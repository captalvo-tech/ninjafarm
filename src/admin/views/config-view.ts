/**
 * ============================================================================
 * NINJA FARM — CONTRATO OBRIGATÓRIO DO ROADMAP
 * ============================================================================
 * Visualização: Configurações & Auditoria de Acessos (/admin/config)
 * ============================================================================
 */

import { adminAuth } from '../auth';

interface AuditLogEntry {
    timestamp: number;
    date: string;
    admin: string;
    action: string;
    ip: string;
    details?: Record<string, any>;
}

export async function renderConfigView(container: HTMLElement): Promise<void> {
    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h1 style="font-size: 24px; font-weight: 700;">Auditoria de Segurança & Configurações</h1>
                <p style="color: var(--text-secondary); font-size: 14px;">Trilha de auditoria das operações administrativas e diretrizes de acesso.</p>
            </div>
            <button id="btn-refresh-audit" class="btn btn-secondary">🔄 Atualizar Logs</button>
        </div>

        <div class="panel" style="margin-top: 16px;">
            <div class="panel-header">
                <div class="panel-title">🛡️ Política de Acesso e Credenciais do Superadministrador</div>
            </div>
            <div class="panel-body" style="display: flex; flex-direction: column; gap: 12px; font-size: 13px;">
                <div><strong>Administrador Primário:</strong> <code>mvioli7@gmail.com</code></div>
                <div><strong>Proteção de Credenciais:</strong> Senhas nunca são mantidas em texto plano. O armazenamento usa <code>password_hash(..., PASSWORD_DEFAULT)</code> com salt único por chave em arquivo com restrição de permissão 0600.</div>
                <div><strong>Redefinição Segura via Terminal (CLI):</strong> Para atualizar ou redefinir a credencial sem expor dados na rede:
                    <pre style="background: var(--bg-page); padding: 8px 12px; border-radius: 6px; font-family: var(--font-mono); margin-top: 4px; border: 1px solid var(--border-color);">php scripts/provision-admin.php</pre>
                </div>
                <div><strong>Rate Limiting Ativo:</strong> 5 tentativas incorretas consecutivas bloqueiam o IP de origem por 15 minutos (900s).</div>
            </div>
        </div>

        <div class="panel" style="margin-top: 20px;">
            <div class="panel-header">
                <div class="panel-title">📝 Trilha de Auditoria Administrativa Recente (Últimos Eventos)</div>
                <span class="badge badge-muted">admin_audit/</span>
            </div>
            <div id="audit-loading" style="padding: 30px; text-align: center; color: var(--text-muted);">
                Carregando logs de auditoria...
            </div>
            <div class="admin-table-container" id="audit-table-box" style="display: none;">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Data e Hora</th>
                            <th>Administrador</th>
                            <th>Ação</th>
                            <th>Endereço IP</th>
                            <th>Detalhes</th>
                        </tr>
                    </thead>
                    <tbody id="audit-table-body"></tbody>
                </table>
            </div>
        </div>
    `;

    const loadAudit = async () => {
        const loading = container.querySelector('#audit-loading') as HTMLElement;
        const box = container.querySelector('#audit-table-box') as HTMLElement;
        const tbody = container.querySelector('#audit-table-body') as HTMLElement;

        try {
            const res = await adminAuth.apiFetch('/api/admin.php?action=audit_logs');
            const data = await res.json();
            const logs: AuditLogEntry[] = data.logs || [];

            loading.style.display = 'none';
            box.style.display = 'block';

            if (logs.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 20px;">Nenhum registro de auditoria arquivado ainda.</td></tr>`;
                return;
            }

            tbody.innerHTML = logs.map(l => `
                <tr>
                    <td style="font-family: var(--font-mono); font-size: 12px;">${escapeHtml(l.date || new Date(l.timestamp * 1000).toLocaleString('pt-BR'))}</td>
                    <td><code>${escapeHtml(l.admin)}</code></td>
                    <td><span class="badge badge-info">${escapeHtml(l.action)}</span></td>
                    <td><code>${escapeHtml(l.ip)}</code></td>
                    <td style="font-size: 12px; color: var(--text-secondary);">${l.details ? escapeHtml(JSON.stringify(l.details)) : '-'}</td>
                </tr>
            `).join('');
        } catch (e: any) {
            loading.innerHTML = `<span style="color: var(--accent-red);">Erro ao carregar auditoria: ${e.message}</span>`;
        }
    };

    container.querySelector('#btn-refresh-audit')?.addEventListener('click', loadAudit);
    await loadAudit();
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
