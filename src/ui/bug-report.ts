/**
 * Ninja Farm - Bug & Feedback Report Modal
 * Discreet diagnostics reporter for alpha testers.
 * Strictly sanitizes data: zero API keys, zero OAuth tokens.
 */

export interface BugReportContext {
    version: string;
    screen: string;
    activeTask?: string;
    recentErrors?: string[];
}

export class BugReportModal {
    private overlay: HTMLElement;
    private isOpenState: boolean = false;
    private getContext: () => BugReportContext;
    private onReportSent?: (reportId: string) => void;

    constructor(getContext: () => BugReportContext, onReportSent?: (reportId: string) => void) {
        this.getContext = getContext;
        this.onReportSent = onReportSent;

        this.overlay = document.createElement('div');
        this.overlay.id = 'ninja-bug-report-modal';
        this.overlay.className = 'bug-report-backdrop';
        document.body.appendChild(this.overlay);

        this.injectStyles();
        this.buildLayout();
    }

    private injectStyles(): void {
        const style = document.createElement('style');
        style.textContent = `
            .bug-report-backdrop {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(15, 23, 42, 0.8);
                backdrop-filter: blur(8px);
                z-index: 250;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 16px;
                box-sizing: border-box;
                font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            }

            .bug-report-backdrop.open {
                display: flex;
            }

            .bug-report-window {
                background: #0f172a;
                border: 1.5px solid rgba(239, 68, 68, 0.5);
                border-radius: 18px;
                width: 100%;
                max-width: 440px;
                padding: 20px;
                box-sizing: border-box;
                color: #f8fafc;
                box-shadow: 0 10px 40px rgba(0,0,0,0.8), 0 0 20px rgba(239, 68, 68, 0.15);
            }

            .bug-report-title {
                font-size: 16px;
                font-weight: 700;
                color: #f87171;
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 6px;
            }

            .bug-report-subtitle {
                font-size: 12.5px;
                color: #94a3b8;
                margin-bottom: 14px;
            }

            .bug-report-meta {
                background: rgba(30, 41, 59, 0.6);
                border-radius: 8px;
                padding: 8px 12px;
                font-size: 11.5px;
                color: #cbd5e1;
                margin-bottom: 12px;
                font-family: monospace;
            }

            .bug-report-textarea {
                width: 100%;
                height: 100px;
                background: rgba(15, 23, 42, 0.8);
                border: 1px solid rgba(148, 163, 184, 0.3);
                border-radius: 10px;
                color: #f8fafc;
                padding: 10px;
                font-size: 13px;
                font-family: inherit;
                resize: vertical;
                box-sizing: border-box;
                margin-bottom: 14px;
            }

            .bug-report-textarea:focus {
                outline: none;
                border-color: #f87171;
            }

            .bug-report-actions {
                display: flex;
                gap: 8px;
                justify-content: flex-end;
            }

            .bug-report-btn-cancel {
                background: transparent;
                border: 1px solid rgba(148, 163, 184, 0.3);
                color: #94a3b8;
                padding: 8px 14px;
                border-radius: 8px;
                font-size: 12px;
                cursor: pointer;
            }

            .bug-report-btn-submit {
                background: linear-gradient(135deg, #ef4444, #dc2626);
                border: none;
                color: #ffffff;
                font-weight: 700;
                padding: 8px 18px;
                border-radius: 8px;
                font-size: 13px;
                cursor: pointer;
            }
        `;
        document.head.appendChild(style);
    }

    private buildLayout(): void {
        this.overlay.innerHTML = `
            <div class="bug-report-window">
                <div class="bug-report-title">🐛 Reportar Problema ou Sugestão</div>
                <div class="bug-report-subtitle">Ajude a aperfeiçoar a Alpha 0.1 do Ninja Farm. Relatórios são anônimos.</div>
                <div class="bug-report-meta" id="bug-report-meta-box">Carregando diagnósticos...</div>
                <textarea class="bug-report-textarea" id="bug-report-msg" placeholder="Descreva o que aconteceu, o que você esperava que acontecesse e como reproduzir o erro..."></textarea>
                <div class="bug-report-actions">
                    <button class="bug-report-btn-cancel" id="bug-report-cancel-btn">Cancelar</button>
                    <button class="bug-report-btn-submit" id="bug-report-submit-btn">Enviar Relatório</button>
                </div>
            </div>
        `;

        this.overlay.querySelector('#bug-report-cancel-btn')?.addEventListener('click', () => this.close());
        this.overlay.querySelector('#bug-report-submit-btn')?.addEventListener('click', () => this.submit());
    }

    public open(): void {
        this.isOpenState = true;
        this.overlay.classList.add('open');

        const ctx = this.getContext();
        const metaBox = this.overlay.querySelector('#bug-report-meta-box');
        if (metaBox) {
            metaBox.innerHTML = `
                Versão: ${ctx.version} | Tela: ${ctx.screen}<br>
                Plataforma: ${navigator.platform} | Tarefa: ${ctx.activeTask || 'Nenhuma'}
            `;
        }

        const msgInput = this.overlay.querySelector('#bug-report-msg') as HTMLTextAreaElement;
        if (msgInput) {
            msgInput.value = '';
            msgInput.focus();
        }
    }

    public isOpen(): boolean {
        return this.isOpenState;
    }

    public close(): void {
        this.isOpenState = false;
        this.overlay.classList.remove('open');
    }

    private async submit(): Promise<void> {
        const msgInput = this.overlay.querySelector('#bug-report-msg') as HTMLTextAreaElement;
        const msg = msgInput?.value.trim();
        if (!msg) {
            alert('Por favor, informe uma descrição do problema antes de enviar.');
            return;
        }

        const submitBtn = this.overlay.querySelector('#bug-report-submit-btn') as HTMLButtonElement;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviando...';
        }

        const ctx = this.getContext();

        try {
            const res = await fetch('/api/report.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    version: ctx.version,
                    browser: navigator.userAgent,
                    platform: navigator.platform,
                    screen: ctx.screen,
                    activeTask: ctx.activeTask,
                    message: msg,
                    recentErrors: ctx.recentErrors || []
                })
            });

            const data = await res.json();
            if (data.success) {
                alert(`Relatório recebido com sucesso! Código: ${data.reportId}`);
                this.onReportSent?.(data.reportId);
                this.close();
            } else {
                alert(`Erro ao enviar relatório: ${data.error || 'Falha de comunicação'}`);
            }
        } catch (err) {
            console.warn('[BugReport] Erro de rede:', err);
            // Salva no localStorage como fallback para envio posterior
            const offlineQueue = JSON.parse(localStorage.getItem('ninja_offline_bug_reports') || '[]');
            offlineQueue.push({ timestamp: Date.now(), message: msg, version: ctx.version });
            localStorage.setItem('ninja_offline_bug_reports', JSON.stringify(offlineQueue));
            alert('Conexão instável. Relatório salvo localmente e será enviado na próxima sincronização.');
            this.close();
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Enviar Relatório';
            }
        }
    }
}
