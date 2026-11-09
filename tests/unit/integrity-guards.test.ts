import { describe, expect, it } from 'vitest';
import { FarmGrid } from '../../src/core/grid';
import { InventorySystem } from '../../src/simulation/inventory';
import { CropSystem } from '../../src/simulation/crops';
import { WaterSystem } from '../../src/simulation/water';
import { EnergySystem } from '../../src/simulation/energy';
import { SimulationClock } from '../../src/simulation/clock';
import { TaskScheduler } from '../../src/simulation/task-scheduler';
import { NavigationSystem } from '../../src/simulation/navigation';
import { FarmDroid } from '../../src/rendering/droid';

describe('Seção 24: Testes de Integridade Não-Negociáveis da Alpha 0.1', () => {
    describe('1. Proteção contra Duplicação de Recursos', () => {
        it('duplo clique em colheita não deve duplicar recursos', () => {
            const inv = new InventorySystem({ food: 0, water: 50 });
            const grid = new FarmGrid();
            const clock = new SimulationClock(0.5);
            const energy = new EnergySystem(grid, inv, clock);
            const water = new WaterSystem(grid, inv, energy);
            const crops = new CropSystem(inv, water);

            crops.plantCrop('field_dup_1', 'vegetable');
            crops.tick(30); // matura a cultura

            // Primeira colheita: sucesso
            const res1 = crops.harvest('field_dup_1');
            expect(res1.success).toBe(true);
            expect(inv.get('food')).toBe(15);

            // Segunda colheita imediata: deve ser rejeitada e não conceder comida adicional
            const res2 = crops.harvest('field_dup_1');
            expect(res2.success).toBe(false);
            expect(inv.get('food')).toBe(15);
        });

        it('transação atômica em consumeBatch deve abortar se faltar qualquer recurso', () => {
            const inv = new InventorySystem({ wood: 10, metal: 5, parts: 0 });

            // Tenta consumir 10 de madeira, 5 de metal e 2 de peças
            const success = inv.consumeBatch({ wood: 10, metal: 5, parts: 2 });
            expect(success).toBe(false);

            // Nenhum recurso deve ter sido debitado parcialmente
            expect(inv.get('wood')).toBe(10);
            expect(inv.get('metal')).toBe(5);
            expect(inv.get('parts')).toBe(0);
        });
    });

    describe('2. Execução Única e Não-Duplicação de Tarefas', () => {
        it('um único Droid não pode ter mais de uma tarefa física ativa simultaneamente', () => {
            const grid = new FarmGrid();
            const inv = new InventorySystem({ energy: 100 });
            const nav = new NavigationSystem(grid);
            const scheduler = new TaskScheduler(grid, nav, inv);
            const materialsStub: any = {};
            const droid = new FarmDroid(grid, materialsStub);

            const t1 = TaskScheduler.createStandardTask({
                category: 'agriculture',
                type: 'prepare_soil',
                title: 'Tarefa 1',
                targetId: 'plot_1',
                targetPosition: { x: 5, y: 0, z: 5 },
                totalDurationSeconds: 10,
                priority: 8
            });

            const t2 = TaskScheduler.createStandardTask({
                category: 'agriculture',
                type: 'prepare_soil',
                title: 'Tarefa 2',
                targetId: 'plot_2',
                targetPosition: { x: 6, y: 0, z: 6 },
                totalDurationSeconds: 10,
                priority: 5
            });

            scheduler.enqueueTask(t1);
            scheduler.enqueueTask(t2);

            scheduler.tick(1.0, droid, 100);

            // Exatamente a Tarefa 1 (maior prioridade) deve estar ativa
            expect(scheduler.getActiveTask()?.id).toBe(t1.id);
            expect(scheduler.getActiveTask()?.id).not.toBe(t2.id);

            // Tarefa 2 deve permanecer em SCHEDULED
            const pending = scheduler.getTasks().find(t => t.id === t2.id);
            expect(pending?.status).toBe('SCHEDULED');
        });

        it('uma célula não pode receber duas construções concorrentes', () => {
            const grid = new FarmGrid();

            const p1 = grid.placeBuilding({
                instanceId: 'bld_1',
                type: 'solar_panel',
                gridX: 10,
                gridY: 10,
                orientation: 0,
                createdAt: Date.now(),
                health: 150
            });
            expect(p1).toBe(true);

            // Tentativa de sobreposição direta na mesma célula
            const check = grid.canPlace('solar_panel', 10, 10, 0);
            expect(check.valid).toBe(false);
            expect(check.reason).toContain('ocupada');
        });
    });

    describe('3. Integridade Energética & Ciclo Dia/Noite', () => {
        it('geração solar deve ser estritamente zero à noite', () => {
            const grid = new FarmGrid();
            const inv = new InventorySystem({ energy: 0 });
            const clock = new SimulationClock(0.0); // Meia-noite (fator solar = 0)
            const energy = new EnergySystem(grid, inv, clock);

            grid.placeBuilding({
                instanceId: 'panel_night_test',
                type: 'solar_panel',
                gridX: 4,
                gridY: 4,
                orientation: 0,
                createdAt: Date.now(),
                health: 150
            });

            const metrics = energy.tick(10.0);
            expect(metrics.productionRate).toBe(0);
            expect(inv.get('energy')).toBe(0);
        });

        it('bateria do Droid não pode ficar negativa', () => {
            const grid = new FarmGrid();
            const materialsStub: any = {};
            const droid = new FarmDroid(grid, materialsStub);

            // Consome mais do que a capacidade total de 100%
            droid.consumeBattery(150);
            expect(droid.getBattery()).toBe(0);
            expect(droid.getBattery()).toBeGreaterThanOrEqual(0);
        });

        it('bateria do Droid não pode ultrapassar o limite máximo de 100%', () => {
            const grid = new FarmGrid();
            const materialsStub: any = {};
            const droid = new FarmDroid(grid, materialsStub);

            // Recarrega além de 100%
            droid.recharge(50);
            expect(droid.getBattery()).toBe(100);
        });
    });
});

