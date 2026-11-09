/**
 * Ninja Farm - Task Scheduler UI
 * Interactive persistent task queue drawer and Droid status monitor.
 */

import { t } from './i18n';
import type { TaskScheduler } from '../simulation/task-scheduler';
import type { FarmDroid } from '../rendering/droid';

export class SchedulerUI {
    private container: HTMLElement;
    private isOpenState: boolean = false;
    private scheduler: TaskScheduler;
    private droid: FarmDroid;

    // Elementos dinâmicos
    private batteryPercentEl!: HTMLElement;
    private batteryBarEl!: HTMLElement;
    private droidStatePillEl!: HTMLElement;
    private activeTaskCardEl!: HTMLElement;
    private queueListEl!: HTMLElement;
    private emptyStateEl!: HTMLElement;

    constructor(scheduler: TaskScheduler, droid: FarmDroid) {
        this.scheduler = scheduler;
        this.droid = droid;

        this.container = document.createElement('div');
        this.container.id = 'scheduler-drawer-modal';
        document.body.appendChild(this.container);

        this.injectStyles();
        this.buildLayout();
        this.setupEventListeners();
    }

    public isOpen(): boolean {
        return this.isOpenState;
    }

    public open(): void {
        this.isOpenState = true;
        this.container.classList.add('open');
        this.render();
    }

    public close(): void {
        this.isOpenState = false;
        this.container.classList.remove('open');
    }

    public toggle(): void {
        if (this.isOpenState) {
            this.close();
        } else {
            this.open();
        }
    }

    private injectStyles(): void {
        const style = document.createElement('style');
        style.textContent = `
            #scheduler-drawer-modal {
                position: fixed;
                top: 0;
                right: -420px;
                width: 400px;
                max-width: 90vw;
                height: 100vh;
                background: rgba(11, 15, 25, 0.95);
                backdrop-filter: blur(14px);
                border-left: 1px solid rgba(255, 255, 255, 0.12);
                box-shadow: -10px 0 35px rgba(0, 0, 0, 0.6);
                z-index: 220;
                display: flex;
                flex-direction: column;
                transition: right 0.35s cubic-bezier(0.16, 1, 0.3, 1);
                color: #F3F4F6;
                font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
                box-sizing: border-box;
            }

            #scheduler-drawer-modal.open {
                right: 0;
            }

            .scheduler-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 18px 20px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            }

            .scheduler-header h2 {
                margin: 0;
                font-size: 16px;
                font-weight: 800;
                display: flex;
                align-items: center;
                gap: 8px;
                color: #FFFFFF;
                letter-spacing: -0.3px;
            }

            .scheduler-close-btn {
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                color: #9CA3AF;
                cursor: pointer;
                font-size: 14px;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            }

            .scheduler-close-btn:hover {
                background: rgba(239, 68, 68, 0.2);
                color: #EF4444;
                border-color: #EF4444;
            }

            .scheduler-body {
                flex: 1;
                overflow-y: auto;
                padding: 16px 20px;
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            /* Droid Status Card */
            .droid-status-card {
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 14px;
                padding: 14px 16px;
            }

            .droid-card-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 10px;
            }

            .droid-title {
                font-size: 13px;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .droid-status-pill {
                font-size: 10px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                padding: 3px 8px;
                border-radius: 20px;
                background: rgba(16, 185, 129, 0.2);
                color: #34D399;
                border: 1px solid rgba(16, 185, 129, 0.4);
            }

            .droid-status-pill.walking {
                background: rgba(59, 130, 246, 0.2);
                color: #60A5FA;
                border-color: rgba(59, 130, 246, 0.4);
            }

            .droid-status-pill.working {
                background: rgba(245, 158, 11, 0.2);
                color: #FBBF24;
                border-color: rgba(245, 158, 11, 0.4);
            }

            .droid-status-pill.recharging {
                background: rgba(139, 92, 246, 0.2);
                color: #A78BFA;
                border-color: rgba(139, 92, 246, 0.4);
            }

            .droid-status-pill.depleted {
                background: rgba(239, 68, 68, 0.2);
                color: #F87171;
                border-color: rgba(239, 68, 68, 0.4);
            }

            .battery-meter-container {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .battery-label-row {
                display: flex;
                justify-content: space-between;
                font-size: 11px;
                color: #9CA3AF;
                font-weight: 600;
            }

            .battery-track {
                height: 8px;
                background: rgba(255, 255, 255, 0.08);
                border-radius: 4px;
                overflow: hidden;
            }

            .battery-fill {
                height: 100%;
                width: 100%;
                background: #10B981;
                transition: width 0.3s ease, background-color 0.3s ease;
            }

            /* Section Headers */
            .section-label {
                font-size: 11px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.8px;
                color: #9CA3AF;
                margin-top: 4px;
            }

            /* Active Task Card */
            .active-task-container {
                background: linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(6, 78, 59, 0.15));
                border: 1px solid rgba(16, 185, 129, 0.3);
                border-radius: 14px;
                padding: 14px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .task-title-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .task-title {
                font-size: 13px;
                font-weight: 700;
                color: #FFFFFF;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .task-progress-bar {
                height: 6px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 3px;
                overflow: hidden;
            }

            .task-progress-fill {
                height: 100%;
                background: #34D399;
                transition: width 0.2s linear;
            }

            .task-meta-row {
                display: flex;
                justify-content: space-between;
                font-size: 11px;
                color: #A7F3D0;
            }

            /* Task Queue List */
            .task-queue-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .queue-item {
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.07);
                border-radius: 12px;
                padding: 10px 12px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
                transition: all 0.2s;
            }

            .queue-item:hover {
                background: rgba(255, 255, 255, 0.06);
                border-color: rgba(255, 255, 255, 0.14);
            }

            .queue-item-info {
                display: flex;
                flex-direction: column;
                gap: 2px;
                overflow: hidden;
            }

            .queue-item-name {
                font-size: 12px;
                font-weight: 700;
                color: #E5E7EB;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .queue-item-meta {
                font-size: 10px;
                color: #9CA3AF;
                display: flex;
                gap: 8px;
            }

            .queue-item-actions {
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .btn-task-action {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 6px;
                color: #D1D5DB;
                cursor: pointer;
                font-size: 11px;
                padding: 4px 6px;
                transition: all 0.2s;
            }

            .btn-task-action:hover {
                background: rgba(255, 255, 255, 0.15);
                color: #FFFFFF;
            }

            .btn-task-cancel:hover {
                background: rgba(239, 68, 68, 0.2);
                color: #EF4444;
                border-color: #EF4444;
            }

            .empty-state {
                padding: 24px 12px;
                text-align: center;
                color: #6B7280;
                font-size: 12px;
                font-style: italic;
            }
        `;
        document.head.appendChild(style);
    }

    private buildLayout(): void {
        this.container.innerHTML = `
            <div class="scheduler-header">
                <h2>📋 ${t('scheduler.title')}</h2>
                <button id="btn-close-scheduler" class="scheduler-close-btn" title="Fechar">✕</button>
            </div>
            <div class="scheduler-body">
                <!-- DROID STATUS -->
                <div class="droid-status-card">
                    <div class="droid-card-header">
                        <span class="droid-title">🤖 Unidade Droid Shinobi</span>
                        <span id="droid-status-pill" class="droid-status-pill">Ocioso</span>
                    </div>
                    <div class="battery-meter-container">
                        <div class="battery-label-row">
                            <span>🔋 Bateria Operacional</span>
                            <span id="droid-battery-percent">100%</span>
                        </div>
                        <div class="battery-track">
                            <div id="droid-battery-fill" class="battery-fill" style="width: 100%;"></div>
                        </div>
                    </div>
                </div>

                <!-- TAREFA ATIVA -->
                <div class="section-label">⚡ Tarefa em Execução</div>
                <div id="active-task-card" class="active-task-container">
                    <!-- Preenchido via render -->
                </div>

                <!-- FILA DE TAREFAS -->
                <div class="section-label">📜 Próximas Tarefas Agendadas</div>
                <div id="task-queue-list" class="task-queue-list">
                    <!-- Lista dinâmica de tarefas -->
                </div>
                <div id="queue-empty-state" class="empty-state">
                    Nenhuma tarefa pendente na agenda. Selecione canteiros ou construções no mapa para enfileirar tarefas para o Droid!
                </div>
            </div>
        `;

        this.batteryPercentEl = this.container.querySelector('#droid-battery-percent') as HTMLElement;
        this.batteryBarEl = this.container.querySelector('#droid-battery-fill') as HTMLElement;
        this.droidStatePillEl = this.container.querySelector('#droid-status-pill') as HTMLElement;
        this.activeTaskCardEl = this.container.querySelector('#active-task-card') as HTMLElement;
        this.queueListEl = this.container.querySelector('#task-queue-list') as HTMLElement;
        this.emptyStateEl = this.container.querySelector('#queue-empty-state') as HTMLElement;
    }

    private setupEventListeners(): void {
        const closeBtn = this.container.querySelector('#btn-close-scheduler');
        closeBtn?.addEventListener('click', () => this.close());
    }

    /**
     * Atualização do conteúdo da interface
     */
    public render(): void {
        if (!this.isOpenState) return;

        // 1. Atualiza Status do Droid
        const battery = this.droid.getBattery();
        const state = this.droid.getState();

        this.batteryPercentEl.textContent = `${Math.round(battery)}%`;
        this.batteryBarEl.style.width = `${Math.max(0, Math.min(100, battery))}%`;

        if (battery < 20) {
            this.batteryBarEl.style.backgroundColor = '#EF4444';
        } else if (battery < 50) {
            this.batteryBarEl.style.backgroundColor = '#F59E0B';
        } else {
            this.batteryBarEl.style.backgroundColor = '#10B981';
        }

        const stateLabels: Record<string, { label: string; cls: string }> = {
            idle: { label: 'Ocioso', cls: 'idle' },
            walking: { label: 'Em Trânsito', cls: 'walking' },
            working: { label: 'Trabalhando', cls: 'working' },
            recharging: { label: 'Recarregando ⚡', cls: 'recharging' },
            paused: { label: 'Pausado ⏸️', cls: 'paused' },
            depleted: { label: 'Sem Bateria 🪫', cls: 'depleted' }
        };

        const stateInfo = stateLabels[state] || { label: state, cls: 'idle' };
        this.droidStatePillEl.textContent = stateInfo.label;
        this.droidStatePillEl.className = `droid-status-pill ${stateInfo.cls}`;

        // 2. Tarefa Ativa
        const activeTask = this.scheduler.getActiveTask();
        if (activeTask) {
            const pct = Math.min(100, (activeTask.progressSeconds / activeTask.totalDurationSeconds) * 100);
            const remaining = Math.max(0, activeTask.totalDurationSeconds - activeTask.progressSeconds);

            this.activeTaskCardEl.style.display = 'flex';
            this.activeTaskCardEl.innerHTML = `
                <div class="task-title-row">
                    <span class="task-title">⚙️ ${activeTask.title}</span>
                    <span style="font-size: 11px; font-weight: 700; color: #34D399;">${Math.round(pct)}%</span>
                </div>
                <div class="task-progress-bar">
                    <div class="task-progress-fill" style="width: ${pct}%;"></div>
                </div>
                <div class="task-meta-row">
                    <span>⏱️ Restante: ${remaining.toFixed(1)}s</span>
                    <span>⚡ Custo: ~${activeTask.energyCostTotal}</span>
                </div>
            `;
        } else {
            this.activeTaskCardEl.style.display = 'none';
        }

        // 3. Fila de Tarefas
        const tasks = this.scheduler.getTasks();
        const queuedTasks = tasks.filter(t => t.id !== activeTask?.id);

        if (queuedTasks.length === 0) {
            this.emptyStateEl.style.display = activeTask ? 'none' : 'block';
            this.queueListEl.innerHTML = '';
        } else {
            this.emptyStateEl.style.display = 'none';
            this.queueListEl.innerHTML = '';

            queuedTasks.forEach((task, idx) => {
                const item = document.createElement('div');
                item.className = 'queue-item';

                const statusColor = task.status === 'WAITING_RESOURCES' ? '#F59E0B' : task.status === 'WAITING_ENERGY' ? '#EF4444' : '#9CA3AF';
                const statusText = task.status === 'WAITING_RESOURCES' ? 'Aguardando Materiais' : task.status === 'WAITING_ENERGY' ? 'Aguardando Energia' : 'Agendada';

                item.innerHTML = `
                    <div class="queue-item-info">
                        <span class="queue-item-name">#${idx + 1} ${task.title}</span>
                        <div class="queue-item-meta">
                            <span style="color: ${statusColor};">● ${statusText}</span>
                            <span>⏱️ ${task.totalDurationSeconds}s</span>
                        </div>
                    </div>
                    <div class="queue-item-actions">
                        <button class="btn-task-action btn-move-up" data-idx="${idx}" title="Subir prioridade">▲</button>
                        <button class="btn-task-action btn-move-down" data-idx="${idx}" title="Descer prioridade">▼</button>
                        <button class="btn-task-action btn-task-cancel" data-id="${task.id}" title="Cancelar">✕</button>
                    </div>
                `;

                // Eventos dos botões da fila
                const btnUp = item.querySelector('.btn-move-up');
                const btnDown = item.querySelector('.btn-move-down');
                const btnCancel = item.querySelector('.btn-task-cancel');

                btnUp?.addEventListener('click', () => {
                    if (idx > 0) {
                        this.scheduler.reorderTasks(idx, idx - 1);
                        this.render();
                    }
                });

                btnDown?.addEventListener('click', () => {
                    if (idx < queuedTasks.length - 1) {
                        this.scheduler.reorderTasks(idx, idx + 1);
                        this.render();
                    }
                });

                btnCancel?.addEventListener('click', () => {
                    this.scheduler.cancelTask(task.id);
                    this.render();
                });

                this.queueListEl.appendChild(item);
            });
        }
    }
}
