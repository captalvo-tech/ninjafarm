import { triggerHaptic } from './haptics';
import type { CropType } from '../core/types';

export interface JoystickVector {
    x: number; // -1 to 1
    y: number; // -1 to 1
    intensity: number; // 0 to 1
    isSprinting: boolean;
}

export interface TouchControlsCallbacks {
    onAction?: () => void;
    onShuriken?: () => void;
    onDash?: () => void;
    onWaterJutsu?: () => void;
    onCloneJutsu?: () => void;
    onSelectCrop?: (crop: CropType) => void;
}

export class VirtualJoystick {
    private baseElement: HTMLElement;
    private stickElement: HTMLElement;
    private actionBtn: HTMLElement;
    private jutsuContainer: HTMLElement;
    private shurikenBtn: HTMLElement;
    private dashBtn: HTMLElement;
    private waterBtn: HTMLElement;
    private cloneBtn: HTMLElement;
    private seedPickerElement: HTMLElement;

    private activeTouchId: number | null = null;
    private startX = 0;
    private startY = 0;
    private radius = 55; // pixels
    private vector: JoystickVector = { x: 0, y: 0, intensity: 0, isSprinting: false };
    private selectedCrop: CropType = 'rice';

    private callbacks: TouchControlsCallbacks;

    constructor(callbacks: TouchControlsCallbacks = {}) {
        this.callbacks = callbacks;

        // Container principal do joystick (Polegar Esquerdo)
        this.baseElement = document.createElement('div');
        this.baseElement.id = 'virtual-joystick-base';

        this.stickElement = document.createElement('div');
        this.stickElement.id = 'virtual-joystick-stick';
        this.baseElement.appendChild(this.stickElement);

        // Botão Principal Contextual (Polegar Direito - Grande e Ergonômico)
        this.actionBtn = document.createElement('button');
        this.actionBtn.id = 'mobile-main-action-btn';
        this.actionBtn.innerHTML = '<span class="action-icon">🎯</span><span class="action-text">Ação</span>';

        // Cluster de Jutsus Ninjas (Satélites ergonômicos no arco do polegar direito)
        this.jutsuContainer = document.createElement('div');
        this.jutsuContainer.id = 'mobile-jutsu-cluster';

        this.shurikenBtn = document.createElement('button');
        this.shurikenBtn.className = 'mobile-jutsu-btn jutsu-shuriken';
        this.shurikenBtn.innerHTML = '🗡️';
        this.shurikenBtn.title = 'Lançar Shuriken';

        this.dashBtn = document.createElement('button');
        this.dashBtn.className = 'mobile-jutsu-btn jutsu-dash';
        this.dashBtn.innerHTML = '💨';
        this.dashBtn.title = 'Shunshin Dash';

        this.waterBtn = document.createElement('button');
        this.waterBtn.className = 'mobile-jutsu-btn jutsu-water';
        this.waterBtn.innerHTML = '🌊';
        this.waterBtn.title = 'Suiton: Chuva de Irrigação';

        this.cloneBtn = document.createElement('button');
        this.cloneBtn.className = 'mobile-jutsu-btn jutsu-clone';
        this.cloneBtn.innerHTML = '👤';
        this.cloneBtn.title = 'Kage Bunshin: Clone Autônomo';

        this.jutsuContainer.appendChild(this.shurikenBtn);
        this.jutsuContainer.appendChild(this.dashBtn);
        this.jutsuContainer.appendChild(this.waterBtn);
        this.jutsuContainer.appendChild(this.cloneBtn);

        // Seletor Rápido de Sementes Mobile (Centro-Inferior)
        this.seedPickerElement = document.createElement('div');
        this.seedPickerElement.id = 'mobile-seed-picker';
        this.seedPickerElement.innerHTML = `
            <button class="seed-option active" data-crop="rice">🌾 Arroz</button>
            <button class="seed-option" data-crop="vegetable">🥕 Cenoura</button>
            <button class="seed-option" data-crop="lotus">🪷 Lótus</button>
        `;

        this.injectStyles();
        document.body.appendChild(this.baseElement);
        document.body.appendChild(this.actionBtn);
        document.body.appendChild(this.jutsuContainer);
        document.body.appendChild(this.seedPickerElement);

        this.setupEvents();
    }

    // Altera dinamicamente o ícone e rótulo do botão principal
    setActionState(icon: string, label: string): void {
        this.actionBtn.innerHTML = `<span class="action-icon">${icon}</span><span class="action-text">${label}</span>`;
    }

    // Exibe ou oculta o seletor rápido de sementes ao aproximar-se de canteiro vazio
    showSeedPicker(visible: boolean): void {
        if (visible) {
            this.seedPickerElement.classList.add('visible');
        } else {
            this.seedPickerElement.classList.remove('visible');
        }
    }

    getSelectedCrop(): CropType {
        return this.selectedCrop;
    }

    setSelectedCrop(crop: CropType): void {
        this.selectedCrop = crop;
        const buttons = this.seedPickerElement.querySelectorAll('.seed-option');
        buttons.forEach((btn) => {
            const el = btn as HTMLElement;
            if (el.dataset.crop === crop) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        });
    }

    private injectStyles(): void {
        const style = document.createElement('style');
        style.textContent = `
            #virtual-joystick-base {
                position: fixed;
                bottom: calc(24px + env(safe-area-inset-bottom, 0px));
                left: calc(24px + env(safe-area-inset-left, 0px));
                width: 120px;
                height: 120px;
                border-radius: 50%;
                background: rgba(11, 15, 25, 0.45);
                border: 2px solid rgba(16, 185, 129, 0.35);
                backdrop-filter: blur(8px);
                touch-action: none;
                z-index: 120;
                display: none;
                align-items: center;
                justify-content: center;
                user-select: none;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
            }

            #virtual-joystick-stick {
                width: 52px;
                height: 52px;
                border-radius: 50%;
                background: radial-gradient(circle at 35% 35%, #34D399, #059669);
                box-shadow: 0 4px 15px rgba(16, 185, 129, 0.6);
                pointer-events: none;
                transform: translate(0px, 0px);
                transition: transform 0.04s ease-out;
            }

            /* BOTÃO PRINCIPAL CONTEXTUAL (POLEGAR DIREITO) */
            #mobile-main-action-btn {
                position: fixed;
                bottom: calc(24px + env(safe-area-inset-bottom, 0px));
                right: calc(22px + env(safe-area-inset-right, 0px));
                width: 74px;
                height: 74px;
                border-radius: 50%;
                background: linear-gradient(135deg, #10B981, #047857);
                border: 2px solid rgba(255, 255, 255, 0.4);
                color: #FFFFFF;
                font-family: 'DM Sans', sans-serif;
                font-weight: 800;
                display: none;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 2px;
                box-shadow: 0 8px 25px rgba(16, 185, 129, 0.5), 0 0 15px rgba(16, 185, 129, 0.3);
                z-index: 120;
                touch-action: manipulation;
                user-select: none;
                cursor: pointer;
                transition: transform 0.1s ease, background 0.2s ease;
            }

            #mobile-main-action-btn .action-icon {
                font-size: 22px;
                line-height: 1;
            }

            #mobile-main-action-btn .action-text {
                font-size: 10px;
                letter-spacing: 0.3px;
                text-transform: uppercase;
                line-height: 1;
            }

            #mobile-main-action-btn:active {
                transform: scale(0.9);
                background: linear-gradient(135deg, #34D399, #10B981);
            }

            /* CLUSTER DE JUTSUS NINJAS */
            #mobile-jutsu-cluster {
                position: fixed;
                bottom: calc(24px + env(safe-area-inset-bottom, 0px));
                right: calc(22px + env(safe-area-inset-right, 0px));
                width: 170px;
                height: 170px;
                pointer-events: none;
                z-index: 119;
                display: none;
            }

            .mobile-jutsu-btn {
                position: absolute;
                width: 48px;
                height: 48px;
                border-radius: 50%;
                background: rgba(30, 41, 59, 0.88);
                border: 1.5px solid rgba(255, 255, 255, 0.3);
                color: #FFFFFF;
                font-size: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
                pointer-events: auto;
                touch-action: manipulation;
                user-select: none;
                cursor: pointer;
                transition: transform 0.1s ease, background 0.2s ease;
            }

            .mobile-jutsu-btn:active {
                transform: scale(0.88);
                background: rgba(16, 185, 129, 0.8);
            }

            /* Posições no arco do polegar */
            .jutsu-shuriken {
                bottom: 6px;
                right: 90px;
                border-color: rgba(245, 158, 11, 0.5);
            }
            .jutsu-dash {
                bottom: 62px;
                right: 88px;
                border-color: rgba(168, 85, 247, 0.5);
            }
            .jutsu-water {
                bottom: 108px;
                right: 52px;
                border-color: rgba(59, 130, 246, 0.5);
            }
            .jutsu-clone {
                bottom: 112px;
                right: -2px;
                border-color: rgba(16, 185, 129, 0.5);
            }

            /* SELETOR RÁPIDO DE SEMENTES */
            #mobile-seed-picker {
                position: fixed;
                bottom: calc(26px + env(safe-area-inset-bottom, 0px));
                left: 50%;
                transform: translateX(-50%) translateY(30px);
                display: flex;
                align-items: center;
                gap: 8px;
                background: rgba(11, 15, 25, 0.92);
                border: 1px solid rgba(16, 185, 129, 0.5);
                backdrop-filter: blur(12px);
                padding: 6px 12px;
                border-radius: 30px;
                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
                opacity: 0;
                pointer-events: none;
                z-index: 125;
                transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
            }

            #mobile-seed-picker.visible {
                opacity: 1;
                pointer-events: auto;
                transform: translateX(-50%) translateY(0);
            }

            .seed-option {
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.15);
                color: #D1D5DB;
                font-family: 'DM Sans', sans-serif;
                font-size: 12px;
                font-weight: 700;
                padding: 6px 12px;
                border-radius: 20px;
                cursor: pointer;
                touch-action: manipulation;
                user-select: none;
                transition: all 0.2s ease;
            }

            .seed-option.active {
                background: rgba(16, 185, 129, 0.35);
                border-color: #10B981;
                color: #FFFFFF;
                box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
            }

            .seed-option:active {
                transform: scale(0.92);
            }

            /* MOSTRA APENAS EM DISPOSITIVOS TOUCH OU TELAS PEQUENAS */
            @media (hover: none) and (pointer: coarse), (max-width: 900px) {
                #virtual-joystick-base {
                    display: flex;
                }
                #mobile-main-action-btn {
                    display: flex;
                }
                #mobile-jutsu-cluster {
                    display: block;
                }
            }
        `;
        document.head.appendChild(style);
    }

    private setupEvents(): void {
        // Joystick Touchstart
        this.baseElement.addEventListener('touchstart', (e) => {
            const touch = e.changedTouches[0];
            this.activeTouchId = touch.identifier;
            const rect = this.baseElement.getBoundingClientRect();
            this.startX = rect.left + rect.width / 2;
            this.startY = rect.top + rect.height / 2;
            this.handleMove(touch.clientX, touch.clientY);
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (this.activeTouchId === null) return;
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                if (touch.identifier === this.activeTouchId) {
                    this.handleMove(touch.clientX, touch.clientY);
                    break;
                }
            }
        }, { passive: false });

        const resetJoystick = (e: TouchEvent) => {
            if (this.activeTouchId === null) return;
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === this.activeTouchId) {
                    this.activeTouchId = null;
                    this.vector = { x: 0, y: 0, intensity: 0, isSprinting: false };
                    this.stickElement.style.transform = 'translate(0px, 0px)';
                    break;
                }
            }
        };

        window.addEventListener('touchend', resetJoystick);
        window.addEventListener('touchcancel', resetJoystick);

        // Ação Principal (Toque rápido com feedback tátil)
        this.actionBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.actionBtn.style.transform = 'scale(0.9)';
            triggerHaptic('light');
            this.callbacks.onAction?.();
        }, { passive: false });

        this.actionBtn.addEventListener('touchend', () => {
            this.actionBtn.style.transform = 'scale(1)';
        });

        // Jutsus Ninjas
        this.shurikenBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.shurikenBtn.style.transform = 'scale(0.88)';
            triggerHaptic('medium');
            this.callbacks.onShuriken?.();
        }, { passive: false });
        this.shurikenBtn.addEventListener('touchend', () => {
            this.shurikenBtn.style.transform = 'scale(1)';
        });

        this.dashBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.dashBtn.style.transform = 'scale(0.88)';
            triggerHaptic('light');
            this.callbacks.onDash?.();
        }, { passive: false });
        this.dashBtn.addEventListener('touchend', () => {
            this.dashBtn.style.transform = 'scale(1)';
        });

        this.waterBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.waterBtn.style.transform = 'scale(0.88)';
            triggerHaptic('jutsu');
            this.callbacks.onWaterJutsu?.();
        }, { passive: false });
        this.waterBtn.addEventListener('touchend', () => {
            this.waterBtn.style.transform = 'scale(1)';
        });

        this.cloneBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.cloneBtn.style.transform = 'scale(0.88)';
            triggerHaptic('jutsu');
            this.callbacks.onCloneJutsu?.();
        }, { passive: false });
        this.cloneBtn.addEventListener('touchend', () => {
            this.cloneBtn.style.transform = 'scale(1)';
        });

        // Seletor de sementes
        const seedButtons = this.seedPickerElement.querySelectorAll('.seed-option');
        seedButtons.forEach((btn) => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const crop = (btn as HTMLElement).dataset.crop as CropType;
                if (crop) {
                    triggerHaptic('light');
                    this.setSelectedCrop(crop);
                    this.callbacks.onSelectCrop?.(crop);
                }
            }, { passive: false });
        });
    }

    private handleMove(clientX: number, clientY: number): void {
        const dx = clientX - this.startX;
        const dy = clientY - this.startY;
        const dist = Math.hypot(dx, dy);

        const clampedDist = Math.min(this.radius, dist);
        const angle = Math.atan2(dy, dx);

        const posX = Math.cos(angle) * clampedDist;
        const posY = Math.sin(angle) * clampedDist;

        this.stickElement.style.transform = `translate(${posX}px, ${posY}px)`;

        const intensity = clampedDist / this.radius;

        // Auto-Sprint: puxar o analógico além de 60% ativa corrida automaticamente!
        const isSprinting = intensity > 0.62;

        this.vector = {
            x: clampedDist > 5 ? posX / this.radius : 0,
            y: clampedDist > 5 ? posY / this.radius : 0,
            intensity,
            isSprinting
        };
    }

    getVector(): JoystickVector {
        return this.vector;
    }

    setVisible(visible: boolean): void {
        this.baseElement.style.display = visible ? 'flex' : 'none';
        this.actionBtn.style.display = visible ? 'flex' : 'none';
        this.jutsuContainer.style.display = visible ? 'block' : 'none';
        if (!visible) {
            this.showSeedPicker(false);
        }
    }
}
