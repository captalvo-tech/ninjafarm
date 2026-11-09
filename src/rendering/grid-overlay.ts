import { Color, Entity, StandardMaterial } from 'playcanvas';

import { FARM_CONFIG } from '../core/config';

export class HolographicGridOverlay {
    readonly entity: Entity;
    private isVisible = false;
    private gridMat: StandardMaterial;

    constructor() {
        this.entity = new Entity('holo_grid_overlay');

        this.gridMat = new StandardMaterial();
        this.gridMat.diffuse = new Color(0.1, 0.9, 0.5);
        this.gridMat.emissive = new Color(0.05, 0.4, 0.2);
        this.gridMat.opacity = 0.25;
        this.gridMat.blendType = 2; // BLEND_NORMAL
        this.gridMat.update();

        this.buildGridLines();
        this.entity.enabled = false;
    }

    private buildGridLines(): void {
        const totalW = FARM_CONFIG.GRID_WIDTH * FARM_CONFIG.CELL_SIZE_METERS;
        const totalH = FARM_CONFIG.GRID_HEIGHT * FARM_CONFIG.CELL_SIZE_METERS;
        const halfW = totalW / 2;
        const halfH = totalH / 2;
        const cell = FARM_CONFIG.CELL_SIZE_METERS;

        // Linhas verticais (ao longo de Z)
        for (let x = 0; x <= FARM_CONFIG.GRID_WIDTH; x += 4) {
            // a cada 4 células para manter performance limpa
            const posX = x * cell - halfW;
            const line = new Entity(`grid_line_v_${x}`);
            line.addComponent('render', {
                type: 'box',
                material: this.gridMat
            });
            line.setLocalScale(0.08, 0.04, totalH);
            line.setLocalPosition(posX, 0.04, 0);
            this.entity.addChild(line);
        }

        // Linhas horizontais (ao longo de X)
        for (let y = 0; y <= FARM_CONFIG.GRID_HEIGHT; y += 4) {
            const posZ = y * cell - halfH;
            const line = new Entity(`grid_line_h_${y}`);
            line.addComponent('render', {
                type: 'box',
                material: this.gridMat
            });
            line.setLocalScale(totalW, 0.04, 0.08);
            line.setLocalPosition(0, 0.04, posZ);
            this.entity.addChild(line);
        }
    }

    toggle(): boolean {
        this.isVisible = !this.isVisible;
        this.entity.enabled = this.isVisible;
        return this.isVisible;
    }

    getVisible(): boolean {
        return this.isVisible;
    }
}
