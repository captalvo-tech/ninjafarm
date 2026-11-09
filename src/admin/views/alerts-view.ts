/**
 * ============================================================================
 * NINJA FARM — CONTRATO OBRIGATÓRIO DO ROADMAP
 * ============================================================================
 * Visualização: Central de Alertas e Incidentes (/admin/alertas)
 * ============================================================================
 */

import { adminAuth } from '../auth';

interface AlertItem {
    id: string;
    type: string;
    severity: 'Crítico' | 'Alto' | 'Médio' | 'Baixo' | 'Informativo';
    title: string;
    description: string;
    firstOccurrence: number;
    lastOccurrence: number;
    occurrences: number;
    version: string;
    module: string;
    status: 'Novo' | 'Em análise' | 'Em correção' | 'Aguardando validação' | 'Resolvido' | 'Ignorado';
    details?: Record<string, any>;
}

export async function renderAlertsView(container: HTMLElement): Promise<void> {
    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h1 style="font-size: 24px; font-weight: 700;">Central de Alertas & Incidentes</h1>
                <p style="color: var(--text-secondary); font-size: 14px;">Gestão de falhas técnicas, relatos de testadores e integridade de salvamento.</p>
            </div>
            <button id="btn-refresh-alerts" class="btn btn-secondary">🔄 Atualizar Alertas</button>
        </div>

        <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
            <div style="display: flex; gap: 8px;">
                <button class="btn btn-secondary alert-filter-status active" data-status="ALL">Todos</button>
                <button class="btn btn-secondary alert-filter-status" data-status="Novo">Novos</button>
                <button class="btn btn-secondary alert-filter-status" data-status="Em análise">Em análise</button>
                <button class="btn btn-secondary alert-filter-status" data-status="Resolvido">Resolvidos</button>
            </div>
            <div style="margin-left: auto; color: var(--text-muted); font-size: 13px;" id="alerts-count-label">Carregando...</div>
        </div>

        <div id="alerts-loading" style="padding: 40px; text-align: center; color: var(--text-muted);">
            Carregando incidentes...
        </div>

        <div id="alerts-container" class="panel" style="display: none;">
            <div class="admin-table-container">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Severidade</th>
                            <th>Título / Resumo</th>
                            <th>Módulo</th>
                            <th>Versão</th>
                            <th>Ocorrências</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody id="alerts-table-body"></tbody>
                </table>
            </div>
        </div>

        <!-- Modal de Detalhes do Alerta -->
        <div id="alert-detail-modal" class="modal-overlay" style="display: none;">
            <div class="modal-card">
                <div class="modal-header">
                    <div id="modal-alert-title" style="font-weight: 600; font-size: 16px;">Detalhes do Incidente</div>
                    <button id="btn-close-modal" class="btn-logout" style="border: none; font-size: 18px; cursor: pointer;">✕</button>
                </div>
                <div class="modal-body" id="modal-alert-body" style="display: flex; flex-direction: column; gap: 14px;"></div>
                <div class="modal-footer">
                    <button id="btn-modal-close" class="btn btn-secondary">Fechar</button>
                </div>
            </div>
        </div>
    `;

    let allAlerts: AlertItem[] = [];
    let currentFilter = 'ALL';

    const loadAlerts = async () => {
        const loading = container.querySelector('#alerts-loading') as HTMLElement;
        const panel = container.querySelector('#alerts-container') as HTMLElement;
        const tbody = container.querySelector('#alerts-table-body') as HTMLElement;
        const countLabel = container.querySelector('#alerts-count-label') as HTMLElement;

        try {
            const res = await adminAuth.apiFetch('/api/admin.php?action=alerts');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            allAlerts = data.alerts || [];

            loading.style.display = 'none';
            panel.style.display = 'block';

            renderFilteredList(tbody, countLabel);
        } catch (e: any) {
            loading.innerHTML = `<span style="color: var(--accent-red);">Erro ao buscar alertas: ${e.message}</span>`;
        }
    };

    const renderFilteredList = (tbody: HTMLElement, countLabel: HTMLElement) => {
        const filtered = currentFilter === 'ALL'
            ? allAlerts
            : allAlerts.filter(a => a.status === currentFilter);

        countLabel.textContent = `${filtered.length} incidentes listados (${allAlerts.length} no total)`;

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">Nenhum alerta encontrado neste filtro.</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(a => {
            const sevBadge = a.severity === 'Crítico' ? 'badge-danger' :
                             a.severity === 'Alto' ? 'badge-warning' :
                             a.severity === 'Médio' ? 'badge-info' : 'badge-muted';

            return `
                <tr data-alert-id="${a.id}">
                    <td><span class="badge ${sevBadge}">${a.severity}</span></td>
                    <td style="font-weight: 500;">
                        <div>${escapeHtml(a.title)}</div>
                        <div style="font-size: 11px; color: var(--text-muted);">${new Date(a.lastOccurrence * 1000).toLocaleString('pt-BR')}</div>
                    </td>
                    <td><code>${escapeHtml(a.module)}</code></td>
                    <td><span class="badge badge-muted">${escapeHtml(a.version)}</span></td>
                    <td>${a.occurrences}x</td>
                    <td>
                        <select class="form-input select-status" data-id="${a.id}" style="padding: 4px 8px; font-size: 12px; width: 140px;">
                            ${['Novo', 'Em análise', 'Em correção', 'Aguardando validação', 'Resolvido', 'Ignorado'].map(s => `
                                <option value="${s}" ${s === a.status ? 'selected' : ''}>${s}</option>
                            `).join('')}
                        </select>
                    </td>
                    <td>
                        <button class="btn btn-secondary btn-inspect" data-id="${a.id}" style="padding: 4px 10px; font-size: 12px;">Inspecionar</button>
                    </td>
                </tr>
            `;
        }).join('');

        // Wire inspect buttons
        tbody.querySelectorAll('.btn-inspect').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const alert = allAlerts.find(x => x.id === id);
                if (alert) openAlertModal(alert);
            });
        });

        // Wire status updates
        tbody.querySelectorAll('.select-status').forEach(sel => {
            sel.addEventListener('change', async (e) => {
                const target = e.target as HTMLSelectElement;
                const id = target.getAttribute('data-id');
                const newStatus = target.value;
                if (!id) return;

                try {
                    const res = await adminAuth.apiFetch('/api/admin.php', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'alerts_update_status', alertId: id, status: newStatus })
                    });
                    const d = await res.json();
                    if (d.success) {
                        const targetAlert = allAlerts.find(x => x.id === id);
                        if (targetAlert) targetAlert.status = newStatus as any;
                    } else {
                        alert('Falha ao atualizar status: ' + (d.error || 'Erro desconhecido'));
                    }
                } catch (err: any) {
                    alert('Erro de comunicação: ' + err.message);
                }
            });
        });
    };

    const openAlertModal = (alert: AlertItem) => {
        const modal = container.querySelector('#alert-detail-modal') as HTMLElement;
        const title = container.querySelector('#modal-alert-title') as HTMLElement;
        const body = container.querySelector('#modal-alert-body') as HTMLElement;

        title.textContent = `Incidente: ${alert.id}`;
        body.innerHTML = `
            <div>
                <div class="kpi-label">Título</div>
                <div style="font-size: 15px; font-weight: 600;">${escapeHtml(alert.title)}</div>
            </div>
            <div>
                <div class="kpi-label">Descrição / Mensagem do Relato</div>
                <div style="background: var(--bg-page); padding: 12px; border-radius: 6px; font-size: 13px; border: 1px solid var(--border-color); white-space: pre-wrap;">${escapeHtml(alert.description)}</div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div>
                    <div class="kpi-label">Módulo</div>
                    <div><code>${escapeHtml(alert.module)}</code></div>
                </div>
                <div>
                    <div class="kpi-label">Versão</div>
                    <div><span class="badge badge-muted">${escapeHtml(alert.version)}</span></div>
                </div>
                <div>
                    <div class="kpi-label">Severidade</div>
                    <div><span class="badge badge-info">${alert.severity}</span></div>
                </div>
                <div>
                    <div class="kpi-label">Status Atual</div>
                    <div><span class="badge badge-success">${alert.status}</span></div>
                </div>
            </div>
            ${alert.details ? `
                <div>
                    <div class="kpi-label">Metadados Técnicos Sanitizados</div>
                    <pre style="background: var(--bg-page); padding: 10px; border-radius: 6px; font-size: 12px; border: 1px solid var(--border-color); overflow-x: auto; font-family: var(--font-mono);">${escapeHtml(JSON.stringify(alert.details, null, 2))}</pre>
                </div>
            ` : ''}
        `;

        modal.style.display = 'flex';
    };

    // Close modal wire
    container.querySelector('#btn-close-modal')?.addEventListener('click', () => {
        (container.querySelector('#alert-detail-modal') as HTMLElement).style.display = 'none';
    });
    container.querySelector('#btn-modal-close')?.addEventListener('click', () => {
        (container.querySelector('#alert-detail-modal') as HTMLElement).style.display = 'none';
    });

    // Wire filters
    container.querySelectorAll('.alert-filter-status').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('.alert-filter-status').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-status') || 'ALL';
            const tbody = container.querySelector('#alerts-table-body') as HTMLElement;
            const countLabel = container.querySelector('#alerts-count-label') as HTMLElement;
            renderFilteredList(tbody, countLabel);
        });
    });

    container.querySelector('#btn-refresh-alerts')?.addEventListener('click', loadAlerts);

    await loadAlerts();
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
