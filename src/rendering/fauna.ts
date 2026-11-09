import { Entity, Vec3 } from 'playcanvas';
import { FarmGrid } from '../core/grid';
import type { GlbAssetLoader } from './asset-loader';

export interface AnimalInstance {
    id?: string;
    entity: Entity;
    modelEntity?: Entity;
    animLayer?: any;
    type: 'chicken' | 'cow' | 'fox';
    position: Vec3;
    targetPosition: Vec3;
    rotation: number;
    targetRotation: number;
    state: 'idle' | 'walk' | 'eat';
    stateTimer: number;
    hunger?: number;
    readyToCollect?: boolean;
}

export class FaunaManager {
    readonly entity: Entity;
    private animals: AnimalInstance[] = [];
    private grid: FarmGrid;
    private assetLoader?: GlbAssetLoader;

    constructor(grid: FarmGrid, assetLoader?: GlbAssetLoader) {
        this.grid = grid;
        this.assetLoader = assetLoader;
        this.entity = new Entity('fauna_manager');

        if (this.assetLoader) {
            this.spawnFaunaWithAssets(this.assetLoader);
        }
    }

    private async spawnFaunaWithAssets(loader: GlbAssetLoader): Promise<void> {
        try {
            // Carrega modelo e animações da Vaca da Fazenda (Quaternius CC0)
            const cowGlb = await loader.load('assets/models/Cow.glb', 'fauna_cow');

            // Carrega modelo e animações da Raposa Selvagem (Khronos CC0)
            const foxGlb = await loader.load('assets/models/fox.glb', 'fauna_fox');

            // Spawna 3 vacas pastando nos canteiros e pastos da fazenda
            const cowSpawns: [number, number][] = [
                [22, 18],
                [25, 20],
                [19, 23]
            ];

            for (const [gx, gy] of cowSpawns) {
                const worldPos = this.grid.gridToWorld(gx, gy);
                const cowRoot = new Entity('farm_cow');
                cowRoot.setPosition(worldPos.x, worldPos.y, worldPos.z);

                const cowModel = cowGlb.instantiate();
                cowModel.name = 'cow_mesh';
                // Escala de altura calibrada para proporção realista (~1.3m de dorso)
                cowModel.setLocalScale(16.0, 16.0, 16.0);
                cowModel.setLocalPosition(0, 0, 0);

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
                    entity: cowRoot,
                    modelEntity: cowModel,
                    animLayer,
                    type: 'cow',
                    position: new Vec3(worldPos.x, worldPos.y, worldPos.z),
                    targetPosition: new Vec3(worldPos.x, worldPos.y, worldPos.z),
                    rotation: Math.random() * 360,
                    targetRotation: Math.random() * 360,
                    state: 'idle',
                    stateTimer: 2.0 + Math.random() * 4.0
                });
            }

            // Spawna raposa sentinela nos arredores da fazenda
            const foxPos = this.grid.gridToWorld(8, 6);
            const foxRoot = new Entity('wild_fox');
            foxRoot.setPosition(foxPos.x, foxPos.y, foxPos.z);

            const foxModel = foxGlb.instantiate();
            foxModel.name = 'fox_mesh';
            foxModel.setLocalScale(0.012, 0.012, 0.012);
            foxModel.setLocalPosition(0, 0, 0);

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
                entity: foxRoot,
                modelEntity: foxModel,
                animLayer: foxAnimLayer,
                type: 'fox',
                position: new Vec3(foxPos.x, foxPos.y, foxPos.z),
                targetPosition: new Vec3(foxPos.x, foxPos.y, foxPos.z),
                rotation: 45,
                targetRotation: 45,
                state: 'idle',
                stateTimer: 4.0
            });
        } catch (err) {
            console.error('[FaunaManager] Failed to load fauna 3D models:', err);
        }
    }

    getAnimals(): AnimalInstance[] {
        return this.animals;
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

            // Rotação suave do animal em direção ao alvo
            let diff = a.targetRotation - a.rotation;
            while (diff < -180) diff += 360;
            while (diff > 180) diff -= 360;
            a.rotation += diff * Math.min(1.0, dt * 6.0);
            a.entity.setEulerAngles(0, a.rotation, 0);

            if (a.state === 'idle' || a.state === 'eat') {
                if (a.stateTimer <= 0) {
                    // Decide entre caminhar, descansar ou pastar
                    const roll = Math.random();
                    if (roll < 0.45) {
                        // Caminhar para célula adjacente desocupada
                        this.pickNextDestination(a);
                    } else if (roll < 0.75 && a.type === 'cow') {
                        // Pastar na grama
                        a.state = 'eat';
                        a.stateTimer = 4.0 + Math.random() * 4.0;
                        if (a.animLayer) a.animLayer.transition('eat', 0.3);
                    } else {
                        // Continuar descansando
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
                    const walkSpeed = a.type === 'cow' ? 1.6 : 2.2;
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

        // Embaralha para escolher direção natural
        const candidates = offsets.sort(() => Math.random() - 0.5);

        for (const [dx, dy] of candidates) {
            const nx = gridX + dx;
            const ny = gridY + dy;

            // Preserva colisão: não anda onde há estruturas ou fora do terreno
            if (this.grid.isInside(nx, ny) && this.grid.getCell(nx, ny)?.walkable) {
                const targetW = this.grid.gridToWorld(nx, ny);
                a.targetPosition.set(targetW.x, targetW.y, targetW.z);
                a.state = 'walk';
                a.stateTimer = 4.0;
                if (a.animLayer) a.animLayer.transition('walk', 0.25);
                return;
            }
        }

        // Se cercado, descansa
        a.state = 'idle';
        a.stateTimer = 2.0;
        if (a.animLayer) a.animLayer.transition('idle', 0.25);
    }
}
