import { Entity } from 'playcanvas';
import { FARM_CONFIG } from '../core/config';
import type { FarmMaterials } from './materials';
import { BuildingModelFactory } from './models';

export class FarmTerrain {
    readonly entity: Entity;
    private materials: FarmMaterials;
    private modelFactory: BuildingModelFactory;

    constructor(materials: FarmMaterials, modelFactory: BuildingModelFactory) {
        this.materials = materials;
        this.modelFactory = modelFactory;
        this.entity = new Entity('farm_terrain');
        this.buildTerrain();
    }

    private buildTerrain(): void {
        const totalW = FARM_CONFIG.GRID_WIDTH * FARM_CONFIG.CELL_SIZE_METERS; // 128m
        const totalH = FARM_CONFIG.GRID_HEIGHT * FARM_CONFIG.CELL_SIZE_METERS; // 72m

        // Terreno base da fazenda
        const ground = new Entity('ground_plane');
        ground.addComponent('render', {
            type: 'box',
            material: this.materials.grass
        });
        ground.setLocalScale(totalW, 1.0, totalH);
        ground.setLocalPosition(0, -0.5, 0);
        this.entity.addChild(ground);

        // Terreno estendido ao redor da base (natureza externa / horizonte)
        const outerGround = new Entity('outer_ground');
        outerGround.addComponent('render', {
            type: 'box',
            material: this.materials.grass
        });
        outerGround.setLocalScale(totalW * 2.2, 0.8, totalH * 2.5);
        outerGround.setLocalPosition(0, -0.6, 0);
        this.entity.addChild(outerGround);

        // Caminhos de pedra / terra batida conectando as zonas
        const mainPath = new Entity('pathway_main');
        mainPath.addComponent('render', {
            type: 'box',
            material: this.materials.soil
        });
        mainPath.setLocalScale(4.5, 0.05, totalH * 0.8);
        mainPath.setLocalPosition(0, 0.02, 0);
        this.entity.addChild(mainPath);

        const crossPath = new Entity('pathway_cross');
        crossPath.addComponent('render', {
            type: 'box',
            material: this.materials.soil
        });
        crossPath.setLocalScale(totalW * 0.7, 0.05, 3.5);
        crossPath.setLocalPosition(0, 0.02, 4);
        this.entity.addChild(crossPath);

        // Cerca e postes delimitadores na borda dos 64x36
        this.buildPerimeterFences(totalW, totalH);

        // Árvores e vegetação ao redor
        this.buildSurroundingVegetation(totalW, totalH);
    }

    private buildPerimeterFences(totalW: number, totalH: number): void {
        const halfW = totalW / 2;
        const halfH = totalH / 2;

        const borderN = new Entity('border_north');
        borderN.addComponent('render', { type: 'box', material: this.materials.wood });
        borderN.setLocalScale(totalW, 0.6, 0.25);
        borderN.setLocalPosition(0, 0.3, -halfH);
        this.entity.addChild(borderN);

        const borderS = new Entity('border_south');
        borderS.addComponent('render', { type: 'box', material: this.materials.wood });
        borderS.setLocalScale(totalW, 0.6, 0.25);
        borderS.setLocalPosition(0, 0.3, halfH);
        this.entity.addChild(borderS);

        const borderW = new Entity('border_west');
        borderW.addComponent('render', { type: 'box', material: this.materials.wood });
        borderW.setLocalScale(0.25, 0.6, totalH);
        borderW.setLocalPosition(-halfW, 0.3, 0);
        this.entity.addChild(borderW);

        const borderE = new Entity('border_east');
        borderE.addComponent('render', { type: 'box', material: this.materials.wood });
        borderE.setLocalScale(0.25, 0.6, totalH);
        borderE.setLocalPosition(halfW, 0.3, 0);
        this.entity.addChild(borderE);
    }

    private buildSurroundingVegetation(totalW: number, totalH: number): void {
        const halfW = totalW / 2;
        const halfH = totalH / 2;

        // Distribuição de árvores naturais fora da área produtiva
        const treePositions: [number, number][] = [
            [-halfW - 6, -halfH - 5],
            [-halfW - 12, 0],
            [-halfW - 8, halfH + 6],
            [halfW + 7, -halfH - 4],
            [halfW + 10, 8],
            [halfW + 6, halfH + 8],
            [-20, -halfH - 8],
            [15, -halfH - 7],
            [-35, halfH + 7],
            [30, halfH + 9]
        ];

        for (let i = 0; i < treePositions.length; i++) {
            const tree = this.modelFactory.createTree();
            tree.setLocalPosition(treePositions[i][0], 0, treePositions[i][1]);
            const scale = 0.8 + ((i % 3) * 0.2);
            tree.setLocalScale(scale, scale, scale);
            this.entity.addChild(tree);
        }
    }
}

