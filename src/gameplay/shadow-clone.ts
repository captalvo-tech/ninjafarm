import { Entity, Vec3 } from 'playcanvas';
import { sound } from '../audio/sound';
import type { FarmGrid } from '../core/grid';
import type { CropSystem } from '../simulation/crops';
import type { FarmMaterials } from '../rendering/materials';
import type { VisualEffectsManager } from '../rendering/vfx';
import type { NinjaProgressionSystem } from './progression';

export interface ActiveClone {
    entity: Entity;
    lifetime: number;
    maxLifetime: number;
    targetCropId: string | null;
    animTimer: number;
}

export class ShadowCloneManager {
    readonly entity: Entity;
    private grid: FarmGrid;
    private cropSystem: CropSystem;
    private vfx: VisualEffectsManager;
    private materials: FarmMaterials;
    private progression: NinjaProgressionSystem;
    private clones: ActiveClone[] = [];
    private lastSpawnTime: number = 0;

    constructor(
        grid: FarmGrid,
        cropSystem: CropSystem,
        vfx: VisualEffectsManager,
        materials: FarmMaterials,
        progression: NinjaProgressionSystem
    ) {
        this.grid = grid;
        this.cropSystem = cropSystem;
        this.vfx = vfx;
        this.materials = materials;
        this.progression = progression;
        this.entity = new Entity('shadow_clone_root');
    }

    canSpawnClone(): boolean {
        return this.clones.length < 2 && Date.now() - this.lastSpawnTime >= 6000;
    }

    spawnClone(originX: number, originY: number, originZ: number, yawDegrees: number): boolean {
        if (this.clones.length >= 2) {
            return false;
        }

        this.lastSpawnTime = Date.now();
        const rad = (yawDegrees * Math.PI) / 180;
        const offsetX = Math.cos(rad) * 1.5;
        const offsetZ = -Math.sin(rad) * 1.5;
        const spawnX = originX + offsetX;
        const spawnZ = originZ + offsetZ;

        // Efeito de invocação com fumaça e selo ninja
        this.vfx.spawnSmokePuff(spawnX, originY, spawnZ);
        sound.playCloneSpawn();

        // Cria o corpo 3D do clone
        const cloneEnt = new Entity('shadow_clone');

        // Tronco do clone com material de chakra translúcido
        const torso = new Entity('clone_torso');
        torso.addComponent('render', {
            type: 'box',
            material: this.materials.ghostValid
        });
        torso.setLocalScale(0.7, 0.9, 0.45);
        torso.setLocalPosition(0, 1.35, 0);
        cloneEnt.addChild(torso);

        // Cabeça
        const head = new Entity('clone_head');
        head.addComponent('render', {
            type: 'box',
            material: this.materials.ghostValid
        });
        head.setLocalScale(0.48, 0.48, 0.48);
        head.setLocalPosition(0, 2.0, 0);
        cloneEnt.addChild(head);

        // Faixa carmesim
        const ribbon = new Entity('clone_ribbon');
        ribbon.addComponent('render', {
            type: 'box',
            material: this.materials.ninjaCrimson
        });
        ribbon.setLocalScale(0.55, 0.15, 0.55);
        ribbon.setLocalPosition(0, 1.95, 0);
        cloneEnt.addChild(ribbon);

        cloneEnt.setPosition(spawnX, originY, spawnZ);
        cloneEnt.setEulerAngles(0, yawDegrees, 0);
        this.entity.addChild(cloneEnt);

        this.clones.push({
            entity: cloneEnt,
            lifetime: 0,
            maxLifetime: 18.0,
            targetCropId: null,
            animTimer: 0
        });

        this.vfx.showFloatingText('👥 Kage Bunshin no Jutsu!', undefined, undefined, '#10B981');
        return true;
    }

    update(dt: number, ninjaPos: Vec3): void {
        for (let i = this.clones.length - 1; i >= 0; i--) {
            const clone = this.clones[i];
            clone.lifetime += dt;
            clone.animTimer += dt;

            const cPos = clone.entity.getPosition();

            // Expira e dissipa em fumaça após tempo limite
            if (clone.lifetime >= clone.maxLifetime) {
                this.vfx.spawnSmokePuff(cPos.x, cPos.y, cPos.z);
                sound.playSmokeDash();
                this.entity.removeChild(clone.entity);
                clone.entity.destroy();
                this.clones.splice(i, 1);
                continue;
            }

            // Busca por colheitas prontas se não tiver alvo
            if (!clone.targetCropId) {
                let closestCropId: string | null = null;
                let minDist = 35.0;

                for (const crop of this.cropSystem.getAllCrops()) {
                    if (crop.stage === 'ready') {
                        const b = this.grid.getBuilding(crop.buildingInstanceId);
                        if (b) {
                            const bPos = this.grid.gridToWorld(b.gridX, b.gridY);
                            const d = Math.hypot(bPos.x - cPos.x, bPos.z - cPos.z);
                            if (d < minDist) {
                                minDist = d;
                                closestCropId = crop.buildingInstanceId;
                            }
                        }
                    }
                }

                clone.targetCropId = closestCropId;
            }

            // Move em direção ao canteiro pronto ou patrulha ao redor do ninja
            let targetX = ninjaPos.x + 2.5;
            let targetZ = ninjaPos.z + 2.5;

            if (clone.targetCropId) {
                const b = this.grid.getBuilding(clone.targetCropId);
                if (b) {
                    const bPos = this.grid.gridToWorld(b.gridX, b.gridY);
                    targetX = bPos.x;
                    targetZ = bPos.z;
                } else {
                    clone.targetCropId = null;
                }
            }

            const dx = targetX - cPos.x;
            const dz = targetZ - cPos.z;
            const dist = Math.hypot(dx, dz);

            if (dist > 1.4) {
                const speed = 5.2; // corrida ágil do clone
                const moveX = (dx / dist) * speed * dt;
                const moveZ = (dz / dist) * speed * dt;

                clone.entity.setPosition(cPos.x + moveX, cPos.y, cPos.z + moveZ);
                const angle = Math.atan2(dx, dz) * (180 / Math.PI);
                clone.entity.setEulerAngles(0, angle, 0);

                // Bobbing de corrida
                const bounce = Math.abs(Math.sin(clone.animTimer * 14.0)) * 0.08;
                clone.entity.setLocalPosition(cPos.x + moveX, cPos.y + bounce, cPos.z + moveZ);
            } else if (clone.targetCropId) {
                // Chegou no canteiro pronto: Colhe automaticamente!
                const harvestRes = this.cropSystem.harvest(clone.targetCropId);
                if (harvestRes.success) {
                    sound.playHarvest();
                    this.vfx.spawnSpark(cPos.x, cPos.y + 1, cPos.z);
                    this.vfx.showFloatingText(
                        `🌾 Clone Colheu +${harvestRes.harvestedAmount} Alimento (+25 XP)`,
                        undefined,
                        undefined,
                        '#34D399'
                    );
                    this.progression.addXP(25);
                }
                clone.targetCropId = null;
            }
        }
    }
}

