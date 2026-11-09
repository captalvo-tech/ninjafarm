/**
 * Ninja Farm - Google Login Modal Overlay
 * Forces authentication before entering the 3D world.
 */

import type { UserProfile } from '../core/types';
import type { AuthManager } from '../persistence/auth';

export interface LoginModalCallbacks {
    onLoginSuccess: (user: UserProfile) => void;
}

export class LoginModal {
    private overlay: HTMLElement;
    private authManager: AuthManager;
    private callbacks: LoginModalCallbacks;

    constructor(authManager: AuthManager, callbacks: LoginModalCallbacks) {
        this.authManager = authManager;
        this.callbacks = callbacks;

        this.overlay = document.createElement('div');
        this.overlay.id = 'login-modal-overlay';
        this.injectStyles();
        this.render();
        document.body.appendChild(this.overlay);

        this.initGoogleIdentity();
    }

    private injectStyles(): void {
        const style = document.createElement('style');
        style.textContent = `
            #login-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(11, 15, 25, 0.96);
                backdrop-filter: blur(16px);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.3s ease, visibility 0.3s ease;
                font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            }

            #login-modal-overlay.visible {
                opacity: 1;
                visibility: visible;
            }

            .login-card {
                background: #141B2D;
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 20px;
                padding: 36px 32px;
                max-width: 440px;
                width: 90%;
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(16, 185, 129, 0.15);
            }

            .login-logo-badge {
                width: 64px;
                height: 64px;
                background: linear-gradient(135deg, #10B981 0%, #064E3B 100%);
                border-radius: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 32px;
                margin-bottom: 16px;
                box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
            }

            .login-title {
                font-size: 24px;
                font-weight: 800;
                color: #FFFFFF;
                margin: 0 0 8px 0;
                letter-spacing: 0.5px;
            }

            .login-subtitle {
                font-size: 14px;
                color: #9CA3AF;
                margin: 0 0 28px 0;
                line-height: 1.5;
            }

            .google-btn-wrapper {
                width: 100%;
                display: flex;
                justify-content: center;
                min-height: 48px;
                margin-bottom: 16px;
            }

            .dev-login-btn {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 10px;
                color: #D1D5DB;
                font-family: inherit;
                font-size: 13px;
                font-weight: 600;
                padding: 10px 16px;
                width: 100%;
                cursor: pointer;
                transition: all 0.2s;
                margin-top: 10px;
            }

            .dev-login-btn:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #FFFFFF;
            }

            .login-status-msg {
                font-size: 12px;
                color: #10B981;
                margin-top: 12px;
                min-height: 18px;
            }
        `;
        document.head.appendChild(style);
    }

    private render(): void {
        this.overlay.innerHTML = `
            <div class="login-card">
                <div class="login-logo-badge">🥷</div>
                <h2 class="login-title">Ninja Farm</h2>
                <p class="login-subtitle">
                    Acesso exclusivo com autenticação Google.<br>
                    Sua propriedade e seu Droid salvos na nuvem.
                </p>

                <div class="google-btn-wrapper" id="google-login-btn-container">
                    <!-- Botão oficial Google Identity Services inserido aqui -->
                </div>

                <div class="login-status-msg" id="login-status-msg"></div>

                ${
                    import.meta.env.DEV
                        ? `<button class="dev-login-btn" id="dev-quick-login-btn">
                    ⚡ Entrar como Ninja (Acesso Rápido / Dev)
                </button>`
                        : ''
                }
            </div>
        `;

        if (import.meta.env.DEV) {
            const devBtn = this.overlay.querySelector('#dev-quick-login-btn');
            devBtn?.addEventListener('click', async () => {
                const statusEl = this.overlay.querySelector('#login-status-msg') as HTMLElement;
                if (statusEl) statusEl.textContent = 'Autenticando...';

                const ok = await this.authManager.loginDevMock();
                if (ok) {
                    const user = this.authManager.getUser();
                    if (user) {
                        this.hide();
                        this.callbacks.onLoginSuccess(user);
                    }
                } else {
                    if (statusEl) statusEl.textContent = 'Erro ao autenticar no modo dev.';
                }
            });
        }
    }

    private async initGoogleIdentity(): Promise<void> {
        // Obtém Client ID configurado no servidor ou via variável de ambiente
        let clientId =
            (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
            (window as any).GOOGLE_CLIENT_ID ||
            '1029384756-ninjafarm.apps.googleusercontent.com';

        try {
            const cfgRes = await fetch('api/auth.php?action=config');
            if (cfgRes.ok) {
                const cfg = await cfgRes.json();
                if (cfg.googleClientId) {
                    clientId = cfg.googleClientId;
                }
            }
        } catch {
            // Mantém fallback seguro
        }

        // Carrega SDK oficial do Google se não existir
        if (!document.getElementById('google-gsi-script')) {
            const script = document.createElement('script');
            script.id = 'google-gsi-script';
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = () => this.setupGsi(clientId);
            document.head.appendChild(script);
        } else {
            this.setupGsi(clientId);
        }
    }

    private setupGsi(clientId: string): void {
        const google = (window as any).google;
        if (!google?.accounts?.id) return;

        google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response: any) => {
                const statusEl = this.overlay.querySelector('#login-status-msg') as HTMLElement;
                if (statusEl) statusEl.textContent = 'Validando credencial Google no servidor...';

                try {
                    const ok = await this.authManager.loginWithGoogleIdToken(response.credential);
                    if (ok) {
                        const user = this.authManager.getUser();
                        if (user) {
                            this.hide();
                            this.callbacks.onLoginSuccess(user);
                        }
                    }
                } catch (err: any) {
                    if (statusEl) {
                        statusEl.textContent = `Erro: ${err.message || 'Falha na validação'}`;
                    }
                }
            }
        });

        const container = this.overlay.querySelector('#google-login-btn-container');
        if (container) {
            google.accounts.id.renderButton(container, {
                theme: 'filled_black',
                size: 'large',
                shape: 'pill',
                text: 'signin_with',
                locale: 'pt-BR'
            });
        }
    }

    public show(): void {
        this.overlay.classList.add('visible');
    }

    public hide(): void {
        this.overlay.classList.remove('visible');
    }
}
