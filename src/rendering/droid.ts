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

/**
 * Ninja Farm - Autonomous Humanoid Droid Entity
 * Exactly ONE operational droid per farm responsible for all physical labor.
 */

import { Application, Color, Entity, StandardMaterial } from 'playcanvas';
import type { FarmMaterials } from './materials';
import type { GlbAssetLoader } from './asset-loader';
import type { DroidSaveState, FarmTask } from '../core/types';
import type { PathNode } from '../simulation/navigation';
import type { FarmGrid } from '../core/grid';

export type DroidVisualState = 'idle' | 'walking' | 'working' | 'recharging' | 'paused' | 'depleted';

export class FarmDroid {
    readonly entity: Entity;
    private modelContainer: Entity;
    private batteryHudContainer: Entity;
    private batteryFillBar!: Entity;

    private battery: number = 100;
    private maxBattery: number = 100;
    private state: DroidVisualState = 'idle';
    private currentTask: FarmTask | null = null;
    private workSpeedMultiplier: number = 1.0;

    private facingAngle: number = 0;
    private waypoints: PathNode[] = [];
    private grid: FarmGrid;
    private materials: FarmMaterials;
    private assetLoader?: GlbAssetLoader;

    // Materiais especializados para o chassi robótico do Droid
    private chassisMat?: StandardMaterial;
    private visorMat?: StandardMaterial;
    private batteryBgMat?: StandardMaterial;
    private batteryFillMat?: StandardMaterial;

    constructor(
        grid: FarmGrid,
        materials: FarmMaterials,
        assetLoader?: GlbAssetLoader,
        initialState?: DroidSaveState
    ) {
        this.grid = grid;
        this.materials = materials;
        this.assetLoader = assetLoader;

        this.entity = new Entity('farm_droid_unit');
        this.modelContainer = new Entity('droid_model_container');
        this.batteryHudContainer = new Entity('droid_battery_hud');

        this.entity.addChild(this.modelContainer);
        this.entity.addChild(this.batteryHudContainer);

        if (this.hasActiveApp()) {
            this.initMaterials();
            this.setupVisuals();
            this.setupFloatingBatteryHUD();
        }

        if (initialState) {
            this.battery = initialState.battery ?? 100;
            this.maxBattery = initialState.maxBattery ?? 100;
            this.state = initialState.state ?? 'idle';
            this.workSpeedMultiplier = initialState.workSpeedMultiplier ?? 1.0;
            if (initialState.position) {
                this.entity.setPosition(initialState.position.x, initialState.position.y, initialState.position.z);
            }
        } else {
            // Posição inicial próxima à sede HQ e estação solar
            const startPos = this.grid.gridToWorld(14, 15);
            this.entity.setPosition(startPos.x, startPos.y, startPos.z);
        }

        this.updateBatteryVisuals();
    }

    private initMaterials(): void {
        // Materiais cibernéticos
        this.chassisMat = new StandardMaterial();
        this.chassisMat.diffuse = new Color(0.85, 0.9, 0.95);
        this.chassisMat.specular = new Color(1, 1, 1);
        this.chassisMat.gloss = 0.85;
        this.chassisMat.useMetalness = true;
        this.chassisMat.metalness = 0.9;
        this.chassisMat.update();

        this.visorMat = new StandardMaterial();
        this.visorMat.diffuse = new Color(0.05, 0.85, 0.95);
        this.visorMat.emissive = new Color(0.1, 0.9, 1.0);
        this.visorMat.gloss = 0.9;
        this.visorMat.update();

        this.batteryBgMat = new StandardMaterial();
        this.batteryBgMat.diffuse = new Color(0.1, 0.12, 0.16);
        this.batteryBgMat.update();

        this.batteryFillMat = new StandardMaterial();
        this.batteryFillMat.diffuse = new Color(0.1, 0.85, 0.45);
        this.batteryFillMat.emissive = new Color(0.1, 0.8, 0.4);
        this.batteryFillMat.update();
    }

    private hasActiveApp(): boolean {
        return typeof window !== 'undefined' && !!Application.getApplication();
    }

    private setupVisuals(): void {
        if (!this.hasActiveApp()) return;

        // Se houver assetLoader, carrega modelo humanoide GLB real
        if (this.assetLoader) {
            this.loadHumanoidModel(this.assetLoader);
        } else {
            this.buildProceduralDroid();
        }
    }

    private async loadHumanoidModel(loader: GlbAssetLoader): Promise<void> {
        try {
            // Carrega modelo humanoide de alta fidelidade
            const droidGlb = await loader.load('assets/models/character.glb', 'droid_humanoid');
            if (droidGlb) {
                const modelInst = droidGlb.instantiate();
                modelInst.name = 'droid_glb_mesh';
                modelInst.setLocalScale(0.95, 0.95, 0.95);
                modelInst.setLocalPosition(0, 0, 0);

                // Aplica visor cibernético ciano iluminado na cabeça do Droid
                const visor = new Entity('droid_visor_glow');
                visor.addComponent('render', {
                    type: 'box',
                    material: this.visorMat
                });
                visor.setLocalScale(0.24, 0.08, 0.12);
                visor.setLocalPosition(0, 1.55, 0.14);
                modelInst.addChild(visor);

                // Antena de comunicação com o satélite / comando ninja
                const antenna = new Entity('droid_antenna');
                antenna.addComponent('render', {
                    type: 'cylinder',
                    material: this.materials.metal
                });
                antenna.setLocalScale(0.02, 0.35, 0.02);
                antenna.setLocalPosition(0.08, 1.75, -0.05);
                modelInst.addChild(antenna);

                this.modelContainer.addChild(modelInst);
                return;
            }
        } catch (err) {
            console.warn('[FarmDroid] Erro ao carregar GLB do Droid. Utilizando chassi procedural:', err);
        }

        this.buildProceduralDroid();
    }

    private buildProceduralDroid(): void {
        const root = new Entity('droid_procedural_body');

        // Tronco robótico metálico
        const torso = new Entity('droid_torso');
        torso.addComponent('render', { type: 'box', material: this.chassisMat });
        torso.setLocalScale(0.65, 0.75, 0.4);
        torso.setLocalPosition(0, 0.95, 0);
        root.addChild(torso);

        // Reator torácico de energia solar
        const reactor = new Entity('droid_reactor');
        reactor.addComponent('render', { type: 'cylinder', material: this.visorMat });
        reactor.setLocalScale(0.25, 0.06, 0.25);
        reactor.setLocalPosition(0, 1.0, 0.21);
        reactor.setLocalEulerAngles(90, 0, 0);
        root.addChild(reactor);

        // Cabeça com visor óptico panorâmico
        const head = new Entity('droid_head');
        head.addComponent('render', { type: 'box', material: this.chassisMat });
        head.setLocalScale(0.4, 0.35, 0.35);
        head.setLocalPosition(0, 1.5, 0);
        root.addChild(head);

        const visor = new Entity('droid_visor');
        visor.addComponent('render', { type: 'box', material: this.visorMat });
        visor.setLocalScale(0.32, 0.1, 0.12);
        visor.setLocalPosition(0, 1.52, 0.18);
        root.addChild(visor);

        // Braços articulados para trabalho agrícola e construção
        const leftArm = new Entity('droid_arm_l');
        leftArm.addComponent('render', { type: 'box', material: this.materials.metal });
        leftArm.setLocalScale(0.18, 0.65, 0.18);
        leftArm.setLocalPosition(-0.46, 0.95, 0);
        root.addChild(leftArm);

        const rightArm = new Entity('droid_arm_r');
        rightArm.addComponent('render', { type: 'box', material: this.materials.metal });
        rightArm.setLocalScale(0.18, 0.65, 0.18);
        rightArm.setLocalPosition(0.46, 0.95, 0);
        root.addChild(rightArm);

        // Pernas bípedes todo-terreno
        const leftLeg = new Entity('droid_leg_l');
        leftLeg.addComponent('render', { type: 'box', material: this.materials.metal });
        leftLeg.setLocalScale(0.2, 0.65, 0.2);
        leftLeg.setLocalPosition(-0.18, 0.32, 0);
        root.addChild(leftLeg);

        const rightLeg = new Entity('droid_leg_r');
        rightLeg.addComponent('render', { type: 'box', material: this.materials.metal });
        rightLeg.setLocalScale(0.2, 0.65, 0.2);
        rightLeg.setLocalPosition(0.18, 0.32, 0);
        root.addChild(rightLeg);

        this.modelContainer.addChild(root);
    }

    private setupFloatingBatteryHUD(): void {
        this.batteryFillBar = new Entity('hud_battery_fill');
        if (!this.hasActiveApp()) return;

        this.batteryHudContainer.setLocalPosition(0, 2.1, 0);

        // Fundo da barra
        const bg = new Entity('hud_battery_bg');
        bg.addComponent('render', { type: 'box', material: this.batteryBgMat });
        bg.setLocalScale(0.8, 0.08, 0.08);
        this.batteryHudContainer.addChild(bg);

        // Barra de preenchimento
        this.batteryFillBar.addComponent('render', { type: 'box', material: this.batteryFillMat });
        this.batteryFillBar.setLocalScale(0.76, 0.06, 0.09);
        this.batteryFillBar.setLocalPosition(0, 0, 0.01);
        this.batteryHudContainer.addChild(this.batteryFillBar);
    }

    private updateBatteryVisuals(): void {
        if (!this.hasActiveApp() || !this.batteryFillBar || !this.batteryFillMat) return;

        const ratio = Math.max(0, Math.min(1.0, this.battery / this.maxBattery));
        this.batteryFillBar.setLocalScale(0.76 * ratio, 0.06, 0.09);
        this.batteryFillBar.setLocalPosition(-0.38 * (1 - ratio), 0, 0.01);

        // Cor dinâmica da bateria
        if (ratio < 0.2) {
            this.batteryFillMat.diffuse = new Color(0.95, 0.2, 0.2);
            this.batteryFillMat.emissive = new Color(0.8, 0.1, 0.1);
        } else if (ratio < 0.5) {
            this.batteryFillMat.diffuse = new Color(0.95, 0.75, 0.15);
            this.batteryFillMat.emissive = new Color(0.8, 0.6, 0.1);
        } else {
            this.batteryFillMat.diffuse = new Color(0.1, 0.85, 0.45);
            this.batteryFillMat.emissive = new Color(0.1, 0.8, 0.4);
        }
        this.batteryFillMat.update();
    }

    /**
     * Atualização a cada frame (movimentação por waypoints, trabalho, bateria e animações)
     */
    public update(dt: number): void {
        if (dt <= 0) return;

        // 1. Locomoção física por A* até o alvo da tarefa
        if (this.waypoints.length > 0) {
            this.state = 'walking';
            const curPos = this.entity.getPosition();
            const wp = this.waypoints[0];
            const targetPos = this.grid.gridToWorld(wp.x, wp.y);

            const dx = targetPos.x - curPos.x;
            const dz = targetPos.z - curPos.z;
            const dist = Math.hypot(dx, dz);

            if (dist < 0.35) {
                this.waypoints.shift();
                if (this.waypoints.length === 0) {
                    // Chegou ao local exato de trabalho
                    if (this.currentTask) {
                        this.state = 'working';
                    } else {
                        this.state = 'idle';
                    }
                }
            } else {
                const moveSpeed = 3.6 * this.workSpeedMultiplier;
                const step = moveSpeed * dt;
                const nextX = curPos.x + (dx / dist) * Math.min(step, dist);
                const nextZ = curPos.z + (dz / dist) * Math.min(step, dist);
                this.entity.setPosition(nextX, curPos.y, nextZ);

                // Rotação suave olhando para o destino
                this.facingAngle = Math.atan2(dx, dz) * (180 / Math.PI);
                this.modelContainer.setEulerAngles(0, this.facingAngle, 0);

                // Consumo de bateria durante deslocamento (0.08% por segundo)
                this.consumeBattery(0.08 * dt);
            }
        } else if (this.state === 'working') {
            // Animação de trabalho (pulso rítmico do modelo)
            const bounce = Math.sin(Date.now() * 0.008) * 0.04;
            this.modelContainer.setLocalPosition(0, bounce, 0);

            // Consumo de bateria durante trabalho físico (0.15% por segundo)
            this.consumeBattery(0.15 * dt);
        } else if (this.state === 'recharging') {
            // Animação de recarga
            this.battery = Math.min(this.maxBattery, this.battery + 2.5 * dt);
            this.updateBatteryVisuals();
            if (this.battery >= this.maxBattery) {
                this.state = 'idle';
            }
        } else {
            // Em repouso (idle)
            this.modelContainer.setLocalPosition(0, 0, 0);
        }

        // Mantém a barra de bateria orientada para a câmera (billboard yaw)
        this.batteryHudContainer.setEulerAngles(0, 0, 0);
    }

    public setWaypoints(path: PathNode[]): void {
        this.waypoints = [...path];
        if (this.waypoints.length > 0) {
            this.state = 'walking';
        }
    }

    public setCurrentTask(task: FarmTask | null): void {
        this.currentTask = task;
        if (!task && this.waypoints.length === 0) {
            this.state = 'idle';
        }
    }

    public getCurrentTask(): FarmTask | null {
        return this.currentTask;
    }

    public getState(): DroidVisualState {
        return this.state;
    }

    public setState(state: DroidVisualState): void {
        this.state = state;
    }

    public getBattery(): number {
        return this.battery;
    }

    public setBattery(val: number): void {
        this.battery = Math.max(0, Math.min(this.maxBattery, val));
        this.updateBatteryVisuals();
    }

    public consumeBattery(amount: number): boolean {
        if (this.battery <= 0) {
            this.state = 'depleted';
            return false;
        }
        this.battery = Math.max(0, this.battery - amount);
        this.updateBatteryVisuals();

        if (this.battery <= 0) {
            this.state = 'depleted';
            return false;
        }
        return true;
    }

    public recharge(amount: number): void {
        this.battery = Math.min(this.maxBattery, this.battery + amount);
        this.updateBatteryVisuals();
        if (this.battery >= 20 && this.state === 'depleted') {
            this.state = 'idle';
        }
    }

    public serialize(): DroidSaveState {
        const pos = this.entity.getPosition();
        return {
            id: 'farm_droid_01',
            battery: Number(this.battery.toFixed(1)),
            maxBattery: this.maxBattery,
            state: this.state,
            position: { x: pos.x, y: pos.y, z: pos.z },
            currentTaskId: this.currentTask?.id || null,
            workSpeedMultiplier: this.workSpeedMultiplier
        };
    }

    public load(saved: DroidSaveState): void {
        this.battery = saved.battery ?? 100;
        this.maxBattery = saved.maxBattery ?? 100;
        this.state = saved.state ?? 'idle';
        this.workSpeedMultiplier = saved.workSpeedMultiplier ?? 1.0;
        if (saved.position) {
            this.entity.setPosition(saved.position.x, saved.position.y, saved.position.z);
        }
        this.updateBatteryVisuals();
    }
}
