/**
 * Ninja Farm - Procedural Audio System (Web Audio API)
 * Zero external audio assets needed, 100% legal, zero latency, lightweight.
 */

class SoundManager {
    private ctx: AudioContext | null = null;
    private isMuted: boolean = false;
    private ambientTimer: number = 0;

    private getContext(): AudioContext | null {
        if (!this.ctx && typeof window !== 'undefined') {
            const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    }

    setMuted(muted: boolean): void {
        this.isMuted = muted;
    }

    toggleMute(): boolean {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }

    getMuted(): boolean {
        return this.isMuted;
    }

    // Clique de interface
    playClick(): void {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.04);

        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
    }

    // Passo do Ninja na grama/terra
    playFootstep(): void {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        const pitch = 110 + Math.random() * 30;
        osc.frequency.setValueAtTime(pitch, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.06);

        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.07);
    }

    // Som de Construção (batida de madeira + ressonância)
    playBuild(): void {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.18);

        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.19);

        const chime = ctx.createOscillator();
        const chimeGain = ctx.createGain();
        chime.type = 'sine';
        chime.frequency.setValueAtTime(523.25, ctx.currentTime + 0.04);
        chime.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
        chimeGain.gain.setValueAtTime(0.15, ctx.currentTime + 0.04);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

        chime.connect(chimeGain);
        chimeGain.connect(ctx.destination);
        chime.start(ctx.currentTime + 0.04);
        chime.stop(ctx.currentTime + 0.3);
    }

    // Som de Colheita (arpeggio mágico brilhante)
    playHarvest(): void {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);

            gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.25);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + idx * 0.06);
            osc.stop(ctx.currentTime + idx * 0.06 + 0.26);
        });
    }

    // Som de Demolição / Remoção
    playDemolish(): void {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.16);
    }

    // Lançamento de Shuriken (whoosh cortante metálico)
    playShuriken(): void {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.16);

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
    }

    // Bomba de Fumaça / Teleporte Ninja (puff macio de vapor)
    playSmokeDash(): void {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.22);

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.24);
    }

    // Respingo de Água da Irrigação Manual
    playWaterSplash(): void {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        // Frequência modulada simulando respingo d'água
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.35);

        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.36);

        // Borbulhar sutil
        const bubble = ctx.createOscillator();
        const bubbleGain = ctx.createGain();
        bubble.type = 'triangle';
        bubble.frequency.setValueAtTime(800, ctx.currentTime + 0.05);
        bubble.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.25);
        bubbleGain.gain.setValueAtTime(0.12, ctx.currentTime + 0.05);
        bubbleGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

        bubble.connect(bubbleGain);
        bubbleGain.connect(ctx.destination);
        bubble.start(ctx.currentTime + 0.05);
        bubble.stop(ctx.currentTime + 0.26);
    }

    // Impacto do Shuriken no Alvo do Dojo (madeira seca)
    playTargetHit(): void {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.12);

        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.14);

        // Ping metálico fino da lâmina cravando
        const ping = ctx.createOscillator();
        const pingGain = ctx.createGain();
        ping.type = 'sine';
        ping.frequency.setValueAtTime(1200, ctx.currentTime);
        ping.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.08);
        pingGain.gain.setValueAtTime(0.15, ctx.currentTime);
        pingGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

        ping.connect(pingGain);
        pingGain.connect(ctx.destination);
        ping.start();
        ping.stop(ctx.currentTime + 0.09);
    }

    // Level Up Fanfare do Fazendeiro Ninja
    playLevelUp(): void {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const melody = [
            { freq: 440.00, time: 0.00, dur: 0.12 }, // A4
            { freq: 554.37, time: 0.10, dur: 0.12 }, // C#5
            { freq: 659.25, time: 0.20, dur: 0.14 }, // E5
            { freq: 880.00, time: 0.32, dur: 0.35 }  // A5
        ];

        melody.forEach(note => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(note.freq, ctx.currentTime + note.time);

            gain.gain.setValueAtTime(0.22, ctx.currentTime + note.time);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + note.time + note.dur);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + note.time);
            osc.stop(ctx.currentTime + note.time + note.dur + 0.02);
        });
    }

    // Ferramenta manual / acionamento de mecanismo
    playToolDeploy(): void {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        // Selo ninja agudo
        const seal = ctx.createOscillator();
        const sealGain = ctx.createGain();
        seal.type = 'sine';
        seal.frequency.setValueAtTime(987.77, ctx.currentTime); // B5
        seal.frequency.exponentialRampToValueAtTime(1318.51, ctx.currentTime + 0.15); // E6
        sealGain.gain.setValueAtTime(0.2, ctx.currentTime);
        sealGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);

        seal.connect(sealGain);
        sealGain.connect(ctx.destination);
        seal.start();
        seal.stop(ctx.currentTime + 0.17);

        // Puff de fumaça ressonante
        const poof = ctx.createOscillator();
        const poofGain = ctx.createGain();
        poof.type = 'triangle';
        poof.frequency.setValueAtTime(280, ctx.currentTime + 0.08);
        poof.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.3);
        poofGain.gain.setValueAtTime(0.28, ctx.currentTime + 0.08);
        poofGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

        poof.connect(poofGain);
        poofGain.connect(ctx.destination);
        poof.start(ctx.currentTime + 0.08);
        poof.stop(ctx.currentTime + 0.32);
    }

    // Carinho / Alimentação de Animais (som dócil e alegre)
    playAnimalPet(): void {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08); // A5
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.23);
    }

    // Moedas / Troca Comercial com Mercador Ninja
    playCoins(): void {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const coins = [1200, 1600, 2200];
        coins.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);
            gain.gain.setValueAtTime(0.14, ctx.currentTime + idx * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.05 + 0.12);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + idx * 0.05);
            osc.stop(ctx.currentTime + idx * 0.05 + 0.14);
        });
    }

    // Conclusão de Missão Diária (Fanfarra Triunfal Shinobi)
    playQuestComplete(): void {
        if (this.isMuted) return;
        const ctx = this.getContext();
        if (!ctx) return;

        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);
            gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.07);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.07 + 0.25);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + idx * 0.07);
            osc.stop(ctx.currentTime + idx * 0.07 + 0.28);
        });
    }

    private cricketTimer: number = 0;

    // Música ambiental meditativa sutil (pentatônica zen estilo koto japonês) e grilos noturnos
    updateAmbientMusic(dt: number, isNight: boolean): void {
        if (this.isMuted) return;
        this.ambientTimer += dt;
        this.cricketTimer += dt;

        // Grilos suaves durante a noite japonesa
        if (isNight && this.cricketTimer > 3.2) {
            this.cricketTimer = 0;
            const ctx = this.getContext();
            if (ctx) {
                const cOsc = ctx.createOscillator();
                const cGain = ctx.createGain();
                cOsc.type = 'sine';
                cOsc.frequency.setValueAtTime(4600 + Math.random() * 400, ctx.currentTime);
                cGain.gain.setValueAtTime(0.02, ctx.currentTime);
                cGain.gain.exponentialRampToValueAtTime(0.0005, ctx.currentTime + 0.12);
                cOsc.connect(cGain);
                cGain.connect(ctx.destination);
                cOsc.start();
                cOsc.stop(ctx.currentTime + 0.13);
            }
        }

        // Toca uma nota suave a cada 5 a 8 segundos
        if (this.ambientTimer > 6.0) {
            this.ambientTimer = 0;
            const ctx = this.getContext();
            if (!ctx) return;

            // Escala pentatônica clássica (Insen / Yo)
            const dayNotes = [293.66, 329.63, 392.00, 440.00, 523.25, 587.33]; // D, E, G, A, C, D
            const nightNotes = [220.00, 246.94, 293.66, 329.63, 370.00, 440.00]; // A, B, D, E, F#, A

            const scale = isNight ? nightNotes : dayNotes;
            const note = scale[Math.floor(Math.random() * scale.length)];

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(note, ctx.currentTime);

            gain.gain.setValueAtTime(0.04, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0005, ctx.currentTime + 2.2);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 2.3);
        }
    }
}

export const sound = new SoundManager();
