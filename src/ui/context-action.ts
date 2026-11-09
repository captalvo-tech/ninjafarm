/**
 * Ninja Farm - Universal Context Action Component
 * Single ergonomic action button + target inspector card.
 */

import type { ContextAction, SelectedTarget } from '../gameplay/actions/action-types';

export interface ContextActionEvents {
    onExecute: (action: ContextAction) => void;
    onDeselect: () => void;
}

export class ContextActionUI {
    private container: HTMLElement;
    private targetCard: HTMLElement;
    private actionButton: HTMLButtonElement;
    private currentAction: ContextAction | null = null;
    private events: ContextActionEvents;

    constructor(events: ContextActionEvents) {
        this.events = events;

        this.container = document.createElement('div');
        this.container.id = 'context-action-container';
        this.injectStyles();

        // 1. Target Status Card (Compact Info Header)
        this.targetCard = document.createElement('div');
        this.targetCard.className = 'context-target-card';

        // 2. Big Ergonomic Action Button
        this.actionButton = document.createElement('button');
        this.actionButton.className = 'context-action-btn';
        this.actionButton.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.currentAction && this.currentAction.enabled) {
                this.events.onExecute(this.currentAction);
            }
        });

        this.container.appendChild(this.targetCard);
        this.container.appendChild(this.actionButton);
        document.body.appendChild(this.container);

        // Global hotkey: Space or E on desktop
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'KeyE') {
                if (this.currentAction && this.currentAction.enabled) {
                    const activeTag = document.activeElement?.tagName;
                    if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;
                    e.preventDefault();
                    this.events.onExecute(this.currentAction);
                }
            } else if (e.code === 'Escape') {
                if (this.currentAction) {
                    this.events.onDeselect();
                }
            }
        });
    }

    private injectStyles(): void {
        const style = document.createElement('style');
        style.textContent = `
            #context-action-container {
                position: fixed;
                bottom: 24px;
                left: 50%;
                transform: translateX(-50%) translateY(20px);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                z-index: 180;
                pointer-events: none;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1),
                            transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
                font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
                max-width: 90vw;
            }

            #context-action-container.visible {
                opacity: 1;
                visibility: visible;
                transform: translateX(-50%) translateY(0);
                pointer-events: auto;
            }

            .context-target-card {
                background: rgba(11, 15, 25, 0.92);
                backdrop-filter: blur(12px);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 14px;
                padding: 6px 16px;
                color: #E2E8F0;
                font-size: 13px;
                display: flex;
                align-items: center;
                gap: 10px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
            }

            .context-target-name {
                font-weight: 700;
                color: #FFFFFF;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .context-target-badge {
                font-size: 11px;
                font-weight: 800;
                padding: 2px 8px;
                border-radius: 6px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .badge-raw { background: #374151; color: #D1D5DB; }
            .badge-tilled { background: #78350F; color: #FCD34D; }
            .badge-planted { background: #065F46; color: #6EE7B7; }
            .badge-growing { background: #1E3A8A; color: #93C5FD; }
            .badge-thirsty { background: #B91C1C; color: #FCA5A5; }
            .badge-ready { background: #047857; color: #34D399; }
            .badge-exhausted { background: #4C1D95; color: #DDD6FE; }
            .badge-normal { background: #1F2937; color: #9CA3AF; }

            .context-action-btn {
                background: linear-gradient(135deg, #10B981 0%, #059669 100%);
                color: #FFFFFF;
                border: none;
                border-radius: 50px;
                padding: 14px 32px;
                min-width: 260px;
                font-size: 16px;
                font-weight: 800;
                letter-spacing: 0.3px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                cursor: pointer;
                box-shadow: 0 10px 25px rgba(16, 185, 129, 0.4), 0 4px 10px rgba(0, 0, 0, 0.3);
                transition: all 0.16s ease;
                outline: none;
                user-select: none;
                -webkit-tap-highlight-color: transparent;
            }

            .context-action-btn:hover:not(:disabled) {
                transform: translateY(-2px) scale(1.02);
                box-shadow: 0 14px 30px rgba(16, 185, 129, 0.5);
                background: linear-gradient(135deg, #34D399 0%, #059669 100%);
            }

            .context-action-btn:active:not(:disabled) {
                transform: translateY(1px) scale(0.98);
            }

            .context-action-btn:disabled {
                background: #1F2937;
                color: #6B7280;
                cursor: not-allowed;
                box-shadow: none;
                border: 1px solid rgba(255, 255, 255, 0.08);
            }

            .context-btn-icon {
                font-size: 20px;
                line-height: 1;
            }

            .context-btn-text-cluster {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                text-align: left;
            }

            .context-btn-title {
                font-size: 15px;
                font-weight: 800;
                line-height: 1.2;
            }

            .context-btn-subtitle {
                font-size: 11px;
                font-weight: 500;
                opacity: 0.85;
                line-height: 1.2;
            }

            .context-btn-keybadge {
                margin-left: auto;
                background: rgba(0, 0, 0, 0.25);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 6px;
                padding: 3px 7px;
                font-size: 11px;
                font-weight: 800;
                color: #FFFFFF;
            }

            .context-close-btn {
                background: none;
                border: none;
                color: #9CA3AF;
                cursor: pointer;
                font-size: 16px;
                padding: 2px 6px;
                border-radius: 4px;
                transition: color 0.15s;
            }

            .context-close-btn:hover {
                color: #FFFFFF;
                background: rgba(255, 255, 255, 0.1);
            }

            @media (max-width: 768px) {
                #context-action-container {
                    bottom: 96px; /* espaço para o joystick e controles móveis */
                }
                .context-action-btn {
                    min-width: 220px;
                    padding: 12px 24px;
                    font-size: 15px;
                }
                .context-btn-keybadge {
                    display: none; /* oculta atalho de teclado no mobile */
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Updates the UI with the active action and selected entity.
     */
    public showAction(action: ContextAction): void {
        this.currentAction = action;
        const target = action.target;

        // Monta o Card de informações do Alvo
        const badgeClass = this.getBadgeClass(target);
        const badgeLabel = this.getBadgeLabel(target);

        this.targetCard.innerHTML = `
            <span class="context-target-name">${target.name}</span>
            <span class="context-target-badge ${badgeClass}">${badgeLabel}</span>
            <button class="context-close-btn" title="Desmarcar alvo (Esc)">✕</button>
        `;

        const closeBtn = this.targetCard.querySelector('.context-close-btn');
        closeBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.events.onDeselect();
        });

        // Configura o Botão Universal de Ação
        this.actionButton.disabled = !action.enabled;

        const subText = action.enabled
            ? action.subtitle || ''
            : action.blockedReason || action.subtitle || 'Indisponível no momento';

        this.actionButton.innerHTML = `
            <span class="context-btn-icon">${action.icon}</span>
            <div class="context-btn-text-cluster">
                <span class="context-btn-title">${action.title}</span>
                <span class="context-btn-subtitle">${subText}</span>
            </div>
            <span class="context-btn-keybadge">[Espaço]</span>
        `;

        this.container.classList.add('visible');
    }

    /**
     * Hides the action UI when no object is selected.
     */
    public hide(): void {
        this.currentAction = null;
        this.container.classList.remove('visible');
    }

    public getActiveAction(): ContextAction | null {
        return this.currentAction;
    }

    private getBadgeClass(target: SelectedTarget): string {
        if (target.soilStatus) {
            return `badge-${target.soilStatus}`;
        }
        return 'badge-normal';
    }

    private getBadgeLabel(target: SelectedTarget): string {
        if (target.type === 'plot') {
            switch (target.soilStatus) {
                case 'raw':
                    return 'Solo Bruto';
                case 'tilled':
                    return 'Pronto para Plantar';
                case 'planted':
                    return 'Recém-Plantado';
                case 'growing':
                    return `${Math.floor((target.growthProgress ?? 0) * 100)}% Crescendo`;
                case 'thirsty':
                    return 'Sem Água';
                case 'ready':
                    return 'Pronto para Colher';
                case 'exhausted':
                    return 'Solo Esgotado';
                default:
                    return 'Canteiro';
            }
        }
        if (target.type === 'animal') {
            if (target.readyToCollect) return 'Ovo no Ninho';
            if ((target.hunger ?? 0) >= 50) return 'Com Fome';
            return 'Saudável';
        }
        if (
            target.buildingHealth !== undefined &&
            target.maxHealth !== undefined &&
            target.buildingHealth < target.maxHealth
        ) {
            return 'Requer Reparo';
        }
        return 'Operacional';
    }
}
