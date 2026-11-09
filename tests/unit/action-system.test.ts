import { describe, it, expect, beforeEach } from 'vitest';

import { FarmGrid } from '../../src/core/grid';
import { ActionExecutor } from '../../src/gameplay/actions/action-executor';
import { ActionResolver } from '../../src/gameplay/actions/action-resolver';
import type { SelectedTarget } from '../../src/gameplay/actions/action-types';
import { CropSystem } from '../../src/simulation/crops';
import { InventorySystem } from '../../src/simulation/inventory';
import { NavigationSystem } from '../../src/simulation/navigation';
import { WaterSystem } from '../../src/simulation/water';

describe('Universal Context Action System (Marco A)', () => {
    let grid: FarmGrid;
    let inventory: InventorySystem;
    let waterSystem: WaterSystem;
    let cropSystem: CropSystem;
    let navigation: NavigationSystem;
    let executor: ActionExecutor;

    beforeEach(() => {
        grid = new FarmGrid();
        inventory = new InventorySystem();
        waterSystem = new WaterSystem(inventory);
        cropSystem = new CropSystem(inventory, waterSystem);
        navigation = new NavigationSystem(grid);
        executor = new ActionExecutor(grid, cropSystem, inventory, navigation);

        // Prepara recursos base para testes
        inventory.set('water', 50);
        inventory.set('food', 20);
        inventory.set('wood', 20);
        inventory.set('metal', 10);
    });

    it('1. Selecionar solo natural mostra "Preparar solo"', () => {
        const rawTarget: SelectedTarget = {
            id: 'bed_1',
            type: 'plot',
            name: 'Canteiro 1',
            gridX: 10,
            gridY: 10,
            worldPosition: { x: 0, y: 0, z: 0 },
            soilStatus: 'raw'
        };

        const action = ActionResolver.resolve(rawTarget, {
            inventory: inventory.getAll()
        });

        expect(action.actionId).toBe('prepare_soil');
        expect(action.title).toBe('Preparar Solo');
        expect(action.enabled).toBe(true);
    });

    it('2. Após preparar, o botão muda para "Plantar"', () => {
        const plotTarget: SelectedTarget = {
            id: 'bed_2',
            type: 'plot',
            name: 'Canteiro 2',
            gridX: 12,
            gridY: 12,
            worldPosition: { x: 0, y: 0, z: 0 },
            soilStatus: 'raw'
        };

        // Executa preparação
        const res = executor.execute(plotTarget, {
            inventory: inventory.getAll()
        });

        expect(res.success).toBe(true);
        expect(plotTarget.soilStatus).toBe('tilled');

        // Reavalia ação contextual imediatamente
        const nextAction = ActionResolver.resolve(plotTarget, {
            inventory: inventory.getAll(),
            seedInventory: { rice: 3 }
        });

        expect(nextAction.actionId).toBe('plant_crop');
        expect(nextAction.title).toContain('Plantar');
        expect(nextAction.enabled).toBe(true);
    });

    it('3. Sem sementes, "Plantar" fica indisponível e informa o motivo', () => {
        const tilledTarget: SelectedTarget = {
            id: 'bed_3',
            type: 'plot',
            name: 'Canteiro 3',
            gridX: 14,
            gridY: 14,
            worldPosition: { x: 0, y: 0, z: 0 },
            soilStatus: 'tilled'
        };

        const action = ActionResolver.resolve(tilledTarget, {
            inventory: inventory.getAll(),
            seedInventory: { rice: 0 },
            selectedCropPreference: 'rice'
        });

        expect(action.actionId).toBe('plant_crop');
        expect(action.enabled).toBe(false);
        expect(action.blockedReason).toContain('Faltam sementes');
        expect(action.missingResource).toBeDefined();
        expect(action.missingResource?.type).toBe('seed');
    });

    it('4. Após plantar, a ação passa a depender do estado da cultura', () => {
        const target: SelectedTarget = {
            id: 'bed_4',
            type: 'plot',
            name: 'Canteiro 4',
            gridX: 16,
            gridY: 16,
            worldPosition: { x: 0, y: 0, z: 0 },
            soilStatus: 'tilled'
        };

        const seeds = { rice: 2 };
        const plantRes = executor.execute(target, {
            inventory: inventory.getAll(),
            seedInventory: seeds,
            selectedCropPreference: 'rice'
        });

        expect(plantRes.success).toBe(true);
        expect(target.soilStatus).toBe('planted');
        expect(seeds.rice).toBe(1);

        // Enquanto cresce irrigado: botão de aguardar (desabilitado)
        target.soilStatus = 'growing';
        target.growthProgress = 0.4;
        target.waterSupplied = true;

        const growingAction = ActionResolver.resolve(target, {
            inventory: inventory.getAll()
        });

        expect(growingAction.actionId).toBe('idle_ok');
        expect(growingAction.enabled).toBe(false);
        expect(growingAction.title).toContain('Crescendo');
    });

    it('5. Planta sem água mostra "Regar"', () => {
        const thirstyTarget: SelectedTarget = {
            id: 'bed_5',
            type: 'plot',
            name: 'Canteiro 5',
            gridX: 18,
            gridY: 18,
            worldPosition: { x: 0, y: 0, z: 0 },
            soilStatus: 'thirsty',
            waterSupplied: false,
            growthProgress: 0.3
        };

        const action = ActionResolver.resolve(thirstyTarget, {
            inventory: inventory.getAll()
        });

        expect(action.actionId).toBe('water_crop');
        expect(action.title).toBe('Regar Canteiro');
        expect(action.enabled).toBe(true);

        // Se o inventário estiver sem água, fica desabilitado com aviso
        inventory.set('water', 0);
        const dryAction = ActionResolver.resolve(thirstyTarget, {
            inventory: inventory.getAll()
        });

        expect(dryAction.actionId).toBe('water_crop');
        expect(dryAction.enabled).toBe(false);
        expect(dryAction.blockedReason).toContain('Água insuficiente');
    });

    it('6. Planta madura mostra "Colher"', () => {
        const matureTarget: SelectedTarget = {
            id: 'bed_6',
            type: 'plot',
            name: 'Canteiro 6',
            gridX: 20,
            gridY: 20,
            worldPosition: { x: 0, y: 0, z: 0 },
            soilStatus: 'ready',
            cropType: 'rice',
            growthProgress: 1.0,
            waterSupplied: true
        };

        const action = ActionResolver.resolve(matureTarget, {
            inventory: inventory.getAll()
        });

        expect(action.actionId).toBe('harvest_crop');
        expect(action.title).toContain('Colher');
        expect(action.enabled).toBe(true);
    });

    it('7. Colher atualiza estoque apenas uma vez', () => {
        // Registra canteiro e planta arroz maduro
        cropSystem.plantCrop('bed_7', 'rice');
        const crop = cropSystem.getCrop('bed_7')!;
        crop.growthProgress = 1.0;
        crop.stage = 'ready';

        const initialFood = inventory.get('food');

        const matureTarget: SelectedTarget = {
            id: 'bed_7',
            type: 'plot',
            name: 'Canteiro 7',
            gridX: 22,
            gridY: 22,
            worldPosition: { x: 0, y: 0, z: 0 },
            soilStatus: 'ready',
            cropType: 'rice'
        };

        const res = executor.execute(matureTarget, {
            inventory: inventory.getAll()
        });

        expect(res.success).toBe(true);
        expect(res.resourceChanges?.food).toBe(25);
        expect(inventory.get('food')).toBe(initialFood + 25);

        // Tentativa de colher novamente deve falhar (cultura já foi colhida)
        matureTarget.soilStatus = 'ready';
        const res2 = executor.execute(matureTarget, {
            inventory: inventory.getAll()
        });

        expect(res2.success).toBe(false);
        expect(inventory.get('food')).toBe(initialFood + 25);
    });

    it('8. Um clique duplo não duplica a recompensa (proteção de concorrência)', () => {
        cropSystem.plantCrop('bed_8', 'rice');
        const crop = cropSystem.getCrop('bed_8')!;
        crop.growthProgress = 1.0;
        crop.stage = 'ready';

        const initialFood = inventory.get('food');

        const target: SelectedTarget = {
            id: 'bed_8',
            type: 'plot',
            name: 'Canteiro 8',
            gridX: 24,
            gridY: 24,
            worldPosition: { x: 0, y: 0, z: 0 },
            soilStatus: 'ready',
            cropType: 'rice'
        };

        // Simula cliques rápidos sequenciais
        const call1 = executor.execute(target, { inventory: inventory.getAll() });
        const call2 = executor.execute(target, { inventory: inventory.getAll() });

        expect(call1.success).toBe(true);
        expect(call2.success).toBe(false);
        expect(inventory.get('food')).toBe(initialFood + 25);
    });

    it('9. Trocar a seleção atualiza o botão imediatamente', () => {
        const plotTarget: SelectedTarget = {
            id: 'plot_9',
            type: 'plot',
            name: 'Canteiro A',
            gridX: 26,
            gridY: 26,
            worldPosition: { x: 0, y: 0, z: 0 },
            soilStatus: 'raw'
        };

        const dummyTarget: SelectedTarget = {
            id: 'dummy_9',
            type: 'dummy',
            name: 'Boneco de Treino',
            gridX: 28,
            gridY: 28,
            worldPosition: { x: 10, y: 0, z: 10 }
        };

        const action1 = ActionResolver.resolve(plotTarget, { inventory: inventory.getAll() });
        const action2 = ActionResolver.resolve(dummyTarget, { inventory: inventory.getAll() });

        expect(action1.actionId).toBe('prepare_soil');
        expect(action2.actionId).toBe('train_dummy');
    });

    it('10. Selecionar objeto sem ação disponível não executa tarefas arbitrárias', () => {
        const idleBuildingTarget: SelectedTarget = {
            id: 'solar_10',
            type: 'building',
            name: 'Painel Solar Fotovoltaico',
            gridX: 30,
            gridY: 30,
            worldPosition: { x: 5, y: 0, z: 5 },
            buildingType: 'solar_panel'
        };

        const action = ActionResolver.resolve(idleBuildingTarget, { inventory: inventory.getAll() });
        expect(action.actionId).toBe('idle_ok');
        expect(action.enabled).toBe(false);

        const execRes = executor.execute(idleBuildingTarget, { inventory: inventory.getAll() });
        expect(execRes.success).toBe(false);
        expect(execRes.errorReason).toBeDefined();
    });
});
