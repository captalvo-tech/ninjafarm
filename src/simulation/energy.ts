import { BUILDING_CATALOG } from '../core/config';
import { domainEvents } from '../core/events';
import { FarmGrid } from '../core/grid';
import { SimulationClock } from './clock';
import { InventorySystem } from './inventory';

export interface EnergyMetrics {
    productionRate: number; // Watts / units per second
    consumptionRate: number; // Watts / units per second
    netRate: number;
    storedEnergy: number;
    capacity: number;
    isDeficit: boolean;
    operationalRatio: number; // 0.0 to 1.0
}

export class EnergySystem {
    private grid: FarmGrid;
    private inventory: InventorySystem;
    private clock: SimulationClock;

    private metrics: EnergyMetrics = {
        productionRate: 0,
        consumptionRate: 0,
        netRate: 0,
        storedEnergy: 0,
        capacity: 0,
        isDeficit: false,
        operationalRatio: 1.0
    };

    constructor(grid: FarmGrid, inventory: InventorySystem, clock: SimulationClock) {
        this.grid = grid;
        this.inventory = inventory;
        this.clock = clock;
    }

    tick(deltaSeconds: number): EnergyMetrics {
        if (deltaSeconds <= 0) return this.metrics;

        const sunlight = this.clock.getSunlightFactor();
        let totalProduction = 0;
        let totalConsumption = 0;
        let totalBatteryCapacity = 100; // capacidade base do sistema

        const buildings = this.grid.getAllBuildings();
        for (const b of buildings) {
            const def = BUILDING_CATALOG[b.type];
            if (!def) continue;

            // Produção solar
            if (def.energyProduction) {
                totalProduction += def.energyProduction * sunlight;
            }

            // Consumo elétrico contínuo (postes de luz só consomem à noite)
            if (def.energyConsumption) {
                if (b.type === 'lamp_post') {
                    if (this.clock.isNight()) {
                        totalConsumption += def.energyConsumption;
                    }
                } else {
                    totalConsumption += def.energyConsumption;
                }
            }

            // Baterias instaladas
            if (def.storageCapacity?.energy) {
                totalBatteryCapacity += def.storageCapacity.energy;
            }
        }

        // Atualiza capacidade de armazenamento no inventário
        this.inventory.setCapacity('energy', totalBatteryCapacity);

        const currentStored = this.inventory.get('energy');
        const netFlow = (totalProduction - totalConsumption) * deltaSeconds;

        let operationalRatio = 1.0;
        let isDeficit = false;

        if (netFlow >= 0) {
            // Excedente gerado: armazena nas baterias
            this.inventory.add('energy', netFlow);
            operationalRatio = 1.0;
        } else {
            // Déficit: consome das baterias
            const needed = Math.abs(netFlow);
            if (currentStored >= needed) {
                this.inventory.consume('energy', needed);
                operationalRatio = 1.0;
            } else {
                // Baterias esgotaram!
                this.inventory.consume('energy', currentStored);
                isDeficit = true;
                operationalRatio = totalConsumption > 0 ? Math.min(1.0, totalProduction / totalConsumption) : 0;
            }
        }

        this.metrics = {
            productionRate: Number(totalProduction.toFixed(2)),
            consumptionRate: Number(totalConsumption.toFixed(2)),
            netRate: Number((totalProduction - totalConsumption).toFixed(2)),
            storedEnergy: this.inventory.get('energy'),
            capacity: totalBatteryCapacity,
            isDeficit,
            operationalRatio
        };

        domainEvents.emit('energy.updated', this.metrics);
        return this.metrics;
    }

    getMetrics(): Readonly<EnergyMetrics> {
        return this.metrics;
    }
}

