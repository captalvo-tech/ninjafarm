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
 * Ninja Farm - Event Journal System
 * Persistent audit log of operational and biological farm events.
 * Consulted by the Droid during status reports and AI dialogue.
 */

import { domainEvents } from '../core/events';
import type { FarmEventEntry } from '../core/types';

export class EventJournal {
    private entries: FarmEventEntry[] = [];
    private readonly maxEntries: number;

    constructor(maxEntries: number = 100) {
        this.maxEntries = maxEntries;
    }

    public recordEvent(entry: {
        type: FarmEventEntry['type'];
        title: string;
        description: string;
        entityId?: string;
        details?: Record<string, unknown>;
        timestamp?: number;
    }): FarmEventEntry {
        const fullEntry: FarmEventEntry = {
            id: 'evt_' + Math.random().toString(36).substring(2, 9),
            timestamp: entry.timestamp ?? Date.now(),
            type: entry.type,
            title: entry.title,
            description: entry.description,
            entityId: entry.entityId,
            details: entry.details
        };

        this.entries.unshift(fullEntry);

        // Limita o tamanho do histórico em memória
        if (this.entries.length > this.maxEntries) {
            this.entries.length = this.maxEntries;
        }

        domainEvents.emit('event.recorded', fullEntry);
        return fullEntry;
    }

    public getRecentEvents(limit: number = 10): FarmEventEntry[] {
        return this.entries.slice(0, limit);
    }

    public getEventsSince(sinceTimestamp: number): FarmEventEntry[] {
        return this.entries.filter(e => e.timestamp >= sinceTimestamp);
    }

    public formatSummaryForDroid(limit: number = 6): string {
        if (this.entries.length === 0) {
            return 'Nenhum acontecimento recente registrado.';
        }

        const recent = this.entries.slice(0, limit);
        return recent
            .map(e => {
                const timeStr = new Date(e.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                return `[${timeStr}] ${e.title}: ${e.description}`;
            })
            .join('\n');
    }

    public serialize(): FarmEventEntry[] {
        return [...this.entries];
    }

    public load(savedEntries: FarmEventEntry[]): void {
        if (!savedEntries || !Array.isArray(savedEntries)) return;
        this.entries = savedEntries.slice(0, this.maxEntries);
    }
}

