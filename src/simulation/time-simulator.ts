/**
 * Ninja Farm - Administrative Time & Economy Simulator (Dev / Balancing Tool)
 * Simulates hours, days, weeks and 365 days of farm operations deterministically.
 * Strict safety: isolated from production player saves.
 */

import { FarmGrid } from '../core/grid';
import { InventorySystem } from './inventory';
import { SimulationClock } from './clock';
import { EnergySystem } from './energy';
import { WaterSystem } from './water';
import { CropSystem } from './crops';
import { TaskScheduler } from './task-scheduler';
import { FarmDroid } from '../rendering/droid';
import { NavigationSystem } from './navigation';
import type { ResourceInventory } from '../core/types';

export type SimulationProfile = 'casual' | 'regular' | 'intensive';

export interface TimeSimulationReport {
    simulatedHours: number;
    simulatedDays: number;
    tasksCompleted: number;
    cropsMatured: number;
    eggsProduced: number;
    totalSolarEnergyGenerated: number;
    totalEnergyConsumed: number;
    totalWaterConsumed: number;
    droidWorkSeconds: number;
    droidRechargeSeconds: number;
    finalResources: ResourceInventory;
    bottlenecks: string[];
}

export class TimeSimulator {
    /**
     * Executa a simulação determinística de tempo acelerado em uma fazenda isolada.
     */
    public static runSimulation(params: {
        durationHours: number;
        profile?: SimulationProfile;
        initialResources?: Partial<ResourceInventory>;
        scheduledTasksCount?: number;
    }): TimeSimulationReport {
        const { durationHours, initialResources, scheduledTasksCount = 10 } = params;
        const totalSeconds = durationHours * 3600;

        // Cria ambiente isolado de teste
        const grid = new FarmGrid();
        const initialRes: ResourceInventory = {
            wood: 100,
            metal: 50,
            parts: 30,
            food: 40,
            water: 100,
            energy: 80,
            ...initialResources
        };
        const inv = new InventorySystem(initialRes);
        const clock = new SimulationClock(0.4);
        const energy = new EnergySystem(grid, inv, clock);
        const water = new WaterSystem(grid, inv, energy);
        const crops = new CropSystem(inv, water);
        const nav = new NavigationSystem(grid);

        // Instala sede, painel solar e bomba na grade de teste
        grid.placeBuilding({
            instanceId: 'sim_hq_main',
            type: 'hq',
            gridX: 16,
            gridY: 12,
            orientation: 0,
            createdAt: Date.now(),
            health: 500
        });

        grid.placeBuilding({
            instanceId: 'sim_solar_1',
            type: 'solar_panel',
            gridX: 12,
            gridY: 14,
            orientation: 0,
            createdAt: Date.now(),
            health: 150
        });

        grid.placeBuilding({
            instanceId: 'sim_water_pump',
            type: 'water_pump',
            gridX: 22,
            gridY: 14,
            orientation: 0,
            createdAt: Date.now(),
            health: 150
        });

        // Canteiros de arroz inicial
        crops.plantCrop('plot_sim_1', 'rice');
        crops.plantCrop('plot_sim_2', 'vegetable');

        // Cria Droid e Agendador
        const materialsStub: any = { metal: null, wood: null };
        const droid = new FarmDroid(grid, materialsStub);
        const scheduler = new TaskScheduler(grid, nav, inv);

        // Enfileira tarefas de teste
        for (let i = 0; i < scheduledTasksCount; i++) {
            scheduler.enqueueTask(TaskScheduler.createStandardTask({
                category: 'agriculture',
                type: 'prepare_soil',
                title: `Preparar Canteiro #${i + 1}`,
                targetId: `plot_sim_${i + 1}`,
                targetPosition: { x: 10 + (i % 5) * 2, y: 0, z: 10 + Math.floor(i / 5) * 2 },
                totalDurationSeconds: 15,
                energyCostTotal: 4
            }));
        }

        // Variáveis de auditoria
        let tasksCompleted = 0;
        let totalSolarGen = 0;
        let totalEnergyConsumed = 0;
        let totalWaterConsumed = 0;
        const bottlenecks: string[] = [];

        // Roda a simulação determinística em passos de 30 segundos
        const stepSec = 30;
        let remaining = totalSeconds;

        while (remaining > 0) {
            const dt = Math.min(stepSec, remaining);
            remaining -= dt;

            // Ciclo solar e produção
            clock.tick(dt);
            const eMetrics = energy.tick(dt);
            totalSolarGen += eMetrics.productionRate * dt;
            totalEnergyConsumed += eMetrics.consumptionRate * dt;

            // Sistema hídrico
            const wMetrics = water.tick(dt);
            totalWaterConsumed += wMetrics.consumptionRate * dt;

            // Agendador e Droid
            const completedInStep = scheduler.simulateOfflineSeconds(dt, droid, eMetrics.productionRate);
            tasksCompleted += completedInStep;
        }

        // Catchup final das colheitas
        const cropRes = crops.simulateOfflineSeconds(totalSeconds);

        // Identifica gargalos operacionais
        if (inv.get('energy') <= 1.0) {
            bottlenecks.push('Gargalo: Escassez de energia elétrica limitou a operação do Droid.');
        }
        if (inv.get('water') <= 2.0) {
            bottlenecks.push('Gargalo: Reserva hídrica insuficiente para irrigação contínua.');
        }
        if (scheduler.getTasks().length > 0 && tasksCompleted < scheduledTasksCount) {
            bottlenecks.push(`Gargalo: Fila com ${scheduler.getTasks().length} tarefas pendentes ao término.`);
        }

        return {
            simulatedHours: durationHours,
            simulatedDays: Math.round((durationHours / 24) * 10) / 10,
            tasksCompleted,
            cropsMatured: cropRes.maturedCount,
            eggsProduced: Math.floor(durationHours / 4), // 1 coleta a cada 4 horas
            totalSolarEnergyGenerated: Math.round(totalSolarGen),
            totalEnergyConsumed: Math.round(totalEnergyConsumed),
            totalWaterConsumed: Math.round(totalWaterConsumed),
            droidWorkSeconds: tasksCompleted * 15,
            droidRechargeSeconds: Math.round((totalSeconds / 3600) * 120),
            finalResources: inv.getAll(),
            bottlenecks
        };
    }
}
