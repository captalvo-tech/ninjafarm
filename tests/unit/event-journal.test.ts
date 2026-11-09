import { describe, expect, it } from 'vitest';
import { EventJournal } from '../../src/simulation/event-journal';

describe('EventJournal & Histórico Operacional do Droid', () => {
    it('deve registrar eventos com timestamp, ID único e respeitar limite máximo de memória', () => {
        const journal = new EventJournal(5);

        for (let i = 1; i <= 8; i++) {
            journal.recordEvent({
                type: 'crop_planted',
                title: `Evento #${i}`,
                description: `Descrição do evento ${i}`,
                details: { index: i }
            });
        }

        const recent = journal.getRecentEvents(10);
        expect(recent.length).toBe(5); // limite máximo = 5
        expect(recent[0].title).toBe('Evento #8'); // o mais recente primeiro
        expect(recent[4].title).toBe('Evento #4');
    });

    it('deve formatar sumário amigável para o Droid e Gemini', () => {
        const journal = new EventJournal(10);
        journal.recordEvent({
            type: 'crop_harvested',
            title: 'Colheita Concluída',
            description: '25 unidades de arroz foram depositadas no celeiro.'
        });
        journal.recordEvent({
            type: 'droid_recharged',
            title: 'Recarga Solar',
            description: 'Droid foi recarregado a 100% na estação solar.'
        });

        const summary = journal.formatSummaryForDroid(2);
        expect(summary).toContain('Recarga Solar');
        expect(summary).toContain('Colheita Concluída');
    });

    it('deve serializar e restaurar histórico fielmente no save/load', () => {
        const journal1 = new EventJournal(10);
        journal1.recordEvent({
            type: 'building_completed',
            title: 'Painel Fotovoltaico Construído',
            description: 'Geração de eletricidade expandida.'
        });

        const serialized = journal1.serialize();
        expect(serialized.length).toBe(1);

        const journal2 = new EventJournal(10);
        journal2.load(serialized);
        expect(journal2.getRecentEvents(1)[0].title).toBe('Painel Fotovoltaico Construído');
    });
});

