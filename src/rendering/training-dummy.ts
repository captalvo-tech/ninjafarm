import { Color, Entity, StandardMaterial } from 'playcanvas';

import { sound } from '../audio/sound';

import type { VisualEffectsManager } from './vfx';

export class TrainingDummy {
    readonly entity: Entity;
    private targetPost: Entity;
    private wobbleTime = 0;
    private isWobbling = false;
    private onHitCallback?: () => void;

    private woodMat: StandardMaterial;
    private strawMat: StandardMaterial;
    private redTargetMat: StandardMaterial;

    constructor(vfx: VisualEffectsManager, onHit?: () => void) {
        this.entity = new Entity('training_dummy_root');
        this.onHitCallback = onHit;

        // Materiais
        this.woodMat = new StandardMaterial();
        this.woodMat.diffuse = new Color(0.4, 0.25, 0.15);
        this.woodMat.gloss = 0.2;
        this.woodMat.update();

        this.strawMat = new StandardMaterial();
        this.strawMat.diffuse = new Color(0.82, 0.72, 0.45);
        this.strawMat.gloss = 0.1;
        this.strawMat.update();

        this.redTargetMat = new StandardMaterial();
        this.redTargetMat.diffuse = new Color(0.85, 0.15, 0.15);
        this.redTargetMat.emissive = new Color(0.3, 0.05, 0.05);
        this.redTargetMat.update();

        // Poste oscilante
        this.targetPost = new Entity('dummy_post');
        this.entity.addChild(this.targetPost);

        this.buildDummyModel();

        // Registra o alvo no sistema de VFX para detecção de colisões com shurikens
        vfx.registerTarget({
            id: 'training_dummy',
            getPosition: () => this.entity.getPosition(),
            radius: 1.2,
            onHit: () => this.hit()
        });
    }

    private buildDummyModel(): void {
        // Base de suporte no chão
        const base = new Entity('dummy_base');
        base.addComponent('render', {
            type: 'box',
            material: this.woodMat
        });
        base.setLocalScale(0.8, 0.15, 0.8);
        base.setLocalPosition(0, 0.075, 0);
        this.entity.addChild(base);

        // Poste de madeira principal
        const pole = new Entity('dummy_pole');
        pole.addComponent('render', {
            type: 'cylinder',
            material: this.woodMat
        });
        pole.setLocalScale(0.25, 2.2, 0.25);
        pole.setLocalPosition(0, 1.1, 0);
        this.targetPost.addChild(pole);

        // Corpo de palha trançada
        const torso = new Entity('dummy_torso');
        torso.addComponent('render', {
            type: 'cylinder',
            material: this.strawMat
        });
        torso.setLocalScale(0.55, 1.1, 0.55);
        torso.setLocalPosition(0, 1.2, 0);
        this.targetPost.addChild(torso);

        // Faixa de alvo vermelha no centro do torso
        const targetRing = new Entity('dummy_target_ring');
        targetRing.addComponent('render', {
            type: 'cylinder',
            material: this.redTargetMat
        });
        targetRing.setLocalScale(0.58, 0.35, 0.58);
        targetRing.setLocalPosition(0, 1.2, 0);
        this.targetPost.addChild(targetRing);

        // Braços de treino horizontais (madeira cruzada)
        const arms = new Entity('dummy_arms');
        arms.addComponent('render', {
            type: 'box',
            material: this.woodMat
        });
        arms.setLocalScale(1.4, 0.12, 0.12);
        arms.setLocalPosition(0, 1.45, 0);
        this.targetPost.addChild(arms);

        // Chapéu cônico de palha (kasa)
        const hat = new Entity('dummy_hat');
        hat.addComponent('render', {
            type: 'cone',
            material: this.strawMat
        });
        hat.setLocalScale(0.9, 0.35, 0.9);
        hat.setLocalPosition(0, 2.1, 0);
        this.targetPost.addChild(hat);
    }

    hit(): void {
        sound.playTargetHit();
        this.isWobbling = true;
        this.wobbleTime = 0;
        this.onHitCallback?.();
    }

    update(dt: number): void {
        if (!this.isWobbling) return;

        this.wobbleTime += dt;
        // Oscilação amortecida
        const decay = Math.exp(-this.wobbleTime * 6);
        const angle = Math.sin(this.wobbleTime * 25) * 18 * decay;

        this.targetPost.setEulerAngles(angle, 0, 0);

        if (decay < 0.02) {
            this.isWobbling = false;
            this.targetPost.setEulerAngles(0, 0, 0);
        }
    }
}
