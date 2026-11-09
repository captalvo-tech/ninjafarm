/**
 * ============================================================================
 * NINJA FARM — CONTRATO OBRIGATÓRIO DO ROADMAP
 * ============================================================================
 * Visualização: Gemini AI & Assistente Consultivo (/admin/gemini)
 * ============================================================================
 */

export async function renderGeminiView(container: HTMLElement): Promise<void> {
    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h1 style="font-size: 24px; font-weight: 700;">Observabilidade Gemini AI & Droid Chat</h1>
                <p style="color: var(--text-secondary); font-size: 14px;">Monitoramento do assistente cognitivo, distribuição de modos e governança read-only.</p>
            </div>
            <button id="btn-refresh-gemini" class="btn btn-secondary">🔄 Atualizar</button>
        </div>

        <div class="kpi-grid" style="margin-top: 16px;">
            <div class="kpi-card">
                <div class="kpi-label">Modelo Padrão</div>
                <div class="kpi-value" style="font-size: 20px; color: var(--accent-blue);">Gemini 2.0 Flash</div>
                <div class="kpi-subtext">Google AI Studio</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Modo Duplo Operacional</div>
                <div class="kpi-value" style="font-size: 20px;">Inteligente / Robótico</div>
                <div class="kpi-subtext">Fallback automático sem chave</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Penalidade de Erro</div>
                <div class="kpi-value" style="color: var(--accent-amber);">30 Segundos</div>
                <div class="kpi-subtext">Bloqueio temporário disciplinar</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Segurança de Estado</div>
                <div class="kpi-value" style="color: var(--accent-green);">100% Read-Only</div>
                <div class="kpi-subtext">Zero mutação direta de save</div>
            </div>
        </div>

        <div class="panel" style="margin-top: 20px;">
            <div class="panel-header">
                <div class="panel-title">🧠 Arquitetura Cognitiva do Droid</div>
                <span class="badge badge-success">Auditado</span>
            </div>
            <div class="panel-body" style="display: flex; flex-direction: column; gap: 12px; font-size: 13px;">
                <div>
                    <strong>1. Estritamente Consultivo (Read-Only):</strong> O Gemini responde dúvidas do jogador sobre a fazenda, diagnostica energia e orienta próximos passos. Ele NUNCA executa comandos de mutação no inventário ou cria itens fictícios.
                </div>
                <div>
                    <strong>2. Modo Limitado / Robótico:</strong> Quando o jogador não possui chave de API ou a cota expira, o Droid disponibiliza 4 relatórios estruturados baseados no estado local (Produção, Energia, Próximos Passos e Diário de Eventos), com custo zero de API.
                </div>
                <div>
                    <strong>3. Sanitização de Tokens:</strong> Nenhuma chave de API de jogador é enviada para logs ou transmitida para terceiros. Chaves personalizadas são salvas de forma protegida.
                </div>
                <div>
                    <strong>4. Disciplina de Bloqueio de 30s:</strong> Se uma consulta livre falhar ou for rate-limited, o sistema aciona uma trava de 30 segundos com contagem regressiva visual, evitando spam e exaustão de requisições.
                </div>
            </div>
        </div>
    `;

    container.querySelector('#btn-refresh-gemini')?.addEventListener('click', () => renderGeminiView(container));
}
