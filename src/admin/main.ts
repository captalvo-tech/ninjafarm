/**
 * ============================================================================
 * NINJA FARM — CONTRATO OBRIGATÓRIO DO ROADMAP
 * ============================================================================
 * Módulo Principal: Entrada da SPA Administrativa (/admin)
 * ============================================================================
 */

import { adminAuth } from './auth';
import { renderDashboardView } from './views/dashboard-view';
import { renderAlertsView } from './views/alerts-view';
import { renderEconomyView } from './views/economy-view';
import { renderRoadmapView } from './views/roadmap-view';
import { renderDroidView } from './views/droid-view';
import { renderGeminiView } from './views/gemini-view';
import { renderQualityView } from './views/quality-view';
import { renderConfigView } from './views/config-view';

class AdminApp {
    private appRoot: HTMLElement;

    constructor() {
        this.appRoot = document.getElementById('admin-app') || document.body;
    }

    public async init(): Promise<void> {
        this.renderLoading();
        const session = await adminAuth.checkSession();

        if (session.authenticated) {
            this.renderAppLayout();
        } else {
            this.renderLoginScreen(session.need_setup);
        }

        window.addEventListener('hashchange', () => {
            if (adminAuth.isAuthenticated()) {
                this.routeCurrentView();
            }
        });
    }

    private renderLoading(): void {
        this.appRoot.innerHTML = `
            <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg-page); color: var(--text-secondary); font-family: var(--font-sans);">
                <div style="text-align: center;">
                    <div style="font-size: 32px; margin-bottom: 12px;">📊</div>
                    <div>Verificando credenciais administrativas...</div>
                </div>
            </div>
        `;
    }

    private renderLoginScreen(needSetup?: boolean): void {
        this.appRoot.innerHTML = `
            <div class="login-screen">
                <div class="login-card">
                    <div class="login-header">
                        <div style="font-size: 36px;">🥷 📊</div>
                        <h2 class="login-title">${needSetup ? 'Provisionamento Inicial do Admin' : 'Ninja Farm — Acesso Administrativo'}</h2>
                        <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">
                            ${needSetup ? 'Defina a senha mestra para mvioli7@gmail.com' : 'Central de Observabilidade, Economia e Roadmap Vivo'}
                        </p>
                    </div>

                    <div id="login-error-box" class="login-error" style="display: none;"></div>

                    <form id="admin-login-form">
                        <div class="form-group">
                            <label class="form-label">E-mail do Administrador</label>
                            <input type="email" id="login-email" class="form-input" value="mvioli7@gmail.com" ${needSetup ? 'readonly' : 'required'} />
                        </div>
                        <div class="form-group">
                            <label class="form-label">${needSetup ? 'Nova Senha Mestra (mínimo 8 caracteres)' : 'Senha Administrativa'}</label>
                            <input type="password" id="login-password" class="form-input" placeholder="••••••••" required />
                        </div>

                        <button type="submit" id="btn-submit-auth" class="btn btn-primary" style="width: 100%; justify-content: center; margin-top: 12px; padding: 12px;">
                            ${needSetup ? 'Concluir Provisionamento' : 'Acessar Central de Comando'}
                        </button>
                    </form>

                    <div class="login-notice">
                        Ambiente protegido contra ataques de força bruta.<br>
                        5 tentativas falhas bloqueiam o acesso por 15 minutos.
                    </div>
                </div>
            </div>
        `;

        const form = this.appRoot.querySelector('#admin-login-form') as HTMLFormElement;
        const emailInput = this.appRoot.querySelector('#login-email') as HTMLInputElement;
        const passInput = this.appRoot.querySelector('#login-password') as HTMLInputElement;
        const errorBox = this.appRoot.querySelector('#login-error-box') as HTMLElement;
        const submitBtn = this.appRoot.querySelector('#btn-submit-auth') as HTMLButtonElement;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorBox.style.display = 'none';
            submitBtn.disabled = true;
            submitBtn.textContent = 'Autenticando...';

            try {
                if (needSetup) {
                    const res = await adminAuth.setupInitialAdmin(passInput.value);
                    if (res.success) {
                        alert('Administrador provisionado com sucesso! Agora você pode realizar o login.');
                        this.renderLoginScreen(false);
                        return;
                    } else {
                        errorBox.textContent = res.error || 'Erro no provisionamento.';
                        errorBox.style.display = 'block';
                    }
                } else {
                    const res = await adminAuth.login(emailInput.value, passInput.value);
                    if (res.success) {
                        this.renderAppLayout();
                        return;
                    } else {
                        if (res.need_setup) {
                            this.renderLoginScreen(true);
                            return;
                        }
                        errorBox.textContent = res.error || 'Credenciais inválidas.';
                        errorBox.style.display = 'block';
                    }
                }
            } catch (err: any) {
                errorBox.textContent = err.message || 'Erro de comunicação.';
                errorBox.style.display = 'block';
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = needSetup ? 'Concluir Provisionamento' : 'Acessar Central de Comando';
            }
        });
    }

    private renderAppLayout(): void {
        this.appRoot.innerHTML = `
            <div class="admin-layout">
                <!-- Sidebar -->
                <aside class="admin-sidebar">
                    <div class="sidebar-header">
                        <div class="sidebar-logo">🥷</div>
                        <div>
                            <div class="sidebar-title">Ninja Farm</div>
                            <div class="sidebar-badge">Painel /admin</div>
                        </div>
                    </div>

                    <nav class="sidebar-nav">
                        <a href="#/" class="nav-item" data-route="">📊 Dashboard Geral</a>
                        <a href="#/alertas" class="nav-item" data-route="alertas">⚠️ Central de Alertas</a>
                        <a href="#/economia" class="nav-item" data-route="economia">🌾 Economia & Simulador</a>
                        <a href="#/roadmap" class="nav-item" data-route="roadmap">📜 Roadmap Vivo</a>
                        <a href="#/droid" class="nav-item" data-route="droid">🤖 Frota Droid & AFK</a>
                        <a href="#/gemini" class="nav-item" data-route="gemini">🧠 Gemini AI</a>
                        <a href="#/qualidade" class="nav-item" data-route="qualidade">🧪 Qualidade & Testes</a>
                        <a href="#/config" class="nav-item" data-route="config">⚙️ Auditoria & Config</a>
                    </nav>

                    <div style="padding: 16px; border-top: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 8px;">
                        <a href="index.html" class="btn btn-secondary" style="font-size: 12px; justify-content: center;">🎮 Abrir Jogo</a>
                        <a href="studio.html" class="btn btn-secondary" style="font-size: 12px; justify-content: center;">🎨 Ninja Farm Studio</a>
                    </div>
                </aside>

                <!-- Conteúdo Principal -->
                <main class="admin-main">
                    <header class="topbar">
                        <div class="topbar-title" id="page-heading">Dashboard Geral</div>
                        <div class="topbar-user">
                            <span class="user-badge">👤 ${escapeHtml(adminAuth.getEmail())}</span>
                            <button id="btn-admin-logout" class="btn-logout">Sair</button>
                        </div>
                    </header>

                    <div class="admin-content" id="admin-view-content"></div>
                </main>
            </div>
        `;

        this.appRoot.querySelector('#btn-admin-logout')?.addEventListener('click', async () => {
            await adminAuth.logout();
            this.renderLoginScreen(false);
        });

        this.routeCurrentView();
    }

    private routeCurrentView(): void {
        const rawHash = window.location.hash.replace(/^#\/?/, '');
        const route = rawHash.split('?')[0] || '';

        // Atualiza item ativo na sidebar
        this.appRoot.querySelectorAll('.nav-item').forEach(el => {
            const itemRoute = el.getAttribute('data-route') || '';
            if (itemRoute === route) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });

        const viewContainer = this.appRoot.querySelector('#admin-view-content') as HTMLElement;
        const pageHeading = this.appRoot.querySelector('#page-heading') as HTMLElement;
        if (!viewContainer) return;

        viewContainer.innerHTML = '';

        switch (route) {
            case 'alertas':
                pageHeading.textContent = 'Central de Alertas & Incidentes';
                renderAlertsView(viewContainer);
                break;
            case 'economia':
                pageHeading.textContent = 'Economia, Escassez & Simulador Temporal';
                renderEconomyView(viewContainer);
                break;
            case 'roadmap':
                pageHeading.textContent = 'Roadmap Vivo & Memória Técnica Permanente';
                renderRoadmapView(viewContainer);
                break;
            case 'droid':
                pageHeading.textContent = 'Frota Droid & Monitoramento AFK';
                renderDroidView(viewContainer);
                break;
            case 'gemini':
                pageHeading.textContent = 'Observabilidade Gemini AI & Droid Chat';
                renderGeminiView(viewContainer);
                break;
            case 'qualidade':
                pageHeading.textContent = 'Qualidade, Testes & Telemetria';
                renderQualityView(viewContainer);
                break;
            case 'config':
                pageHeading.textContent = 'Auditoria de Segurança & Configurações';
                renderConfigView(viewContainer);
                break;
            case '':
            case 'dashboard':
            default:
                pageHeading.textContent = 'Dashboard Geral';
                renderDashboardView(viewContainer);
                break;
        }
    }
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new AdminApp();
    app.init();
});
