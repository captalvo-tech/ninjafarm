import { describe, expect, it } from 'vitest';
import { FarmGrid } from '../../src/core/grid';
import { FARM_CONFIG } from '../../src/core/config';

describe('FarmGrid (64x36)', () => {
    it('deve inicializar com 64 colunas e 36 linhas (2.304 células)', () => {
        const grid = new FarmGrid();
        expect(grid.width).toBe(64);
        expect(grid.height).toBe(36);
        expect(FARM_CONFIG.GRID_WIDTH * FARM_CONFIG.GRID_HEIGHT).toBe(2304);

        // Validação de limites
        expect(grid.isInside(0, 0)).toBe(true);
        expect(grid.isInside(63, 35)).toBe(true);
        expect(grid.isInside(64, 35)).toBe(false);
        expect(grid.isInside(0, 36)).toBe(false);
        expect(grid.isInside(-1, 0)).toBe(false);
    });

    it('deve calcular footprints rotacionados corretamente', () => {
        const grid = new FarmGrid();
        const fp = { width: 4, height: 2 };

        expect(grid.getRotatedFootprint(fp, 0)).toEqual({ width: 4, height: 2 });
        expect(grid.getRotatedFootprint(fp, 90)).toEqual({ width: 2, height: 4 });
        expect(grid.getRotatedFootprint(fp, 180)).toEqual({ width: 4, height: 2 });
        expect(grid.getRotatedFootprint(fp, 270)).toEqual({ width: 2, height: 4 });
    });

    it('deve validar posicionamento e rejeitar fora dos limites', () => {
        const grid = new FarmGrid();
        // HQ tem 4x4
        expect(grid.canPlace('hq', 0, 0, 0).valid).toBe(true);
        expect(grid.canPlace('hq', 60, 32, 0).valid).toBe(true);
        expect(grid.canPlace('hq', 61, 32, 0).valid).toBe(false); // 61+4 = 65 > 64
        expect(grid.canPlace('hq', 60, 33, 0).valid).toBe(false); // 33+4 = 37 > 36
    });

    it('deve impedir sobreposição de construções', () => {
        const grid = new FarmGrid();
        const placed = grid.placeBuilding({
            instanceId: 'hq_1',
            type: 'hq',
            gridX: 10,
            gridY: 10,
            orientation: 0,
            createdAt: Date.now(),
            health: 500
        });
        expect(placed).toBe(true);

        // Tentativa de colocar outra construção por cima
        const overlapCheck = grid.canPlace('solar_panel', 11, 11, 0);
        expect(overlapCheck.valid).toBe(false);
        expect(overlapCheck.reason).toContain('Área já ocupada');

        // Perto sem colidir deve ser válido
        const freeCheck = grid.canPlace('solar_panel', 15, 10, 0);
        expect(freeCheck.valid).toBe(true);
    });

    it('deve desocupar células ao remover construção', () => {
        const grid = new FarmGrid();
        grid.placeBuilding({
            instanceId: 'shed_1',
            type: 'shed',
            gridX: 20,
            gridY: 20,
            orientation: 0,
            createdAt: Date.now(),
            health: 300
        });

        expect(grid.getCell(20, 20)?.walkable).toBe(false);
        grid.removeBuilding('shed_1');
        expect(grid.getCell(20, 20)?.walkable).toBe(true);
        expect(grid.getCell(20, 20)?.occupiedBy).toBe(null);
    });
});

