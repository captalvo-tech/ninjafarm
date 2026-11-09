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

import { FARM_CONFIG, BUILDING_CATALOG } from './config';
import type { BuildingOrientation, Footprint, PlacedBuilding } from './types';

export interface GridCell {
    x: number; // 0 to 63
    y: number; // 0 to 35
    occupiedBy: string | null; // building instanceId or null
    walkable: boolean;
    elevation: number; // altura suave do terreno em metros
}

export class FarmGrid {
    readonly width = FARM_CONFIG.GRID_WIDTH;
    readonly height = FARM_CONFIG.GRID_HEIGHT;
    readonly cellSize = FARM_CONFIG.CELL_SIZE_METERS;

    private cells: GridCell[][];
    private buildings = new Map<string, PlacedBuilding>();

    constructor() {
        this.cells = [];
        for (let x = 0; x < this.width; x++) {
            this.cells[x] = [];
            for (let y = 0; y < this.height; y++) {
                // Elevação suave procedural
                const nx = (x / this.width) * 4;
                const ny = (y / this.height) * 4;
                const elevation = Math.sin(nx) * 0.4 + Math.cos(ny) * 0.3;

                this.cells[x][y] = {
                    x,
                    y,
                    occupiedBy: null,
                    walkable: true,
                    elevation: Number(elevation.toFixed(2))
                };
            }
        }
    }

    isInside(x: number, y: number): boolean {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    getCell(x: number, y: number): GridCell | null {
        if (!this.isInside(x, y)) return null;
        return this.cells[x][y];
    }

    getRotatedFootprint(footprint: Footprint, orientation: BuildingOrientation): Footprint {
        if (orientation === 90 || orientation === 270) {
            return { width: footprint.height, height: footprint.width };
        }
        return { width: footprint.width, height: footprint.height };
    }

    getCellsInFootprint(
        originX: number,
        originY: number,
        footprint: Footprint,
        orientation: BuildingOrientation
    ): GridCell[] {
        const rotated = this.getRotatedFootprint(footprint, orientation);
        const result: GridCell[] = [];

        for (let dx = 0; dx < rotated.width; dx++) {
            for (let dy = 0; dy < rotated.height; dy++) {
                const cell = this.getCell(originX + dx, originY + dy);
                if (cell) {
                    result.push(cell);
                }
            }
        }
        return result;
    }

    canPlace(
        buildingType: keyof typeof BUILDING_CATALOG,
        gridX: number,
        gridY: number,
        orientation: BuildingOrientation = 0,
        ignoreInstanceId?: string
    ): { valid: boolean; reason?: string } {
        const def = BUILDING_CATALOG[buildingType];
        if (!def) {
            return { valid: false, reason: 'Construção desconhecida no catálogo.' };
        }

        const rotated = this.getRotatedFootprint(def.footprint, orientation);

        // Verifica se todo o footprint cabe dentro dos limites da fazenda
        if (gridX < 0 || gridY < 0 || gridX + rotated.width > this.width || gridY + rotated.height > this.height) {
            return { valid: false, reason: 'Fora dos limites da grade da fazenda (64x36).' };
        }

        // Verifica colisão célula a célula
        for (let dx = 0; dx < rotated.width; dx++) {
            for (let dy = 0; dy < rotated.height; dy++) {
                const cell = this.getCell(gridX + dx, gridY + dy);
                if (!cell) {
                    return { valid: false, reason: 'Célula inexistente.' };
                }
                if (cell.occupiedBy && cell.occupiedBy !== ignoreInstanceId) {
                    return { valid: false, reason: 'Área já ocupada por outra estrutura.' };
                }
            }
        }

        return { valid: true };
    }

    placeBuilding(building: PlacedBuilding): boolean {
        const check = this.canPlace(building.type, building.gridX, building.gridY, building.orientation);
        if (!check.valid) return false;

        const def = BUILDING_CATALOG[building.type];
        const cells = this.getCellsInFootprint(building.gridX, building.gridY, def.footprint, building.orientation);

        for (const cell of cells) {
            cell.occupiedBy = building.instanceId;
            cell.walkable = false; // construções bloqueiam passagem
        }

        this.buildings.set(building.instanceId, { ...building });
        return true;
    }

    removeBuilding(instanceId: string): PlacedBuilding | null {
        const building = this.buildings.get(instanceId);
        if (!building) return null;

        const def = BUILDING_CATALOG[building.type];
        const cells = this.getCellsInFootprint(building.gridX, building.gridY, def.footprint, building.orientation);

        for (const cell of cells) {
            if (cell.occupiedBy === instanceId) {
                cell.occupiedBy = null;
                cell.walkable = true;
            }
        }

        this.buildings.delete(instanceId);
        return building;
    }

    getBuilding(instanceId: string): PlacedBuilding | undefined {
        return this.buildings.get(instanceId);
    }

    getAllBuildings(): PlacedBuilding[] {
        return Array.from(this.buildings.values());
    }

    // Converte coordenada lógica do grid para metros 3D no mundo
    gridToWorld(gridX: number, gridY: number): { x: number; y: number; z: number } {
        // Centraliza a grade na origem (0, 0, 0)
        const halfWidth = (this.width * this.cellSize) / 2;
        const halfHeight = (this.height * this.cellSize) / 2;

        const worldX = gridX * this.cellSize + this.cellSize / 2 - halfWidth;
        const worldZ = gridY * this.cellSize + this.cellSize / 2 - halfHeight;
        const cell = this.getCell(gridX, gridY);
        const worldY = cell ? cell.elevation : 0;

        return { x: worldX, y: worldY, z: worldZ };
    }

    // Converte posição 3D do mundo para coordenada inteira do grid
    worldToGrid(worldX: number, worldZ: number): { gridX: number; gridY: number } {
        const halfWidth = (this.width * this.cellSize) / 2;
        const halfHeight = (this.height * this.cellSize) / 2;

        const gridX = Math.floor((worldX + halfWidth) / this.cellSize);
        const gridY = Math.floor((worldZ + halfHeight) / this.cellSize);

        return { gridX, gridY };
    }
}
