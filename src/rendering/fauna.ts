import { Color, Entity, StandardMaterial, Vec3 } from 'playcanvas';
import { FarmGrid } from '../core/grid';

export interface AnimalInstance {
    entity: Entity;
    type: 'chicken' | 'fish' | 'fox';
    position: Vec3;
    targetPosition: Vec3;
    rotation: number;
    state: 'idle' | 'walk' | 'eat' | 'swim';
    stateTimer: number;
    animTimer: number;
}

export class FaunaManager {
    readonly entity: Entity;
    private animals: AnimalInstance[] = [];
    private grid: FarmGrid;

    // Materiais dos animais
    private chickenWhite: StandardMaterial;
    private chickenRed: StandardMaterial;
    private chickenBeak: StandardMaterial;
    private fishOrange: StandardMaterial;
    private foxOrange: StandardMaterial;
    private foxWhite: StandardMaterial;

    constructor(grid: FarmGrid) {
        this.grid = grid;
        this.entity = new Entity('fauna_manager');

        this.chickenWhite = new StandardMaterial();
        this.chickenWhite.diffuse = new Color(0.95, 0.95, 0.92);
        this.chickenWhite.gloss = 0.2;
        this.chickenWhite.update();

        this.chickenRed = new StandardMaterial();
        this.chickenRed.diffuse = new Color(0.85, 0.15, 0.15);
        this.chickenRed.gloss = 0.3;
        this.chickenRed.update();

        this.chickenBeak = new StandardMaterial();
        this.chickenBeak.diffuse = new Color(0.95, 0.65, 0.1);
        this.chickenBeak.gloss = 0.4;
        this.chickenBeak.update();

        this.fishOrange = new StandardMaterial();
        this.fishOrange.diffuse = new Color(0.95, 0.35, 0.1);
        this.fishOrange.gloss = 0.8;
        this.fishOrange.useMetalness = true;
        this.fishOrange.metalness = 0.3;
        this.fishOrange.update();

        this.foxOrange = new StandardMaterial();
        this.foxOrange.diffuse = new Color(0.88, 0.38, 0.12);
        this.foxOrange.gloss = 0.3;
        this.foxOrange.update();

        this.foxWhite = new StandardMaterial();
        this.foxWhite.diffuse = new Color(0.95, 0.95, 0.92);
        this.foxWhite.gloss = 0.2;
        this.foxWhite.update();

        this.spawnInitialFauna();
    }

    private spawnInitialFauna(): void {
        // Spawna 3 galinhas soltas pelo terreiro
        const chickenSpawns: [number, number][] = [
            [22, 18],
            [24, 19],
            [20, 22]
        ];

        for (const [gx, gy] of chickenSpawns) {
            const worldPos = this.grid.gridToWorld(gx, gy);
            const chicken = this.createChickenModel();
            chicken.setPosition(worldPos.x, worldPos.y, worldPos.z);
            this.entity.addChild(chicken);

            this.animals.push({
                entity: chicken,
                type: 'chicken',
                position: new Vec3(worldPos.x, worldPos.y, worldPos.z),
                targetPosition: new Vec3(worldPos.x, worldPos.y, worldPos.z),
                rotation: Math.random() * 360,
                state: 'idle',
                stateTimer: 2.0 + Math.random() * 3.0,
                animTimer: Math.random() * 10
            });
        }

        // Spawna raposa vigia nos arredores
        const foxPos = this.grid.gridToWorld(8, 6);
        const fox = this.createFoxModel();
        fox.setPosition(foxPos.x, foxPos.y, foxPos.z);
        this.entity.addChild(fox);

        this.animals.push({
            entity: fox,
            type: 'fox',
            position: new Vec3(foxPos.x, foxPos.y, foxPos.z),
            targetPosition: new Vec3(foxPos.x, foxPos.y, foxPos.z),
            rotation: 45,
            state: 'idle',
            stateTimer: 4.0,
            animTimer: 0
        });
    }

    private createChickenModel(): Entity {
        const root = new Entity('chicken');

        // Corpo
        const body = new Entity('chicken_body');
        body.addComponent('render', {
            type: 'box',
            material: this.chickenWhite
        });
        body.setLocalScale(0.45, 0.38, 0.55);
        body.setLocalPosition(0, 0.35, 0);
        root.addChild(body);

        // Cabeça
        const head = new Entity('chicken_head');
        head.addComponent('render', {
            type: 'box',
            material: this.chickenWhite
        });
        head.setLocalScale(0.24, 0.3, 0.24);
        head.setLocalPosition(0, 0.55, 0.28);
        root.addChild(head);

        // Bico
        const beak = new Entity('chicken_beak');
        beak.addComponent('render', {
            type: 'cone',
            material: this.chickenBeak
        });
        beak.setLocalScale(0.12, 0.16, 0.12);
        beak.setLocalPosition(0, 0.55, 0.44);
        beak.setLocalEulerAngles(90, 0, 0);
        root.addChild(beak);

        // Crista vermelha
        const comb = new Entity('chicken_comb');
        comb.addComponent('render', {
            type: 'box',
            material: this.chickenRed
        });
        comb.setLocalScale(0.08, 0.15, 0.22);
        comb.setLocalPosition(0, 0.74, 0.28);
        root.addChild(comb);

        // Perninhas
        const legLeft = new Entity('leg_left');
        legLeft.addComponent('render', {
            type: 'cylinder',
            material: this.chickenBeak
        });
        legLeft.setLocalScale(0.04, 0.2, 0.04);
        legLeft.setLocalPosition(-0.12, 0.1, 0);
        root.addChild(legLeft);

        const legRight = new Entity('leg_right');
        legRight.addComponent('render', {
            type: 'cylinder',
            material: this.chickenBeak
        });
        legRight.setLocalScale(0.04, 0.2, 0.04);
        legRight.setLocalPosition(0.12, 0.1, 0);
        root.addChild(legRight);

        return root;
    }

    private createFoxModel(): Entity {
        const root = new Entity('fox');

        // Corpo alongado da raposa
        const body = new Entity('fox_body');
        body.addComponent('render', {
            type: 'box',
            material: this.foxOrange
        });
        body.setLocalScale(0.5, 0.45, 0.9);
        body.setLocalPosition(0, 0.5, 0);
        root.addChild(body);

        // Cabeça
        const head = new Entity('fox_head');
        head.addComponent('render', {
            type: 'box',
            material: this.foxOrange
        });
        head.setLocalScale(0.35, 0.35, 0.4);
        head.setLocalPosition(0, 0.75, 0.45);
        root.addChild(head);

        // Focinho
        const snout = new Entity('fox_snout');
        snout.addComponent('render', {
            type: 'cone',
            material: this.foxWhite
        });
        snout.setLocalScale(0.2, 0.25, 0.2);
        snout.setLocalPosition(0, 0.7, 0.7);
        snout.setLocalEulerAngles(90, 0, 0);
        root.addChild(snout);

        // Cauda fofa com ponta branca
        const tail = new Entity('fox_tail');
        tail.addComponent('render', {
            type: 'cylinder',
            material: this.foxOrange
        });
        tail.setLocalScale(0.22, 0.7, 0.22);
        tail.setLocalPosition(0, 0.65, -0.65);
        tail.setLocalEulerAngles(45, 0, 0);
        root.addChild(tail);

        return root;
    }

    update(dt: number): void {
        const halfW = (this.grid.width * this.grid.cellSize) / 2 - 2;
        const halfH = (this.grid.height * this.grid.cellSize) / 2 - 2;

        for (const anim of this.animals) {
            anim.animTimer += dt;
            anim.stateTimer -= dt;

            // Troca de estado da IA do animal
            if (anim.stateTimer <= 0) {
                if (anim.state === 'walk') {
                    // Parou para bicar / descansar
                    anim.state = Math.random() > 0.4 ? 'eat' : 'idle';
                    anim.stateTimer = 2.0 + Math.random() * 4.0;
                } else {
                    // Escolhe novo destino próximo
                    anim.state = 'walk';
                    anim.stateTimer = 3.0 + Math.random() * 3.0;

                    const range = anim.type === 'chicken' ? 6 : 14;
                    const randX = anim.position.x + (Math.random() - 0.5) * range;
                    const randZ = anim.position.z + (Math.random() - 0.5) * range;

                    anim.targetPosition.set(
                        Math.max(-halfW, Math.min(halfW, randX)),
                        anim.position.y,
                        Math.max(-halfH, Math.min(halfH, randZ))
                    );

                    const dx = anim.targetPosition.x - anim.position.x;
                    const dz = anim.targetPosition.z - anim.position.z;
                    anim.rotation = Math.atan2(dx, dz) * (180 / Math.PI);
                }
            }

            // Executa comportamento e animação
            if (anim.state === 'walk') {
                const moveSpeed = anim.type === 'chicken' ? 1.6 : 3.2;
                const dir = new Vec3().sub2(anim.targetPosition, anim.position);
                const dist = dir.length();

                if (dist > 0.2) {
                    dir.normalize();
                    anim.position.x += dir.x * moveSpeed * dt;
                    anim.position.z += dir.z * moveSpeed * dt;

                    // Balanço ao andar
                    const waddle = Math.sin(anim.animTimer * 12.0) * 0.04;
                    anim.entity.setPosition(anim.position.x, anim.position.y + Math.abs(waddle), anim.position.z);
                    anim.entity.setEulerAngles(0, anim.rotation, Math.sin(anim.animTimer * 12.0) * 6);
                } else {
                    anim.state = 'eat';
                    anim.stateTimer = 2.5;
                }
            } else if (anim.state === 'eat') {
                // Animação de bicar o solo (peck)
                const peckAngle = Math.abs(Math.sin(anim.animTimer * 8.0)) * 25;
                anim.entity.setPosition(anim.position.x, anim.position.y, anim.position.z);
                anim.entity.setEulerAngles(peckAngle, anim.rotation, 0);
            } else {
                // Idle normal
                anim.entity.setPosition(anim.position.x, anim.position.y, anim.position.z);
                anim.entity.setEulerAngles(0, anim.rotation, 0);
            }
        }
    }

    triggerAnimalReaction(type: 'chicken' | 'fox'): Vec3 | null {
        const found = this.animals.find(a => a.type === type);
        if (found) {
            // Salto animado de alegria e entusiasmo
            found.state = 'idle';
            found.stateTimer = 1.8;
            found.animTimer = 0;
            found.entity.setPosition(found.position.x, found.position.y + 0.55, found.position.z);
            found.entity.setEulerAngles(-15, found.rotation + 25, 0);
            return found.position.clone();
        }
        return null;
    }

    getAnimals(): AnimalInstance[] {
        return this.animals;
    }
}

