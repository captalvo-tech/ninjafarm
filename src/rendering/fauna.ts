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

import { Application, Color, Entity, StandardMaterial, Vec3 } from 'playcanvas';

import type { FarmGrid } from '../core/grid';
import type { AnimalData, AnimalState, AnimalType } from '../core/types';
import { getVisualConfig, onVisualConfigChange } from '../core/visual-config';

import type { GlbAssetLoader } from './asset-loader';

export interface AnimalInstance {
    id: string;
    entity: Entity;
    modelEntity?: Entity;
    animLayer?: any;
    type: AnimalType;
    position: Vec3;
    targetPosition: Vec3;
    rotation: number;
    targetRotation: number;
    state: 'idle' | 'walk' | 'eat';
    stateTimer: number;
    hunger: number; // 0 (saciado) a 100 (faminto)
    lastFedAt: number;
    productionProgress: number; // 0.0 a 1.0 (ovo)
    readyToCollect: boolean;
}

export class FaunaManager {
    readonly entity: Entity;
    private animals: AnimalInstance[] = [];
    private grid: FarmGrid;
    private assetLoader?: GlbAssetLoader;

    private chickenBodyMat?: StandardMaterial;
    private chickenCombMat?: StandardMaterial;
    private chickenBeakMat?: StandardMaterial;

    constructor(grid: FarmGrid, assetLoader?: GlbAssetLoader) {
        this.grid = grid;
        this.assetLoader = assetLoader;
        this.entity = new Entity('fauna_manager');

        if (this.hasActiveApp()) {
            this.initProceduralMaterials();
        }

        // 1. Spawna 2 Galinhas Caipiras no piquete do galinheiro
        this.spawnChicken('chicken_farm_1', 20, 18, 20);
        this.spawnChicken('chicken_farm_2', 21, 19, 40);

        if (this.assetLoader) {
            this.spawnFaunaWithAssets(this.assetLoader);
        }
    }

    private hasActiveApp(): boolean {
        return typeof window !== 'undefined' && !!Application.getApplication();
    }

    private initProceduralMaterials(): void {
        this.chickenBodyMat = new StandardMaterial();
        this.chickenBodyMat.diffuse = new Color(0.96, 0.94, 0.88);
        this.chickenBodyMat.update();

        this.chickenCombMat = new StandardMaterial();
        this.chickenCombMat.diffuse = new Color(0.9, 0.15, 0.15);
        this.chickenCombMat.update();

        this.chickenBeakMat = new StandardMaterial();
        this.chickenBeakMat.diffuse = new Color(0.95, 0.75, 0.1);
        this.chickenBeakMat.update();
    }

    private async spawnFaunaWithAssets(loader: GlbAssetLoader): Promise<void> {
        try {
            // 2. Carrega modelo e animações da Vaca da Fazenda (Quaternius CC0)
            const cowGlb = await loader.load('assets/models/Cow.glb', 'fauna_cow');

            // 3. Carrega modelo e animações da Raposa Selvagem (Khronos CC0)
            const foxGlb = await loader.load('assets/models/fox.glb', 'fauna_fox');

            const visualConfig = getVisualConfig();
            const cowCfg = visualConfig.fauna.cow;
            const cowScale = cowCfg?.scale ?? 0.316;
            const cowOffsetY = cowCfg?.offsetY ?? 0.018;

            const foxCfg = visualConfig.fauna.fox;
            const foxScale = foxCfg?.scale ?? 0.0048;
            const foxOffsetY = foxCfg?.offsetY ?? 0.001;

            // Spawna vacas pastando nos canteiros e pastos da fazenda
            const cowSpawns: [string, number, number][] = [
                ['cow_farm_1', 22, 18],
                ['cow_farm_2', 25, 20]
            ];

            if (cowGlb) {
                for (const [id, gx, gy] of cowSpawns) {
                    const worldPos = this.grid.gridToWorld(gx, gy);
                    const cowRoot = new Entity('farm_cow_' + id);
                    cowRoot.setPosition(worldPos.x, worldPos.y, worldPos.z);

                    const cowModel = cowGlb.instantiate();
                    cowModel.name = 'cow_mesh';
                    cowModel.setLocalScale(cowScale, cowScale, cowScale);
                    cowModel.setLocalPosition(0, cowOffsetY, 0);

                    cowModel.addComponent('anim', {
                        activate: true,
                        speed: 1.0
                    });

                    const idleTrack = cowGlb.getTrack('Idle');
                    const walkTrack = cowGlb.getTrack('Walk');
                    const eatTrack = cowGlb.getTrack('Eating') || idleTrack;

                    if (idleTrack) cowModel.anim?.assignAnimation('idle', idleTrack, undefined, 1.0, true);
                    if (walkTrack) cowModel.anim?.assignAnimation('walk', walkTrack, undefined, 1.0, true);
                    if (eatTrack) cowModel.anim?.assignAnimation('eat', eatTrack, undefined, 0.8, true);

                    cowRoot.addChild(cowModel);
                    this.entity.addChild(cowRoot);

                    const animLayer = cowModel.anim?.baseLayer || null;

                    this.animals.push({
                        id,
                        entity: cowRoot,
                        modelEntity: cowModel,
                        animLayer,
                        type: 'cow',
                        position: new Vec3(worldPos.x, worldPos.y, worldPos.z),
                        targetPosition: new Vec3(worldPos.x, worldPos.y, worldPos.z),
                        rotation: Math.random() * 360,
                        targetRotation: Math.random() * 360,
                        state: 'idle',
                        stateTimer: 2.0 + Math.random() * 4.0,
                        hunger: 15,
                        lastFedAt: Date.now(),
                        productionProgress: 0.1,
                        readyToCollect: false
                    });
                }
            }

            // Spawna raposa sentinela nos arredores da fazenda
            if (foxGlb) {
                const foxPos = this.grid.gridToWorld(8, 6);
                const foxRoot = new Entity('wild_fox');
                foxRoot.setPosition(foxPos.x, foxPos.y, foxPos.z);

                const foxModel = foxGlb.instantiate();
                foxModel.name = 'fox_mesh';
                foxModel.setLocalScale(foxScale, foxScale, foxScale);
                foxModel.setLocalPosition(0, foxOffsetY, 0);

                foxModel.addComponent('anim', {
                    activate: true,
                    speed: 1.0
                });

                const surveyTrack = foxGlb.getTrack('Survey');
                const walkTrack = foxGlb.getTrack('Walk');
                const runTrack = foxGlb.getTrack('Run');

                if (surveyTrack) foxModel.anim?.assignAnimation('idle', surveyTrack, undefined, 1.0, true);
                if (walkTrack) foxModel.anim?.assignAnimation('walk', walkTrack, undefined, 1.1, true);
                if (runTrack) foxModel.anim?.assignAnimation('eat', runTrack, undefined, 1.0, true);

                foxRoot.addChild(foxModel);
                this.entity.addChild(foxRoot);

                const foxAnimLayer = foxModel.anim?.baseLayer || null;

                this.animals.push({
                    id: 'fox_sentinel_1',
                    entity: foxRoot,
                    modelEntity: foxModel,
                    animLayer: foxAnimLayer,
                    type: 'fox',
                    position: new Vec3(foxPos.x, foxPos.y, foxPos.z),
                    targetPosition: new Vec3(foxPos.x, foxPos.y, foxPos.z),
                    rotation: 45,
                    targetRotation: 45,
                    state: 'idle',
                    stateTimer: 4.0,
                    hunger: 5,
                    lastFedAt: Date.now(),
                    productionProgress: 0,
                    readyToCollect: false
                });
            }

            // Escuta mudanças dinâmicas no Ninja Farm Studio e aplica em tempo real
            onVisualConfigChange((newCfg) => {
                const updatedCowScale = newCfg.fauna.cow?.scale ?? 0.316;
                const updatedCowOffset = newCfg.fauna.cow?.offsetY ?? 0.018;
                const updatedFoxScale = newCfg.fauna.fox?.scale ?? 0.0048;
                const updatedFoxOffset = newCfg.fauna.fox?.offsetY ?? 0.001;

                for (const a of this.animals) {
                    if (a.type === 'cow' && a.modelEntity) {
                        a.modelEntity.setLocalScale(updatedCowScale, updatedCowScale, updatedCowScale);
                        a.modelEntity.setLocalPosition(0, updatedCowOffset, 0);
                    } else if (a.type === 'fox' && a.modelEntity) {
                        a.modelEntity.setLocalScale(updatedFoxScale, updatedFoxScale, updatedFoxScale);
                        a.modelEntity.setLocalPosition(0, updatedFoxOffset, 0);
                    }
                }
            });
        } catch (err) {
            console.error('[FaunaManager] Failed to load fauna 3D models:', err);
        }
    }

    private spawnChicken(id: string, gx: number, gy: number, initialHunger = 20): void {
        const worldPos = this.grid.gridToWorld(gx, gy);
        const root = new Entity('farm_chicken_' + id);
        root.setPosition(worldPos.x, worldPos.y, worldPos.z);

        if (this.hasActiveApp()) {
            const chickenMesh = this.buildProceduralChicken();
            root.addChild(chickenMesh);
            this.entity.addChild(root);
        }

        this.animals.push({
            id,
            entity: root,
            type: 'chicken',
            position: new Vec3(worldPos.x, worldPos.y, worldPos.z),
            targetPosition: new Vec3(worldPos.x, worldPos.y, worldPos.z),
            rotation: Math.random() * 360,
            targetRotation: Math.random() * 360,
            state: 'idle',
            stateTimer: 2.0 + Math.random() * 3.0,
            hunger: initialHunger,
            lastFedAt: Date.now(),
            productionProgress: initialHunger < 40 ? 0.4 : 0.0,
            readyToCollect: false
        });
    }

    private buildProceduralChicken(): Entity {
        const chickenRoot = new Entity('chicken_procedural');

        // Corpo
        const body = new Entity('chicken_body');
        body.addComponent('render', { type: 'box', material: this.chickenBodyMat });
        body.setLocalScale(0.4, 0.35, 0.5);
        body.setLocalPosition(0, 0.35, 0);
        chickenRoot.addChild(body);

        // Cabeça
        const head = new Entity('chicken_head');
        head.addComponent('render', { type: 'box', material: this.chickenBodyMat });
        head.setLocalScale(0.2, 0.25, 0.2);
        head.setLocalPosition(0, 0.6, 0.22);
        chickenRoot.addChild(head);

        // Crista vermelha
        const comb = new Entity('chicken_comb');
        comb.addComponent('render', { type: 'box', material: this.chickenCombMat });
        comb.setLocalScale(0.06, 0.12, 0.18);
        comb.setLocalPosition(0, 0.76, 0.22);
        chickenRoot.addChild(comb);

        // Bico amarelo
        const beak = new Entity('chicken_beak');
        beak.addComponent('render', { type: 'box', material: this.chickenBeakMat });
        beak.setLocalScale(0.08, 0.06, 0.12);
        beak.setLocalPosition(0, 0.58, 0.35);
        chickenRoot.addChild(beak);

        // Asas
        const wingL = new Entity('chicken_wing_l');
        wingL.addComponent('render', { type: 'box', material: this.chickenBodyMat });
        wingL.setLocalScale(0.08, 0.22, 0.35);
        wingL.setLocalPosition(-0.22, 0.38, -0.02);
        chickenRoot.addChild(wingL);

        const wingR = new Entity('chicken_wing_r');
        wingR.addComponent('render', { type: 'box', material: this.chickenBodyMat });
        wingR.setLocalScale(0.08, 0.22, 0.35);
        wingR.setLocalPosition(0.22, 0.38, -0.02);
        chickenRoot.addChild(wingR);

        return chickenRoot;
    }

    public feedAnimal(animalId: string): boolean {
        const a = this.animals.find((an) => an.id === animalId || an.type === animalId);
        if (!a) return false;

        a.hunger = 0;
        a.lastFedAt = Date.now();
        a.state = 'eat';
        a.stateTimer = 4.0;
        if (a.animLayer) a.animLayer.transition('eat', 0.25);
        return true;
    }

    public collectEggs(animalId?: string): { success: boolean; amount: number } {
        let totalEggs = 0;
        for (const a of this.animals) {
            if (a.type === 'chicken' && (!animalId || a.id === animalId)) {
                if (a.readyToCollect) {
                    a.readyToCollect = false;
                    a.productionProgress = 0.0;
                    totalEggs += 2;
                }
            }
        }
        return { success: totalEggs > 0, amount: totalEggs };
    }

    public simulateOfflineSeconds(elapsedSeconds: number): { eggsProduced: number } {
        if (elapsedSeconds <= 0) return { eggsProduced: 0 };

        let eggsProduced = 0;
        const hungerIncrease = Math.min(60, (elapsedSeconds / 3600) * 15); // +15 de fome por hora

        for (const a of this.animals) {
            a.hunger = Math.min(100, a.hunger + hungerIncrease);

            if (a.type === 'chicken') {
                if (a.hunger < 70 && !a.readyToCollect) {
                    // Galinha bem alimentada botou ovos durante a ausência
                    const prodHours = elapsedSeconds / 3600;
                    a.productionProgress = Math.min(1.0, a.productionProgress + prodHours * 0.5);
                    if (a.productionProgress >= 1.0) {
                        a.readyToCollect = true;
                        eggsProduced += 2;
                    }
                }
            }
        }

        return { eggsProduced };
    }

    getAnimals(): AnimalInstance[] {
        return this.animals;
    }

    getAnimalById(id: string): AnimalInstance | undefined {
        return this.animals.find((a) => a.id === id);
    }

    triggerAnimalReaction(type: string): void {
        for (const a of this.animals) {
            if (a.type === type || (type === 'chicken' && a.type === 'cow')) {
                a.state = 'idle';
                a.stateTimer = 3.0;
                if (a.animLayer) {
                    a.animLayer.transition('idle', 0.2);
                }
            }
        }
    }

    update(dt: number): void {
        for (const a of this.animals) {
            a.stateTimer -= dt;

            // Fome biológica contínua (+0.05 por segundo = +3 por minuto)
            a.hunger = Math.min(100, a.hunger + dt * 0.04);

            // Ciclo de produção de ovos para galinhas (se fome < 60)
            if (a.type === 'chicken') {
                if (a.hunger < 60 && !a.readyToCollect) {
                    a.productionProgress += dt / 120.0; // 1 ciclo a cada 2 minutos
                    if (a.productionProgress >= 1.0) {
                        a.productionProgress = 1.0;
                        a.readyToCollect = true;
                    }
                }
            }

            // Rotação suave do animal em direção ao alvo
            let diff = a.targetRotation - a.rotation;
            while (diff < -180) diff += 360;
            while (diff > 180) diff -= 360;
            a.rotation += diff * Math.min(1.0, dt * 6.0);
            a.entity.setEulerAngles(0, a.rotation, 0);

            if (a.state === 'idle' || a.state === 'eat') {
                if (a.stateTimer <= 0) {
                    // Decide entre caminhar, descansar ou pastar/bicar
                    const roll = Math.random();
                    if (roll < 0.45) {
                        this.pickNextDestination(a);
                    } else if (roll < 0.75 && (a.type === 'cow' || a.type === 'chicken')) {
                        a.state = 'eat';
                        a.stateTimer = 3.0 + Math.random() * 3.0;
                        if (a.animLayer) a.animLayer.transition('eat', 0.3);
                    } else {
                        a.state = 'idle';
                        a.stateTimer = 2.5 + Math.random() * 3.5;
                        if (a.animLayer) a.animLayer.transition('idle', 0.25);
                    }
                }
            } else if (a.state === 'walk') {
                // Desloca em direção a targetPosition sem atravessar estruturas
                const dir = new Vec3().sub2(a.targetPosition, a.position);
                const dist = dir.length();

                if (dist < 0.15 || a.stateTimer <= 0) {
                    a.position.copy(a.targetPosition);
                    a.entity.setPosition(a.position.x, a.position.y, a.position.z);
                    a.state = 'idle';
                    a.stateTimer = 2.0 + Math.random() * 3.0;
                    if (a.animLayer) a.animLayer.transition('idle', 0.25);
                } else {
                    dir.normalize();
                    const walkSpeed =
                        a.type === 'cow' ? 1.1 : a.type === 'chicken' ? 1.0 : a.type === 'fox' ? 2.0 : 1.4;
                    const step = Math.min(dist, walkSpeed * dt);
                    a.position.add(dir.mulScalar(step));
                    a.entity.setPosition(a.position.x, a.position.y, a.position.z);

                    // Alinha orientação visual de caminhada
                    const moveAngle = (Math.atan2(dir.x, dir.z) * 180) / Math.PI;
                    a.targetRotation = moveAngle;
                }
            }
        }
    }

    private pickNextDestination(a: AnimalInstance): void {
        const { gridX, gridY } = this.grid.worldToGrid(a.position.x, a.position.z);
        const offsets: [number, number][] = [
            [-1, 0],
            [1, 0],
            [0, -1],
            [0, 1],
            [-1, -1],
            [1, 1]
        ];

        const candidates = offsets.sort(() => Math.random() - 0.5);

        for (const [dx, dy] of candidates) {
            const nx = gridX + dx;
            const ny = gridY + dy;

            if (this.grid.isInside(nx, ny) && this.grid.getCell(nx, ny)?.walkable) {
                const targetW = this.grid.gridToWorld(nx, ny);
                a.targetPosition.set(targetW.x, targetW.y, targetW.z);
                a.state = 'walk';
                a.stateTimer = 4.0;
                if (a.animLayer) a.animLayer.transition('walk', 0.25);
                return;
            }
        }

        a.state = 'idle';
        a.stateTimer = 2.0;
        if (a.animLayer) a.animLayer.transition('idle', 0.25);
    }

    public serialize(): AnimalData[] {
        return this.animals.map((a) => {
            const coords = this.grid.worldToGrid(a.position.x, a.position.z);
            return {
                id: a.id,
                type: a.type,
                state: (a.state === 'walk' ? 'walking' : a.state === 'eat' ? 'eating' : 'idle') as AnimalState,
                posX: coords.gridX,
                posY: coords.gridY,
                hunger: Math.round(a.hunger),
                lastFedAt: a.lastFedAt,
                productionProgress: Math.round(a.productionProgress * 100) / 100,
                readyToCollect: a.readyToCollect
            };
        });
    }

    public load(savedAnimals: AnimalData[]): void {
        if (!savedAnimals || savedAnimals.length === 0) return;

        for (const saved of savedAnimals) {
            const a = this.animals.find((an) => an.id === saved.id);
            if (a) {
                a.hunger = saved.hunger;
                a.lastFedAt = saved.lastFedAt;
                a.productionProgress = saved.productionProgress;
                a.readyToCollect = saved.readyToCollect;
                const pos = this.grid.gridToWorld(saved.posX, saved.posY);
                a.position.set(pos.x, pos.y, pos.z);
                a.targetPosition.set(pos.x, pos.y, pos.z);
                a.entity.setPosition(pos.x, pos.y, pos.z);
            }
        }
    }
}
