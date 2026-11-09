import { Color, Entity, StandardMaterial, Vec3 } from 'playcanvas';

export interface ActiveProjectile {
    entity: Entity;
    velocity: Vec3;
    life: number;
    maxLife: number;
}

export interface HitTarget {
    id: string;
    getPosition: () => Vec3;
    radius: number;
    onHit: () => void;
}

export class VisualEffectsManager {
    readonly entity: Entity;
    private projectiles: ActiveProjectile[] = [];
    private smokePuffs: { entity: Entity; life: number; maxLife: number }[] = [];
    private waterRings: { entity: Entity; life: number; maxLife: number }[] = [];
    private sparks: { entity: Entity; life: number; maxLife: number }[] = [];
    private targets: HitTarget[] = [];

    private metalMat: StandardMaterial;
    private smokeMat: StandardMaterial;
    private waterMat: StandardMaterial;
    private sparkMat: StandardMaterial;
    private beaconMat: StandardMaterial;
    private beacons: { entity: Entity; life: number; maxLife: number }[] = [];

    constructor() {
        this.entity = new Entity('vfx_manager');

        this.metalMat = new StandardMaterial();
        this.metalMat.diffuse = new Color(0.85, 0.88, 0.95);
        this.metalMat.specular = new Color(1, 1, 1);
        this.metalMat.gloss = 0.9;
        this.metalMat.useMetalness = true;
        this.metalMat.metalness = 0.95;
        this.metalMat.update();

        this.smokeMat = new StandardMaterial();
        this.smokeMat.diffuse = new Color(0.8, 0.8, 0.85);
        this.smokeMat.opacity = 0.6;
        this.smokeMat.blendType = 2; // BLEND_NORMAL
        this.smokeMat.update();

        this.waterMat = new StandardMaterial();
        this.waterMat.diffuse = new Color(0.2, 0.6, 1.0);
        this.waterMat.emissive = new Color(0.1, 0.4, 0.9);
        this.waterMat.opacity = 0.55;
        this.waterMat.blendType = 2; // BLEND_NORMAL
        this.waterMat.update();

        this.sparkMat = new StandardMaterial();
        this.sparkMat.diffuse = new Color(1.0, 0.8, 0.2);
        this.sparkMat.emissive = new Color(1.0, 0.9, 0.3);
        this.sparkMat.update();

        this.beaconMat = new StandardMaterial();
        this.beaconMat.diffuse = new Color(0.2, 0.9, 0.5);
        this.beaconMat.emissive = new Color(0.1, 0.8, 0.4);
        this.beaconMat.opacity = 0.7;
        this.beaconMat.blendType = 2; // BLEND_NORMAL
        this.beaconMat.update();
    }

    registerTarget(target: HitTarget): void {
        this.targets.push(target);
    }

    unregisterTarget(id: string): void {
        this.targets = this.targets.filter(t => t.id !== id);
    }

    // Lança um Shuriken 3D na direção em que o Ninja está olhando
    spawnShuriken(originX: number, originY: number, originZ: number, yawDegrees: number): void {
        const shuriken = new Entity('shuriken');

        // Cria estrela de 4 pontas
        const bar1 = new Entity('shuriken_bar1');
        bar1.addComponent('render', {
            type: 'box',
            material: this.metalMat
        });
        bar1.setLocalScale(0.06, 0.02, 0.45);
        shuriken.addChild(bar1);

        const bar2 = new Entity('shuriken_bar2');
        bar2.addComponent('render', {
            type: 'box',
            material: this.metalMat
        });
        bar2.setLocalScale(0.45, 0.02, 0.06);
        shuriken.addChild(bar2);

        // Centro da shuriken
        const center = new Entity('shuriken_center');
        center.addComponent('render', {
            type: 'cylinder',
            material: this.metalMat
        });
        center.setLocalScale(0.12, 0.03, 0.12);
        shuriken.addChild(center);

        shuriken.setPosition(originX, originY + 1.2, originZ);
        this.entity.addChild(shuriken);

        const rad = (yawDegrees * Math.PI) / 180;
        const speed = 28.0; // m/s
        const velocity = new Vec3(Math.sin(rad) * speed, 0, Math.cos(rad) * speed);

        this.projectiles.push({
            entity: shuriken,
            velocity,
            life: 0,
            maxLife: 1.2
        });
    }

    // Nuvem de fumaça ninja (Smoke Dash)
    spawnSmokePuff(x: number, y: number, z: number): void {
        const puffRoot = new Entity('smoke_puff');
        puffRoot.setPosition(x, y + 0.8, z);

        for (let i = 0; i < 6; i++) {
            const sphere = new Entity('smoke_particle_' + i);
            sphere.addComponent('render', {
                type: 'sphere',
                material: this.smokeMat
            });
            const scale = 0.6 + Math.random() * 0.5;
            sphere.setLocalScale(scale, scale, scale);
            sphere.setLocalPosition(
                (Math.random() - 0.5) * 1.2,
                (Math.random() - 0.5) * 0.8,
                (Math.random() - 0.5) * 1.2
            );
            puffRoot.addChild(sphere);
        }

        this.entity.addChild(puffRoot);
        this.smokePuffs.push({
            entity: puffRoot,
            life: 0,
            maxLife: 0.5
        });
    }

    // Suiton: Anel de água expansivo no solo
    spawnSuitonRing(x: number, y: number, z: number): void {
        const ring = new Entity('suiton_ring');
        ring.addComponent('render', {
            type: 'cylinder',
            material: this.waterMat
        });
        ring.setLocalScale(1, 0.08, 1);
        ring.setPosition(x, y + 0.05, z);

        this.entity.addChild(ring);
        this.waterRings.push({
            entity: ring,
            life: 0,
            maxLife: 0.7
        });
    }

    // Fagulhas de impacto
    spawnSpark(x: number, y: number, z: number): void {
        const sparkRoot = new Entity('sparks_root');
        sparkRoot.setPosition(x, y, z);

        for (let i = 0; i < 5; i++) {
            const spark = new Entity('spark_' + i);
            spark.addComponent('render', {
                type: 'box',
                material: this.sparkMat
            });
            spark.setLocalScale(0.08, 0.08, 0.08);
            spark.setLocalPosition(
                (Math.random() - 0.5) * 0.4,
                (Math.random() - 0.5) * 0.4,
                (Math.random() - 0.5) * 0.4
            );
            sparkRoot.addChild(spark);
        }

        this.entity.addChild(sparkRoot);
        this.sparks.push({
            entity: sparkRoot,
            life: 0,
            maxLife: 0.25
        });
    }

    // Poeira de corrida (Sprint Dust)
    spawnSprintDust(x: number, y: number, z: number): void {
        const dust = new Entity('sprint_dust');
        dust.addComponent('render', {
            type: 'sphere',
            material: this.smokeMat
        });
        dust.setLocalScale(0.25, 0.2, 0.25);
        dust.setPosition(x + (Math.random() - 0.5) * 0.3, y + 0.1, z + (Math.random() - 0.5) * 0.3);

        this.entity.addChild(dust);
        this.smokePuffs.push({
            entity: dust,
            life: 0,
            maxLife: 0.35
        });
    }

    // Anel de toque no solo indicando destino de movimento (Tap-to-move)
    spawnMoveBeacon(x: number, y: number, z: number): void {
        const beacon = new Entity('move_beacon');
        beacon.addComponent('render', {
            type: 'cylinder',
            material: this.beaconMat
        });
        beacon.setLocalScale(0.3, 0.02, 0.3);
        beacon.setPosition(x, y + 0.04, z);

        this.entity.addChild(beacon);
        this.beacons.push({
            entity: beacon,
            life: 0,
            maxLife: 0.45
        });
    }

    // Exibe número flutuante na tela ("+25 Alimento", etc.)
    showFloatingText(text: string, screenX?: number, screenY?: number, color: string = '#34D399'): void {
        const floater = document.createElement('div');
        floater.className = 'floating-vfx-text';
        floater.textContent = text;
        floater.style.cssText = `
            position: fixed;
            left: ${screenX ?? (window.innerWidth / 2 + (Math.random() - 0.5) * 100)}px;
            top: ${screenY ?? (window.innerHeight / 2 - 40 + (Math.random() - 0.5) * 40)}px;
            color: ${color};
            font-family: 'DM Sans', sans-serif;
            font-size: 20px;
            font-weight: 900;
            text-shadow: 0 0 10px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.9);
            pointer-events: none;
            z-index: 200;
            transform: translate(-50%, 0px);
            transition: transform 0.9s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.9s ease;
            opacity: 1;
        `;

        document.body.appendChild(floater);

        // Animação flutuante para cima
        requestAnimationFrame(() => {
            floater.style.transform = 'translate(-50%, -60px) scale(1.15)';
            floater.style.opacity = '0';
        });

        setTimeout(() => {
            floater.remove();
        }, 950);
    }

    update(dt: number): void {
        // Atualiza shurikens
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.life += dt;

            // Movimento reto e rotação veloz
            p.entity.rotate(0, 1800 * dt, 0);
            p.entity.translate(p.velocity.x * dt, p.velocity.y * dt, p.velocity.z * dt);

            // Teste de colisão com alvos registrados
            const pPos = p.entity.getPosition();
            let hit = false;
            for (const target of this.targets) {
                const tPos = target.getPosition();
                const dist = Math.hypot(pPos.x - tPos.x, pPos.z - tPos.z);
                if (dist <= target.radius && Math.abs(pPos.y - tPos.y) <= 1.8) {
                    target.onHit();
                    this.spawnSpark(pPos.x, pPos.y, pPos.z);
                    this.entity.removeChild(p.entity);
                    p.entity.destroy();
                    this.projectiles.splice(i, 1);
                    hit = true;
                    break;
                }
            }

            if (!hit && p.life >= p.maxLife) {
                this.entity.removeChild(p.entity);
                p.entity.destroy();
                this.projectiles.splice(i, 1);
            }
        }

        // Atualiza fumaça
        for (let i = this.smokePuffs.length - 1; i >= 0; i--) {
            const puff = this.smokePuffs[i];
            puff.life += dt;

            const progress = puff.life / puff.maxLife;
            const currentScale = 1.0 + progress * 1.5;
            puff.entity.setLocalScale(currentScale, currentScale, currentScale);
            puff.entity.translate(0, 0.8 * dt, 0);

            if (puff.life >= puff.maxLife) {
                this.entity.removeChild(puff.entity);
                puff.entity.destroy();
                this.smokePuffs.splice(i, 1);
            }
        }

        // Atualiza anéis de água do Suiton
        for (let i = this.waterRings.length - 1; i >= 0; i--) {
            const ring = this.waterRings[i];
            ring.life += dt;

            const progress = ring.life / ring.maxLife;
            const currentScale = 1.0 + progress * 8.0; // expande até 8m
            ring.entity.setLocalScale(currentScale, 0.08, currentScale);

            if (ring.life >= ring.maxLife) {
                this.entity.removeChild(ring.entity);
                ring.entity.destroy();
                this.waterRings.splice(i, 1);
            }
        }

        // Atualiza anéis de toque no solo (beacons)
        for (let i = this.beacons.length - 1; i >= 0; i--) {
            const b = this.beacons[i];
            b.life += dt;
            const progress = b.life / b.maxLife;
            const scale = 0.3 + progress * 1.4;
            b.entity.setLocalScale(scale, 0.02, scale);

            if (b.life >= b.maxLife) {
                this.entity.removeChild(b.entity);
                b.entity.destroy();
                this.beacons.splice(i, 1);
            }
        }

        // Atualiza fagulhas
        for (let i = this.sparks.length - 1; i >= 0; i--) {
            const sp = this.sparks[i];
            sp.life += dt;
            sp.entity.translate(0, 1.2 * dt, 0);

            if (sp.life >= sp.maxLife) {
                this.entity.removeChild(sp.entity);
                sp.entity.destroy();
                this.sparks.splice(i, 1);
            }
        }
    }
}
