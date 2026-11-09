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
 * Ninja Farm - Gemini AI Read-Only Service
 * Manages conversational queries, strict read-only tool contexts, 30s error lockout, and robot reports.
 */

import type { ResourceInventory, CropState } from '../core/types';

export interface FarmAIContext {
    resources: ResourceInventory;
    solarGenerationRate: number;
    farmStoredEnergy: number;
    farmStoredWater: number;
    droidBattery: number;
    droidState: string;
    crops: CropState[];
    buildingsCount: number;
    queuedTasksCount: number;
    activeTaskTitle?: string;
    ninjaRankTitle?: string;
    recentEvents?: { timestamp: number; title: string; description: string }[];
}

export class GeminiService {
    private apiKey = '';
    private maskedKey = '';
    private mode: 'smart' | 'limited' = 'limited';
    private lockoutUntil = 0;

    constructor() {
        if (typeof localStorage !== 'undefined') {
            this.apiKey =
                localStorage.getItem('ninja_gemini_api_key') || localStorage.getItem('ninja_gemini_key') || '';
            const isConfigured = localStorage.getItem('ninja_gemini_configured') === 'true';
            this.maskedKey = localStorage.getItem('ninja_gemini_masked') || '';
            this.mode = this.apiKey || isConfigured ? 'smart' : 'limited';
        }
    }

    public getMode(): 'smart' | 'limited' {
        return this.mode;
    }

    public setMode(mode: 'smart' | 'limited'): void {
        this.mode = mode;
    }

    public getApiKey(): string {
        return this.apiKey;
    }

    public getMaskedKey(): string {
        return this.maskedKey;
    }

    public setApiKey(key: string): void {
        this.apiKey = key.trim();
        if (typeof localStorage !== 'undefined') {
            if (this.apiKey) {
                localStorage.setItem('ninja_gemini_api_key', this.apiKey);
                localStorage.setItem('ninja_gemini_key', this.apiKey);
                this.mode = 'smart';
            } else {
                localStorage.removeItem('ninja_gemini_api_key');
                localStorage.removeItem('ninja_gemini_key');
                localStorage.removeItem('ninja_gemini_configured');
                localStorage.removeItem('ninja_gemini_masked');
                this.maskedKey = '';
                this.mode = 'limited';
            }
        }
    }

    /**
     * Salva a chave do Gemini de forma segura e criptografada no servidor (AES-256-CBC).
     * Nunca armazena o texto plano no localStorage em produção.
     */
    public async saveKeyToServer(key: string): Promise<{ success: boolean; maskedKey?: string; error?: string }> {
        const trimmed = key.trim();
        if (!trimmed || trimmed.length < 15) {
            return { success: false, error: 'Chave Gemini inválida ou curta demais.' };
        }
        try {
            const res = await fetch('/api/ai.php?action=set_key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey: trimmed })
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.success) {
                this.apiKey = trimmed;
                this.maskedKey = data.maskedKey || trimmed.slice(0, 6) + '...' + trimmed.slice(-4);
                this.mode = 'smart';
                if (typeof localStorage !== 'undefined') {
                    // Remove texto plano de localStorage
                    localStorage.removeItem('ninja_gemini_api_key');
                    localStorage.removeItem('ninja_gemini_key');
                    localStorage.setItem('ninja_gemini_configured', 'true');
                    localStorage.setItem('ninja_gemini_masked', this.maskedKey);
                }
                return { success: true, maskedKey: this.maskedKey };
            }
            return { success: false, error: data.error || 'Erro ao salvar chave no servidor.' };
        } catch (_err) {
            return { success: false, error: 'Falha de rede ao conectar com servidor.' };
        }
    }

    /**
     * Remove a chave pessoal criptografada do servidor e retorna ao Modo Limitado.
     */
    public async deleteKeyFromServer(): Promise<{ success: boolean; error?: string }> {
        try {
            const res = await fetch('/api/ai.php?action=delete_key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json().catch(() => ({}));
            this.apiKey = '';
            this.maskedKey = '';
            this.mode = 'limited';
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem('ninja_gemini_api_key');
                localStorage.removeItem('ninja_gemini_key');
                localStorage.removeItem('ninja_gemini_configured');
                localStorage.removeItem('ninja_gemini_masked');
            }
            return { success: !!data?.success };
        } catch (_err) {
            return { success: false, error: 'Falha ao desconectar chave no servidor.' };
        }
    }

    /**
     * Sincroniza o status da chave criptografada do usuário autenticado no servidor.
     */
    public async checkServerKeyStatus(): Promise<{ success: boolean; hasCustomKey: boolean; maskedKey?: string }> {
        try {
            const res = await fetch('/api/ai.php?action=get_key_status');
            if (res.ok) {
                const data = await res.json();
                if (data.hasCustomKey) {
                    this.mode = 'smart';
                    this.maskedKey = data.maskedKey || '';
                    if (typeof localStorage !== 'undefined') {
                        localStorage.setItem('ninja_gemini_configured', 'true');
                        if (this.maskedKey) localStorage.setItem('ninja_gemini_masked', this.maskedKey);
                    }
                    return { success: true, hasCustomKey: true, maskedKey: this.maskedKey };
                } else {
                    if (typeof localStorage !== 'undefined') {
                        localStorage.removeItem('ninja_gemini_configured');
                        localStorage.removeItem('ninja_gemini_masked');
                    }
                }
            }
        } catch {
            // Em caso de falha de rede mantém o estado atual
        }
        return { success: false, hasCustomKey: false };
    }

    public getRemainingLockoutSeconds(): number {
        const remaining = Math.ceil((this.lockoutUntil - Date.now()) / 1000);
        return Math.max(0, remaining);
    }

    public isLockedOut(): boolean {
        return Date.now() < this.lockoutUntil;
    }

    /**
     * Envia uma dúvida do jogador ao Gemini com contexto estritamente de leitura da fazenda.
     */
    public async askQuestion(
        question: string,
        context: FarmAIContext
    ): Promise<{ success: boolean; reply?: string; error?: string; remainingSeconds?: number }> {
        // Checagem de intervalo obrigatório de 30 segundos após erro
        if (this.isLockedOut()) {
            return {
                success: false,
                error: 'Intervalo de segurança ativo. Aguarde 30 segundos.',
                remainingSeconds: this.getRemainingLockoutSeconds()
            };
        }

        if (this.mode === 'limited' && !this.apiKey) {
            return {
                success: false,
                error: 'Modo Limitado ativo. Utilize os relatórios diagnósticos pré-programados.'
            };
        }

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };
            if (this.apiKey) {
                headers['X-Gemini-Key'] = this.apiKey;
            }

            const res = await fetch('/api/ai.php?action=query', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    question,
                    context
                })
            });

            if (!res.ok) {
                // Penalidade de 30 segundos por erro
                this.lockoutUntil = Date.now() + 30000;
                const errData = await res.json().catch(() => ({}));
                return {
                    success: false,
                    error: errData.error || 'Erro na comunicação com a IA. Bloqueio de 30s ativado.',
                    remainingSeconds: 30
                };
            }

            const data = await res.json();
            return {
                success: true,
                reply: data.reply
            };
        } catch (_err: unknown) {
            // Penalidade de 30 segundos por falha de rede
            this.lockoutUntil = Date.now() + 30000;
            return {
                success: false,
                error: 'Falha de conexão com o servidor. Bloqueio de 30s ativado.',
                remainingSeconds: 30
            };
        }
    }

    // ==========================================
    // RELATÓRIOS DO MODO LIMITADO / ROBÓTICO
    // Sem custos de IA, 100% determinísticos
    // ==========================================

    public generateProductionReport(resources: ResourceInventory, crops: CropState[]): string {
        const readyCount = crops.filter((c) => c.stage === 'ready').length;
        const growingCount = crops.filter((c) => c.stage === 'growing' || c.stage === 'planted').length;

        return (
            `📊 **Relatório de Produção e Estoque**\n\n` +
            `• 🪵 Madeira: ${Math.floor(resources.wood)} unidades\n` +
            `• ⚙️ Metal: ${Math.floor(resources.metal)} unidades\n` +
            `• 🔩 Peças: ${Math.floor(resources.parts)} componentes\n` +
            `• 🍙 Alimento: ${Math.floor(resources.food)} rações\n` +
            `• 💧 Água: ${Math.floor(resources.water)} L\n` +
            `• ⚡ Energia: ${Math.floor(resources.energy)} W\n\n` +
            `🌾 **Lavoura Shinobi:** ${crops.length} canteiros ativos (${readyCount} maduros, ${growingCount} em crescimento).`
        );
    }

    public generateEnergyReport(
        solarGen: number,
        storedEnergy: number,
        droidBattery: number,
        droidState: string
    ): string {
        return (
            `⚡ **Diagnóstico de Energia & Bateria**\n\n` +
            `• ☀️ Geração Solar Atual: +${solarGen.toFixed(1)} W\n` +
            `• 🔋 Armazenamento na Base: ${Math.floor(storedEnergy)} W disponíveis\n` +
            `• 🤖 Bateria do Droid: ${Math.round(droidBattery)}% (Estado: ${droidState})\n\n` +
            `*Dica:* Quando a bateria do Droid atinge < 15%, ele retorna automaticamente à estação de recarga próxima ao painel solar.`
        );
    }

    public generateAdviceReport(
        resources: ResourceInventory,
        crops: CropState[],
        tasksCount: number,
        droidBattery: number
    ): string {
        const suggestions: string[] = [];

        if (resources.water < 15) {
            suggestions.push('💧 **Nível Hídrico Baixo:** Instale bombas de água ou proteja os reservatórios.');
        }

        const thirstyCrops = crops.filter((c) => !c.waterSupplied && c.stage !== 'ready');
        if (thirstyCrops.length > 0) {
            suggestions.push(
                `🌾 **Canteiros Sedentos:** Há ${thirstyCrops.length} canteiro(s) sem irrigação. Agende a rega para acelerar o crescimento.`
            );
        }

        const readyCrops = crops.filter((c) => c.stage === 'ready');
        if (readyCrops.length > 0) {
            suggestions.push(
                `🧺 **Safra Pronta:** ${readyCrops.length} canteiro(s) maduro(s). Agende a colheita para alimentar a base.`
            );
        }

        if (droidBattery < 20) {
            suggestions.push(
                '🪫 **Droid em Baixa Potência:** O Droid precisa de recarga solar antes de assumir construções pesadas.'
            );
        }

        if (tasksCount === 0) {
            suggestions.push(
                '📋 **Agenda Vazia:** Posicione novos blueprints na grade ou prepare o solo para semeadura.'
            );
        }

        if (suggestions.length === 0) {
            suggestions.push(
                '✨ **Propriedade Equilibrada:** A fazenda opera em harmonia. Continue explorando e cumprindo provas shinobi!'
            );
        }

        return `💡 **Sugestões Estratégicas Shinobi**\n\n` + suggestions.join('\n\n');
    }

    public generateEventsReport(events: { timestamp: number; title: string; description: string }[]): string {
        if (!events || events.length === 0) {
            return `📜 **Diário de Eventos Recentes**\n\nNenhum evento registrado ainda nesta fazenda.`;
        }

        const lines = events
            .slice(-5)
            .reverse()
            .map((e) => {
                const timeStr = new Date(e.timestamp).toLocaleTimeString();
                return `• [${timeStr}] **${e.title}:** ${e.description}`;
            });

        return `📜 **Diário de Eventos Recentes**\n\n` + lines.join('\n');
    }
}
