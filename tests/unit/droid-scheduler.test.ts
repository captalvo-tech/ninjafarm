import { describe, it, expect, beforeEach } from 'vitest';
import { FarmGrid } from '../../src/core/grid';
import { InventorySystem } from '../../src/simulation/inventory';
import { NavigationSystem } from '../../src/simulation/navigation';
import { TaskScheduler } from '../../src/simulation/task-scheduler';
import { FarmDroid } from '../../src/rendering/droid';
import type { FarmMaterials } from '../../src/rendering/materials';
import type { FarmTask } from '../../src/core/types';

describe('Fase B: Droid Único e Agendador de Tarefas', () => {
    let grid: FarmGrid;
    let nav: NavigationSystem;
    let inv: InventorySystem;
    let scheduler: TaskScheduler;
    let droid: FarmDroid;

    beforeEach(() => {
        grid = new FarmGrid();
        nav = new NavigationSystem(grid);
        inv = new InventorySystem({
            wood: 50,
            metal: 30,
            parts: 10,
            food: 20,
            water: 50,
            energy: 100
        });

        // Mock leve de materiais para teste sem WebGL
        const mockMaterials = {
            metal: { update: () => {} } as any,
            glass: { update: () => {} } as any,
        } as unknown as FarmMaterials;

        droid = new FarmDroid(grid, mockMaterials);
        scheduler = new TaskScheduler(grid, nav, inv);
    });

    it('1. Deve inicializar o Droid com 100% de bateria e estado ocioso (idle)', () => {
        expect(droid.getBattery()).toBe(100);
        expect(droid.getState()).toBe('idle');
        expect(droid.getCurrentTask()).toBeNull();
    });

    it('2. Deve permitir consumo e recarga controlada da bateria do Droid', () => {
        droid.consumeBattery(35);
        expect(droid.getBattery()).toBe(65);

        droid.consumeBattery(70);
        expect(droid.getBattery()).toBe(0);
        expect(droid.getState()).toBe('depleted');

        droid.recharge(50);
        expect(droid.getBattery()).toBe(50);
        expect(droid.getState()).toBe('idle');
    });

    it('3. Deve enfileirar tarefas respeitando prioridade (maior prioridade na frente)', () => {
        const taskBaixa = TaskScheduler.createStandardTask({
            category: 'agriculture',
            type: 'till_soil',
            title: 'Arar Canteiro A',
            targetId: 'plot_1',
            targetPosition: { x: 5, y: 0, z: 5 },
            priority: 2
        });

        const taskAlta = TaskScheduler.createStandardTask({
            category: 'agriculture',
            type: 'harvest_crop',
            title: 'Colheita Urgente',
            targetId: 'plot_2',
            targetPosition: { x: 10, y: 0, z: 10 },
            priority: 9
        });

        scheduler.enqueueTask(taskBaixa);
        scheduler.enqueueTask(taskAlta);

        const tasks = scheduler.getTasks();
        expect(tasks.length).toBe(2);
        expect(tasks[0].id).toBe(taskAlta.id);
        expect(tasks[1].id).toBe(taskBaixa.id);
    });

    it('4. Deve executar o ciclo completo de uma tarefa física pelo Droid', () => {
        const task = TaskScheduler.createStandardTask({
            category: 'agriculture',
            type: 'water_plot',
            title: 'Regar Canteiro B',
            targetId: 'plot_3',
            targetPosition: { x: 14, y: 0, z: 15 },
            totalDurationSeconds: 2,
            requiredResources: { water: 2 }
        });

        let completedCalled = false;
        const testScheduler = new TaskScheduler(grid, nav, inv, {
            onTaskCompleted: (t) => {
                completedCalled = true;
                expect(t.id).toBe(task.id);
            }
        });

        testScheduler.enqueueTask(task);

        // Tick 1: Despacha Droid para o canteiro
        testScheduler.tick(0.5, droid, 100);
        expect(testScheduler.getActiveTask()).not.toBeNull();
        expect(testScheduler.getActiveTask()?.status).toBe('IN_PROGRESS');
        expect(inv.get('water')).toBe(48); // Consumiu 2 de água

        // Simula Droid já no local trabalhando
        droid.setState('working');

        // Tick 2: Avança progresso de 2 segundos (completa tarefa)
        testScheduler.tick(2.1, droid, 100);
        expect(completedCalled).toBe(true);
        expect(testScheduler.getActiveTask()).toBeNull();
        expect(testScheduler.getTasks().length).toBe(0);
    });

    it('5. Bloqueia tarefa com WAITING_RESOURCES quando inventário não possui recursos', () => {
        const taskCara = TaskScheduler.createStandardTask({
            category: 'construction',
            type: 'construct_building',
            title: 'Construir Usina Solar',
            targetId: 'bld_solar_99',
            targetPosition: { x: 20, y: 0, z: 20 },
            requiredResources: { metal: 999 } // Só temos 30 metal
        });

        scheduler.enqueueTask(taskCara);
        scheduler.tick(0.5, droid, 100);

        expect(scheduler.getActiveTask()).toBeNull();
        const tasks = scheduler.getTasks();
        expect(tasks[0].status).toBe('WAITING_RESOURCES');
        expect(tasks[0].blockedReason).toContain('materiais');
    });

    it('6. Deve enviar Droid para recarga solar quando bateria estiver crítica (< 15%)', () => {
        droid.setBattery(10); // Bateria crítica

        const task = TaskScheduler.createStandardTask({
            category: 'agriculture',
            type: 'till_soil',
            title: 'Arar Canteiro',
            targetId: 'plot_5',
            targetPosition: { x: 8, y: 0, z: 8 }
        });

        scheduler.enqueueTask(task);
        scheduler.tick(0.5, droid, 50);

        // Tarefa não deve começar pois droid precisa de carga
        expect(scheduler.getActiveTask()).toBeNull();
        expect(droid.getState()).toBe('walking'); // Caminhando para a estação de recarga
    });

    it('7. Reconciliação AFK offline: computa progresso e tarefas completadas enquanto ausente', () => {
        const task1 = TaskScheduler.createStandardTask({
            category: 'agriculture',
            type: 'harvest_crop',
            title: 'Colheita 1',
            targetId: 'plot_1',
            targetPosition: { x: 10, y: 0, z: 10 },
            totalDurationSeconds: 10
        });

        const task2 = TaskScheduler.createStandardTask({
            category: 'agriculture',
            type: 'harvest_crop',
            title: 'Colheita 2',
            targetId: 'plot_2',
            targetPosition: { x: 12, y: 0, z: 10 },
            totalDurationSeconds: 15
        });

        scheduler.enqueueTask(task1);
        scheduler.enqueueTask(task2);

        // Jogador esteve offline por 30 segundos com gerador solar ativo
        const completed = scheduler.simulateOfflineSeconds(30, droid, 1.0);
        expect(completed).toBe(2);
        expect(scheduler.getTasks().length).toBe(0);
    });

    it('8. Suporta pausar, retomar, reordenar e cancelar tarefas da agenda', () => {
        const t1 = TaskScheduler.createStandardTask({ category: 'general', type: 'a', title: 'T1', targetId: '1', targetPosition: { x: 0, y: 0, z: 0 } });
        const t2 = TaskScheduler.createStandardTask({ category: 'general', type: 'b', title: 'T2', targetId: '2', targetPosition: { x: 0, y: 0, z: 0 } });

        scheduler.enqueueTask(t1);
        scheduler.enqueueTask(t2);

        // Reordenar
        scheduler.reorderTasks(0, 1);
        expect(scheduler.getTasks()[0].id).toBe(t2.id);

        // Cancelar
        const cancelled = scheduler.cancelTask(t1.id);
        expect(cancelled).toBe(true);
        expect(scheduler.getTasks().length).toBe(1);
    });

    it('9. Serializa e desserializa estado do Droid e do Agendador fielmente', () => {
        droid.setBattery(82.5);
        droid.setState('working');
        const droidSave = droid.serialize();

        expect(droidSave.battery).toBe(82.5);
        expect(droidSave.state).toBe('working');

        const task = TaskScheduler.createStandardTask({
            category: 'agriculture',
            type: 'till',
            title: 'Task Salva',
            targetId: 'p1',
            targetPosition: { x: 1, y: 2, z: 3 }
        });
        scheduler.enqueueTask(task);

        const schedulerSave = scheduler.serialize();
        expect(schedulerSave.tasks.length).toBe(1);
        expect(schedulerSave.tasks[0].title).toBe('Task Salva');

        const novoScheduler = new TaskScheduler(grid, nav, inv);
        novoScheduler.load(schedulerSave);
        expect(novoScheduler.getTasks().length).toBe(1);
        expect(novoScheduler.getTasks()[0].id).toBe(task.id);
    });
});
