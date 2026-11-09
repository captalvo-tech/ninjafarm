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

import { BUILDING_CATALOG } from '../core/config';
import { domainEvents } from '../core/events';
import { FarmGrid } from '../core/grid';
import { EnergySystem } from './energy';
import { InventorySystem } from './inventory';

export interface WaterMetrics {
    productionRate: number; // L/s
    consumptionRate: number; // L/s
    netRate: number;
    storedWater: number;
    capacity: number;
    isDepleted: boolean;
    waterSuppliedRatio: number; // 0.0 to 1.0
}

export class WaterSystem {
    private grid: FarmGrid;
    private inventory: InventorySystem;
    private energy: EnergySystem;

    private metrics: WaterMetrics = {
        productionRate: 0,
        consumptionRate: 0,
        netRate: 0,
        storedWater: 0,
        capacity: 0,
        isDepleted: false,
        waterSuppliedRatio: 1.0
    };

    constructor(grid: FarmGrid, inventory: InventorySystem, energy: EnergySystem) {
        this.grid = grid;
        this.inventory = inventory;
        this.energy = energy;
    }

    tick(deltaSeconds: number): WaterMetrics {
        if (deltaSeconds <= 0) return this.metrics;

        const energyStatus = this.energy.getMetrics();
        let totalProduction = 0;
        let totalConsumption = 0;
        let totalTankCapacity = 100; // capacidade hídrica base

        const buildings = this.grid.getAllBuildings();
        for (const b of buildings) {
            const def = BUILDING_CATALOG[b.type];
            if (!def) continue;

            // Bombas d'água só produzem se a rede tiver energia suficiente
            if (def.waterProduction) {
                totalProduction += def.waterProduction * energyStatus.operationalRatio;
            }

            // Consumo contínuo
            if (def.waterConsumption) {
                totalConsumption += def.waterConsumption;
            }

            // Cisternas e reservatórios
            if (def.storageCapacity?.water) {
                totalTankCapacity += def.storageCapacity.water;
            }
        }

        this.inventory.setCapacity('water', totalTankCapacity);

        const currentWater = this.inventory.get('water');
        const netFlow = (totalProduction - totalConsumption) * deltaSeconds;

        let waterSuppliedRatio = 1.0;
        let isDepleted = false;

        if (netFlow >= 0) {
            this.inventory.add('water', netFlow);
            waterSuppliedRatio = 1.0;
        } else {
            const needed = Math.abs(netFlow);
            if (currentWater >= needed) {
                this.inventory.consume('water', needed);
                waterSuppliedRatio = 1.0;
            } else {
                this.inventory.consume('water', currentWater);
                isDepleted = true;
                waterSuppliedRatio = totalConsumption > 0 ? Math.min(1.0, (currentWater + totalProduction * deltaSeconds) / (totalConsumption * deltaSeconds)) : 0;
            }
        }

        this.metrics = {
            productionRate: Number(totalProduction.toFixed(2)),
            consumptionRate: Number(totalConsumption.toFixed(2)),
            netRate: Number((totalProduction - totalConsumption).toFixed(2)),
            storedWater: this.inventory.get('water'),
            capacity: totalTankCapacity,
            isDepleted,
            waterSuppliedRatio
        };

        domainEvents.emit('water.updated', this.metrics);
        return this.metrics;
    }

    getMetrics(): Readonly<WaterMetrics> {
        return this.metrics;
    }
}

