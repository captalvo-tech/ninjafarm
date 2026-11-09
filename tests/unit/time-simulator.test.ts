import { describe, expect, it } from 'vitest';
import { TimeSimulator } from '../../src/simulation/time-simulator';

describe('TimeSimulator — Simulador Administrativo de Tempo (Seção 13 & 26)', () => {
    it('deve simular 1 hora de operação da fazenda com geração solar e tarefas do Droid', () => {
        const report = TimeSimulator.runSimulation({
            durationHours: 1,
            initialResources: { energy: 50, water: 50 },
            scheduledTasksCount: 4
        });

        expect(report.simulatedHours).toBe(1);
        expect(report.tasksCompleted).toBeGreaterThan(0);
        expect(report.totalSolarEnergyGenerated).toBeGreaterThan(0);
        expect(report.totalWaterConsumed).toBeGreaterThan(0);
        expect(report.droidWorkSeconds).toBeGreaterThan(0);
    });

    it('deve simular 24 horas (1 dia completo) registrando ciclo solar e maturação de culturas', () => {
        const report = TimeSimulator.runSimulation({
            durationHours: 24,
            initialResources: { energy: 100, water: 150 },
            scheduledTasksCount: 8
        });

        expect(report.simulatedHours).toBe(24);
        expect(report.simulatedDays).toBe(1);
        expect(report.cropsMatured).toBeGreaterThanOrEqual(1);
        expect(report.eggsProduced).toBeGreaterThanOrEqual(1);
    });

    it('deve simular 7 dias e 30 dias de balanceamento com detecção determinística de gargalos', () => {
        const report7d = TimeSimulator.runSimulation({
            durationHours: 24 * 7,
            scheduledTasksCount: 15
        });

        expect(report7d.simulatedDays).toBe(7);
        expect(report7d.tasksCompleted).toBeGreaterThan(0);

        const report30d = TimeSimulator.runSimulation({
            durationHours: 24 * 30,
            scheduledTasksCount: 20
        });

        expect(report30d.simulatedDays).toBe(30);
        expect(report30d.totalSolarEnergyGenerated).toBeGreaterThan(report7d.totalSolarEnergyGenerated);
    });

    it('Equivalência Temporal: duas simulações com os mesmos parâmetros devem produzir exatamente o mesmo resultado determinístico', () => {
        const rep1 = TimeSimulator.runSimulation({
            durationHours: 4,
            initialResources: { energy: 60, water: 80 },
            scheduledTasksCount: 5
        });

        const rep2 = TimeSimulator.runSimulation({
            durationHours: 4,
            initialResources: { energy: 60, water: 80 },
            scheduledTasksCount: 5
        });

        expect(rep1.tasksCompleted).toBe(rep2.tasksCompleted);
        expect(rep1.cropsMatured).toBe(rep2.cropsMatured);
        expect(rep1.totalSolarEnergyGenerated).toBe(rep2.totalSolarEnergyGenerated);
        expect(rep1.finalResources.energy).toBe(rep2.finalResources.energy);
        expect(rep1.finalResources.water).toBe(rep2.finalResources.water);
    });
});
