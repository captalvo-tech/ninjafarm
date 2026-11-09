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
 * Ninja Farm - Google Identity & Authentication Manager
 * Handles Google GIS, session storage, backend verification and logout.
 */

import type { UserProfile } from '../core/types';

export interface AuthEvents {
    onLogin?: (user: UserProfile) => void;
    onLogout?: () => void;
}

export class AuthManager {
    private currentUser: UserProfile | null = null;
    private sessionToken: string | null = null;
    private events: AuthEvents;
    private baseUrl: string;

    constructor(events: AuthEvents = {}, baseUrl = './api/auth.php') {
        this.events = events;
        this.baseUrl = baseUrl;
        this.sessionToken = typeof localStorage !== 'undefined' ? localStorage.getItem('ninja_session_token') : null;
    }

    public async checkSession(): Promise<boolean> {
        try {
            const headers: Record<string, string> = {};
            if (this.sessionToken) {
                headers['Authorization'] = `Bearer ${this.sessionToken}`;
            }

            const res = await fetch(`${this.baseUrl}?action=check`, {
                method: 'GET',
                headers
            });

            if (res.ok) {
                const data = await res.json();
                if (data.authenticated && data.user) {
                    this.currentUser = data.user;
                    this.events.onLogin?.(this.currentUser!);
                    return true;
                }
            }
        } catch (err) {
            console.warn('[AuthManager] Falha ao verificar sessão remota:', err);
        }

        this.currentUser = null;
        return false;
    }

    public async loginWithGoogleIdToken(idToken: string): Promise<boolean> {
        try {
            const res = await fetch(`${this.baseUrl}?action=login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_token: idToken })
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || 'Falha na autenticação do Google.');
            }

            const data = await res.json();
            if (data.success && data.user) {
                this.currentUser = data.user;
                if (data.sessionToken) {
                    this.sessionToken = data.sessionToken;
                    if (typeof localStorage !== 'undefined') {
                        localStorage.setItem('ninja_session_token', data.sessionToken);
                    }
                }
                this.events.onLogin?.(this.currentUser!);
                return true;
            }
        } catch (err) {
            console.error('[AuthManager] Erro no login Google:', err);
            throw err;
        }

        return false;
    }

    /**
     * Login em modo desenvolvedor / teste local
     */
    public async loginDevMock(name = 'Ninja Desenvolvedor', email = 'ninja.dev@pinut.shop'): Promise<boolean> {
        try {
            const res = await fetch(`${this.baseUrl}?action=login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dev_mock: true,
                    dev_user: {
                        sub: 'dev_ninja_' + Math.random().toString(36).substring(2, 9),
                        email,
                        name,
                        picture: ''
                    }
                })
            });

            const data = await res.json();
            if (data.success && data.user) {
                this.currentUser = data.user;
                if (data.sessionToken) {
                    this.sessionToken = data.sessionToken;
                    if (typeof localStorage !== 'undefined') {
                        localStorage.setItem('ninja_session_token', data.sessionToken);
                    }
                }
                this.events.onLogin?.(this.currentUser!);
                return true;
            }
        } catch (err) {
            console.warn('[AuthManager] Fallback dev mock local:', err);
            this.currentUser = {
                sub: 'local_offline_ninja',
                email,
                name,
                createdAt: Date.now(),
                lastLoginAt: Date.now()
            };
            this.events.onLogin?.(this.currentUser);
            return true;
        }

        return false;
    }

    public async logout(): Promise<void> {
        try {
            const headers: Record<string, string> = {};
            if (this.sessionToken) {
                headers['Authorization'] = `Bearer ${this.sessionToken}`;
            }

            await fetch(`${this.baseUrl}?action=logout`, {
                method: 'POST',
                headers
            });
        } catch (err) {
            console.warn('[AuthManager] Falha ao notificar logout no servidor:', err);
        } finally {
            this.currentUser = null;
            this.sessionToken = null;
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem('ninja_session_token');
            }
            this.events.onLogout?.();
        }
    }

    public getUser(): UserProfile | null {
        return this.currentUser;
    }

    public isAuthenticated(): boolean {
        return this.currentUser !== null;
    }

    public getSessionToken(): string | null {
        return this.sessionToken;
    }
}
