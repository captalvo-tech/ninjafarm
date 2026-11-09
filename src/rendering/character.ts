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

import { Color, Entity, StandardMaterial } from 'playcanvas';
import type { FarmMaterials } from './materials';
import type { GlbAssetLoader, LoadedGLB } from './asset-loader';
import { type CharacterVisualConfig, getVisualConfig } from '../core/visual-config';

export type NinjaLocomotionState = 'idle' | 'walk' | 'run';

function hexToColor(hex: string, fallback: Color): Color {
    try {
        const cleaned = hex.replace('#', '');
        if (cleaned.length === 6) {
            const r = parseInt(cleaned.slice(0, 2), 16) / 255;
            const g = parseInt(cleaned.slice(2, 4), 16) / 255;
            const b = parseInt(cleaned.slice(4, 6), 16) / 255;
            return new Color(r, g, b);
        }
    } catch {
        // fallback
    }
    return fallback;
}

export class NinjaCharacter {
    readonly entity: Entity;
    private materials: FarmMaterials;
    private modelRoot: Entity | null = null;
    private animLayer: any = null;
    private assetLoader?: GlbAssetLoader;
    private currentGlb: LoadedGLB | null = null;
    private config: CharacterVisualConfig;

    private customMainMat: StandardMaterial | null = null;
    private customJointsMat: StandardMaterial | null = null;

    private state: NinjaLocomotionState = 'idle';
    private targetRotation: number = 0;
    private currentRotation: number = 0;
    private isLoaded: boolean = false;

    constructor(materials: FarmMaterials, assetLoader?: GlbAssetLoader, config?: CharacterVisualConfig) {
        this.materials = materials;
        this.assetLoader = assetLoader;
        this.config = config || getVisualConfig().character;
        this.entity = new Entity('ninja_player');

        if (assetLoader) {
            this.loadGlbCharacter();
        }
    }

    private applyMaterials(modelEntity: Entity): void {
        const mainColor = hexToColor(this.config.tintMain, this.materials.ninjaCharcoal.diffuse);
        const jointsColor = hexToColor(this.config.tintJoints, this.materials.ninjaCrimson.diffuse);

        if (!this.customMainMat) {
            this.customMainMat = new StandardMaterial();
            this.customMainMat.gloss = 0.35;
            this.customMainMat.useMetalness = true;
            this.customMainMat.metalness = 0.1;
        }
        this.customMainMat.diffuse = mainColor;
        this.customMainMat.update();

        if (!this.customJointsMat) {
            this.customJointsMat = new StandardMaterial();
            this.customJointsMat.gloss = 0.5;
            this.customJointsMat.useMetalness = true;
            this.customJointsMat.metalness = 0.2;
        }
        this.customJointsMat.diffuse = jointsColor;
        this.customJointsMat.update();

        const renders = modelEntity.findComponents('render');
        for (const r of renders) {
            const meshInstances = (r as any).meshInstances || [];
            for (const mi of meshInstances) {
                if (mi.material?.name === 'M_Main' || mi.material?.name?.toLowerCase().includes('main')) {
                    mi.material = this.customMainMat;
                } else if (mi.material?.name === 'M_Joints' || mi.material?.name?.toLowerCase().includes('joint')) {
                    mi.material = this.customJointsMat;
                }
            }
        }
    }

    private async loadGlbCharacter(): Promise<void> {
        if (!this.assetLoader) return;
        try {
            const url = this.config.modelUrl || 'assets/models/character.glb';
            const glb = await this.assetLoader.load(url, 'character_ninja');
            this.currentGlb = glb;
            const modelEntity = glb.instantiate();
            modelEntity.name = 'ninja_mesh_root';

            // Escala e alinhamento do personagem humanoide
            const scale = this.config.scale || 1.0;
            modelEntity.setLocalScale(scale, scale, scale);
            modelEntity.setLocalPosition(0, 0, 0);
            modelEntity.setLocalEulerAngles(0, this.config.rotationOffsetY || 0, 0);

            // Adiciona o componente de animação
            modelEntity.addComponent('anim', {
                activate: true,
                speed: 1.0
            });

            // Extrai as faixas de locomoção configuradas
            const idleClipName = this.config.animations?.idle || 'Idle_Loop';
            const walkClipName = this.config.animations?.walk || 'Walk_Loop';
            const runClipName = this.config.animations?.run || 'Jog_Fwd_Loop';

            const idleTrack = glb.getTrack(idleClipName) || glb.getTrack('Idle');
            const walkTrack = glb.getTrack(walkClipName) || glb.getTrack('Walk');
            const runTrack = glb.getTrack(runClipName) || glb.getTrack('Run') || glb.getTrack('Sprint');

            if (idleTrack) {
                modelEntity.anim?.assignAnimation('idle', idleTrack, undefined, 1.0, true);
            }
            if (walkTrack) {
                const walkSpeed = this.config.walkAnimSpeed || 1.25;
                modelEntity.anim?.assignAnimation('walk', walkTrack, undefined, walkSpeed, true);
            }
            if (runTrack) {
                const runSpeed = this.config.runAnimSpeed || 1.35;
                modelEntity.anim?.assignAnimation('run', runTrack, undefined, runSpeed, true);
            }

            // Customização dos materiais
            this.applyMaterials(modelEntity);

            if (this.modelRoot) {
                this.entity.removeChild(this.modelRoot);
                this.modelRoot.destroy();
            }

            this.entity.addChild(modelEntity);
            this.modelRoot = modelEntity;
            this.animLayer = modelEntity.anim?.baseLayer || null;
            this.isLoaded = true;

            // Transiciona para o estado atual se já foi definido antes do carregamento
            if (this.animLayer) {
                this.animLayer.transition(this.state, 0.1);
            }
        } catch (err) {
            console.error('[NinjaCharacter] Failed to load GLB model:', err);
        }
    }

    async applyVisualConfig(newConfig: CharacterVisualConfig): Promise<void> {
        const modelChanged = this.config.modelUrl !== newConfig.modelUrl;
        this.config = { ...newConfig };

        if (modelChanged && this.assetLoader) {
            await this.loadGlbCharacter();
        } else if (this.modelRoot) {
            const scale = this.config.scale || 1.0;
            this.modelRoot.setLocalScale(scale, scale, scale);
            this.modelRoot.setLocalEulerAngles(0, this.config.rotationOffsetY || 0, 0);
            this.applyMaterials(this.modelRoot);

            // Atualiza velocidade de reprodução
            if (this.modelRoot.anim?.baseLayer) {
                const idleTrack = this.currentGlb?.getTrack(this.config.animations?.idle || 'Idle_Loop');
                const walkTrack = this.currentGlb?.getTrack(this.config.animations?.walk || 'Walk_Loop');
                const runTrack = this.currentGlb?.getTrack(this.config.animations?.run || 'Jog_Fwd_Loop');

                if (idleTrack) this.modelRoot.anim.assignAnimation('idle', idleTrack, undefined, 1.0, true);
                if (walkTrack) this.modelRoot.anim.assignAnimation('walk', walkTrack, undefined, this.config.walkAnimSpeed || 1.25, true);
                if (runTrack) this.modelRoot.anim.assignAnimation('run', runTrack, undefined, this.config.runAnimSpeed || 1.35, true);
            }
        }
    }

    getConfig(): CharacterVisualConfig {
        return { ...this.config };
    }

    setState(state: NinjaLocomotionState): void {
        if (this.state === state) return;
        this.state = state;

        if (this.animLayer) {
            // Transição com crossfade suave entre os estados de animação
            const crossfadeTime = state === 'idle' ? 0.25 : 0.18;
            this.animLayer.transition(state, crossfadeTime);
        }
    }

    getState(): NinjaLocomotionState {
        return this.state;
    }

    getModelRoot(): Entity | null {
        return this.modelRoot;
    }

    getIsLoaded(): boolean {
        return this.isLoaded;
    }

    setFacing(angleDegrees: number): void {
        this.targetRotation = angleDegrees;
    }

    getFacing(): number {
        return this.currentRotation;
    }

    update(dt: number): void {
        // Suavização da rotação angular do ninja
        let diff = this.targetRotation - this.currentRotation;
        while (diff < -180) diff += 360;
        while (diff > 180) diff -= 360;
        this.currentRotation += diff * Math.min(1.0, dt * 14.0);
        this.entity.setEulerAngles(0, this.currentRotation, 0);
    }
}
