/**
 * Ninja Farm - Settings Modal
 * Account status, progress reset, and Gemini AI configuration.
 */

import type { UserProfile, FarmSaveState } from '../core/types';
import type { AuthManager } from '../persistence/auth';
import type { CloudSaveManager } from '../persistence/cloud-save';

export interface SettingsModalCallbacks {
    onLogout: () => void;
    onResetProgress: (freshSave: FarmSaveState) => void;
    onGeminiConfigChange?: (config: { mode: 'smart' | 'limited'; hasKey: boolean }) => void;
    onOpenBugReport?: () => void;
    onRestartTutorial?: () => void;
}

export class SettingsModal {
    private overlay: HTMLElement;
    private authManager: AuthManager;
    private cloudSaveManager: CloudSaveManager;
    private callbacks: SettingsModalCallbacks;
    private isOpen = false;

    constructor(authManager: AuthManager, cloudSaveManager: CloudSaveManager, callbacks: SettingsModalCallbacks) {
        this.authManager = authManager;
        this.cloudSaveManager = cloudSaveManager;
        this.callbacks = callbacks;

        this.overlay = document.createElement('div');
        this.overlay.id = 'settings-modal-overlay';
        this.injectStyles();
        document.body.appendChild(this.overlay);
    }

    private injectStyles(): void {
        const style = document.createElement('style');
        style.textContent = `
            #settings-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(11, 15, 25, 0.85);
                backdrop-filter: blur(12px);
                z-index: 9500;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.25s ease, visibility 0.25s ease;
                font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            }

            #settings-modal-overlay.visible {
                opacity: 1;
                visibility: visible;
            }

            .settings-card {
                background: #141B2D;
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 20px;
                padding: 28px;
                max-width: 520px;
                width: 90%;
                max-height: 85vh;
                overflow-y: auto;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
                color: #FFFFFF;
            }

            .settings-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                padding-bottom: 14px;
                margin-bottom: 20px;
            }

            .settings-title {
                font-size: 20px;
                font-weight: 800;
                margin: 0;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .settings-close-btn {
                background: none;
                border: none;
                color: #9CA3AF;
                font-size: 20px;
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 6px;
            }

            .settings-close-btn:hover {
                color: #FFFFFF;
                background: rgba(255, 255, 255, 0.1);
            }

            .settings-section {
                background: rgba(11, 15, 25, 0.6);
                border: 1px solid rgba(255, 255, 255, 0.06);
                border-radius: 12px;
                padding: 16px;
                margin-bottom: 16px;
            }

            .settings-section-title {
                font-size: 14px;
                font-weight: 700;
                color: #10B981;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin: 0 0 12px 0;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .settings-user-row {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 12px;
            }

            .settings-user-avatar {
                width: 44px;
                height: 44px;
                border-radius: 50%;
                background: #374151;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                border: 2px solid #10B981;
            }

            .settings-user-details {
                display: flex;
                flex-direction: column;
            }

            .settings-user-name {
                font-weight: 700;
                font-size: 15px;
            }

            .settings-user-email {
                font-size: 12px;
                color: #9CA3AF;
            }

            .settings-btn-danger {
                background: rgba(239, 68, 68, 0.15);
                border: 1px solid rgba(239, 68, 68, 0.35);
                color: #F87171;
                padding: 10px 16px;
                border-radius: 8px;
                font-weight: 700;
                font-size: 13px;
                cursor: pointer;
                transition: all 0.15s;
                width: 100%;
            }

            .settings-btn-danger:hover {
                background: rgba(239, 68, 68, 0.25);
                color: #FFFFFF;
            }

            .settings-btn-secondary {
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.15);
                color: #E5E7EB;
                padding: 8px 14px;
                border-radius: 8px;
                font-weight: 600;
                font-size: 13px;
                cursor: pointer;
                transition: all 0.15s;
            }

            .settings-btn-secondary:hover {
                background: rgba(255, 255, 255, 0.15);
                color: #FFFFFF;
            }

            .gemini-input-group {
                display: flex;
                gap: 8px;
                margin-top: 10px;
            }

            .gemini-input {
                flex: 1;
                background: #0B0F19;
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 8px;
                padding: 8px 12px;
                color: #FFFFFF;
                font-family: inherit;
                font-size: 13px;
            }

            .gemini-status-badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 3px 8px;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 800;
                background: rgba(16, 185, 129, 0.15);
                color: #34D399;
                margin-bottom: 8px;
            }

            .gemini-status-badge.limited {
                background: rgba(245, 158, 11, 0.15);
                color: #FBBF24;
            }
        `;
        document.head.appendChild(style);
    }

    public open(): void {
        this.isOpen = true;
        this.render();
        this.overlay.classList.add('visible');
    }

    public close(): void {
        this.isOpen = false;
        this.overlay.classList.remove('visible');
    }

    public getIsOpen(): boolean {
        return this.isOpen;
    }

    private render(): void {
        const user: UserProfile | null = this.authManager.getUser();
        const isConfigured =
            localStorage.getItem('ninja_gemini_configured') === 'true' ||
            !!localStorage.getItem('ninja_gemini_api_key');
        const maskedKey = localStorage.getItem('ninja_gemini_masked') || '';
        const mode = isConfigured ? 'smart' : 'limited';

        this.overlay.innerHTML = `
            <div class="settings-card">
                <div class="settings-header">
                    <h3 class="settings-title">⚙️ Configurações da Propriedade</h3>
                    <button class="settings-close-btn" id="settings-close-btn">✕</button>
                </div>

                <!-- 1. Seção Conta -->
                <div class="settings-section">
                    <div class="settings-section-title">👤 Conta Google Conectada</div>
                    <div class="settings-user-row">
                        <div class="settings-user-avatar">
                            ${user?.picture ? `<img src="${user.picture}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : '🥷'}
                        </div>
                        <div class="settings-user-details">
                            <span class="settings-user-name">${user?.name || 'Mestre Ninja'}</span>
                            <span class="settings-user-email">${user?.email || 'Autenticado via Google'}</span>
                        </div>
                    </div>
                    <button class="settings-btn-secondary" id="settings-logout-btn" style="width:100%;">
                        🚪 Sair da Conta (Logout)
                    </button>
                </div>

                <!-- 2. Seção Gemini AI -->
                <div class="settings-section">
                    <div class="settings-section-title">🤖 Conexão Gemini AI (Droid)</div>
                    <div class="gemini-status-badge ${mode}">
                        ${mode === 'smart' ? '● Modo Inteligente Ativo (Criptografia AES-256)' : '● Modo Limitado / Robótico (Sem API)'}
                    </div>
                    <p style="font-size:12px;color:#9CA3AF;margin:0 0 10px 0;">
                        O Droid utiliza a IA exclusivamente para responder dúvidas e relatórios (somente leitura; nunca executa ações pelo chat). Sua chave é salva criptografada (AES-256-CBC) no servidor.
                    </p>
                    <div class="gemini-input-group">
                        <input type="password" class="gemini-input" id="gemini-key-input" placeholder="${maskedKey || (isConfigured ? '••••••••••••••••••••••••' : 'Insira sua chave do Google AI Studio...')}" />
                        <button class="settings-btn-secondary" id="save-gemini-key-btn">Salvar</button>
                    </div>
                    ${
                        isConfigured
                            ? `
                        <div style="display:flex;gap:8px;margin-top:8px;">
                            <button class="settings-btn-secondary" id="test-gemini-key-btn" style="flex:1;font-size:12px;">
                                🧪 Testar Conexão
                            </button>
                            <button class="settings-btn-secondary" id="disconnect-gemini-key-btn" style="flex:1;font-size:12px;color:#FCA5A5;">
                                Desconectar Chave
                            </button>
                        </div>
                    `
                            : ''
                    }
                    <div id="gemini-test-result" style="font-size:12px;margin-top:8px;min-height:16px;"></div>
                </div>

                <!-- 3. Seção Suporte & Diagnóstico -->
                <div class="settings-section">
                    <div class="settings-section-title">🛠️ Suporte & Ferramentas</div>
                    <div style="display:flex;gap:10px;margin-top:8px;">
                        <button class="settings-btn-secondary" id="settings-tutorial-btn" style="flex:1;">
                            📖 Rever Tutorial
                        </button>
                        <button class="settings-btn-secondary" id="settings-bugreport-btn" style="flex:1;color:#f87171;border-color:rgba(239,68,68,0.4);">
                            🐛 Reportar Bug
                        </button>
                    </div>
                    <div style="display:flex;gap:10px;margin-top:8px;">
                        <a href="studio.html" target="_blank" class="settings-btn-secondary" style="flex:1;text-decoration:none;text-align:center;font-size:12px;">
                            🎨 Studio 3D
                        </a>
                        <a href="admin.html" target="_blank" class="settings-btn-secondary" style="flex:1;text-decoration:none;text-align:center;font-size:12px;">
                            📊 Painel /admin
                        </a>
                    </div>
                </div>

                <!-- 4. Seção Progresso -->
                <div class="settings-section">
                    <div class="settings-section-title" style="color:#EF4444;">⚠️ Gerenciamento de Progresso</div>
                    <p style="font-size:12px;color:#9CA3AF;margin:0 0 12px 0;">
                        Apagar o progresso reinicializará sua fazenda, cancelará todas as tarefas do Droid e restaurará o estado inicial da propriedade. Esta ação é irreversível.
                    </p>
                    <button class="settings-btn-danger" id="settings-reset-farm-btn">
                        🗑️ Apagar Progresso e Começar do Zero
                    </button>
                </div>
            </div>
        `;

        // Eventos
        this.overlay.querySelector('#settings-close-btn')?.addEventListener('click', () => this.close());

        this.overlay.querySelector('#settings-logout-btn')?.addEventListener('click', async () => {
            await this.authManager.logout();
            this.close();
            this.callbacks.onLogout();
        });

        const keyInput = this.overlay.querySelector('#gemini-key-input') as HTMLInputElement;
        const saveKeyBtn = this.overlay.querySelector('#save-gemini-key-btn');
        const resultEl = this.overlay.querySelector('#gemini-test-result');

        saveKeyBtn?.addEventListener('click', async () => {
            const val = keyInput.value.trim();
            if (!val) return;
            if (resultEl) resultEl.innerHTML = '<span style="color:#9CA3AF;">Criptografando e salvando...</span>';

            try {
                const res = await fetch('/api/ai.php?action=set_key', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ apiKey: val })
                });
                const data = await res.json().catch(() => ({}));
                if (res.ok && data.success) {
                    localStorage.removeItem('ninja_gemini_api_key');
                    localStorage.setItem('ninja_gemini_configured', 'true');
                    if (data.maskedKey) localStorage.setItem('ninja_gemini_masked', data.maskedKey);
                    if (resultEl)
                        resultEl.innerHTML =
                            '<span style="color:#34D399;">✓ Chave salva e criptografada (AES-256) no servidor!</span>';
                    this.callbacks.onGeminiConfigChange?.({ mode: 'smart', hasKey: true });
                    setTimeout(() => this.render(), 1200);
                } else {
                    if (resultEl)
                        resultEl.innerHTML = `<span style="color:#F87171;">✕ ${data.error || 'Erro ao salvar chave.'}</span>`;
                }
            } catch {
                // Fallback para modo local de desenvolvimento caso backend esteja inacessível
                localStorage.setItem('ninja_gemini_api_key', val);
                if (resultEl)
                    resultEl.innerHTML =
                        '<span style="color:#34D399;">✓ Chave salva localmente (Modo Desenvolvimento).</span>';
                this.callbacks.onGeminiConfigChange?.({ mode: 'smart', hasKey: true });
                setTimeout(() => this.render(), 1200);
            }
        });

        this.overlay.querySelector('#test-gemini-key-btn')?.addEventListener('click', async () => {
            if (resultEl) resultEl.innerHTML = '<span style="color:#9CA3AF;">Testando conexão com Gemini...</span>';
            try {
                const res = await fetch('/api/ai.php?action=test', { method: 'POST' });
                const data = await res.json().catch(() => ({}));
                if (res.ok && data.success) {
                    if (resultEl)
                        resultEl.innerHTML = '<span style="color:#34D399;">✓ Conexão com Gemini validada com sucesso!</span>';
                } else {
                    if (resultEl)
                        resultEl.innerHTML = `<span style="color:#F87171;">✕ ${data.error || 'Falha no teste de conexão.'}</span>`;
                }
            } catch {
                if (resultEl) resultEl.innerHTML = '<span style="color:#F87171;">✕ Falha de conexão.</span>';
            }
        });

        this.overlay.querySelector('#disconnect-gemini-key-btn')?.addEventListener('click', async () => {
            try {
                await fetch('/api/ai.php?action=delete_key', { method: 'POST' });
            } catch {}
            localStorage.removeItem('ninja_gemini_api_key');
            localStorage.removeItem('ninja_gemini_configured');
            localStorage.removeItem('ninja_gemini_masked');
            this.callbacks.onGeminiConfigChange?.({ mode: 'limited', hasKey: false });
            this.render();
        });

        this.overlay.querySelector('#settings-reset-farm-btn')?.addEventListener('click', async () => {
            const confirmed = window.confirm(
                'ATENÇÃO: Você tem certeza de que deseja apagar todo o progresso da fazenda e começar do zero?\n\n' +
                    'Todas as construções, safras, inventário e tarefas do Droid serão restauradas ao estado inicial.'
            );

            if (confirmed) {
                const freshSave = await this.cloudSaveManager.resetProgress();
                if (freshSave) {
                    this.close();
                    this.callbacks.onResetProgress(freshSave);
                } else {
                    alert('Falha ao reiniciar o progresso no servidor.');
                }
            }
        });
    }
}
