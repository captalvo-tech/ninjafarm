/**
 * ============================================================================
 * NINJA FARM — CONTRATO OBRIGATÓRIO DO ROADMAP
 * ============================================================================
 * Testes Unitários do Tutorial Interativo Onboarding (8 Passos)
 * ============================================================================
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InteractiveTutorial, type TutorialStep } from '../../src/ui/tutorial';

describe('InteractiveTutorial — Onboarding Interativo da Alpha 0.1', () => {
    let tutorial: InteractiveTutorial;
    let completedSteps: string[];
    let isCompleted: boolean;

    beforeEach(() => {
        // Mock simples de localStorage
        const store: Record<string, string> = {};
        (globalThis as any).localStorage = {
            getItem: (key: string) => store[key] || null,
            setItem: (key: string, val: string) => {
                store[key] = val;
            },
            removeItem: (key: string) => {
                delete store[key];
            }
        };

        completedSteps = [];
        isCompleted = false;

        tutorial = new InteractiveTutorial({
            onStepChange: (step: TutorialStep) => {
                completedSteps.push(step.id);
            },
            onComplete: () => {
                isCompleted = true;
            }
        });
    });

    it('1. Deve inicializar no Passo 1 (Conheça seu Droid) quando novo jogador', () => {
        expect(tutorial.getCurrentStepIndex()).toBe(0);
        expect(tutorial.getCurrentStep().id).toBe('meet_droid');
        expect(tutorial.getCurrentStep().stepNumber).toBe(1);
        expect(tutorial.getCurrentStep().totalSteps).toBe(8);
        expect(tutorial.isCompleted()).toBe(false);
    });

    it('2. Deve avançar sequencialmente pelos 8 passos do tutorial', () => {
        const expectedStepIds = [
            'meet_droid',
            'select_target',
            'context_action',
            'schedule_task',
            'task_agenda',
            'droid_battery',
            'blueprints',
            'afk_reports'
        ];

        for (let i = 0; i < expectedStepIds.length; i++) {
            expect(tutorial.getCurrentStep().id).toBe(expectedStepIds[i]);
            expect(tutorial.getCurrentStep().stepNumber).toBe(i + 1);
            if (i < expectedStepIds.length - 1) {
                tutorial.nextStep();
            }
        }

        // Ao concluir o 8º passo
        tutorial.nextStep();
        expect(tutorial.isCompleted()).toBe(true);
        expect(isCompleted).toBe(true);
    });

    it('3. Deve persistir estado de conclusão no localStorage', () => {
        tutorial.completeTutorial();
        expect(tutorial.isCompleted()).toBe(true);
        expect(localStorage.getItem('ninja_farm_tutorial_completed')).toBe('true');

        // Cria nova instância: deve detectar tutorial já concluído
        const freshTutorial = new InteractiveTutorial();
        expect(freshTutorial.isCompleted()).toBe(true);
    });

    it('4. Deve permitir reiniciar tutorial pelo menu de configurações', () => {
        tutorial.completeTutorial();
        expect(tutorial.isCompleted()).toBe(true);

        tutorial.resetTutorial();
        expect(tutorial.isCompleted()).toBe(false);
        expect(tutorial.getCurrentStepIndex()).toBe(0);
        expect(tutorial.getCurrentStep().id).toBe('meet_droid');
    });
});
