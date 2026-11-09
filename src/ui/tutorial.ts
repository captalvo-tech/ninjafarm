/**
 * Ninja Farm - Interactive Onboarding Tutorial
 * Step-by-step contextual guide presented directly by the autonomous Droid.
 * Works completely offline without Gemini requirement.
 */

export interface TutorialStep {
    id: string;
    stepNumber: number;
    totalSteps: number;
    title: string;
    instruction: string;
    hint?: string;
    actionLabel?: string;
}

export class InteractiveTutorial {
    private container: HTMLElement;
    private currentStepIndex: number = 0;
    private isVisible: boolean = false;
    private completed: boolean = false;
    private onStepChange?: (step: TutorialStep) => void;

    private readonly steps: TutorialStep[] = [
        {
            id: 'meet_droid',
            stepNumber: 1,
            totalSteps: 8,
            title: '🤖 Conheça seu Droid Operacional',
            instruction: 'Bem-vindo à Fazenda Ninja! Sou seu único funcionário robótico. Eu cuido de todo o trabalho físico enquanto você planeja a propriedade.',
            actionLabel: 'Entendido, vamos lá!'
        },
        {
            id: 'select_target',
            stepNumber: 2,
            totalSteps: 8,
            title: '🎯 Seleção de Alvo',
            instruction: 'Toque em qualquer canteiro de cultivo ou objeto na grade para inspecioná-lo.',
            hint: 'Dica: Toque no canteiro de terra inicial para ver seu estado.',
            actionLabel: 'Próximo'
        },
        {
            id: 'context_action',
            stepNumber: 3,
            totalSteps: 8,
            title: '🔘 Botão Contextual Único',
            instruction: 'Você não precisa trocar de ferramentas. O botão principal inteligente identifica se a terra precisa ser arada, semeada, regada ou colhida.',
            actionLabel: 'Próximo'
        },
        {
            id: 'schedule_task',
            stepNumber: 4,
            totalSteps: 8,
            title: '📋 Agendamento de Tarefas',
            instruction: 'Ao acionar uma ação física, ela é agendada para mim. Eu calculo a rota, caminho até o local e realizo o serviço.',
            actionLabel: 'Próximo'
        },
        {
            id: 'task_agenda',
            stepNumber: 5,
            totalSteps: 8,
            title: '📑 Gaveta da Agenda',
            instruction: 'Abra a Agenda no topo da tela para acompanhar o tempo restante, reordenar prioridades ou cancelar tarefas da fila.',
            actionLabel: 'Próximo'
        },
        {
            id: 'droid_battery',
            stepNumber: 6,
            totalSteps: 8,
            title: '⚡ Bateria e Energia Solar',
            instruction: 'Observe a barra sobre minha cabeça. Se a bateria baixar de 15%, irei automaticamente à estação solar recarregar.',
            actionLabel: 'Próximo'
        },
        {
            id: 'blueprints',
            stepNumber: 7,
            totalSteps: 8,
            title: '📐 Construção por Blueprints',
            instruction: 'Posicione novos prédios como hologramas translúcidos. Eu reunirei os materiais e construirei a versão física sólida.',
            actionLabel: 'Próximo'
        },
        {
            id: 'afk_reports',
            stepNumber: 8,
            totalSteps: 8,
            title: '🌙 Trabalho AFK e Diário',
            instruction: 'A fazenda continua operando quando você sai! Ao retornar, pergunte-me o que aconteceu ou veja os relatórios estruturados.',
            actionLabel: 'Concluir Tutorial'
        }
    ];

    constructor(onStepChange?: (step: TutorialStep) => void) {
        this.onStepChange = onStepChange;
        this.completed = localStorage.getItem('ninja_tutorial_completed') === 'true';

        this.container = document.createElement('div');
        this.container.id = 'ninja-tutorial-container';
        this.container.className = 'tutorial-hud-card';
        document.body.appendChild(this.container);

        this.injectStyles();
    }

    private injectStyles(): void {
        const style = document.createElement('style');
        style.textContent = `
            .tutorial-hud-card {
                position: fixed;
                bottom: 80px;
                left: 50%;
                transform: translateX(-50%);
                width: 92%;
                max-width: 440px;
                background: rgba(15, 23, 42, 0.95);
                border: 1.5px solid rgba(16, 185, 129, 0.6);
                border-radius: 16px;
                padding: 16px;
                box-sizing: border-box;
                z-index: 220;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7), 0 0 20px rgba(16, 185, 129, 0.2);
                backdrop-filter: blur(10px);
                color: #f1f5f9;
                font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
                display: none;
                animation: tutorialSlideUp 0.3s ease-out;
            }

            @keyframes tutorialSlideUp {
                from { opacity: 0; transform: translate(-50%, 20px); }
                to { opacity: 1; transform: translate(-50%, 0); }
            }

            .tutorial-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 8px;
            }

            .tutorial-title {
                font-size: 15px;
                font-weight: 700;
                color: #34d399;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .tutorial-badge {
                font-size: 11px;
                font-weight: 700;
                background: rgba(16, 185, 129, 0.2);
                color: #6ee7b7;
                padding: 3px 8px;
                border-radius: 10px;
            }

            .tutorial-instruction {
                font-size: 13.5px;
                line-height: 1.5;
                color: #e2e8f0;
                margin-bottom: 8px;
            }

            .tutorial-hint {
                font-size: 12px;
                color: #94a3b8;
                font-style: italic;
                margin-bottom: 12px;
                background: rgba(30, 41, 59, 0.6);
                padding: 6px 10px;
                border-radius: 8px;
                border-left: 3px solid #38bdf8;
            }

            .tutorial-actions {
                display: flex;
                gap: 8px;
                margin-top: 10px;
            }

            .tutorial-btn-primary {
                flex: 1;
                background: linear-gradient(135deg, #10b981, #059669);
                border: none;
                color: #ffffff;
                font-weight: 700;
                font-size: 13px;
                padding: 10px 16px;
                border-radius: 10px;
                cursor: pointer;
                transition: transform 0.15s, opacity 0.15s;
            }

            .tutorial-btn-primary:active {
                transform: scale(0.97);
            }

            .tutorial-btn-dismiss {
                background: rgba(30, 41, 59, 0.8);
                border: 1px solid rgba(148, 163, 184, 0.3);
                color: #94a3b8;
                font-size: 12px;
                padding: 8px 12px;
                border-radius: 10px;
                cursor: pointer;
            }
        `;
        document.head.appendChild(style);
    }

    public isCompleted(): boolean {
        return this.completed;
    }

    public start(force: boolean = false): void {
        if (this.completed && !force) return;
        this.currentStepIndex = 0;
        this.isVisible = true;
        this.render();
    }

    public advanceStep(): void {
        if (!this.isVisible) return;
        if (this.currentStepIndex < this.steps.length - 1) {
            this.currentStepIndex++;
            this.render();
        } else {
            this.finish();
        }
    }

    public triggerActionHook(actionId: string): void {
        if (!this.isVisible) return;
        const current = this.steps[this.currentStepIndex];

        if (actionId === 'target_selected' && current.id === 'select_target') {
            this.advanceStep();
        } else if (actionId === 'task_scheduled' && current.id === 'schedule_task') {
            this.advanceStep();
        } else if (actionId === 'agenda_opened' && current.id === 'task_agenda') {
            this.advanceStep();
        }
    }

    public finish(): void {
        this.completed = true;
        this.isVisible = false;
        this.container.style.display = 'none';
        localStorage.setItem('ninja_tutorial_completed', 'true');
    }

    public dismiss(): void {
        this.isVisible = false;
        this.container.style.display = 'none';
    }

    private render(): void {
        if (!this.isVisible) {
            this.container.style.display = 'none';
            return;
        }

        const step = this.steps[this.currentStepIndex];
        this.container.style.display = 'block';

        this.container.innerHTML = `
            <div class="tutorial-header">
                <div class="tutorial-title">${step.title}</div>
                <div class="tutorial-badge">${step.stepNumber} de ${step.totalSteps}</div>
            </div>
            <div class="tutorial-instruction">${step.instruction}</div>
            ${step.hint ? `<div class="tutorial-hint">${step.hint}</div>` : ''}
            <div class="tutorial-actions">
                <button class="tutorial-btn-dismiss" id="btn-tutorial-dismiss">Dispensar</button>
                <button class="tutorial-btn-primary" id="btn-tutorial-next">${step.actionLabel || 'Avançar'}</button>
            </div>
        `;

        this.container.querySelector('#btn-tutorial-next')?.addEventListener('click', () => {
            this.advanceStep();
        });

        this.container.querySelector('#btn-tutorial-dismiss')?.addEventListener('click', () => {
            this.dismiss();
        });

        this.onStepChange?.(step);
    }
}
