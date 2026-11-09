import { domainEvents } from '../core/events';
import type { CropState, CropType } from '../core/types';
import { InventorySystem } from './inventory';
import { WaterSystem } from './water';

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
