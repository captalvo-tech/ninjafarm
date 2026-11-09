import { Color, Entity, StandardMaterial } from 'playcanvas';

import type { SimulationClock } from '../simulation/clock';

export class CelestialSkyManager {
    readonly entity: Entity;
    private clock: SimulationClock;

    private sunMesh: Entity;
    private moonMesh: Entity;
    private starsRoot: Entity;
    private lanterns: { entity: Entity; light?: Entity }[] = [];
    private bonfires: { entity: Entity; flame?: Entity; light?: Entity }[] = [];

    private sunMat: StandardMaterial;
    private moonMat: StandardMaterial;
    private starMat: StandardMaterial;
    private lanternMat: StandardMaterial;

    constructor(clock: SimulationClock) {
        this.clock = clock;
        this.entity = new Entity('celestial_sky_manager');

        // Material do Sol
        this.sunMat = new StandardMaterial();
        this.sunMat.diffuse = new Color(1.0, 0.95, 0.4);
        this.sunMat.emissive = new Color(1.0, 0.9, 0.3);
        this.sunMat.update();

        // Material da Lua
        this.moonMat = new StandardMaterial();
        this.moonMat.diffuse = new Color(0.9, 0.95, 1.0);
        this.moonMat.emissive = new Color(0.85, 0.9, 1.0);
        this.moonMat.update();

        // Material das Estrelas
        this.starMat = new StandardMaterial();
        this.starMat.diffuse = new Color(1.0, 1.0, 1.0);
        this.starMat.emissive = new Color(1.0, 1.0, 1.0);
        this.starMat.update();

        // Material das Lanternas Noturnas
        this.lanternMat = new StandardMaterial();
        this.lanternMat.diffuse = new Color(1.0, 0.5, 0.1);
        this.lanternMat.emissive = new Color(1.0, 0.4, 0.05);
        this.lanternMat.update();

        // Sol 3D no céu
        this.sunMesh = new Entity('sun_orb');
        this.sunMesh.addComponent('render', {
            type: 'sphere',
            material: this.sunMat
        });
        this.sunMesh.setLocalScale(8, 8, 8);
        this.entity.addChild(this.sunMesh);

        // Lua 3D no céu
        this.moonMesh = new Entity('moon_orb');
        this.moonMesh.addComponent('render', {
            type: 'sphere',
            material: this.moonMat
        });
        this.moonMesh.setLocalScale(6, 6, 6);
        this.entity.addChild(this.moonMesh);

        // Campo de estrelas
        this.starsRoot = new Entity('stars_root');
        this.entity.addChild(this.starsRoot);
        this.generateStarfield();
    }

    private generateStarfield(): void {
        const starCount = 60;
        const radius = 120;
        for (let i = 0; i < starCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * (Math.PI / 2); // hemisfério superior

            const x = radius * Math.cos(theta) * Math.sin(phi);
            const y = radius * Math.cos(phi) + 15;
            const z = radius * Math.sin(theta) * Math.sin(phi);

            const star = new Entity('star_' + i);
            star.addComponent('render', {
                type: 'box',
                material: this.starMat
            });
            const s = 0.5 + Math.random() * 0.4;
            star.setLocalScale(s, s, s);
            star.setLocalPosition(x, y, z);
            this.starsRoot.addChild(star);
        }
    }

    registerLantern(entity: Entity, hasPointLight = true): void {
        let lightEnt: Entity | undefined = entity.findByName('lantern_point_light') as Entity;
        if (!lightEnt && hasPointLight) {
            lightEnt = new Entity('lantern_point_light');
            lightEnt.addComponent('light', {
                type: 'omni',
                color: new Color(1.0, 0.72, 0.35),
                range: 16,
                intensity: 0.8
            });
            lightEnt.setLocalPosition(0, 0.5, 0);
            entity.addChild(lightEnt);
        }
        this.lanterns.push({ entity, light: lightEnt });
    }

    unregisterLantern(entity: Entity): void {
        this.lanterns = this.lanterns.filter((l) => l.entity !== entity);
    }

    registerBonfire(entity: Entity): void {
        const flame = entity.findByName('bonfire_flame') as Entity | undefined;
        const light = entity.findByName('bonfire_light') as Entity | undefined;
        this.bonfires.push({ entity, flame, light });
    }

    unregisterBonfire(entity: Entity): void {
        this.bonfires = this.bonfires.filter((b) => b.entity !== entity);
    }

    update(): void {
        const timeOfDay = this.clock.getTimeOfDay(); // 0 a 1
        const angleRad = timeOfDay * Math.PI * 2 - Math.PI / 2; // ciclo circular

        const orbitRadius = 110;
        // Posição do Sol
        const sunX = Math.cos(angleRad) * orbitRadius;
        const sunY = Math.sin(angleRad) * orbitRadius;
        this.sunMesh.setPosition(sunX, Math.max(-20, sunY), 0);

        // Lua oposta ao sol (180 graus de diferença)
        const moonAngle = angleRad + Math.PI;
        const moonX = Math.cos(moonAngle) * orbitRadius;
        const moonY = Math.sin(moonAngle) * orbitRadius;
        this.moonMesh.setPosition(moonX, Math.max(-20, moonY), 0);

        const isNight = this.clock.isNight();

        // Estrelas só visíveis à noite
        this.starsRoot.enabled = isNight;

        // Animação de cintilação suave e orgânica nas lanternas noturnas (papel washi / óleo)
        const timeSec = performance.now() * 0.003;
        for (let i = 0; i < this.lanterns.length; i++) {
            const lan = this.lanterns[i];
            if (lan.light?.light) {
                if (isNight) {
                    const flicker = Math.sin(timeSec * 3.5 + i * 1.7) * 0.16 + Math.cos(timeSec * 6.2 + i * 2.3) * 0.09;
                    lan.light.light.intensity = Math.max(0.65, 1.4 + flicker);
                } else {
                    lan.light.light.intensity = 0.0;
                }
            }
        }

        // Animação de pulso e labareda viva nas fogueiras (dia e noite, com brilho intensificado ao anoitecer)
        for (let i = 0; i < this.bonfires.length; i++) {
            const bf = this.bonfires[i];
            const flamePulse =
                0.85 + Math.sin(timeSec * 5.5 + i * 2.1) * 0.12 + Math.cos(timeSec * 9.0 + i * 3.1) * 0.06;
            if (bf.flame) {
                bf.flame.setLocalScale(
                    0.5 * (1 + (flamePulse - 0.85) * 0.4),
                    flamePulse,
                    0.5 * (1 + (flamePulse - 0.85) * 0.4)
                );
            }
            if (bf.light?.light) {
                const baseInt = isNight ? 1.8 : 1.2;
                const flicker = Math.sin(timeSec * 4.8 + i * 1.5) * 0.22 + Math.cos(timeSec * 8.4 + i * 2.7) * 0.12;
                bf.light.light.intensity = Math.max(0.7, baseInt + flicker);
            }
        }
    }
}
