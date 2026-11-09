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

import { FARM_CONFIG } from '../core/config';
import { domainEvents } from '../core/events';

export class SimulationClock {
    // 0.0 a 1.0 onde:
    // 0.0 = Meia-noite (00:00)
    // 0.25 = Amanhecer (06:00)
    // 0.50 = Meio-dia solar (12:00)
    // 0.75 = Pôr do sol (18:00)
    // 1.0 = Meia-noite seguinte
    private timeOfDay: number = 0.35; // Começa pelas 08:24 da manhã
    private totalGameDays: number = 0;
    private isPaused: boolean = false;
    private timeScale: number = 1.0;

    constructor(initialTimeOfDay: number = 0.35, initialDays: number = 0) {
        this.timeOfDay = initialTimeOfDay;
        this.totalGameDays = initialDays;
    }

    tick(deltaSeconds: number): void {
        if (this.isPaused || deltaSeconds <= 0) return;

        const deltaDay = (deltaSeconds * this.timeScale) / FARM_CONFIG.DAY_DURATION_SECONDS;
        this.timeOfDay += deltaDay;

        if (this.timeOfDay >= 1.0) {
            const daysPassed = Math.floor(this.timeOfDay);
            this.timeOfDay -= daysPassed;
            this.totalGameDays += daysPassed;
            domainEvents.emit('clock.day_passed', { totalDays: this.totalGameDays });
        }
    }

    // Retorna fator de luz solar de 0.0 (escuridão da noite) até 1.0 (pico do meio-dia)
    // Mantém iluminação plena durante a tarde (0.35 a 0.68) para evitar escurecimento precoce
    getSunlightFactor(): number {
        // Sol nasce em 0.22 (05:16) e se põe em 0.78 (18:43)
        if (this.timeOfDay < 0.22 || this.timeOfDay > 0.78) {
            return 0.0;
        }

        // Platô de luminosidade plena mantido ao longo de toda a tarde (08:24 às 16:20)
        if (this.timeOfDay >= 0.35 && this.timeOfDay <= 0.68) {
            return 1.0;
        }

        if (this.timeOfDay < 0.35) {
            // Transição suave da aurora (05:16 a 08:24)
            const dawnFraction = (this.timeOfDay - 0.22) / (0.35 - 0.22);
            return 0.5 - 0.5 * Math.cos(dawnFraction * Math.PI);
        } else {
            // Entardecer dourado suave (16:20 a 18:43)
            const duskFraction = (this.timeOfDay - 0.68) / (0.78 - 0.68);
            return 0.5 + 0.5 * Math.cos(duskFraction * Math.PI);
        }
    }

    isNight(): boolean {
        return this.getSunlightFactor() < 0.05;
    }

    // Horário formatado como HH:MM
    getFormattedTime(): string {
        const totalMinutes = Math.floor(this.timeOfDay * 24 * 60);
        const hours = Math.floor(totalMinutes / 60) % 24;
        const minutes = totalMinutes % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    getTimeOfDay(): number {
        return this.timeOfDay;
    }

    getTotalDays(): number {
        return this.totalGameDays;
    }

    setTimeOfDay(time: number): void {
        this.timeOfDay = Math.max(0, Math.min(1, time));
    }

    setPaused(paused: boolean): void {
        this.isPaused = paused;
    }

    setTimeScale(scale: number): void {
        this.timeScale = Math.max(0.1, Math.min(10.0, scale));
    }
}

