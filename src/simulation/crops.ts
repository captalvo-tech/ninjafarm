/**
 * ============================================================================
 * NINJA FARM — CONTRATO OBRIGATÓRIO DO ROADMAP
 * ============================================================================
 *
 * O ROADMAP É O REGISTRO OFICIAL DA EVOLUÇÃO DESTE PROJETO.
 *
 * Qualquer alteração funcional relevante neste módulo exige:
 *
 * 1. Atualizar o registro de funcionalidades do roadmap.
 * 2. Registrar a alteração no histórico permanente.
 * 3. Atualizar a documentação técnica relacionada.
 * 4. Registrar funcionalidades adicionadas, modificadas ou removidas.
 * 5. Relacionar a mudança ao commit e aos testes realizados.
 *
 * Funcionalidades removidas DEVEM permanecer no histórico com
 * status REMOVIDO. Nunca apagar seu registro histórico.
 *
 * Documentação:
 * - docs/02-ROADMAP.md
 * - docs/19-LOG-IMPLEMENTACAO.md
 * - Registro estruturado de funcionalidades do projeto
 *
 * IMPORTANTE: Código, roadmap e documentação devem permanecer
 * sincronizados durante todo o desenvolvimento.
 * ============================================================================
 */

import { domainEvents } from '../core/events';
import type { CropState, CropType } from '../core/types';

import type { InventorySystem } from './inventory';
import type { WaterSystem } from './water';

export interface CropDefinition {
    id: CropType;
    name: string;
    growthTimeSeconds: number; // tempo até maturação
    waterPerSecond: number; // consumo de água
    yieldResource: 'food';
    yieldAmount: number;
}

export const CROP_DEFINITIONS: Record<CropType, CropDefinition> = {
    rice: {
        id: 'rice',
        name: 'Arroz Hidropônico Tradicional',
        growthTimeSeconds: 45, // 45 segundos para teste ágil no MVP
        waterPerSecond: 0.8,
        yieldResource: 'food',
        yieldAmount: 25
    },
    vegetable: {
        id: 'vegetable',
        name: 'Hortaliça Ninja de Ciclo Curto',
        growthTimeSeconds: 25, // 25 segundos
        waterPerSecond: 0.5,
        yieldResource: 'food',
        yieldAmount: 15
    },
    lotus: {
        id: 'lotus',
        name: 'Flor de Lótus Sagrada Shinobi',
        growthTimeSeconds: 55, // 55 segundos
        waterPerSecond: 0.9,
        yieldResource: 'food',
        yieldAmount: 50
    }
};

export class CropSystem {
    private crops = new Map<string, CropState>();
    private inventory: InventorySystem;
    private waterSystem: WaterSystem;

    constructor(inventory: InventorySystem, waterSystem: WaterSystem) {
        this.inventory = inventory;
        this.waterSystem = waterSystem;
    }

    plantCrop(buildingInstanceId: string, cropType: CropType): CropState | null {
        // Verifica se já existe canteiro registrado com planta ativa
        if (this.crops.has(buildingInstanceId)) {
            const current = this.crops.get(buildingInstanceId)!;
            if (current.stage !== 'empty' && current.stage !== 'harvested') {
                return null;
            }
        }

        const state: CropState = {
            instanceId: 'crop_' + Math.random().toString(36).substring(2, 9),
            buildingInstanceId,
            cropType,
            stage: 'planted',
            growthProgress: 0.0,
            waterSupplied: true,
            plantedAt: Date.now(),
            lastUpdated: Date.now()
        };

        this.crops.set(buildingInstanceId, state);
        domainEvents.emit('crop.planted', state);
        return state;
    }

    tick(deltaSeconds: number): void {
        if (deltaSeconds <= 0) return;

        const waterRatio = this.waterSystem.getMetrics().waterSuppliedRatio;

        for (const state of this.crops.values()) {
            if (state.stage === 'ready' || state.stage === 'empty' || state.stage === 'harvested') {
                continue;
            }

            const def = CROP_DEFINITIONS[state.cropType];
            if (!def) continue;

            // Se não houver água suficiente, o crescimento pausa
            const hasWater = waterRatio > 0.1;
            state.waterSupplied = hasWater;

            if (hasWater) {
                const growthRate = (1.0 / def.growthTimeSeconds) * Math.min(1.0, waterRatio);
                state.growthProgress = Math.min(1.0, state.growthProgress + growthRate * deltaSeconds);

                if (state.growthProgress >= 1.0) {
                    state.stage = 'ready';
                    domainEvents.emit('crop.ready', state);
                } else if (state.growthProgress >= 0.25) {
                    state.stage = 'growing';
                }
            }

            state.lastUpdated = Date.now();
        }
    }

    /**
     * Reconciliação AFK Determinística: simula o crescimento das culturas durante ausência offline.
     * Consome água do inventário proporcionalmente à demanda das culturas ativas.
     */
    simulateOfflineSeconds(elapsedSeconds: number): { maturedCount: number } {
        if (elapsedSeconds <= 0) return { maturedCount: 0 };

        // Limita o catchup a no máximo 7 dias contínuos para evitar loops de processamento
        const maxSimSeconds = Math.min(elapsedSeconds, 7 * 86400);
        const stepSize = 5; // Resolução de 5 segundos para precisão no consumo hídrico
        let remaining = maxSimSeconds;
        let maturedCount = 0;

        while (remaining > 0) {
            const dt = Math.min(stepSize, remaining);
            remaining -= dt;

            // Coleta culturas em crescimento
            const activeCrops: { state: CropState; def: CropDefinition }[] = [];
            let totalWaterNeeded = 0;

            for (const state of this.crops.values()) {
                if (state.stage === 'planted' || state.stage === 'growing') {
                    const def = CROP_DEFINITIONS[state.cropType];
                    if (def) {
                        activeCrops.push({ state, def });
                        totalWaterNeeded += def.waterPerSecond * dt;
                    }
                }
            }

            if (activeCrops.length === 0) {
                // Nenhuma cultura em crescimento
                break;
            }

            // Verifica disponibilidade hídrica
            const currentWater = this.inventory.get('water');
            let waterSuppliedRatio = 1.0;

            if (totalWaterNeeded > 0) {
                if (currentWater <= 0) {
                    waterSuppliedRatio = 0.0;
                } else if (currentWater < totalWaterNeeded) {
                    waterSuppliedRatio = currentWater / totalWaterNeeded;
                    this.inventory.consume('water', currentWater);
                } else {
                    this.inventory.consume('water', totalWaterNeeded);
                    waterSuppliedRatio = 1.0;
                }
            }

            // Se não há água disponível, o crescimento cessa
            if (waterSuppliedRatio <= 0.05) {
                for (const { state } of activeCrops) {
                    state.waterSupplied = false;
                }
                break;
            }

            // Avança o progresso biológico de cada cultura
            for (const { state, def } of activeCrops) {
                state.waterSupplied = true;
                const growthDelta = (dt / def.growthTimeSeconds) * waterSuppliedRatio;
                state.growthProgress = Math.min(1.0, state.growthProgress + growthDelta);

                if (state.growthProgress >= 1.0) {
                    state.stage = 'ready';
                    maturedCount++;
                    domainEvents.emit('crop.ready', state);
                } else if (state.growthProgress >= 0.25) {
                    state.stage = 'growing';
                }
            }
        }

        return { maturedCount };
    }

    harvest(buildingInstanceId: string): { success: boolean; harvestedAmount: number; cropType?: CropType } {
        const crop = this.crops.get(buildingInstanceId);
        if (!crop || crop.stage !== 'ready') {
            return { success: false, harvestedAmount: 0 };
        }

        const def = CROP_DEFINITIONS[crop.cropType];
        const added = this.inventory.add(def.yieldResource, def.yieldAmount);

        const harvestedType = crop.cropType;
        crop.stage = 'harvested';
        crop.growthProgress = 0;
        domainEvents.emit('crop.harvested', { crop, added });

        return { success: true, harvestedAmount: added, cropType: harvestedType };
    }

    getCrop(buildingInstanceId: string): CropState | undefined {
        return this.crops.get(buildingInstanceId);
    }

    getAllCrops(): CropState[] {
        return Array.from(this.crops.values());
    }

    serialize(): CropState[] {
        return Array.from(this.crops.values());
    }

    load(saved: CropState[]): void {
        this.crops.clear();
        for (const item of saved) {
            this.crops.set(item.buildingInstanceId, { ...item });
        }
    }
}
