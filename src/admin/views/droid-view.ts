/**
 * ============================================================================
 * NINJA FARM — CONTRATO OBRIGATÓRIO DO ROADMAP
 * ============================================================================
 * Visualização: Frota Droid & Diagnóstico AFK (/admin/droid)
 * ============================================================================
 */

import { adminAuth } from '../auth';

export async function renderDroidView(container: HTMLElement): Promise<void> {
    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h1 style="font-size: 24px; font-weight: 700;">Frota Droid & Monitoramento AFK</h1>
                <p style="color: var(--text-secondary); font-size: 14px;">Diagnóstico de operação do Droid Único, telemetria de bateria, agendador e reconciliação offline.</p>
            </div>
            <button id="btn-refresh-droid" class="btn btn-secondary">🔄 Atualizar Métricas</button>
        </div>

        <div id="droid-loading" style="padding: 40px; text-align: center; color: var(--text-muted);">
            Carregando dados da frota Droid...
        </div>

        <div id="droid-content" style="display: none; flex-direction: column; gap: 24px;">
            <div class="kpi-grid">
                <div class="kpi-card">
                    <div class="kpi-label">Unidades Droid Totais</div>
                    <div class="kpi-value" id="d-total">0</div>
                    <div class="kpi-subtext">1 Droid por propriedade</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Taxa de Utilização</div>
                    <div class="kpi-value" id="d-util" style="color: var(--accent-blue);">0%</div>
                    <div class="kpi-subtext">Droids trabalhando ativamente</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Droids em Recarga Solar</div>
                    <div class="kpi-value" id="d-recharging" style="color: var(--accent-amber);">0</div>
                    <div class="kpi-subtext">Estação solar fotovoltaica</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label">Bateria Crítica (&lt;15%)</div>
                    <div class="kpi-value" id="d-low" style="color: var(--accent-red);">0</div>
                    <div class="kpi-subtext">Retorno de emergência</div>
                </div>
            </div>

            <!-- Diretrizes do Sistema Droid -->
            <div class="panel">
                <div class="panel-header">
                    <div class="panel-title">🛡️ Regras Arquiteturais Não-Negociáveis do Droid</div>
                    <span class="badge badge-success">Em Conformidade</span>
                </div>
                <div class="panel-body" style="display: flex; flex-direction: column; gap: 12px; font-size: 13px;">
                    <div><strong>1. Unicidade Absoluta:</strong> É estritamente proibido instanciar mais de um Droid por propriedade (sem clones, sem compra de segundo robô).</div>
                    <div><strong>2. Autonomia Física:</strong> O Droid é o único executor físico de arar, plantar, colher, alimentar galinhas, recolher ovos e construir. O ninja humano apenas planeja.</div>
                    <div><strong>3. Reconciliação AFK Determinística:</strong> Quando o jogador sai do jogo, o tempo decorrido (Δt) é processado respeitando a velocidade do Droid, sua bateria e o ciclo de geração solar.</div>
                    <div><strong>4. Retorno de Emergência:</strong> Ao atingir 15% de carga, o Droid cancela temporariamente o deslocamento da tarefa atual e retorna à estação solar mais próxima.</div>
                </div>
            </div>
        </div>
    `;

    const loadData = async () => {
        const loading = container.querySelector('#droid-loading') as HTMLElement;
        const content = container.querySelector('#droid-content') as HTMLElement;

        try {
            const res = await adminAuth.apiFetch('/api/admin.php?action=dashboard');
            const data = await res.json();
            const d = data.droid || {};

            (container.querySelector('#d-total') as HTMLElement).textContent = d.totalDroids ?? 0;
            (container.querySelector('#d-util') as HTMLElement).textContent = `${d.operationalUtilization ?? 0}%`;
            (container.querySelector('#d-recharging') as HTMLElement).textContent = d.recharging ?? 0;
            (container.querySelector('#d-low') as HTMLElement).textContent = d.lowBattery ?? 0;

            loading.style.display = 'none';
            content.style.display = 'flex';
        } catch (e: any) {
            loading.innerHTML = `<span style="color: var(--accent-red);">Erro: ${e.message}</span>`;
        }
    };

    container.querySelector('#btn-refresh-droid')?.addEventListener('click', loadData);
    await loadData();
}
