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
    getSunlightFactor(): number {
        // Sol nasce em 0.25 e se põe em 0.75
        if (this.timeOfDay < 0.22 || this.timeOfDay > 0.78) {
            return 0.0;
        }

        // Curva seno suave durante o período diurno (0.25 a 0.75)
        const dayFraction = (this.timeOfDay - 0.25) / 0.5; // 0 a 1
        if (dayFraction < 0 || dayFraction > 1) return 0.0;

        return Math.max(0, Math.sin(dayFraction * Math.PI));
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

