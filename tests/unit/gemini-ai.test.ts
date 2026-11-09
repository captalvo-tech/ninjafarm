import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GeminiService, type FarmAIContext } from '../../src/ai/gemini-service';

describe('Fase E & F: Gemini AI Read-Only & Modo Limitado', () => {
    let gemini: GeminiService;
    let mockContext: FarmAIContext;

    beforeEach(() => {
        const mockStore = new Map<string, string>();
        global.localStorage = {
            getItem: (key: string) => mockStore.get(key) || null,
            setItem: (key: string, val: string) => mockStore.set(key, val),
            removeItem: (key: string) => mockStore.delete(key),
            clear: () => mockStore.clear(),
            key: () => null,
            length: 0
        } as any;

        gemini = new GeminiService();

        mockContext = {
            resources: { wood: 50, metal: 30, parts: 10, food: 40, water: 25, energy: 60 },
            solarGenerationRate: 4.5,
            farmStoredEnergy: 120,
            farmStoredWater: 80,
            droidBattery: 85,
            droidState: 'idle',
            crops: [
                {
                    instanceId: 'c1',
                    buildingInstanceId: 'b1',
                    cropType: 'rice',
                    stage: 'ready',
                    growthProgress: 1.0,
                    waterSupplied: true,
                    plantedAt: Date.now() - 60000,
                    lastUpdated: Date.now()
                },
                {
                    instanceId: 'c2',
                    buildingInstanceId: 'b2',
                    cropType: 'vegetable',
                    stage: 'growing',
                    growthProgress: 0.5,
                    waterSupplied: false,
                    plantedAt: Date.now() - 30000,
                    lastUpdated: Date.now()
                }
            ],
            buildingsCount: 6,
            queuedTasksCount: 1,
            activeTaskTitle: 'Construir Galinheiro',
            ninjaRankTitle: 'Genin da Terra'
        };
    });

    it('1. Inicia em Modo Limitado por padrão quando nenhuma chave é fornecida', () => {
        expect(gemini.getMode()).toBe('limited');
        expect(gemini.getApiKey()).toBe('');
    });

    it('2. Bloqueia perguntas livres no Modo Limitado sem chamar a API', async () => {
        const res = await gemini.askQuestion('Como plantar arroz?', mockContext);
        expect(res.success).toBe(false);
        expect(res.error).toContain('Modo Limitado ativo');
    });

    it('3. Gera relatório de produção completo e formatado sem dependência de IA', () => {
        const report = gemini.generateProductionReport(mockContext.resources, mockContext.crops);
        expect(report).toContain('Relatório de Produção e Estoque');
        expect(report).toContain('Madeira: 50');
        expect(report).toContain('Alimento: 40');
        expect(report).toContain('2 canteiros ativos');
        expect(report).toContain('1 maduros');
    });

    it('4. Gera relatório de energia e bateria com dados do Droid e painel solar', () => {
        const report = gemini.generateEnergyReport(4.5, 120, 85, 'idle');
        expect(report).toContain('Diagnóstico de Energia & Bateria');
        expect(report).toContain('+4.5 W');
        expect(report).toContain('120 W disponíveis');
        expect(report).toContain('85%');
    });

    it('5. Gera sugestões estratégicas inteligentes baseadas em gargalos reais', () => {
        const report = gemini.generateAdviceReport(mockContext.resources, mockContext.crops, 1, 85);
        expect(report).toContain('Sugestões Estratégicas');
        // Identifica que há canteiros sedentos e canteiros prontos para colheita
        expect(report).toContain('Canteiros Sedentos');
        expect(report).toContain('Safra Pronta');
    });

    it('6. Ativa Modo Inteligente ao configurar chave e permite alternância', () => {
        gemini.setApiKey('test_gemini_api_key_123');
        expect(gemini.getMode()).toBe('smart');
        expect(gemini.getApiKey()).toBe('test_gemini_api_key_123');

        gemini.setApiKey('');
        expect(gemini.getMode()).toBe('limited');
    });

    it('7. Enforça penalidade de 30 segundos após erro em pergunta livre', async () => {
        gemini.setApiKey('test_key');

        // Mock de erro na API
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            json: async () => ({ error: 'Cota excedida' })
        } as any);

        const res = await gemini.askQuestion('Como vencer?', mockContext);
        expect(res.success).toBe(false);
        expect(res.remainingSeconds).toBe(30);
        expect(gemini.isLockedOut()).toBe(true);

        // Tentativa imediata subsequente é rejeitada localmente pelo lockout de 30s
        const res2 = await gemini.askQuestion('Outra pergunta', mockContext);
        expect(res2.success).toBe(false);
        expect(res2.error).toContain('Intervalo de segurança ativo');
    });
});
