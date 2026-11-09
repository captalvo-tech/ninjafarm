/**
 * ============================================================================
 * NINJA FARM — CONTRATO OBRIGATÓRIO DO ROADMAP
 * ============================================================================
 * Visualização: Roadmap Vivo & Memória Técnica Permanente (/admin/roadmap)
 * ============================================================================
 */

import { adminAuth } from '../auth';

interface FeatureItem {
    id: string;
    name: string;
    description: string;
    category: string;
    phase: number;
    status: 'PLANEJADO' | 'EM_DESENVOLVIMENTO' | 'IMPLEMENTADO' | 'VALIDADO' | 'DEPRECIADO' | 'REMOVIDO';
    addedAt: string;
    implementedAt?: string;
    validatedAt?: string;
    modules?: string[];
    tests?: string[];
    removalReason?: string;
    removalCommit?: string;
}

interface HistoryItem {
    id: string;
    featureId: string;
    action: 'CRIADO' | 'ATUALIZADO' | 'VALIDADO' | 'REMOVIDO';
    timestamp: number;
    date: string;
    commit: string;
    author: string;
    details: string;
}

export async function renderRoadmapView(container: HTMLElement): Promise<void> {
    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h1 style="font-size: 24px; font-weight: 700;">Roadmap Vivo & Memória Técnica</h1>
                <p style="color: var(--text-secondary); font-size: 14px;">Governança permanente de código. Funcionalidades nunca são apagadas do registro histórico.</p>
            </div>
            <button id="btn-refresh-roadmap" class="btn btn-secondary">🔄 Recarregar Roadmap</button>
        </div>

        <div id="roadmap-loading" style="padding: 40px; text-align: center; color: var(--text-muted);">
            Carregando governança permanente do projeto...
        </div>

        <div id="roadmap-content" style="display: none; flex-direction: column; gap: 24px;">
            <!-- Linha 1: Resumo do Catálogo -->
            <div class="kpi-grid" id="roadmap-kpis"></div>

            <!-- Linha 2: Filtros e Busca -->
            <div class="panel">
                <div class="panel-body" style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 240px;">
                        <input type="text" id="roadmap-search" class="form-input" placeholder="Buscar funcionalidade por nome, ID ou módulo..." style="width: 100%;">
                    </div>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;" id="status-filters">
                        <button class="btn btn-secondary roadmap-filter-btn active" data-status="ALL">Todas</button>
                        <button class="btn btn-secondary roadmap-filter-btn" data-status="VALIDADO">Validadas</button>
                        <button class="btn btn-secondary roadmap-filter-btn" data-status="IMPLEMENTADO">Implementadas</button>
                        <button class="btn btn-secondary roadmap-filter-btn" data-status="REMOVIDO">Removidas</button>
                    </div>
                </div>
            </div>

            <!-- Linha 3: Lista Estruturada de Funcionalidades -->
            <div class="panel">
                <div class="panel-header">
                    <div class="panel-title">📜 Catálogo Estruturado de Funcionalidades</div>
                    <span class="badge badge-info" id="features-counter">0 listadas</span>
                </div>
                <div class="admin-table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Status</th>
                                <th>Identificador (ID)</th>
                                <th>Nome & Descrição</th>
                                <th>Fase</th>
                                <th>Módulos de Código</th>
                                <th>Testes Automatizados</th>
                            </tr>
                        </thead>
                        <tbody id="features-table-body"></tbody>
                    </table>
                </div>
            </div>

            <!-- Linha 4: Histórico Permanente Append-Only -->
            <div class="panel">
                <div class="panel-header">
                    <div class="panel-title">⏳ Histórico Cronológico de Auditoria (Append-Only)</div>
                    <span class="badge badge-muted">history.jsonl</span>
                </div>
                <div class="panel-body" style="display: flex; flex-direction: column; gap: 12px; max-height: 400px; overflow-y: auto;" id="history-feed"></div>
            </div>
        </div>
    `;

    let allFeatures: FeatureItem[] = [];
    let allHistory: HistoryItem[] = [];
    let activeFilter = 'ALL';
    let searchQuery = '';

    const loadRoadmap = async () => {
        const loading = container.querySelector('#roadmap-loading') as HTMLElement;
        const content = container.querySelector('#roadmap-content') as HTMLElement;

        try {
            const res = await adminAuth.apiFetch('/api/admin.php?action=roadmap');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            allFeatures = data.features || [];
            allHistory = data.history || [];

            loading.style.display = 'none';
            content.style.display = 'flex';

            renderKpis(container, allFeatures);
            renderFeaturesTable(container, allFeatures, activeFilter, searchQuery);
            renderHistoryFeed(container, allHistory);
        } catch (e: any) {
            loading.innerHTML = `<span style="color: var(--accent-red);">Falha ao carregar roadmap: ${e.message}</span>`;
        }
    };

    container.querySelector('#btn-refresh-roadmap')?.addEventListener('click', loadRoadmap);

    // Search wire
    container.querySelector('#roadmap-search')?.addEventListener('input', (e) => {
        searchQuery = (e.target as HTMLInputElement).value.toLowerCase();
        renderFeaturesTable(container, allFeatures, activeFilter, searchQuery);
    });

    // Filter wire
    container.querySelectorAll('.roadmap-filter-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('.roadmap-filter-btn').forEach((b) => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.getAttribute('data-status') || 'ALL';
            renderFeaturesTable(container, allFeatures, activeFilter, searchQuery);
        });
    });

    await loadRoadmap();
}

function renderKpis(container: HTMLElement, features: FeatureItem[]): void {
    const kpiGrid = container.querySelector('#roadmap-kpis') as HTMLElement;

    const validatedCount = features.filter((f) => f.status === 'VALIDADO').length;
    const implementedCount = features.filter((f) => f.status === 'IMPLEMENTADO').length;
    const removedCount = features.filter((f) => f.status === 'REMOVIDO').length;

    kpiGrid.innerHTML = `
        <div class="kpi-card">
            <div class="kpi-label">Total de Funcionalidades</div>
            <div class="kpi-value">${features.length}</div>
            <div class="kpi-subtext">Catálogo governado</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Validadas com Testes</div>
            <div class="kpi-value" style="color: var(--accent-green);">${validatedCount}</div>
            <div class="kpi-subtext">Prontas para produção</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Implementadas</div>
            <div class="kpi-value" style="color: var(--accent-blue);">${implementedCount}</div>
            <div class="kpi-subtext">Aguardando validação final</div>
        </div>
        <div class="kpi-card">
            <div class="kpi-label">Descontinuadas / Removidas</div>
            <div class="kpi-value" style="color: var(--accent-red);">${removedCount}</div>
            <div class="kpi-subtext">Preservadas no histórico</div>
        </div>
    `;
}

function renderFeaturesTable(
    container: HTMLElement,
    features: FeatureItem[],
    statusFilter: string,
    search: string
): void {
    const tbody = container.querySelector('#features-table-body') as HTMLElement;
    const counter = container.querySelector('#features-counter') as HTMLElement;

    const filtered = features.filter((f) => {
        if (statusFilter !== 'ALL' && f.status !== statusFilter) return false;
        if (search) {
            const str = `${f.id} ${f.name} ${f.description} ${(f.modules || []).join(' ')}`.toLowerCase();
            if (!str.includes(search)) return false;
        }
        return true;
    });

    counter.textContent = `${filtered.length} listadas (${features.length} total)`;

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">Nenhuma funcionalidade atende aos filtros atuais.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered
        .map((f) => {
            let badgeClass = 'badge-info';
            if (f.status === 'VALIDADO') badgeClass = 'badge-success';
            else if (f.status === 'REMOVIDO') badgeClass = 'badge-removed';
            else if (f.status === 'EM_DESENVOLVIMENTO') badgeClass = 'badge-warning';

            return `
            <tr>
                <td><span class="badge ${badgeClass}">${f.status}</span></td>
                <td><code>${escapeHtml(f.id)}</code></td>
                <td>
                    <div style="font-weight: 600;">${escapeHtml(f.name)}</div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">${escapeHtml(f.description)}</div>
                    ${
                        f.status === 'REMOVIDO'
                            ? `
                        <div style="margin-top: 6px; padding: 6px 10px; background: rgba(239, 68, 68, 0.1); border-left: 2px solid var(--accent-red); font-size: 11px; color: #fca5a5;">
                            <strong>Motivo da Remoção:</strong> ${escapeHtml(f.removalReason || '')} (Commit: <code>${f.removalCommit}</code>)
                        </div>
                    `
                            : ''
                    }
                </td>
                <td>Fase ${f.phase}</td>
                <td>
                    ${
                        f.modules && f.modules.length > 0
                            ? f.modules
                                  .map(
                                      (m) => `
                        <div style="font-family: var(--font-mono); font-size: 11px; color: var(--accent-blue);">${escapeHtml(m)}</div>
                    `
                                  )
                                  .join('')
                            : '<span style="color: var(--text-muted); font-size: 11px;">Nenhum</span>'
                    }
                </td>
                <td>
                    ${
                        f.tests && f.tests.length > 0
                            ? f.tests
                                  .map(
                                      (t) => `
                        <div style="font-family: var(--font-mono); font-size: 11px; color: var(--accent-green);">✓ ${escapeHtml(t)}</div>
                    `
                                  )
                                  .join('')
                            : '<span style="color: var(--text-muted); font-size: 11px;">-</span>'
                    }
                </td>
            </tr>
        `;
        })
        .join('');
}

function renderHistoryFeed(container: HTMLElement, history: HistoryItem[]): void {
    const feed = container.querySelector('#history-feed') as HTMLElement;
    if (history.length === 0) {
        feed.innerHTML = `<div style="color: var(--text-muted); text-align: center; padding: 20px;">Nenhum evento histórico registrado.</div>`;
        return;
    }

    feed.innerHTML = history
        .map((h) => {
            const actionBadge =
                h.action === 'CRIADO'
                    ? 'badge-info'
                    : h.action === 'VALIDADO'
                      ? 'badge-success'
                      : h.action === 'REMOVIDO'
                        ? 'badge-danger'
                        : 'badge-warning';

            return `
            <div style="display: flex; gap: 14px; padding: 10px; background: var(--bg-page); border-radius: 6px; border: 1px solid var(--border-color); align-items: flex-start;">
                <span class="badge ${actionBadge}" style="margin-top: 2px;">${h.action}</span>
                <div style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <strong><code>${escapeHtml(h.featureId)}</code></strong>
                        <span style="font-size: 11px; color: var(--text-muted);">${escapeHtml(h.date || '')}</span>
                    </div>
                    <div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">${escapeHtml(h.details)}</div>
                    <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">
                        Autor: <strong>${escapeHtml(h.author)}</strong> | Commit: <code>${escapeHtml(h.commit)}</code>
                    </div>
                </div>
            </div>
        `;
        })
        .join('');
}

function escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
