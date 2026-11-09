/**
 * Ninja Farm - Droid Chat Dialog
 * Dual-mode AI interface: Smart Mode (Gemini text) + Limited Robot Mode (Deterministic Reports).
 * Enforces mandatory 30-second penalty on error.
 */

import type { GeminiService, FarmAIContext } from '../ai/gemini-service';

export interface DroidChatCallbacks {
    getContext: () => FarmAIContext;
    onOpenSettings?: () => void;
}

export class DroidChatModal {
    private container: HTMLElement;
    private geminiService: GeminiService;
    private callbacks: DroidChatCallbacks;
    private isOpenState: boolean = false;
    private lockoutTimer: any = null;

    // Elementos internos
    private messagesEl!: HTMLElement;
    private inputEl!: HTMLInputElement;
    private sendBtnEl!: HTMLButtonElement;
    private modeBadgeEl!: HTMLElement;
    private lockoutBannerEl!: HTMLElement;
    private limitedNoticeEl!: HTMLElement;

    constructor(geminiService: GeminiService, callbacks: DroidChatCallbacks) {
        this.geminiService = geminiService;
        this.callbacks = callbacks;

        this.container = document.createElement('div');
        this.container.id = 'droid-chat-modal';
        this.container.className = 'droid-chat-backdrop';
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
        this.updateModeUI();
        this.checkLockoutStatus();
    }

    public close(): void {
        this.isOpenState = false;
        this.container.classList.remove('open');
        if (this.lockoutTimer) {
            clearInterval(this.lockoutTimer);
            this.lockoutTimer = null;
        }
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
            .droid-chat-backdrop {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(11, 15, 25, 0.75);
                backdrop-filter: blur(8px);
                z-index: 240;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 16px;
                box-sizing: border-box;
                font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            }

            .droid-chat-backdrop.open {
                display: flex;
            }

            .droid-chat-window {
                background: rgba(15, 23, 42, 0.96);
                border: 1.5px solid rgba(16, 185, 129, 0.4);
                border-radius: 20px;
                width: 100%;
                max-width: 480px;
                max-height: 85vh;
                display: flex;
                flex-direction: column;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
                overflow: hidden;
            }

            .chat-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 16px 20px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                background: rgba(11, 15, 25, 0.6);
            }

            .chat-title-group {
                display: flex;
                align-items: center;
                gap: 10px;
            }

            .chat-title-group h2 {
                margin: 0;
                font-size: 15px;
                font-weight: 800;
                color: #FFFFFF;
            }

            .chat-mode-badge {
                font-size: 10px;
                font-weight: 800;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                padding: 3px 8px;
                border-radius: 20px;
            }

            .chat-mode-badge.smart {
                background: rgba(16, 185, 129, 0.2);
                color: #34D399;
                border: 1px solid rgba(16, 185, 129, 0.4);
            }

            .chat-mode-badge.limited {
                background: rgba(245, 158, 11, 0.2);
                color: #FBBF24;
                border: 1px solid rgba(245, 158, 11, 0.4);
            }

            .chat-close-btn {
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

            .chat-close-btn:hover {
                background: rgba(239, 68, 68, 0.2);
                color: #EF4444;
                border-color: #EF4444;
            }

            .chat-messages {
                flex: 1;
                padding: 16px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 12px;
                max-height: 48vh;
            }

            .chat-msg {
                max-width: 88%;
                padding: 10px 14px;
                border-radius: 14px;
                font-size: 12.5px;
                line-height: 1.45;
                word-wrap: break-word;
            }

            .chat-msg.droid {
                align-self: flex-start;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: #E5E7EB;
                border-top-left-radius: 4px;
            }

            .chat-msg.user {
                align-self: flex-end;
                background: linear-gradient(135deg, #10B981, #059669);
                color: #FFFFFF;
                border-top-right-radius: 4px;
            }

            .chat-msg.system {
                align-self: center;
                background: rgba(245, 158, 11, 0.15);
                border: 1px solid rgba(245, 158, 11, 0.3);
                color: #FBBF24;
                font-size: 11px;
                text-align: center;
            }

            /* Botões de Relatório Rápido */
            .quick-reports-bar {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                padding: 10px 16px;
                border-top: 1px solid rgba(255, 255, 255, 0.08);
                background: rgba(11, 15, 25, 0.4);
            }

            .btn-quick-report {
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                color: #D1D5DB;
                font-size: 11px;
                font-weight: 700;
                padding: 8px 10px;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .btn-quick-report:hover {
                background: rgba(16, 185, 129, 0.15);
                border-color: #34D399;
                color: #FFFFFF;
            }

            /* Barra de Input */
            .chat-input-bar {
                display: flex;
                gap: 8px;
                padding: 12px 16px;
                border-top: 1px solid rgba(255, 255, 255, 0.08);
                background: rgba(11, 15, 25, 0.8);
            }

            .chat-input {
                flex: 1;
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 10px;
                padding: 10px 14px;
                color: #FFFFFF;
                font-size: 13px;
                outline: none;
            }

            .chat-input:focus {
                border-color: #10B981;
            }

            .chat-input:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .btn-chat-send {
                background: #10B981;
                border: none;
                border-radius: 10px;
                color: #0B0F19;
                font-size: 12px;
                font-weight: 800;
                padding: 0 16px;
                cursor: pointer;
                transition: all 0.2s;
            }

            .btn-chat-send:hover {
                background: #34D399;
            }

            .btn-chat-send:disabled {
                background: rgba(255, 255, 255, 0.1);
                color: #6B7280;
                cursor: not-allowed;
            }

            /* Banners Informativos */
            .lockout-banner {
                background: rgba(239, 68, 68, 0.2);
                border-top: 1px solid rgba(239, 68, 68, 0.4);
                color: #F87171;
                font-size: 11px;
                font-weight: 700;
                padding: 8px 16px;
                text-align: center;
                display: none;
            }

            .limited-notice {
                font-size: 11px;
                color: #9CA3AF;
                text-align: center;
                padding: 6px 16px;
                background: rgba(245, 158, 11, 0.08);
                display: none;
            }
        `;
        document.head.appendChild(style);
    }

    private buildLayout(): void {
        this.container.innerHTML = `
            <div class="droid-chat-window">
                <div class="chat-header">
                    <div class="chat-title-group">
                        <h2>🤖 Droid Assistente</h2>
                        <span id="chat-mode-badge" class="chat-mode-badge limited">Modo Limitado</span>
                    </div>
                    <button id="btn-close-droid-chat" class="chat-close-btn" title="Fechar">✕</button>
                </div>

                <div class="chat-messages" id="chat-messages-container">
                    <div class="chat-msg droid">
                        Olá, comandante Ninja! Sou a unidade Droid da sua fazenda. Como posso ajudá-lo hoje? Selecione um relatório abaixo ou envie sua dúvida sobre o andamento da propriedade.
                    </div>
                </div>

                <!-- RELATÓRIOS DO MODO LIMITADO / BOTÕES DE ACESSO RÁPIDO -->
                <div class="quick-reports-bar">
                    <button class="btn-quick-report" id="btn-rep-production">📊 Produção</button>
                    <button class="btn-quick-report" id="btn-rep-energy">⚡ Bateria & Energia</button>
                    <button class="btn-quick-report" id="btn-rep-advice">💡 Próximos Passos</button>
                    <button class="btn-quick-report" id="btn-rep-events">📜 Diário de Eventos</button>
                </div>

                <div id="limited-mode-notice" class="limited-notice">
                    Modo Limitado Ativo (Sem Custos). Para perguntas livres com IA, configure sua chave Gemini em <a href="#" id="link-open-settings" style="color: #34D399; font-weight: 700;">Configurações (⚙️)</a>.
                </div>

                <div id="lockout-penalty-banner" class="lockout-banner">
                    ⚠️ Intervalo de segurança ativo. Aguarde <span id="lockout-timer-seconds">30</span>s antes de perguntar novamente.
                </div>

                <div class="chat-input-bar" id="chat-input-container">
                    <input type="text" id="chat-user-input" class="chat-input" placeholder="Pergunte sobre a fazenda, colheitas, sol..." />
                    <button id="btn-chat-send-msg" class="btn-chat-send">Enviar</button>
                </div>
            </div>
        `;

        this.messagesEl = this.container.querySelector('#chat-messages-container') as HTMLElement;
        this.inputEl = this.container.querySelector('#chat-user-input') as HTMLInputElement;
        this.sendBtnEl = this.container.querySelector('#btn-chat-send-msg') as HTMLButtonElement;
        this.modeBadgeEl = this.container.querySelector('#chat-mode-badge') as HTMLElement;
        this.lockoutBannerEl = this.container.querySelector('#lockout-penalty-banner') as HTMLElement;
        this.limitedNoticeEl = this.container.querySelector('#limited-mode-notice') as HTMLElement;
    }

    private setupEventListeners(): void {
        const closeBtn = this.container.querySelector('#btn-close-droid-chat');
        closeBtn?.addEventListener('click', () => this.close());

        this.sendBtnEl?.addEventListener('click', () => this.handleSendMessage());
        this.inputEl?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.handleSendMessage();
            }
        });

        // Botões de Relatório Rápido (Modo Robótico)
        this.container.querySelector('#btn-rep-production')?.addEventListener('click', () => {
            const ctx = this.callbacks.getContext();
            const rep = this.geminiService.generateProductionReport(ctx.resources, ctx.crops);
            this.appendMessage('droid', rep);
        });

        this.container.querySelector('#btn-rep-energy')?.addEventListener('click', () => {
            const ctx = this.callbacks.getContext();
            const rep = this.geminiService.generateEnergyReport(ctx.solarGenerationRate, ctx.farmStoredEnergy, ctx.droidBattery, ctx.droidState);
            this.appendMessage('droid', rep);
        });

        this.container.querySelector('#btn-rep-advice')?.addEventListener('click', () => {
            const ctx = this.callbacks.getContext();
            const rep = this.geminiService.generateAdviceReport(ctx.resources, ctx.crops, ctx.queuedTasksCount, ctx.droidBattery);
            this.appendMessage('droid', rep);
        });

        this.container.querySelector('#btn-rep-events')?.addEventListener('click', () => {
            const ctx = this.callbacks.getContext();
            const rep = this.geminiService.generateEventsReport(ctx.recentEvents || []);
            this.appendMessage('droid', rep);
        });

        this.container.querySelector('#link-open-settings')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.close();
            this.callbacks.onOpenSettings?.();
        });
    }

    private updateModeUI(): void {
        const mode = this.geminiService.getMode();
        if (mode === 'smart') {
            this.modeBadgeEl.textContent = 'Modo Inteligente';
            this.modeBadgeEl.className = 'chat-mode-badge smart';
            this.limitedNoticeEl.style.display = 'none';
            this.inputEl.disabled = false;
            this.sendBtnEl.disabled = false;
            this.inputEl.placeholder = 'Pergunte sobre a fazenda, colheitas, sol...';
        } else {
            this.modeBadgeEl.textContent = 'Modo Limitado';
            this.modeBadgeEl.className = 'chat-mode-badge limited';
            this.limitedNoticeEl.style.display = 'block';
            this.inputEl.disabled = true;
            this.sendBtnEl.disabled = true;
            this.inputEl.placeholder = 'Modo Limitado: Utilize os botões de relatório acima';
        }
    }

    private checkLockoutStatus(): void {
        const remaining = this.geminiService.getRemainingLockoutSeconds();
        if (remaining > 0) {
            this.startLockoutCountdown(remaining);
        } else {
            this.lockoutBannerEl.style.display = 'none';
            if (this.geminiService.getMode() === 'smart') {
                this.inputEl.disabled = false;
                this.sendBtnEl.disabled = false;
            }
        }
    }

    private startLockoutCountdown(seconds: number): void {
        this.inputEl.disabled = true;
        this.sendBtnEl.disabled = true;
        this.lockoutBannerEl.style.display = 'block';

        const secondsEl = this.container.querySelector('#lockout-timer-seconds') as HTMLElement;
        if (secondsEl) secondsEl.textContent = seconds.toString();

        if (this.lockoutTimer) clearInterval(this.lockoutTimer);

        let rem = seconds;
        this.lockoutTimer = setInterval(() => {
            rem--;
            if (secondsEl) secondsEl.textContent = rem.toString();
            if (rem <= 0) {
                clearInterval(this.lockoutTimer);
                this.lockoutTimer = null;
                this.lockoutBannerEl.style.display = 'none';
                if (this.geminiService.getMode() === 'smart') {
                    this.inputEl.disabled = false;
                    this.sendBtnEl.disabled = false;
                }
            }
        }, 1000);
    }

    private async handleSendMessage(): Promise<void> {
        const text = this.inputEl.value.trim();
        if (!text) return;

        this.appendMessage('user', text);
        this.inputEl.value = '';
        this.inputEl.disabled = true;
        this.sendBtnEl.disabled = true;

        const ctx = this.callbacks.getContext();
        const res = await this.geminiService.askQuestion(text, ctx);

        if (res.success && res.reply) {
            this.appendMessage('droid', res.reply);
            this.inputEl.disabled = false;
            this.sendBtnEl.disabled = false;
            this.inputEl.focus();
        } else {
            this.appendMessage('system', `⚠️ ${res.error || 'Erro na resposta do Droid.'}`);
            if (res.remainingSeconds) {
                this.startLockoutCountdown(res.remainingSeconds);
            } else {
                this.inputEl.disabled = false;
                this.sendBtnEl.disabled = false;
            }
        }
    }

    public appendMessage(sender: 'user' | 'droid' | 'system', text: string): void {
        const msg = document.createElement('div');
        msg.className = `chat-msg ${sender}`;
        msg.innerHTML = text.replace(/\n/g, '<br/>');
        this.messagesEl.appendChild(msg);
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    }
}

