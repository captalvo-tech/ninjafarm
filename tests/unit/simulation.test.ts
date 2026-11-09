import { describe, expect, it } from 'vitest';
import { FarmGrid } from '../../src/core/grid';
import { SimulationClock } from '../../src/simulation/clock';
import { CropSystem } from '../../src/simulation/crops';
import { EnergySystem } from '../../src/simulation/energy';
import { InventorySystem } from '../../src/simulation/inventory';
import { NavigationSystem } from '../../src/simulation/navigation';
import { WaterSystem } from '../../src/simulation/water';

describe('Sistemas de Simulação e Recursos', () => {
    it('SimulationClock deve calcular ciclo dia/noite e irradiação solar', () => {
        const clock = new SimulationClock(0.5); // Meio-dia
        expect(clock.getSunlightFactor()).toBeCloseTo(1.0, 1);
        expect(clock.isNight()).toBe(false);

        // Noite (0.0 = meia-noite)
        clock.setTimeOfDay(0.0);
        expect(clock.getSunlightFactor()).toBe(0.0);
        expect(clock.isNight()).toBe(true);

        // Avanço no tempo
        clock.tick(90); // meio dia com DAY_DURATION_SECONDS = 180
        expect(clock.getTimeOfDay()).toBeCloseTo(0.5, 1);
    });

    it('InventorySystem deve respeitar limites de capacidade e impedir saldos negativos', () => {
        const inv = new InventorySystem({ wood: 50 }, { wood: 100 });
        expect(inv.get('wood')).toBe(50);

        // Adicionar respeitando capacidade
        const added = inv.add('wood', 70);
        expect(added).toBe(50); // só cabiam 50
        expect(inv.get('wood')).toBe(100);

        // Consumo válido
        expect(inv.consume('wood', 30)).toBe(true);
        expect(inv.get('wood')).toBe(70);

        // Consumo excessivo deve falhar sem alterar saldo
        expect(inv.consume('wood', 200)).toBe(false);
        expect(inv.get('wood')).toBe(70);
    });

    it('EnergySystem deve gerar energia solar de dia e zerar à noite', () => {
        const grid = new FarmGrid();
        const inv = new InventorySystem({ energy: 0 });
        const clock = new SimulationClock(0.5); // meio-dia solar
        const energy = new EnergySystem(grid, inv, clock);

        grid.placeBuilding({
            instanceId: 'panel_1',
            type: 'solar_panel',
            gridX: 5,
            gridY: 5,
            orientation: 0,
            createdAt: Date.now(),
            health: 150
        });

        // Tick com sol
        const m1 = energy.tick(1.0);
        expect(m1.productionRate).toBeGreaterThan(15);
        expect(inv.get('energy')).toBeGreaterThan(0);

        // Noite
        clock.setTimeOfDay(0.05);
        const m2 = energy.tick(1.0);
        expect(m2.productionRate).toBe(0);
    });

    it('EnergySystem deve consumir energia do lamp_post apenas à noite', () => {
        const grid = new FarmGrid();
        const inv = new InventorySystem({ energy: 50 });
        const clock = new SimulationClock(0.5); // Meio-dia
        const energy = new EnergySystem(grid, inv, clock);

        grid.placeBuilding({
            instanceId: 'lamp_1',
            type: 'lamp_post',
            gridX: 10,
            gridY: 10,
            orientation: 0,
            createdAt: Date.now(),
            health: 100
        });

        // Durante o dia: consumo de lamp_post deve ser 0
        const dayMetrics = energy.tick(1.0);
        expect(dayMetrics.consumptionRate).toBe(0);

        // Durante a noite: consumo deve ativar
        clock.setTimeOfDay(0.0); // Meia-noite
        const nightMetrics = energy.tick(1.0);
        expect(nightMetrics.consumptionRate).toBe(1);
    });

    it('WaterSystem deve bombear água e abastecer estoque', () => {
        const grid = new FarmGrid();
        const inv = new InventorySystem({ energy: 100, water: 0 });
        const clock = new SimulationClock(0.5);
        const energy = new EnergySystem(grid, inv, clock);
        const water = new WaterSystem(grid, inv, energy);

        grid.placeBuilding({
            instanceId: 'pump_1',
            type: 'water_pump',
            gridX: 8,
            gridY: 8,
            orientation: 0,
            createdAt: Date.now(),
            health: 150
        });

        water.tick(2.0);
        expect(inv.get('water')).toBeGreaterThan(0);
    });

    it('CropSystem deve crescer com água e produzir alimento na colheita', () => {
        const inv = new InventorySystem({ food: 0, water: 100 });
        const grid = new FarmGrid();
        const clock = new SimulationClock(0.5);
        const energy = new EnergySystem(grid, inv, clock);
        const water = new WaterSystem(grid, inv, energy);
        const crops = new CropSystem(inv, water);

        const crop = crops.plantCrop('field_1', 'vegetable');
        expect(crop).not.toBeNull();
        expect(crop?.stage).toBe('planted');

        // Avança tempo até maturação (25s)
        crops.tick(30.0);
        const readyCrop = crops.getCrop('field_1');
        expect(readyCrop?.stage).toBe('ready');

        // Colheita
        const result = crops.harvest('field_1');
        expect(result.success).toBe(true);
        expect(result.harvestedAmount).toBe(15);
        expect(result.cropType).toBe('vegetable');
        expect(inv.get('food')).toBe(15);
        expect(crops.getCrop('field_1')?.stage).toBe('harvested');

        // Teste de Flor de Lótus Sagrada
        const lotusCrop = crops.plantCrop('field_2', 'lotus');
        expect(lotusCrop).not.toBeNull();
        crops.tick(60.0);
        expect(crops.getCrop('field_2')?.stage).toBe('ready');
        const lotusResult = crops.harvest('field_2');
        expect(lotusResult.success).toBe(true);
        expect(lotusResult.harvestedAmount).toBe(50);
        expect(lotusResult.cropType).toBe('lotus');
        expect(inv.get('food')).toBe(65);
    });

    it('NavigationSystem deve calcular rotas e contornar obstáculos', () => {
        const grid = new FarmGrid();
        const nav = new NavigationSystem(grid);

        // Rota desimpedida
        const directPath = nav.findPath(0, 0, 5, 0);
        expect(directPath.length).toBeGreaterThan(0);
        expect(directPath[0]).toEqual({ x: 0, y: 0 });
        expect(directPath[directPath.length - 1]).toEqual({ x: 5, y: 0 });

        // Coloca obstáculo fechando a linha y=0 entre x=2 e x=3
        grid.placeBuilding({
            instanceId: 'obstacle_1',
            type: 'crop_field',
            gridX: 2,
            gridY: 0,
            orientation: 0,
            createdAt: Date.now(),
            health: 100
        });

        // O pathfinding deve desviar (y > 0) e ainda alcançar (5, 0)
        const detourPath = nav.findPath(0, 0, 5, 0);
        expect(detourPath.length).toBeGreaterThan(0);
        // Nenhum ponto do caminho pode ser uma célula não caminhável
        for (const pt of detourPath) {
            expect(grid.getCell(pt.x, pt.y)?.walkable).toBe(true);
        }
    });
});

