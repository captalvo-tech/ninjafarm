import { Color, Entity, StandardMaterial } from 'playcanvas';
import { FARM_CONFIG } from '../core/config';

interface SakuraPetal {
    entity: Entity;
    x: number;
    y: number;
    z: number;
    speedY: number;
    driftSpeed: number;
    rotSpeedX: number;
    rotSpeedY: number;
    phase: number;
}

interface Firefly {
    entity: Entity;
    baseX: number;
    baseY: number;
    baseZ: number;
    phase: number;
    speed: number;
}

export class WeatherSystem {
    readonly entity: Entity;
    private petals: SakuraPetal[] = [];
    private fireflies: Firefly[] = [];
    private petalMat: StandardMaterial;
    private fireflyMat: StandardMaterial;
    private windTimer: number = 0;

    constructor(petalCount: number = 45, fireflyCount: number = 25) {
        this.entity = new Entity('weather_system_root');

        // Material rosa cerejeira translúcido e suave
        this.petalMat = new StandardMaterial();
        this.petalMat.diffuse = new Color(1.0, 0.72, 0.82);
        this.petalMat.emissive = new Color(0.3, 0.1, 0.15);
        this.petalMat.opacity = 0.85;
        this.petalMat.blendType = 2; // BLEND_NORMAL
        this.petalMat.update();

        // Material vagalume (Hotaru) místico verde-esmeralda cintilante
        this.fireflyMat = new StandardMaterial();
        this.fireflyMat.diffuse = new Color(0.4, 0.95, 0.25);
        this.fireflyMat.emissive = new Color(0.5, 1.0, 0.3);
        this.fireflyMat.opacity = 0.9;
        this.fireflyMat.blendType = 2; // BLEND_NORMAL
        this.fireflyMat.update();

        this.initPetals(petalCount);
        this.initFireflies(fireflyCount);
    }

    private initPetals(count: number): void {
        const halfW = (FARM_CONFIG.GRID_WIDTH * FARM_CONFIG.CELL_SIZE_METERS) / 2;
        const halfH = (FARM_CONFIG.GRID_HEIGHT * FARM_CONFIG.CELL_SIZE_METERS) / 2;

        for (let i = 0; i < count; i++) {
            const petal = new Entity(`sakura_petal_${i}`);
            petal.addComponent('render', {
                type: 'box',
                material: this.petalMat
            });

            // Pétala fina e achatada
            petal.setLocalScale(0.18, 0.02, 0.12);

            const x = (Math.random() - 0.5) * halfW * 2;
            const y = 3 + Math.random() * 18;
            const z = (Math.random() - 0.5) * halfH * 2;

            petal.setPosition(x, y, z);
            this.entity.addChild(petal);

            this.petals.push({
                entity: petal,
                x,
                y,
                z,
                speedY: 0.8 + Math.random() * 0.9,
                driftSpeed: 1.2 + Math.random() * 0.8,
                rotSpeedX: 40 + Math.random() * 80,
                rotSpeedY: 60 + Math.random() * 120,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    private initFireflies(count: number): void {
        const halfW = (FARM_CONFIG.GRID_WIDTH * FARM_CONFIG.CELL_SIZE_METERS) / 2 - 4;
        const halfH = (FARM_CONFIG.GRID_HEIGHT * FARM_CONFIG.CELL_SIZE_METERS) / 2 - 4;

        for (let i = 0; i < count; i++) {
            const firefly = new Entity(`firefly_${i}`);
            firefly.addComponent('render', {
                type: 'sphere',
                material: this.fireflyMat
            });

            firefly.setLocalScale(0.16, 0.16, 0.16);

            const x = (Math.random() - 0.5) * halfW * 1.8;
            const y = 0.5 + Math.random() * 2.8;
            const z = (Math.random() - 0.5) * halfH * 1.8;

            firefly.setPosition(x, y, z);
            firefly.enabled = false;
            this.entity.addChild(firefly);

            this.fireflies.push({
                entity: firefly,
                baseX: x,
                baseY: y,
                baseZ: z,
                phase: Math.random() * Math.PI * 2,
                speed: 0.8 + Math.random() * 1.2
            });
        }
    }

    update(dt: number, isNight: boolean = false): void {
        this.windTimer += dt;
        const windX = Math.sin(this.windTimer * 0.4) * 1.5;
        const windZ = Math.cos(this.windTimer * 0.3) * 0.8;

        const halfW = (FARM_CONFIG.GRID_WIDTH * FARM_CONFIG.CELL_SIZE_METERS) / 2;
        const halfH = (FARM_CONFIG.GRID_HEIGHT * FARM_CONFIG.CELL_SIZE_METERS) / 2;

        for (const p of this.petals) {
            p.y -= p.speedY * dt;
            p.x += (windX + Math.sin(p.phase + this.windTimer * 2) * 0.8) * dt;
            p.z += (windZ + Math.cos(p.phase + this.windTimer * 1.5) * 0.6) * dt;

            // Rotação suave no ar
            p.entity.rotate(p.rotSpeedX * dt, p.rotSpeedY * dt, 15 * dt);
            p.entity.setPosition(p.x, p.y, p.z);

            // Se tocar o chão ou sair da fazenda, recicla no alto
            if (p.y <= 0.05 || Math.abs(p.x) > halfW + 10 || Math.abs(p.z) > halfH + 10) {
                p.y = 16 + Math.random() * 6;
                p.x = (Math.random() - 0.5) * halfW * 1.8;
                p.z = (Math.random() - 0.5) * halfH * 1.8;
                p.entity.setPosition(p.x, p.y, p.z);
            }
        }

        // Vagalumes cintilantes noturnos (Hotaru)
        for (const f of this.fireflies) {
            if (!isNight) {
                if (f.entity.enabled) f.entity.enabled = false;
                continue;
            }

            if (!f.entity.enabled) f.entity.enabled = true;

            const t = this.windTimer * f.speed + f.phase;
            const curX = f.baseX + Math.sin(t * 1.2) * 1.4;
            const curY = f.baseY + Math.sin(t * 2.5) * 0.45;
            const curZ = f.baseZ + Math.cos(t * 1.0) * 1.4;

            // Pulsação suave de brilho e escala
            const pulse = 0.14 + Math.sin(t * 4.0) * 0.05;
            f.entity.setLocalScale(pulse, pulse, pulse);
            f.entity.setPosition(curX, curY, curZ);
        }
    }
}

