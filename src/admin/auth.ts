/**
 * ============================================================================
 * NINJA FARM — CONTRATO OBRIGATÓRIO DO ROADMAP
 * ============================================================================
 * Módulo de Autenticação e Sessão Administrativa (/admin)
 * ============================================================================
 */

export interface AdminSession {
    authenticated: boolean;
    email?: string;
    role?: string;
    csrfToken?: string;
    need_setup?: boolean;
}

export class AdminAuthManager {
    private token: string | null = null;
    private csrfToken: string | null = null;
    private email: string | null = null;
    private role: string | null = null;

    constructor() {
        this.token = localStorage.getItem('ninja_admin_token');
        this.csrfToken = localStorage.getItem('ninja_admin_csrf');
        this.email = localStorage.getItem('ninja_admin_email');
        this.role = localStorage.getItem('ninja_admin_role');
    }

    public isAuthenticated(): boolean {
        return !!this.token;
    }

    public getEmail(): string {
        return this.email || 'mvioli7@gmail.com';
    }

    public getRole(): string {
        return this.role || 'superadmin';
    }

    public getCsrfToken(): string | null {
        return this.csrfToken;
    }

    public async checkSession(): Promise<AdminSession> {
        try {
            const res = await this.apiFetch('/api/admin.php?action=check', { method: 'GET' });
            if (res.ok) {
                const data = await res.json();
                if (data.authenticated) {
                    this.csrfToken = data.csrfToken;
                    this.email = data.email;
                    this.role = data.role;
                    if (this.csrfToken) localStorage.setItem('ninja_admin_csrf', this.csrfToken);
                    if (this.email) localStorage.setItem('ninja_admin_email', this.email);
                    if (this.role) localStorage.setItem('ninja_admin_role', this.role);
                    return { authenticated: true, email: this.email || undefined, role: this.role || undefined, csrfToken: this.csrfToken || undefined };
                }
            } else if (res.status === 401) {
                const data = await res.json().catch(() => ({}));
                this.clearLocalSession();
                return { authenticated: false, need_setup: !!data.need_setup };
            }
        } catch (e) {
            console.warn('[AdminAuth] Falha ao verificar sessão:', e);
        }
        return { authenticated: false };
    }

    public async login(email: string, password: string): Promise<{ success: boolean; error?: string; need_setup?: boolean }> {
        try {
            const res = await fetch('/api/admin.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'login', email, password })
            });
            const data = await res.json();
            if (data.success && data.adminToken) {
                this.token = data.adminToken;
                this.csrfToken = data.csrfToken;
                this.email = data.email;
                this.role = 'superadmin';

                localStorage.setItem('ninja_admin_token', this.token || '');
                localStorage.setItem('ninja_admin_csrf', this.csrfToken || '');
                localStorage.setItem('ninja_admin_email', this.email || '');
                localStorage.setItem('ninja_admin_role', this.role || '');

                return { success: true };
            }
            return { success: false, error: data.error || 'Credenciais inválidas', need_setup: !!data.need_setup };
        } catch (e: any) {
            return { success: false, error: e.message || 'Erro de conexão com o servidor.' };
        }
    }

    public async setupInitialAdmin(password: string): Promise<{ success: boolean; error?: string }> {
        try {
            const res = await fetch('/api/admin.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'setup_initial_admin', email: 'mvioli7@gmail.com', password })
            });
            const data = await res.json();
            if (data.success) {
                return { success: true };
            }
            return { success: false, error: data.error || 'Falha no provisionamento inicial.' };
        } catch (e: any) {
            return { success: false, error: e.message || 'Erro de conexão com o servidor.' };
        }
    }

    public async logout(): Promise<void> {
        try {
            await this.apiFetch('/api/admin.php?action=logout', { method: 'GET' });
        } catch (e) {
            console.warn('[AdminAuth] Erro ao deslogar do servidor:', e);
        }
        this.clearLocalSession();
    }

    private clearLocalSession(): void {
        this.token = null;
        this.csrfToken = null;
        this.email = null;
        this.role = null;
        localStorage.removeItem('ninja_admin_token');
        localStorage.removeItem('ninja_admin_csrf');
        localStorage.removeItem('ninja_admin_email');
        localStorage.removeItem('ninja_admin_role');
    }

    public async apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
        const headers: Record<string, string> = {
            ...(options.headers as Record<string, string> || {})
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        if (this.csrfToken && options.method && options.method.toUpperCase() === 'POST') {
            headers['X-CSRF-Token'] = this.csrfToken;
        }

        return fetch(url, {
            ...options,
            headers
        });
    }
}

export const adminAuth = new AdminAuthManager();
