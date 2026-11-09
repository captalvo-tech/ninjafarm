/**
 * ============================================================================
 * NINJA FARM — CONTRATO OBRIGATÓRIO DO ROADMAP
 * ============================================================================
 * Visualização: Qualidade, Testes & Telemetria (/admin/qualidade)
 * ============================================================================
 */

import { adminAuth } from '../auth';

export async function renderQualityView(container: HTMLElement): Promise<void> {
    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h1 style="font-size: 24px; font-weight: 700;">Qualidade, Testes Automatizados & Telemetria</h1>
                <p style="color: var(--text-secondary); font-size: 14px;">Métricas reais de cobertura, integridade e execução do pipeline de testes.</p>
            </div>
            <button id="btn-refresh-quality" class="btn btn-secondary">🔄 Atualizar Relatório</button>
        </div>
        <div id="quality-loading" style="padding: 30px; text-align: center; color: var(--text-muted);">
            Carregando relatório real de testes...
        </div>
        <div id="quality-content" style="display: none; margin-top: 16px;"></div>
    `;

    const refreshBtn = container.querySelector('#btn-refresh-quality');
    refreshBtn?.addEventListener('click', () => renderQualityView(container));

    await loadQualityData(container);
}

async function loadQualityData(container: HTMLElement): Promise<void> {
    const loadingEl = container.querySelector('#quality-loading') as HTMLElement;
    const contentEl = container.querySelector('#quality-content') as HTMLElement;

    try {
        let reportData: any = null;
        let isVerified = false;

        // Tenta endpoint autenticado do admin primeiro
        try {
            const res = await adminAuth.apiFetch('/api/admin.php?action=quality');
            if (res.ok) {
                const data = await res.json();
                if (data.verified && data.results) {
                    reportData = data.results;
                    isVerified = true;
                }
            }
        } catch {}

        // Fallback para arquivo direto caso admin api falhe
        if (!reportData) {
            try {
                const directRes = await fetch('/test-results.json');
                if (directRes.ok) {
                    reportData = await directRes.json();
                    isVerified = true;
                }
            } catch {}
        }

        if (loadingEl) loadingEl.style.display = 'none';
        if (!contentEl) return;
        contentEl.style.display = 'block';

        if (!isVerified || !reportData) {
            contentEl.innerHTML = `
                <div class="kpi-grid">
                    <div class="kpi-card">
                        <div class="kpi-label">Status dos Testes</div>
                        <div class="kpi-value" style="color: var(--accent-yellow); font-size: 20px;">Não verificado</div>
                        <div class="kpi-subtext">Nenhum relatório de execução encontrado</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-label">Ação Necessária</div>
                        <div class="kpi-value" style="color: var(--accent-blue); font-size: 18px;">Executar npm test</div>
                        <div class="kpi-subtext">Gera public/test-results.json</div>
                    </div>
                </div>
                <div class="panel" style="margin-top: 20px;">
                    <div class="panel-header">
                        <div class="panel-title">⚠️ Relatório Pendente de Execução</div>
                        <span class="badge badge-warning">Não verificado</span>
                    </div>
                    <div class="panel-body">
                        <p style="color: var(--text-secondary); font-size: 14px;">
                            O Ninja Farm adota uma política de verdade técnica estrita: dados de testes não são simulados ou inventados.
                            Para visualizar métricas comprováveis, execute a suíte de testes no ambiente do servidor ou terminal de desenvolvimento:
                        </p>
                        <pre style="background: #0B0F19; padding: 12px; border-radius: 8px; color: #10B981; font-family: var(--font-mono); margin-top: 12px;">npm test</pre>
                    </div>
                </div>
            `;
            return;
        }

        const totalSuites = reportData.testResults?.length || reportData.numTotalTestSuites || 0;
        const totalTests = reportData.numTotalTests || 0;
        const passedTests = reportData.numPassedTests || 0;
        const failedTests = reportData.numFailedTests || 0;
        const startTime = reportData.startTime ? new Date(reportData.startTime).toLocaleString('pt-BR') : 'Recente';
        const isSuccess = reportData.success && failedTests === 0;

        contentEl.innerHTML = `
            <div class="kpi-grid">
                <div class="kpi-card">
                    <div class="kpi-label">Suítes de Testes Vitest</div>
                    <div class="kpi-value" style="color: ${isSuccess ? 'var(--accent-green)' : 'var(--accent-red)'};">${totalSuites} Suítes</div>
                    <div class="kpi-subtext">${isSuccess ? '100% dos arquivos executados' : `${failedTests} arquivos com falha`}</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Testes Automatizados</div>
                    <div class="kpi-value" style="color: var(--accent-blue);">${totalTests} Testes</div>
                    <div class="kpi-subtext">${passedTests} aprovados | ${failedTests} reprovados</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Última Execução Comprovada</div>
                    <div class="kpi-value" style="color: var(--accent-purple); font-size: 16px;">${startTime}</div>
                    <div class="kpi-subtext">Arquivo: public/test-results.json</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Integridade do Build</div>
                    <div class="kpi-value" style="color: ${isSuccess ? 'var(--accent-green)' : 'var(--accent-red)'}; font-size: 20px;">
                        ${isSuccess ? '✓ Validado' : '✕ Falhas Detectadas'}
                    </div>
                    <div class="kpi-subtext">Vitest v3 / TypeScript Estrito</div>
                </div>
            </div>

            <div class="panel" style="margin-top: 20px;">
                <div class="panel-header">
                    <div class="panel-title">🧪 Suítes Automatizadas Reais (Execução Aprovada)</div>
                    <span class="badge ${isSuccess ? 'badge-success' : 'badge-danger'}">${isSuccess ? 'Passing' : 'Failing'}</span>
                </div>
                <div class="admin-table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Arquivo de Teste</th>
                                <th>Testes na Suíte</th>
                                <th>Tempo</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(reportData.testResults || [])
                                .map((suite: any) => {
                                    const shortName = (suite.name || '')
                                        .replace(/^.*?Ninja_Farm_Project[\\/]/, '')
                                        .replace(/\\/g, '/');
                                    const suitePassed = suite.status === 'passed';
                                    const testCount = suite.assertionResults?.length || 0;
                                    const duration = Math.round(
                                        suite.endTime && suite.startTime ? suite.endTime - suite.startTime : 0
                                    );
                                    return `
                                    <tr>
                                        <td><code>${shortName}</code></td>
                                        <td><strong>${testCount}</strong> asserções</td>
                                        <td style="font-family: var(--font-mono); font-size: 12px;">${duration}ms</td>
                                        <td>
                                            <span class="badge ${suitePassed ? 'badge-success' : 'badge-danger'}">
                                                ${suitePassed ? `✓ ${testCount} passaram` : '✕ Falha'}
                                            </span>
                                        </td>
                                    </tr>
                                `;
                                })
                                .join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    } catch (e: any) {
        if (loadingEl) loadingEl.style.display = 'none';
        if (contentEl) {
            contentEl.style.display = 'block';
            contentEl.innerHTML = `<span style="color: var(--accent-red);">❌ Erro ao renderizar qualidade: ${e.message}</span>`;
        }
    }
}
