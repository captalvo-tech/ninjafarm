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
 * Ninja Farm - Minimal Privacy-Safe Alpha Telemetry
 * Measures milestone progression, error frequencies, and player funnels without PII.
 */

import { domainEvents } from './events';

export type TelemetryEvent =
    | 'login_completed'
    | 'farm_loaded'
    | 'tutorial_started'
    | 'tutorial_completed'
    | 'first_task_enqueued'
    | 'first_task_completed'
    | 'first_blueprint_placed'
    | 'first_building_completed'
    | 'afk_reconnected'
    | 'gemini_query'
    | 'gemini_error'
    | 'droid_low_battery'
    | 'task_blocked'
    | 'save_error';

export interface TelemetrySummary {
    sessionStartTime: number;
    eventsCount: Record<string, number>;
    milestones: Record<string, number>;
}

export class TelemetryService {
    private counts: Record<string, number> = {};
    private milestones: Record<string, number> = {};
    private readonly storageKey = 'ninja_telemetry_alpha';

    constructor() {
        this.load();
        this.attachDomainListeners();
    }

    public track(event: TelemetryEvent, details?: Record<string, unknown>): void {
        this.counts[event] = (this.counts[event] || 0) + 1;

        // Se for primeiro acontecimento de um marco, registra timestamp
        if (!this.milestones[event]) {
            this.milestones[event] = Date.now();
        }

        this.persist();

        if (import.meta.env.DEV) {
            console.log(`[Telemetry] 📈 ${event}`, details || '');
        }
    }

    public getSummary(): TelemetrySummary {
        return {
            sessionStartTime: this.milestones['farm_loaded'] || Date.now(),
            eventsCount: { ...this.counts },
            milestones: { ...this.milestones }
        };
    }

    private attachDomainListeners(): void {
        domainEvents.on('task.enqueued', () => this.track('first_task_enqueued'));
        domainEvents.on('task.completed', () => this.track('first_task_completed'));
        domainEvents.on('crop.planted', () => this.track('first_task_enqueued'));
        domainEvents.on('building.placed', () => this.track('first_blueprint_placed'));
    }

    private persist(): void {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(
                    this.storageKey,
                    JSON.stringify({
                        counts: this.counts,
                        milestones: this.milestones
                    })
                );
            }
        } catch {
            // Ignore quota errors
        }
    }

    private load(): void {
        try {
            if (typeof localStorage !== 'undefined') {
                const raw = localStorage.getItem(this.storageKey);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    this.counts = parsed.counts || {};
                    this.milestones = parsed.milestones || {};
                }
            }
        } catch {
            // Start fresh
        }
    }
}

export const telemetry = new TelemetryService();
