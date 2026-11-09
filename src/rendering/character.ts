import { Entity } from 'playcanvas';
import type { FarmMaterials } from './materials';

export type NinjaLocomotionState = 'idle' | 'walk' | 'run';

export class NinjaCharacter {
    readonly entity: Entity;
    private materials: FarmMaterials;

    // Partes articuladas para animação
    private leftLeg!: Entity;
    private rightLeg!: Entity;
    private leftArm!: Entity;
    private rightArm!: Entity;
    private torso!: Entity;
    private headRibbon!: Entity;

    private state: NinjaLocomotionState = 'idle';
    private animTime: number = 0;
    private targetRotation: number = 0;
    private currentRotation: number = 0;

    constructor(materials: FarmMaterials) {
        this.materials = materials;
        this.entity = new Entity('ninja_player');
        this.buildNinjaModel();
    }

    private buildNinjaModel(): void {
        // Root de animação
        this.torso = new Entity('ninja_torso');
        this.torso.addComponent('render', {
            type: 'box',
            material: this.materials.ninjaCharcoal
        });
        this.torso.setLocalScale(0.7, 0.9, 0.45);
        this.torso.setLocalPosition(0, 1.35, 0);
        this.entity.addChild(this.torso);

        // Faixa carmesim na cintura
        const sash = new Entity('ninja_sash');
        sash.addComponent('render', {
            type: 'box',
            material: this.materials.ninjaCrimson
        });
        sash.setLocalScale(0.74, 0.22, 0.49);
        sash.setLocalPosition(0, -0.3, 0);
        this.torso.addChild(sash);

        // Katana nas costas
        const scabbard = new Entity('katana_scabbard');
        scabbard.addComponent('render', {
            type: 'box',
            material: this.materials.ninjaCharcoal
        });
        scabbard.setLocalScale(0.1, 1.4, 0.1);
        scabbard.setLocalPosition(0.2, 0.1, -0.28);
        scabbard.setLocalEulerAngles(0, 0, -35);
        this.torso.addChild(scabbard);

        const hilt = new Entity('katana_hilt');
        hilt.addComponent('render', {
            type: 'cylinder',
            material: this.materials.ninjaCrimson
        });
        hilt.setLocalScale(0.08, 0.35, 0.08);
        hilt.setLocalPosition(0.65, 0.7, -0.28);
        hilt.setLocalEulerAngles(0, 0, -35);
        this.torso.addChild(hilt);

        // Cabeça com máscara ninja
        const head = new Entity('ninja_head');
        head.addComponent('render', {
            type: 'box',
            material: this.materials.ninjaCharcoal
        });
        head.setLocalScale(0.48, 0.5, 0.48);
        head.setLocalPosition(0, 0.72, 0);
        this.torso.addChild(head);

        // Testeira / Faixa na testa
        const headband = new Entity('ninja_headband');
        headband.addComponent('render', {
            type: 'box',
            material: this.materials.ninjaCrimson
        });
        headband.setLocalScale(0.51, 0.14, 0.51);
        headband.setLocalPosition(0, 0.12, 0);
        head.addChild(headband);

        // Fitas da bandana atrás da cabeça
        this.headRibbon = new Entity('headband_ribbon');
        this.headRibbon.addComponent('render', {
            type: 'box',
            material: this.materials.ninjaCrimson
        });
        this.headRibbon.setLocalScale(0.12, 0.6, 0.04);
        this.headRibbon.setLocalPosition(0, -0.2, -0.26);
        head.addChild(this.headRibbon);

        // Perna esquerda
        this.leftLeg = new Entity('left_leg');
        this.leftLeg.addComponent('render', {
            type: 'box',
            material: this.materials.ninjaCharcoal
        });
        this.leftLeg.setLocalScale(0.24, 0.9, 0.26);
        this.leftLeg.setLocalPosition(-0.2, 0.45, 0);
        this.entity.addChild(this.leftLeg);

        // Perna direita
        this.rightLeg = new Entity('right_leg');
        this.rightLeg.addComponent('render', {
            type: 'box',
            material: this.materials.ninjaCharcoal
        });
        this.rightLeg.setLocalScale(0.24, 0.9, 0.26);
        this.rightLeg.setLocalPosition(0.2, 0.45, 0);
        this.entity.addChild(this.rightLeg);

        // Braço esquerdo
        this.leftArm = new Entity('left_arm');
        this.leftArm.addComponent('render', {
            type: 'box',
            material: this.materials.ninjaCharcoal
        });
        this.leftArm.setLocalScale(0.2, 0.8, 0.2);
        this.leftArm.setLocalPosition(-0.5, 0.05, 0);
        this.torso.addChild(this.leftArm);

        // Braço direito
        this.rightArm = new Entity('right_arm');
        this.rightArm.addComponent('render', {
            type: 'box',
            material: this.materials.ninjaCharcoal
        });
        this.rightArm.setLocalScale(0.2, 0.8, 0.2);
        this.rightArm.setLocalPosition(0.5, 0.05, 0);
        this.torso.addChild(this.rightArm);
    }

    setState(state: NinjaLocomotionState): void {
        this.state = state;
    }

    getState(): NinjaLocomotionState {
        return this.state;
    }

    setFacing(angleDegrees: number): void {
        this.targetRotation = angleDegrees;
    }

    getFacing(): number {
        return this.currentRotation;
    }

    update(dt: number): void {
        this.animTime += dt;

        // Suavização da rotação do personagem
        let diff = this.targetRotation - this.currentRotation;
        while (diff < -180) diff += 360;
        while (diff > 180) diff -= 360;
        this.currentRotation += diff * Math.min(1.0, dt * 14.0);
        this.entity.setEulerAngles(0, this.currentRotation, 0);

        // Máquina de estados de animação
        if (this.state === 'idle') {
            // Respiração sutil e descanso em postura ninja
            const breath = Math.sin(this.animTime * 3.0) * 0.03;
            this.torso.setLocalPosition(0, 1.35 + breath, 0);
            this.torso.setLocalEulerAngles(0, 0, 0);

            this.leftLeg.setLocalEulerAngles(0, 0, -4);
            this.rightLeg.setLocalEulerAngles(0, 0, 4);
            this.leftArm.setLocalEulerAngles(0, 0, -6);
            this.rightArm.setLocalEulerAngles(0, 0, 6);

            this.headRibbon.setLocalEulerAngles(Math.sin(this.animTime * 2.5) * 8, 0, 0);
        } else {
            // Ciclo de passada (walk ou run)
            const speedMultiplier = this.state === 'run' ? 14.0 : 8.5;
            const strideAngle = this.state === 'run' ? 42 : 28;
            const armAngle = this.state === 'run' ? 45 : 26;

            const cycle = Math.sin(this.animTime * speedMultiplier);
            const bounce = Math.abs(Math.sin(this.animTime * speedMultiplier)) * (this.state === 'run' ? 0.08 : 0.04);

            // Inclinação para frente ao correr
            const forwardLean = this.state === 'run' ? 16 : 8;
            this.torso.setLocalEulerAngles(forwardLean, 0, cycle * 3.5);
            this.torso.setLocalPosition(0, 1.35 + bounce, 0);

            // Pernas alternadas
            this.leftLeg.setLocalEulerAngles(cycle * strideAngle, 0, 0);
            this.rightLeg.setLocalEulerAngles(-cycle * strideAngle, 0, 0);

            // Braços em contra-fase
            this.leftArm.setLocalEulerAngles(-cycle * armAngle, 0, -5);
            this.rightArm.setLocalEulerAngles(cycle * armAngle, 0, 5);

            // Bandana balançando com a velocidade do vento
            const windFlutter = Math.sin(this.animTime * 18.0) * 20;
            this.headRibbon.setLocalEulerAngles(-25 + windFlutter, 0, 0);
        }
    }
}
