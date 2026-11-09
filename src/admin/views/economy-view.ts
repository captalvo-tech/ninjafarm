/**
 * ============================================================================
 * NINJA FARM — CONTRATO OBRIGATÓRIO DO ROADMAP
 * ============================================================================
 * Visualização: Economia, Escassez e Simulador Temporal (/admin/economia)
 * ============================================================================
 */

import { adminAuth } from '../auth';
import { TimeSimulator, type TimeSimulationReport } from '../../simulation/time-simulator';

export async function renderEconomyView(container: HTMLElement): Promise<void> {
    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h1 style="font-size: 24px; font-weight: 700;">Economia da Fazenda & Simulador de Equilíbrio</h1>
                <p style="color: var(--text-secondary); font-size: 14px;">Análise da massa monetária/recursos reais das fazendas e projeções temporais de 1h a 365 dias.</p>
            </div>
            <button id="btn-refresh-economy" class="btn btn-secondary">🔄 Atualizar Métricas Reais</button>
        </div>

        <div id="economy-loading" style="padding: 40px; text-align: center; color: var(--text-muted);">
            Consultando registros econômicos agregados...
        </div>

        <div id="economy-content" style="display: none; flex-direction: column; gap: 24px;">
            <!-- Linha 1: Estoque Agregado de Recursos em Todas as Fazendas -->
            <div class="panel">
                <div class="panel-header">
                    <div class="panel-title">📦 Estoque Agregado de Recursos (Total em Todas as Fazendas)</div>
                    <span class="badge badge-info" id="farms-count-badge">0 Fazendas Analisadas</span>
                </div>
                <div class="panel-body">
                    <div class="kpi-grid" id="resources-grid"></div>
                </div>
            </div>

            <!-- Linha 2: Diagnóstico de Escassez e Gargalos -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
                <div class="panel">
                    <div class="panel-header">
                        <div class="panel-title">🚨 Termômetro de Escassez Crítica</div>
                    </div>
                    <div class="panel-body">
                        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">
                            Número de fazendas onde o recurso está abaixo de <strong>5.0 unidades</strong>:
                        </p>
                        <div id="scarcity-list" style="display: flex; flex-direction: column; gap: 8px;"></div>
                    </div>
                </div>

                <div class="panel">
                    <div class="panel-header">
                        <div class="panel-title">☀️ Infraestrutura Energética Instalada</div>
                    </div>
                    <div class="panel-body" style="display: flex; flex-direction: column; gap: 14px;">
                        <div>
                            <div class="kpi-label">Potência Solar Fotovoltaica de Pico</div>
                            <div id="solar-power-val" style="font-size: 24px; font-weight: 700; color: var(--accent-amber);">0 W</div>
                        </div>
                        <div style="font-size: 13px; color: var(--text-secondary);">
                            Cada painel solar padrão gera até 18 W de pico ao meio-dia e 0 W durante a noite. Baterias são cruciais para manter a operação noturna dos postes e recargas do Droid.
                        </div>
                    </div>
                </div>
            </div>

            <!-- Linha 3: SIMULADOR TEMPORAL ACELERADO (SANDBOX) -->
            <div class="panel" style="border: 1px solid var(--accent-blue);">
                <div class="panel-header" style="background: rgba(56, 189, 248, 0.1);">
                    <div class="panel-title" style="color: var(--accent-blue);">
                        ⏱️ Simulador Administrativo de Tempo (Sandbox de Equilíbrio)
                    </div>
                    <span class="badge badge-info">Ambiente 100% Isolado</span>
                </div>
                <div class="panel-body" style="display: flex; flex-direction: column; gap: 18px;">
                    <p style="font-size: 13px; color: var(--text-secondary);">
                        Execute simulações determinísticas instantâneas de até 365 dias para verificar se a economia da fazenda colapsa, acumula recursos em excesso ou sofre paradas por falta de energia/água.
                    </p>

                    <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
                        <div>
                            <label class="form-label">Horizonte de Simulação:</label>
                            <select id="sim-horizon-select" class="form-input" style="width: 180px;">
                                <option value="1">1 Hora</option>
                                <option value="12">12 Horas</option>
                                <option value="24" selected>24 Horas (1 dia)</option>
                                <option value="168">7 Dias (1 semana)</option>
                                <option value="720">30 Dias (1 mês)</option>
                                <option value="8760">365 Dias (1 ano)</option>
                            </select>
                        </div>

                        <div>
                            <label class="form-label">Perfil de Jogador:</label>
                            <select id="sim-profile-select" class="form-input" style="width: 160px;">
                                <option value="casual">Casual (baixa carga)</option>
                                <option value="regular" selected>Regular (equilibrado)</option>
                                <option value="intensive">Intensivo (produção contínua)</option>
                            </select>
                        </div>

                        <div style="margin-top: 22px;">
                            <button id="btn-run-simulation" class="btn btn-primary">
                                ▶️ Executar Simulação
                            </button>
                        </div>
                    </div>

                    <!-- Resultado da Simulação -->
                    <div id="sim-result-box" style="display: none; background: var(--bg-page); padding: 18px; border-radius: 8px; border: 1px solid var(--border-color); flex-direction: column; gap: 16px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <h3 style="font-size: 16px; font-weight: 600;" id="sim-result-title">Resultado da Simulação</h3>
                            <span class="badge badge-success">Determinismo Comprovado</span>
                        </div>

                        <div class="kpi-grid" id="sim-kpi-grid"></div>

                        <div>
                            <div class="kpi-label">Diagnóstico de Gargalos Identificados</div>
                            <div id="sim-bottlenecks-list" style="margin-top: 6px; font-size: 13px;"></div>
                        </div>

                        <div>
                            <div class="kpi-label">Estoque Final Simulado no Inventário</div>
                            <div id="sim-final-resources" style="margin-top: 6px; display: flex; gap: 12px; flex-wrap: wrap;"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const loadEconomyData = async () => {
        const loading = container.querySelector('#economy-loading') as HTMLElement;
        const content = container.querySelector('#economy-content') as HTMLElement;

        try {
            const res = await adminAuth.apiFetch('/api/admin.php?action=economy');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            loading.style.display = 'none';
            content.style.display = 'flex';

            renderEconomyMetrics(container, data);
        } catch (e: any) {
            loading.innerHTML = `<span style="color: var(--accent-red);">Erro ao carregar dados econômicos: ${e.message}</span>`;
        }
    };

    container.querySelector('#btn-refresh-economy')?.addEventListener('click', loadEconomyData);

    // Setup interactive TimeSimulator
    container.querySelector('#btn-run-simulation')?.addEventListener('click', () => {
        const horizon = parseInt((container.querySelector('#sim-horizon-select') as HTMLSelectElement).value, 10);
        const profile = (container.querySelector('#sim-profile-select') as HTMLSelectElement).value as any;

        const report: TimeSimulationReport = TimeSimulator.runSimulation({
            durationHours: horizon,
            profile,
            scheduledTasksCount: horizon > 24 ? 40 : 15
        });

        renderSimulationReport(container, report, horizon);
    });

    await loadEconomyData();
}

function renderEconomyMetrics(container: HTMLElement, data: any): void {
    const farmsCountBadge = container.querySelector('#farms-count-badge') as HTMLElement;
    if (farmsCountBadge) {
        farmsCountBadge.textContent = `${data.solarInfrastructure?.farmsCount || 0} Fazendas Analisadas`;
    }

    const grid = container.querySelector('#resources-grid') as HTMLElement;
    const agg = data.aggregateResources || {};

    const resourceIcons: Record<string, { icon: string; name: string; unit: string }> = {
        wood: { icon: '🪵', name: 'Madeira', unit: 'unidades' },
        metal: { icon: '🔩', name: 'Metal', unit: 'unidades' },
        parts: { icon: '⚙️', name: 'Peças & Chips', unit: 'unidades' },
        food: { icon: '🍙', name: 'Alimentos / Arroz', unit: 'kg' },
        water: { icon: '💧', name: 'Água Potável', unit: 'L' },
        energy: { icon: '⚡', name: 'Energia Armazenada', unit: 'Wh' }
    };

    grid.innerHTML = Object.entries(resourceIcons).map(([key, info]) => {
        const val = Math.round(agg[key] || 0);
        return `
            <div class="kpi-card">
                <div class="kpi-label">${info.icon} ${info.name}</div>
                <div class="kpi-value">${val.toLocaleString('pt-BR')}</div>
                <div class="kpi-subtext">${info.unit}</div>
            </div>
        `;
    }).join('');

    // Scarcity list
    const scarcityList = container.querySelector('#scarcity-list') as HTMLElement;
    const scarcity = data.scarcityFarmsCount || {};
    scarcityList.innerHTML = Object.entries(resourceIcons).map(([key, info]) => {
        const count = scarcity[key] || 0;
        const color = count > 0 ? 'var(--accent-amber)' : 'var(--text-muted)';
        return `
            <div style="display: flex; justify-content: space-between; font-size: 13px;">
                <span>${info.icon} ${info.name}:</span>
                <strong style="color: ${color};">${count} fazendas</strong>
            </div>
        `;
    }).join('');

    // Solar Power
    const solarVal = container.querySelector('#solar-power-val') as HTMLElement;
    if (solarVal) {
        solarVal.textContent = data.solarInfrastructure?.solarPanelsActiveCapacity || '0 W';
    }
}

function renderSimulationReport(container: HTMLElement, report: TimeSimulationReport, hours: number): void {
    const box = container.querySelector('#sim-result-box') as HTMLElement;
    const title = container.querySelector('#sim-result-title') as HTMLElement;
    const kpiGrid = container.querySelector('#sim-kpi-grid') as HTMLElement;
    const bottlenecksEl = container.querySelector('#sim-bottlenecks-list') as HTMLElement;
    const finalResEl = container.querySelector('#sim-final-resources') as HTMLElement;

    box.style.display = 'flex';
    title.textContent = `Projeção Determinística: ${hours} horas (${report.simulatedDays.toFixed(1)} dias de jogo)`;

    kpiGrid.innerHTML = `
        <div class="kpi-card">
            <div class="kpi-label">Tarefas Físicas Concluídas</div>
            <div class="kpi-value" style="color: var(--accent-green);">${report.tasksCompleted}</div>
            <div class="kpi-subtext">Pelo Droid operacional</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Culturas Colhidas</div>
            <div class="kpi-value" style="color: var(--accent-blue);">${report.cropsMatured}</div>
            <div class="kpi-subtext">Alimentos gerados</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Geração Solar</div>
            <div class="kpi-value">${Math.round(report.totalSolarEnergyGenerated)} Wh</div>
            <div class="kpi-subtext">Consumido: ${Math.round(report.totalEnergyConsumed)} Wh</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Água Consumida</div>
            <div class="kpi-value">${Math.round(report.totalWaterConsumed)} L</div>
            <div class="kpi-subtext">Irrigação & Sede</div>
        </div>
    `;

    if (report.bottlenecks.length === 0) {
        bottlenecksEl.innerHTML = `<span style="color: var(--accent-green);">✅ Nenhum gargalo crítico detectado. A fazenda operou em equilíbrio estável.</span>`;
    } else {
        bottlenecksEl.innerHTML = report.bottlenecks.map(b => `
            <div style="color: var(--accent-amber); padding: 4px 0;">⚠️ ${escapeHtml(b)}</div>
        `).join('');
    }

    finalResEl.innerHTML = Object.entries(report.finalResources).map(([k, v]) => `
        <span class="badge badge-muted">${k}: <strong>${Math.round(v)}</strong></span>
    `).join('');
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
