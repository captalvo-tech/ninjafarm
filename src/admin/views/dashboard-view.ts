/**
 * ============================================================================
 * NINJA FARM — CONTRATO OBRIGATÓRIO DO ROADMAP
 * ============================================================================
 * Visualização: Dashboard Geral & Central de Comando (/admin)
 * ============================================================================
 */

import { adminAuth } from '../auth';

export async function renderDashboardView(container: HTMLElement): Promise<void> {
    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h1 style="font-size: 24px; font-weight: 700;">Central Operacional do Ninja Farm</h1>
                <p style="color: var(--text-secondary); font-size: 14px;">Diagnóstico em tempo real de infraestrutura, jogadores, economia e frota Droid.</p>
            </div>
            <button id="btn-refresh-dashboard" class="btn btn-secondary">🔄 Atualizar Dados</button>
        </div>
        <div id="dashboard-loading" style="padding: 40px; text-align: center; color: var(--text-muted);">
            Carregando indicadores reais do servidor...
        </div>
        <div id="dashboard-content" style="display: none; flex-direction: column; gap: 24px;"></div>
    `;

    const refreshBtn = container.querySelector('#btn-refresh-dashboard') as HTMLButtonElement;
    refreshBtn?.addEventListener('click', () => loadDashboardData(container));

    await loadDashboardData(container);
}

async function loadDashboardData(container: HTMLElement): Promise<void> {
    const loadingEl = container.querySelector('#dashboard-loading') as HTMLElement;
    const contentEl = container.querySelector('#dashboard-content') as HTMLElement;

    try {
        const res = await adminAuth.apiFetch('/api/admin.php?action=dashboard');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (loadingEl) loadingEl.style.display = 'none';
        if (contentEl) {
            contentEl.style.display = 'flex';
            contentEl.innerHTML = `
                <!-- Linha 1: Status do Sistema & Versão -->
                <div class="panel">
                    <div class="panel-header">
                        <div class="panel-title">🟢 Integridade do Sistema & Versão de Produção</div>
                        <span class="badge badge-success">${data.system?.apiStatus || 'OPERATIONAL'}</span>
                    </div>
                    <div class="panel-body" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
                        <div>
                            <div class="kpi-label">Versão Deployed</div>
                            <div style="font-size: 18px; font-weight: 600;">${data.system?.deployedVersion || 'Alpha 0.1.0'}</div>
                        </div>
                        <div>
                            <div class="kpi-label">Motor & Ambiente</div>
                            <div style="font-size: 15px;">PHP ${data.system?.phpVersion || '8.x'} / PlayCanvas 2.23</div>
                        </div>
                        <div>
                            <div class="kpi-label">Banco de Dados</div>
                            <div style="font-size: 14px; color: var(--text-secondary);">${data.system?.databaseStatus || 'SQLite / JSON Atômico'}</div>
                        </div>
                        <div>
                            <div class="kpi-label">Horário do Servidor</div>
                            <div style="font-size: 14px; font-family: var(--font-mono);">${new Date((data.serverTime || Date.now() / 1000) * 1000).toLocaleString('pt-BR')}</div>
                        </div>
                    </div>
                </div>

                <!-- Linha 2: KPIs de Jogadores e Fazendas -->
                <div class="kpi-grid">
                    <div class="kpi-card">
                        <div class="kpi-label">Contas Registradas</div>
                        <div class="kpi-value">${data.players?.totalAccounts ?? 0}</div>
                        <div class="kpi-subtext">Google Identity autêntico</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-label">Jogadores Ativos Hoje</div>
                        <div class="kpi-value" style="color: var(--accent-green);">${data.players?.activeToday ?? 0}</div>
                        <div class="kpi-subtext">Últimas 24 horas</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-label">Ativos (7 dias)</div>
                        <div class="kpi-value" style="color: var(--accent-blue);">${data.players?.active7d ?? 0}</div>
                        <div class="kpi-subtext">Retenção semanal</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-label">Fazendas Ativas</div>
                        <div class="kpi-value">${data.farms?.totalFarms ?? 0}</div>
                        <div class="kpi-subtext">${data.farms?.farmsWithActiveCrops ?? 0} com lavouras em cultivo</div>
                    </div>
                </div>

                <!-- Linha 3: Frota Droid & Agendador AFK -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
                    <div class="panel">
                        <div class="panel-header">
                            <div class="panel-title">🤖 Frota Droid Operacional</div>
                            <span class="badge badge-info">${data.droid?.totalDroids ?? 0} Unidades</span>
                        </div>
                        <div class="panel-body" style="display: flex; flex-direction: column; gap: 14px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: var(--text-secondary);">Taxa de Ocupação Operacional:</span>
                                <strong style="color: var(--accent-blue); font-size: 16px;">${data.droid?.operationalUtilization ?? 0}%</strong>
                            </div>
                            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                                <span class="badge badge-success">Em Trabalho: ${data.droid?.working ?? 0}</span>
                                <span class="badge badge-warning">Recarregando: ${data.droid?.recharging ?? 0}</span>
                                <span class="badge badge-muted">Ociosos: ${data.droid?.idle ?? 0}</span>
                                <span class="badge badge-danger">Bateria Crítica (&lt;15%): ${data.droid?.lowBattery ?? 0}</span>
                            </div>
                            <div style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">
                                Droids com bateria crítica retornam automaticamente à estação solar mais próxima.
                            </div>
                        </div>
                    </div>

                    <div class="panel">
                        <div class="panel-header">
                            <div class="panel-title">📋 Agendador Central de Tarefas</div>
                            <span class="badge badge-muted">${data.scheduler?.totalTasks ?? 0} Total</span>
                        </div>
                        <div class="panel-body" style="display: flex; flex-direction: column; gap: 14px;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: var(--text-secondary);">Tarefas Concluídas:</span>
                                <strong style="color: var(--accent-green); font-size: 16px;">${data.scheduler?.completed ?? 0}</strong>
                            </div>
                            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                                <span class="badge badge-info">Na Fila / Andamento: ${data.scheduler?.scheduled ?? 0}</span>
                                <span class="badge badge-danger">Falta de Recursos: ${data.scheduler?.waitingResources ?? 0}</span>
                            </div>
                            <div style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">
                                Tarefas bloqueadas por insumos são ignoradas até o suprimento ser restabelecido.
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Atalhos rápidos -->
                <div class="panel" style="background: rgba(30, 41, 59, 0.4);">
                    <div class="panel-body" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                        <div>
                            <div style="font-weight: 600; font-size: 15px;">Deseja inspecionar a integridade técnica e econômica?</div>
                            <div style="color: var(--text-secondary); font-size: 13px;">Acesse as ferramentas dedicadas para balanceamento, alertas de testadores e governança.</div>
                        </div>
                        <div style="display: flex; gap: 12px;">
                            <a href="#/alertas" class="btn btn-primary">⚠️ Central de Alertas</a>
                            <a href="#/economia" class="btn btn-secondary">🌾 Simulador de Economia</a>
                            <a href="#/roadmap" class="btn btn-secondary">📜 Roadmap Vivo</a>
                        </div>
                    </div>
                </div>
            `;
        }
    } catch (e: any) {
        if (loadingEl) {
            loadingEl.style.display = 'block';
            loadingEl.innerHTML = `<span style="color: var(--accent-red);">❌ Falha ao carregar dashboard: ${e.message}</span>`;
        }
    }
}
