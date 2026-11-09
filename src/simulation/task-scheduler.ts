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
 * Ninja Farm - Task Scheduler System
 * Central AFK scheduler managing the single Droid's persistent task queue.
 */

import type { FarmTask, TaskSchedulerSaveState } from '../core/types';
import type { FarmDroid } from '../rendering/droid';
import type { NavigationSystem } from './navigation';
import type { FarmGrid } from '../core/grid';
import type { InventorySystem } from './inventory';
import { domainEvents } from '../core/events';

export interface SchedulerCallbacks {
    onTaskStarted?: (task: FarmTask) => void;
    onTaskCompleted?: (task: FarmTask) => void;
    onTaskBlocked?: (task: FarmTask, reason: string) => void;
    onTaskCancelled?: (task: FarmTask) => void;
}

export class TaskScheduler {
    private tasks: FarmTask[] = [];
    private activeTask: FarmTask | null = null;
    private grid: FarmGrid;
    private navigation: NavigationSystem;
    private inventory: InventorySystem;
    private callbacks: SchedulerCallbacks;
    private lastProcessedTimestamp: number = Date.now();

    constructor(
        grid: FarmGrid,
        navigation: NavigationSystem,
        inventory: InventorySystem,
        callbacks: SchedulerCallbacks = {}
    ) {
        this.grid = grid;
        this.navigation = navigation;
        this.inventory = inventory;
        this.callbacks = callbacks;
    }

    public enqueueTask(task: FarmTask): void {
        // Insere respeitando a prioridade (maior prioridade na frente)
        const insertIdx = this.tasks.findIndex(t => t.priority < task.priority && t.status === 'SCHEDULED');
        if (insertIdx !== -1) {
            this.tasks.splice(insertIdx, 0, task);
        } else {
            this.tasks.push(task);
        }
        domainEvents.emit('task.enqueued', task);
    }

    public reorderTasks(fromIndex: number, toIndex: number): void {
        if (fromIndex < 0 || fromIndex >= this.tasks.length || toIndex < 0 || toIndex >= this.tasks.length) {
            return;
        }
        const [moved] = this.tasks.splice(fromIndex, 1);
        this.tasks.splice(toIndex, 0, moved);
    }

    public cancelTask(taskId: string): boolean {
        const idx = this.tasks.findIndex(t => t.id === taskId);
        if (idx === -1) return false;

        const task = this.tasks[idx];
        if (task.status === 'COMPLETED') return false;

        task.status = 'CANCELLED';
        if (this.activeTask?.id === taskId) {
            this.activeTask = null;
        }

        // Remove da fila
        this.tasks.splice(idx, 1);
        this.callbacks.onTaskCancelled?.(task);
        domainEvents.emit('task.cancelled', task);
        return true;
    }

    public pauseTask(taskId: string): void {
        const task = this.tasks.find(t => t.id === taskId);
        if (task && task.status === 'IN_PROGRESS') {
            task.status = 'PAUSED';
            if (this.activeTask?.id === taskId) {
                this.activeTask = null;
            }
        }
    }

    public resumeTask(taskId: string): void {
        const task = this.tasks.find(t => t.id === taskId);
        if (task && task.status === 'PAUSED') {
            task.status = 'SCHEDULED';
        }
    }

    /**
     * Ciclo de simulação do Agendador (executado a cada frame/tick)
     */
    public tick(dt: number, droid: FarmDroid, farmEnergyStorage: number): void {
        this.lastProcessedTimestamp = Date.now();

        // 1. Checa estado da bateria do Droid
        if (droid.getBattery() < 15 && droid.getState() !== 'recharging') {
            if (this.activeTask) {
                this.activeTask.status = 'WAITING_ENERGY';
                this.activeTask = null;
            }

            // Envia Droid para a estação de recarga solar (grade 13, 14)
            const dPos = droid.entity.getPosition();
            const dGrid = this.grid.worldToGrid(dPos.x, dPos.z);
            const path = this.navigation.findPath(dGrid.gridX, dGrid.gridY, 13, 14);
            if (path.length > 0) {
                droid.setWaypoints(path);
            } else {
                droid.setState('recharging');
            }
            return;
        }

        // Se o Droid estiver recarregando, absorve energia da fazenda até encher
        if (droid.getState() === 'recharging') {
            if (farmEnergyStorage > 0.5) {
                this.inventory.consume('energy', 2.0 * dt);
                droid.recharge(4.0 * dt);
                if (droid.getBattery() >= 95) {
                    droid.setState('idle');
                }
            }
            return;
        }

        // 2. Se não houver tarefa ativa, busca a próxima tarefa viável na fila
        if (!this.activeTask) {
            const nextTask = this.findNextEligibleTask(droid);
            if (nextTask) {
                this.startTask(nextTask, droid);
            }
        }

        // 3. Progresso da tarefa em andamento
        if (this.activeTask && this.activeTask.status === 'IN_PROGRESS') {
            if (droid.getState() === 'working') {
                this.activeTask.progressSeconds += dt * droid.serialize().workSpeedMultiplier;

                if (this.activeTask.progressSeconds >= this.activeTask.totalDurationSeconds) {
                    this.completeTask(this.activeTask, droid);
                }
            }
        }
    }

    private findNextEligibleTask(droid: FarmDroid): FarmTask | null {
        for (const task of this.tasks) {
            if (task.status !== 'SCHEDULED' && task.status !== 'WAITING_RESOURCES' && task.status !== 'WAITING_ENERGY') {
                continue;
            }

            // Verifica se possui recursos necessários
            if (task.requiredResources && !this.inventory.has(task.requiredResources)) {
                task.status = 'WAITING_RESOURCES';
                task.blockedReason = 'Aguardando materiais no inventário.';
                continue;
            }

            // Verifica se o Droid tem bateria mínima
            if (droid.getBattery() < 15) {
                task.status = 'WAITING_ENERGY';
                task.blockedReason = 'Bateria do Droid insuficiente para iniciar.';
                continue;
            }

            return task;
        }
        return null;
    }

    private startTask(task: FarmTask, droid: FarmDroid): void {
        this.activeTask = task;
        task.status = 'IN_PROGRESS';
        task.startedAt = Date.now();
        task.blockedReason = undefined;

        // Consome ou reserva recursos se configurado
        if (task.requiredResources) {
            this.inventory.consumeBatch(task.requiredResources);
            task.consumedResources = { ...task.requiredResources };
        }

        droid.setCurrentTask(task);

        // Calcula rota do Droid até o ponto da tarefa
        const dPos = droid.entity.getPosition();
        const dGrid = this.grid.worldToGrid(dPos.x, dPos.z);
        const tGrid = this.grid.worldToGrid(task.targetPosition.x, task.targetPosition.z);

        const path = this.navigation.findPath(dGrid.gridX, dGrid.gridY, tGrid.gridX, tGrid.gridY);
        if (path.length > 0) {
            droid.setWaypoints(path);
        } else {
            droid.setState('working');
        }

        this.callbacks.onTaskStarted?.(task);
        domainEvents.emit('task.started', task);
    }

    private completeTask(task: FarmTask, droid: FarmDroid): void {
        task.status = 'COMPLETED';
        task.completedAt = Date.now();
        this.activeTask = null;
        droid.setCurrentTask(null);

        // Remove da fila ativa
        const idx = this.tasks.findIndex(t => t.id === task.id);
        if (idx !== -1) {
            this.tasks.splice(idx, 1);
        }

        this.callbacks.onTaskCompleted?.(task);
        domainEvents.emit('task.completed', task);
    }

    /**
     * Reconciliação AFK / Offline: simula o progresso determinístico ocorrido enquanto o jogador esteve desconectado.
     */
    public simulateOfflineSeconds(elapsedSeconds: number, droid: FarmDroid, solarGenPerSecond: number): number {
        if (elapsedSeconds <= 0) return 0;

        let completedCount = 0;
        let remainingSeconds = elapsedSeconds;

        while (remainingSeconds > 0) {
            const task = this.activeTask || this.findNextEligibleTask(droid);
            if (!task) break;

            if (!this.activeTask) {
                this.activeTask = task;
                task.status = 'IN_PROGRESS';
            }

            const neededSeconds = task.totalDurationSeconds - task.progressSeconds;
            const availableBatterySeconds = (droid.getBattery() / 0.15); // segundos de trabalho restantes na bateria

            const effectiveWorkSeconds = Math.min(neededSeconds, availableBatterySeconds, remainingSeconds);
            task.progressSeconds += effectiveWorkSeconds;
            droid.consumeBattery(effectiveWorkSeconds * 0.15);
            remainingSeconds -= effectiveWorkSeconds;

            if (task.progressSeconds >= task.totalDurationSeconds) {
                this.completeTask(task, droid);
                completedCount++;
            } else if (droid.getBattery() <= 10) {
                // Ciclo de recarga com energia solar
                const rechargeSeconds = Math.min(60, remainingSeconds);
                const rechargedPct = (solarGenPerSecond > 0 ? 1.5 : 0.2) * rechargeSeconds;
                droid.recharge(rechargedPct);
                remainingSeconds -= rechargeSeconds;
            } else {
                break;
            }
        }

        return completedCount;
    }

    public getTasks(): ReadonlyArray<FarmTask> {
        return this.tasks;
    }

    public getActiveTask(): FarmTask | null {
        return this.activeTask;
    }

    public getLastProcessedTimestamp(): number {
        return this.lastProcessedTimestamp;
    }

    public static createStandardTask(params: {
        category: FarmTask['category'];
        type: string;
        title: string;
        targetId: string;
        targetPosition: { x: number; y: number; z: number };
        totalDurationSeconds?: number;
        energyCostTotal?: number;
        requiredResources?: FarmTask['requiredResources'];
        producedResources?: FarmTask['producedResources'];
        priority?: number;
        customData?: Record<string, unknown>;
    }): FarmTask {
        return {
            id: 'task_' + Math.random().toString(36).substring(2, 9),
            category: params.category,
            type: params.type,
            title: params.title,
            targetId: params.targetId,
            targetPosition: params.targetPosition,
            status: 'SCHEDULED',
            priority: params.priority ?? 5,
            totalDurationSeconds: params.totalDurationSeconds ?? 5,
            progressSeconds: 0,
            energyCostTotal: params.energyCostTotal ?? 5,
            requiredResources: params.requiredResources,
            producedResources: params.producedResources,
            customData: params.customData,
            createdAt: Date.now()
        };
    }

    public serialize(): TaskSchedulerSaveState {
        return {
            tasks: this.tasks.map(t => ({ ...t })),
            activeTaskId: this.activeTask?.id || null,
            lastProcessedTimestamp: Math.floor(Date.now() / 1000)
        };
    }

    public load(saved: TaskSchedulerSaveState): void {
        this.tasks = saved.tasks ? saved.tasks.map(t => ({ ...t })) : [];
        if (saved.activeTaskId) {
            this.activeTask = this.tasks.find(t => t.id === saved.activeTaskId) || null;
        } else {
            this.activeTask = null;
        }
        this.lastProcessedTimestamp = (saved.lastProcessedTimestamp || Math.floor(Date.now() / 1000)) * 1000;
    }
}
