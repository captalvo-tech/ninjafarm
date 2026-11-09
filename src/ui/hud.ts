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

import { sound } from '../audio/sound';
import type { BuildingType, ResourceInventory } from '../core/types';
import { setHapticsEnabled, isHapticsEnabled, triggerHaptic } from '../input/haptics';
import type { CameraMode } from '../rendering/camera-controller';
import type { EnergyMetrics } from '../simulation/energy';
import type { WaterMetrics } from '../simulation/water';

import { t, setLanguage, getLanguage } from './i18n';

export interface HUDCallbacks {
    onModeChange: (mode: CameraMode) => void;
    onSelectBuilding: (type: BuildingType | null) => void;
    onRotateBuilding: () => void;
    onSaveGame: () => void;
    onLoadGame: () => void;
    onOpenSettings?: () => void;
    onOpenScheduler?: () => void;
    onOpenDroidChat?: () => void;
    onDemolishMode?: (active: boolean) => void;
    onVirtualMove?: (x: number, y: number) => void;
}

export class FarmHUD {
    private container: HTMLElement;
    private callbacks: HUDCallbacks;

    // Elementos da UI
    private fpsElement!: HTMLElement;
    private timeElement!: HTMLElement;
    private daysElement!: HTMLElement;
    private woodElement!: HTMLElement;
    private metalElement!: HTMLElement;
    private partsElement!: HTMLElement;
    private foodElement!: HTMLElement;
    private waterElement!: HTMLElement;
    private energyElement!: HTMLElement;
    private solarRateElement!: HTMLElement;
    private batteryElement!: HTMLElement;
    private buildBarElement!: HTMLElement;
    private ghostBarElement!: HTMLElement;
    private notificationElement!: HTMLElement;

    // Elementos de Progressão / Rank Ninja
    private rankTitleElement!: HTMLElement;
    private rankLevelElement!: HTMLElement;
    private xpFillElement!: HTMLElement;
    private xpTextElement!: HTMLElement;

    private selectedBuilding: BuildingType | null = null;
    private activeCameraMode: CameraMode = 'explore';
    private trialsHtmlProvider?: () => string;
    private onClaimTrialCallback?: (id: string) => void;

    getActiveCameraMode(): CameraMode {
        return this.activeCameraMode;
    }

    constructor(callbacks: HUDCallbacks) {
        this.callbacks = callbacks;
        this.container = document.createElement('div');
        this.container.id = 'ninja-farm-hud';
        document.body.appendChild(this.container);

        this.injectStyles();
        this.buildLayout();
        this.setupEventListeners();
    }

    private injectStyles(): void {
        const style = document.createElement('style');
        style.textContent = `
            #ninja-farm-hud {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                pointer-events: none;
                z-index: 100;
                font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
                user-select: none;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                box-sizing: border-box;
                padding: 12px 16px;
            }

            .hud-interactive {
                pointer-events: auto;
            }

            /* TOP BAR */
            .hud-top-bar {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                justify-content: space-between;
                gap: 10px;
                background: rgba(11, 15, 25, 0.88);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 16px;
                padding: 8px 16px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            }

            .hud-brand {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 900;
                font-size: 16px;
                letter-spacing: 0.5px;
                color: #FFFFFF;
            }

            .hud-badge {
                font-size: 11px;
                background: rgba(16, 185, 129, 0.18);
                color: #34D399;
                border: 1px solid rgba(16, 185, 129, 0.35);
                padding: 2px 8px;
                border-radius: 12px;
                font-weight: 700;
            }

            /* NINJA PROGRESSION / XP BADGE */
            .hud-rank-section {
                display: flex;
                align-items: center;
                gap: 8px;
                background: rgba(30, 41, 59, 0.6);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 10px;
                padding: 4px 10px;
            }

            .hud-rank-badge {
                background: linear-gradient(135deg, #EF4444, #B91C1C);
                color: #FFFFFF;
                font-size: 11px;
                font-weight: 900;
                padding: 2px 6px;
                border-radius: 6px;
                letter-spacing: 0.5px;
            }

            .hud-rank-info {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .hud-rank-title {
                font-size: 11px;
                font-weight: 800;
                color: #F3F4F6;
            }

            .hud-xp-bar-container {
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .hud-xp-bar-bg {
                width: 70px;
                height: 5px;
                background: rgba(255, 255, 255, 0.15);
                border-radius: 3px;
                overflow: hidden;
            }

            .hud-xp-bar-fill {
                height: 100%;
                width: 0%;
                background: linear-gradient(90deg, #F59E0B, #10B981);
                transition: width 0.4s ease;
            }

            .hud-xp-text {
                font-size: 10px;
                font-weight: 700;
                color: #9CA3AF;
            }

            .hud-clock-section {
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 14px;
                color: #E5E7EB;
                font-weight: 600;
            }

            .hud-resources {
                display: flex;
                align-items: center;
                gap: 12px;
                flex-wrap: wrap;
            }

            .res-item {
                display: flex;
                align-items: center;
                gap: 5px;
                font-size: 13px;
                font-weight: 700;
                background: rgba(255, 255, 255, 0.05);
                padding: 4px 10px;
                border-radius: 8px;
                border: 1px solid rgba(255, 255, 255, 0.06);
            }

            .res-item.energy { color: #FBBF24; }
            .res-item.water { color: #60A5FA; }
            .res-item.wood { color: #F59E0B; }
            .res-item.metal { color: #9CA3AF; }
            .res-item.parts { color: #A78BFA; }
            .res-item.food { color: #34D399; }

            .hud-actions {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .hud-btn {
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.14);
                color: #F3F4F6;
                padding: 6px 12px;
                border-radius: 8px;
                font-size: 12px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s;
                display: inline-flex;
                align-items: center;
                gap: 6px;
            }

            .hud-btn:hover {
                background: rgba(255, 255, 255, 0.18);
            }

            .hud-btn.active {
                background: #10B981;
                color: #0B0F19;
                border-color: #34D399;
            }

            /* STATUS WIDGETS (SIDE) */
            .hud-side-widgets {
                position: absolute;
                top: 80px;
                right: 16px;
                display: flex;
                flex-direction: column;
                gap: 8px;
                width: 220px;
            }

            .widget-card {
                background: rgba(11, 15, 25, 0.85);
                backdrop-filter: blur(8px);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 12px;
                padding: 10px 14px;
                font-size: 12px;
                color: #9CA3AF;
            }

            .widget-header {
                display: flex;
                justify-content: space-between;
                font-weight: 700;
                color: #FFFFFF;
                margin-bottom: 4px;
            }

            .widget-bar-bg {
                width: 100%;
                height: 6px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 3px;
                overflow: hidden;
                margin-top: 4px;
            }

            .widget-bar-fill {
                height: 100%;
                border-radius: 3px;
                transition: width 0.3s ease;
            }

            /* BOTTOM CONTROLS & BUILD BAR */
            .hud-bottom-bar {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
                width: 100%;
            }

            .build-toolbar {
                display: flex;
                align-items: center;
                gap: 8px;
                background: rgba(11, 15, 25, 0.9);
                backdrop-filter: blur(12px);
                border: 1px solid rgba(255, 255, 255, 0.12);
                border-radius: 18px;
                padding: 8px 12px;
                overflow-x: auto;
                max-width: 90vw;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            }

            .build-item-btn {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 3px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.08);
                color: #E5E7EB;
                border-radius: 12px;
                padding: 8px 12px;
                cursor: pointer;
                min-width: 68px;
                font-size: 11px;
                font-weight: 700;
                transition: all 0.2s;
            }

            .build-item-btn:hover {
                background: rgba(16, 185, 129, 0.15);
                border-color: rgba(16, 185, 129, 0.4);
                transform: translateY(-2px);
            }

            .build-item-btn.selected {
                background: rgba(16, 185, 129, 0.25);
                border-color: #10B981;
                color: #FFFFFF;
                box-shadow: 0 0 12px rgba(16, 185, 129, 0.4);
            }

            .build-item-icon {
                font-size: 20px;
            }

            /* GHOST CONTROL BAR */
            .ghost-bar {
                display: none;
                align-items: center;
                gap: 12px;
                background: rgba(11, 15, 25, 0.92);
                border: 1px solid #10B981;
                padding: 8px 18px;
                border-radius: 50px;
                font-size: 13px;
                font-weight: 700;
                color: #FFFFFF;
                box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
            }

            .ghost-bar.active {
                display: flex;
            }

            /* TOAST NOTIFICATION */
            .hud-toast {
                position: fixed;
                bottom: 120px;
                left: 50%;
                transform: translateX(-50%) translateY(20px);
                background: rgba(16, 185, 129, 0.95);
                color: #0B0F19;
                font-weight: 800;
                font-size: 14px;
                padding: 10px 22px;
                border-radius: 30px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
                opacity: 0;
                pointer-events: none;
                transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }

            .hud-toast.show {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }

            /* LEVEL UP BANNER */
            .hud-levelup-banner {
                position: fixed;
                top: 90px;
                left: 50%;
                transform: translateX(-50%) scale(0.8);
                background: linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95));
                border: 2px solid #34D399;
                color: #FFFFFF;
                font-family: 'Cinzel', serif;
                font-size: 22px;
                font-weight: 900;
                padding: 12px 28px;
                border-radius: 50px;
                box-shadow: 0 10px 35px rgba(16, 185, 129, 0.6);
                opacity: 0;
                pointer-events: none;
                transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                z-index: 150;
            }

            .hud-levelup-banner.show {
                opacity: 1;
                transform: translateX(-50%) scale(1);
            }

            /* CODEX / ALMANAC MODAL */
            .hud-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(11, 15, 25, 0.75);
                backdrop-filter: blur(10px);
                z-index: 250;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 16px;
                box-sizing: border-box;
            }

            .hud-modal.open {
                display: flex;
            }

            .codex-dialog {
                background: rgba(15, 23, 42, 0.96);
                border: 1.5px solid rgba(16, 185, 129, 0.45);
                border-radius: 20px;
                width: 100%;
                max-width: 440px;
                max-height: 82vh;
                display: flex;
                flex-direction: column;
                box-shadow: 0 15px 40px rgba(0, 0, 0, 0.7);
                overflow: hidden;
            }

            .codex-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 14px 18px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }

            .codex-header h2 {
                margin: 0;
                font-size: 16px;
                color: #FFFFFF;
                font-weight: 800;
            }

            .codex-close-btn {
                background: rgba(255, 255, 255, 0.1);
                border: none;
                color: #FFFFFF;
                font-size: 16px;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s;
            }

            .codex-close-btn:active {
                background: rgba(255, 255, 255, 0.25);
            }

            .codex-nav {
                display: flex;
                gap: 8px;
                padding: 10px 16px;
                background: rgba(0, 0, 0, 0.2);
                border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            }

            .codex-tab {
                flex: 1;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: #9CA3AF;
                font-family: inherit;
                font-size: 12px;
                font-weight: 700;
                padding: 8px 6px;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.2s;
                text-align: center;
            }

            .codex-tab.active {
                background: rgba(16, 185, 129, 0.25);
                border-color: #10B981;
                color: #FFFFFF;
            }

            .codex-body {
                padding: 14px 16px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-height: 55vh;
            }

            .codex-panel {
                display: none;
                flex-direction: column;
                gap: 10px;
            }

            .codex-panel.active {
                display: flex;
            }

            .codex-crop-card {
                display: flex;
                gap: 12px;
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 14px;
                padding: 10px 12px;
            }

            .crop-icon {
                font-size: 28px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .crop-details h3 {
                margin: 0 0 3px 0;
                font-size: 13px;
                color: #FFFFFF;
                font-weight: 700;
            }

            .crop-details p {
                margin: 0 0 6px 0;
                font-size: 11px;
                color: #9CA3AF;
                line-height: 1.3;
            }

            .crop-specs {
                display: flex;
                gap: 10px;
                font-size: 10px;
                font-weight: 800;
                color: #34D399;
            }

            .codex-rank-card {
                display: flex;
                align-items: center;
                gap: 12px;
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 12px;
                padding: 10px 12px;
                color: #FFFFFF;
                font-size: 12px;
            }

            .codex-rank-card .rank-badge {
                background: rgba(16, 185, 129, 0.2);
                border: 1px solid #10B981;
                color: #34D399;
                font-weight: 800;
                font-size: 11px;
                padding: 3px 8px;
                border-radius: 10px;
            }

            .codex-setting-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 12px;
                padding: 10px 14px;
                color: #FFFFFF;
                font-size: 12px;
                font-weight: 700;
            }

            @media (max-width: 900px) {
                #ninja-farm-hud {
                    padding: calc(6px + env(safe-area-inset-top, 0px)) 10px calc(8px + env(safe-area-inset-bottom, 0px)) 10px;
                }
                .hud-top-bar {
                    padding: 6px 10px;
                    gap: 6px;
                    border-radius: 12px;
                }
                .hud-brand {
                    font-size: 13px;
                    gap: 4px;
                }
                .hud-badge {
                    display: none;
                }
                .hud-rank-section {
                    padding: 2px 6px;
                }
                .hud-xp-bar-bg {
                    width: 45px;
                }
                .hud-clock-section {
                    font-size: 11px;
                    gap: 5px;
                }
                .hud-side-widgets {
                    display: none;
                }
                .hud-resources {
                    gap: 4px;
                }
                .res-item {
                    font-size: 11px;
                    padding: 2px 6px;
                }
                /* No mobile compacto, foca nos recursos vitais para despoluir a tela */
                .res-item.parts, .res-item.metal {
                    display: none;
                }
                .hud-actions {
                    gap: 4px;
                }
                .hud-btn {
                    padding: 5px 8px;
                    font-size: 11px;
                }
                .build-toolbar {
                    max-width: 96vw;
                    padding: 6px 8px;
                    gap: 6px;
                    -webkit-overflow-scrolling: touch;
                }
                .build-item-btn {
                    min-width: 60px;
                    padding: 6px 6px;
                    font-size: 10px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    private buildLayout(): void {
        this.container.innerHTML = `
            <div class="hud-top-bar hud-interactive">
                <div class="hud-brand">
                    <span>🥷</span>
                    <span>${t('game.title')}</span>
                </div>

                <!-- RANK & PROGRESSION -->
                <div class="hud-rank-section">
                    <span class="hud-rank-badge" id="hud-rank-level">LV.1</span>
                    <div class="hud-rank-info">
                        <span class="hud-rank-title" id="hud-rank-title">Iniciante</span>
                        <div class="hud-xp-bar-container">
                            <div class="hud-xp-bar-bg">
                                <div class="hud-xp-bar-fill" id="hud-xp-fill"></div>
                            </div>
                            <span class="hud-xp-text" id="hud-xp-text">0/100</span>
                        </div>
                    </div>
                </div>

                <div class="hud-clock-section">
                    <span>☀️ <span id="hud-time">12:00</span></span>
                    <span>&bull;</span>
                    <span>${t('hud.day')} <span id="hud-days">1</span></span>
                    <span style="color: #9CA3AF; font-size: 11px;">(<span id="hud-fps">60</span>)</span>
                </div>

                <div class="hud-resources">
                    <div class="res-item wood">🪵 <span id="hud-wood">150</span></div>
                    <div class="res-item metal">⚙️ <span id="hud-metal">100</span></div>
                    <div class="res-item parts">🔩 <span id="hud-parts">40</span></div>
                    <div class="res-item food">🍙 <span id="hud-food">30</span></div>
                    <div class="res-item water">💧 <span id="hud-water">120</span></div>
                    <div class="res-item energy">⚡ <span id="hud-energy">80</span></div>
                </div>

                <div class="hud-actions">
                    <button class="hud-btn" id="btn-hud-sound" title="Alternar Áudio">🔊</button>
                    <button class="hud-btn" id="btn-hud-codex" title="${t('codex.title')}">📜</button>
                    <button class="hud-btn active" id="btn-mode-explore">${t('hud.mode.explore')}</button>
                    <button class="hud-btn" id="btn-mode-build">${t('hud.mode.build')}</button>
                    <button class="hud-btn" id="btn-mode-overview">${t('hud.mode.overview')}</button>
                    <button class="hud-btn" id="btn-hud-save" title="Salvar">💾</button>
                    <button class="hud-btn" id="btn-hud-scheduler" title="${t('scheduler.title')}">📋 ${t('scheduler.btn')}</button>
                    <button class="hud-btn" id="btn-hud-droid" title="Comunicação com o Droid">🤖 Droid</button>
                    <button class="hud-btn" id="btn-hud-settings" title="Configurações da Propriedade e Droid">⚙️</button>
                </div>
            </div>

            <!-- LEVEL UP BANNER -->
            <div class="hud-levelup-banner" id="hud-levelup-banner">
                ⭐ LEVEL UP! NOVO RANK NINJA! ⭐
            </div>

            <!-- CODEX / ALMANAQUE MODAL -->
            <div id="hud-codex-modal" class="hud-modal hud-interactive">
                <div class="codex-dialog">
                    <div class="codex-header">
                        <h2>📜 ${t('codex.title')}</h2>
                        <button id="btn-codex-close" class="codex-close-btn">✕</button>
                    </div>
                    <div class="codex-nav">
                        <button class="codex-tab active" data-tab="crops">🌾 ${t('codex.tab.crops')}</button>
                        <button class="codex-tab" data-tab="ranks">🥋 ${t('codex.tab.ranks')}</button>
                        <button class="codex-tab" data-tab="trials">📜 ${t('trials.tab')}</button>
                        <button class="codex-tab" data-tab="settings">⚙️ ${t('codex.tab.settings')}</button>
                    </div>
                    <div class="codex-body">
                        <!-- ABA 1: CULTURAS -->
                        <div class="codex-panel active" id="codex-panel-crops">
                            <div class="codex-crop-card">
                                <div class="crop-icon">🌾</div>
                                <div class="crop-details">
                                    <h3>Arroz Hidropônico (Traditional Rice)</h3>
                                    <p>Base alimentar tradicional shinobi. Crescimento confiável e alta resistência climática.</p>
                                    <div class="crop-specs">
                                        <span>⏱️ 45s</span>
                                        <span>💧 0.8/s</span>
                                        <span>🍙 +25 Alimento</span>
                                    </div>
                                </div>
                            </div>
                            <div class="codex-crop-card">
                                <div class="crop-icon">🥕</div>
                                <div class="crop-details">
                                    <h3>Cenoura Ninja (Shinobi Carrot)</h3>
                                    <p>Cultivo de ciclo ultra-rápido para reposição veloz de víveres da base.</p>
                                    <div class="crop-specs">
                                        <span>⏱️ 25s (Rápido)</span>
                                        <span>💧 0.5/s</span>
                                        <span>🍙 +15 Alimento</span>
                                    </div>
                                </div>
                            </div>
                            <div class="codex-crop-card">
                                <div class="crop-icon">🪷</div>
                                <div class="crop-details">
                                    <h3>Flor de Lótus Sagrada (Sacred Lotus)</h3>
                                    <p>Espécie mística aquática sagrada dos templos shinobi. Alto rendimento espiritual.</p>
                                    <div class="crop-specs">
                                        <span>⏱️ 55s</span>
                                        <span>💧 0.9/s</span>
                                        <span>🍙 +50 Alimento</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- ABA 2: GRADUAÇÕES -->
                        <div class="codex-panel" id="codex-panel-ranks">
                            <div class="codex-rank-card"><span class="rank-badge">LV.1</span> <div><strong>Iniciante Rural (Field Novice)</strong><br><small>Iniciação no caminho do cultivo e técnicas manuais de fazenda</small></div></div>
                            <div class="codex-rank-card"><span class="rank-badge">LV.2</span> <div><strong>Cultivador Prático (Skilled Cultivator)</strong><br><small>Domínio do ciclo solar, hídrico e manejo da terra</small></div></div>
                            <div class="codex-rank-card"><span class="rank-badge">LV.3</span> <div><strong>Mestre da Colheita (Master Harvester)</strong><br><small>Eficiência avançada na colheita e ferramentas físicas</small></div></div>
                            <div class="codex-rank-card"><span class="rank-badge">LV.4</span> <div><strong>Guardião da Fazenda (Estate Warden)</strong><br><small>Harmonia total com a terra fértil e fauna da propriedade</small></div></div>
                            <div class="codex-rank-card"><span class="rank-badge">LV.5</span> <div><strong>Grão-Agrônomo (Grand Agronomist)</strong><br><small>Patamar supremo da Fazenda Ninja autossustentável</small></div></div>
                        </div>

                        <!-- ABA 3: MISSÕES & PROVAS SHINOBI -->
                        <div class="codex-panel" id="codex-panel-trials">
                            <div id="codex-trials-content" style="display: flex; flex-direction: column; gap: 10px;"></div>
                        </div>

                        <!-- ABA 4: CONFIGURAÇÕES -->
                        <div class="codex-panel" id="codex-panel-settings">
                            <div class="codex-setting-row">
                                <span>🔊 ${t('settings.sound')}</span>
                                <button class="hud-btn" id="btn-setting-sound">${t('settings.sound.on')}</button>
                            </div>
                            <div class="codex-setting-row">
                                <span>📳 ${t('settings.haptics')}</span>
                                <button class="hud-btn" id="btn-setting-haptics">${t('settings.haptics.on')}</button>
                            </div>
                            <div class="codex-setting-row">
                                <span>🌐 ${t('settings.language')}</span>
                                <button class="hud-btn" id="btn-setting-lang">Português (BR)</button>
                            </div>
                            <div class="codex-setting-row">
                                <span>💾 IndexedDB</span>
                                <button class="hud-btn" id="btn-setting-save">${t('settings.save')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- WIDGETS LATERAIS -->
            <div class="hud-side-widgets hud-interactive">
                <div class="widget-card">
                    <div class="widget-header">
                        <span>⚡ ${t('hud.solar.status')}</span>
                        <span id="hud-solar-rate">+18 W</span>
                    </div>
                    <div>${t('hud.battery.status')}: <span id="hud-battery-text">80 / 150</span></div>
                    <div class="widget-bar-bg">
                        <div class="widget-bar-fill" id="hud-battery-bar" style="width: 53%; background: #FBBF24;"></div>
                    </div>
                </div>

                <div class="widget-card">
                    <div class="widget-header">
                        <span>💧 ${t('hud.water.status')}</span>
                        <span id="hud-water-text">120 / 300</span>
                    </div>
                    <div>${t('hud.water.status')}: <span id="hud-water-sub">120 / 300</span></div>
                    <div class="widget-bar-bg">
                        <div class="widget-bar-fill" id="hud-water-bar" style="width: 40%; background: #60A5FA;"></div>
                    </div>
                </div>
            </div>

            <!-- TOAST -->
            <div class="hud-toast" id="hud-toast-msg">Mensagem</div>

            <!-- BARRA INFERIOR -->
            <div class="hud-bottom-bar hud-interactive">
                <!-- GHOST ACTION BAR -->
                <div class="ghost-bar" id="hud-ghost-bar">
                    <span>Posicione na grade (Clique no terreno)</span>
                    <button class="hud-btn" id="btn-ghost-rotate">🔄 ${t('hud.build.rotate')}</button>
                    <button class="hud-btn" id="btn-ghost-cancel">❌ ${t('hud.build.cancel')}</button>
                </div>

                <!-- SELETOR DE CONSTRUÇÃO -->
                <div class="build-toolbar" id="hud-build-toolbar">
                    <button class="build-item-btn" data-type="crop_field">
                        <span class="build-item-icon">🌾</span>
                        <span>${t('hud.build.crop_field')}</span>
                    </button>
                    <button class="build-item-btn" data-type="solar_panel">
                        <span class="build-item-icon">☀️</span>
                        <span>${t('hud.build.solar_panel')}</span>
                    </button>
                    <button class="build-item-btn" data-type="battery">
                        <span class="build-item-icon">🔋</span>
                        <span>${t('hud.build.battery')}</span>
                    </button>
                    <button class="build-item-btn" data-type="water_tank">
                        <span class="build-item-icon">💧</span>
                        <span>${t('hud.build.water_tank')}</span>
                    </button>
                    <button class="build-item-btn" data-type="water_pump">
                        <span class="build-item-icon">🚰</span>
                        <span>${t('hud.build.water_pump')}</span>
                    </button>
                    <button class="build-item-btn" data-type="lamp_post">
                        <span class="build-item-icon">🏮</span>
                        <span>${t('hud.build.lamp_post')}</span>
                    </button>
                    <button class="build-item-btn" data-type="torii_gate">
                        <span class="build-item-icon">⛩️</span>
                        <span>${t('hud.build.torii_gate')}</span>
                    </button>
                    <button class="build-item-btn" data-type="shed">
                        <span class="build-item-icon">🛖</span>
                        <span>${t('hud.build.shed')}</span>
                    </button>
                    <button class="build-item-btn" data-type="hq">
                        <span class="build-item-icon">🏯</span>
                        <span>${t('hud.build.hq')}</span>
                    </button>
                    <button class="build-item-btn" data-type="bonfire">
                        <span class="build-item-icon">🔥</span>
                        <span>${t('hud.build.bonfire')}</span>
                    </button>
                    <button class="build-item-btn" data-type="fish_pond">
                        <span class="build-item-icon">🐟</span>
                        <span>${t('hud.build.fish_pond')}</span>
                    </button>
                    <button class="build-item-btn" data-type="chicken_coop">
                        <span class="build-item-icon">🐔</span>
                        <span>${t('hud.build.chicken_coop')}</span>
                    </button>
                    <button class="build-item-btn" id="btn-tool-demolish" style="border-color: rgba(239, 68, 68, 0.4); color: #FCA5A5;">
                        <span class="build-item-icon">🔨</span>
                        <span>Demolir</span>
                    </button>
                </div>
            </div>
        `;

        this.fpsElement = document.getElementById('hud-fps')!;
        this.timeElement = document.getElementById('hud-time')!;
        this.daysElement = document.getElementById('hud-days')!;
        this.woodElement = document.getElementById('hud-wood')!;
        this.metalElement = document.getElementById('hud-metal')!;
        this.partsElement = document.getElementById('hud-parts')!;
        this.foodElement = document.getElementById('hud-food')!;
        this.waterElement = document.getElementById('hud-water')!;
        this.energyElement = document.getElementById('hud-energy')!;
        this.solarRateElement = document.getElementById('hud-solar-rate')!;
        this.batteryElement = document.getElementById('hud-battery-text')!;
        this.buildBarElement = document.getElementById('hud-build-toolbar')!;
        this.ghostBarElement = document.getElementById('hud-ghost-bar')!;
        this.notificationElement = document.getElementById('hud-toast-msg')!;

        this.rankLevelElement = document.getElementById('hud-rank-level')!;
        this.rankTitleElement = document.getElementById('hud-rank-title')!;
        this.xpFillElement = document.getElementById('hud-xp-fill')!;
        this.xpTextElement = document.getElementById('hud-xp-text')!;
    }

    private setupEventListeners(): void {
        const btnExplore = document.getElementById('btn-mode-explore')!;
        const btnBuild = document.getElementById('btn-mode-build')!;
        const btnOverview = document.getElementById('btn-mode-overview')!;
        const btnSave = document.getElementById('btn-hud-save')!;

        const setMode = (mode: CameraMode) => {
            this.activeCameraMode = mode;
            [btnExplore, btnBuild, btnOverview].forEach((b) => b.classList.remove('active'));
            if (mode === 'explore') btnExplore.classList.add('active');
            if (mode === 'build') btnBuild.classList.add('active');
            if (mode === 'overview') btnOverview.classList.add('active');
            this.callbacks.onModeChange(mode);
        };

        const btnSound = document.getElementById('btn-hud-sound')!;
        btnSound.addEventListener('click', () => {
            const muted = sound.toggleMute();
            btnSound.textContent = muted ? '🔇' : '🔊';
            btnSound.title = muted ? 'Áudio Mudo' : 'Áudio Ativo';
        });

        const btnDemolish = document.getElementById('btn-tool-demolish');
        btnDemolish?.addEventListener('click', () => {
            this.clearSelection();
            sound.playClick();
            this.callbacks.onDemolishMode?.(true);
            this.showToast('Modo Demolição: Clique em uma estrutura para desmontar');
        });

        btnExplore.addEventListener('click', () => {
            sound.playClick();
            setMode('explore');
        });
        btnBuild.addEventListener('click', () => {
            sound.playClick();
            setMode('build');
        });
        btnOverview.addEventListener('click', () => {
            sound.playClick();
            setMode('overview');
        });
        btnSave.addEventListener('click', () => {
            sound.playClick();
            this.callbacks.onSaveGame();
        });

        const btnSettings = document.getElementById('btn-hud-settings');
        btnSettings?.addEventListener('click', () => {
            sound.playClick();
            triggerHaptic('light');
            this.callbacks.onOpenSettings?.();
        });

        const btnScheduler = document.getElementById('btn-hud-scheduler');
        btnScheduler?.addEventListener('click', () => {
            sound.playClick();
            triggerHaptic('light');
            this.callbacks.onOpenScheduler?.();
        });

        const btnDroid = document.getElementById('btn-hud-droid');
        btnDroid?.addEventListener('click', () => {
            sound.playClick();
            triggerHaptic('light');
            this.callbacks.onOpenDroidChat?.();
        });

        // Modal do Codex / Almanaque Shinobi
        const codexModal = document.getElementById('hud-codex-modal')!;
        const btnCodexOpen = document.getElementById('btn-hud-codex')!;
        const btnCodexClose = document.getElementById('btn-codex-close')!;

        const openCodex = () => {
            sound.playClick();
            triggerHaptic('light');
            this.updateCodexTrials();
            codexModal.classList.add('open');
        };

        const closeCodex = () => {
            sound.playClick();
            codexModal.classList.remove('open');
        };

        btnCodexOpen?.addEventListener('click', openCodex);
        btnCodexClose?.addEventListener('click', closeCodex);

        // Abas do Codex
        const codexTabs = codexModal.querySelectorAll('.codex-tab');
        const codexPanels = codexModal.querySelectorAll('.codex-panel');

        codexTabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                sound.playClick();
                triggerHaptic('light');
                const targetTab = (tab as HTMLElement).dataset.tab;
                codexTabs.forEach((t) => t.classList.remove('active'));
                tab.classList.add('active');

                if (targetTab === 'trials') {
                    this.updateCodexTrials();
                }

                codexPanels.forEach((p) => {
                    if (p.id === `codex-panel-${targetTab}`) {
                        p.classList.add('active');
                    } else {
                        p.classList.remove('active');
                    }
                });
            });
        });

        // Configurações dentro do Codex
        const btnSettingSound = document.getElementById('btn-setting-sound');
        btnSettingSound?.addEventListener('click', () => {
            const muted = sound.toggleMute();
            btnSettingSound.textContent = muted ? t('settings.sound.off') : t('settings.sound.on');
            btnSound.textContent = muted ? '🔇' : '🔊';
            triggerHaptic('light');
        });

        const btnSettingHaptics = document.getElementById('btn-setting-haptics');
        btnSettingHaptics?.addEventListener('click', () => {
            const next = !isHapticsEnabled();
            setHapticsEnabled(next);
            btnSettingHaptics.textContent = next ? t('settings.haptics.on') : t('settings.haptics.off');
            if (next) triggerHaptic('medium');
        });

        const btnSettingLang = document.getElementById('btn-setting-lang');
        btnSettingLang?.addEventListener('click', () => {
            const cur = getLanguage();
            const next = cur === 'pt' ? 'en' : 'pt';
            setLanguage(next);
            btnSettingLang.textContent = next === 'pt' ? 'Português (BR)' : 'English (US)';
            this.showToast(next === 'pt' ? 'Idioma alterado para Português' : 'Language changed to English');
            triggerHaptic('light');
        });

        const btnSettingSave = document.getElementById('btn-setting-save');
        btnSettingSave?.addEventListener('click', () => {
            sound.playClick();
            triggerHaptic('harvest');
            this.callbacks.onSaveGame();
        });

        // Botões da toolbar de construção
        const itemBtns = this.buildBarElement.querySelectorAll('.build-item-btn');
        itemBtns.forEach((btn) => {
            btn.addEventListener('click', () => {
                const bType = btn.getAttribute('data-type') as BuildingType;
                if (this.selectedBuilding === bType) {
                    this.clearSelection();
                } else {
                    this.selectBuilding(bType);
                }
            });
        });

        // Controles de rotação e cancelamento do ghost
        document.getElementById('btn-ghost-rotate')?.addEventListener('click', () => {
            this.callbacks.onRotateBuilding();
        });

        document.getElementById('btn-ghost-cancel')?.addEventListener('click', () => {
            this.clearSelection();
        });
    }

    selectBuilding(type: BuildingType): void {
        this.selectedBuilding = type;
        const itemBtns = this.buildBarElement.querySelectorAll('.build-item-btn');
        itemBtns.forEach((b) => {
            if (b.getAttribute('data-type') === type) {
                b.classList.add('selected');
            } else {
                b.classList.remove('selected');
            }
        });

        this.ghostBarElement.classList.add('active');
        this.callbacks.onSelectBuilding(type);
    }

    clearSelection(): void {
        this.selectedBuilding = null;
        this.buildBarElement.querySelectorAll('.build-item-btn').forEach((b) => b.classList.remove('selected'));
        this.ghostBarElement.classList.remove('active');
        this.callbacks.onSelectBuilding(null);
    }

    showToast(message: string): void {
        this.notificationElement.textContent = message;
        this.notificationElement.classList.add('show');
        setTimeout(() => {
            this.notificationElement.classList.remove('show');
        }, 3200);
    }

    showLevelUpBanner(level: number, title: string): void {
        const banner = document.getElementById('hud-levelup-banner');
        if (banner) {
            banner.textContent = `⭐ RANK UP! LV.${level} ${title.toUpperCase()} ⭐`;
            banner.classList.add('show');
            setTimeout(() => {
                banner.classList.remove('show');
            }, 3500);
        }
    }

    updateProgression(
        level: number,
        title: string,
        currentInTier: number,
        totalInTier: number,
        percentage: number
    ): void {
        if (this.rankLevelElement) {
            this.rankLevelElement.textContent = `LV.${level}`;
        }
        if (this.rankTitleElement) {
            this.rankTitleElement.textContent = title;
        }
        if (this.xpFillElement) {
            this.xpFillElement.style.width = `${percentage}%`;
        }
        if (this.xpTextElement) {
            this.xpTextElement.textContent = `${Math.floor(currentInTier)}/${totalInTier} XP`;
        }
    }

    updateResources(res: ResourceInventory): void {
        this.woodElement.textContent = Math.floor(res.wood).toString();
        this.metalElement.textContent = Math.floor(res.metal).toString();
        this.partsElement.textContent = Math.floor(res.parts).toString();
        this.foodElement.textContent = Math.floor(res.food).toString();
        this.waterElement.textContent = Math.floor(res.water).toString();
        this.energyElement.textContent = Math.floor(res.energy).toString();
    }

    updateClock(formattedTime: string, totalDays: number, fps: number): void {
        this.timeElement.textContent = formattedTime;
        this.daysElement.textContent = (totalDays + 1).toString();
        this.fpsElement.textContent = Math.round(fps).toString();
    }

    updateEnergy(metrics: EnergyMetrics): void {
        this.solarRateElement.textContent = `${metrics.productionRate >= 0 ? '+' : ''}${metrics.productionRate} W`;
        this.batteryElement.textContent = `${Math.floor(metrics.storedEnergy)} / ${metrics.capacity}`;
        const fill = document.getElementById('hud-battery-bar');
        if (fill) {
            const pct = Math.min(100, Math.max(0, (metrics.storedEnergy / metrics.capacity) * 100));
            fill.style.width = `${pct}%`;
        }
    }

    updateWater(metrics: WaterMetrics): void {
        const text = document.getElementById('hud-water-text');
        if (text) {
            text.textContent = `${Math.floor(metrics.storedWater)} / ${metrics.capacity}`;
        }
        const sub = document.getElementById('hud-water-sub');
        if (sub) {
            sub.textContent = `${Math.floor(metrics.storedWater)} / ${metrics.capacity}`;
        }
        const fill = document.getElementById('hud-water-bar');
        if (fill) {
            const pct = Math.min(100, Math.max(0, (metrics.storedWater / metrics.capacity) * 100));
            fill.style.width = `${pct}%`;
        }
    }

    setTrialsProvider(provider: () => string, onClaim: (id: string) => void): void {
        this.trialsHtmlProvider = provider;
        this.onClaimTrialCallback = onClaim;
        this.updateCodexTrials();
    }

    updateCodexTrials(): void {
        const container = this.container.querySelector('#codex-trials-content');
        if (container && this.trialsHtmlProvider) {
            container.innerHTML = this.trialsHtmlProvider();
            const claimBtns = container.querySelectorAll('[data-claim]');
            claimBtns.forEach((btn) => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = (btn as HTMLElement).dataset.claim;
                    if (id && this.onClaimTrialCallback) {
                        this.onClaimTrialCallback(id);
                        this.updateCodexTrials();
                    }
                });
            });
        }
    }

    isCodexOpen(): boolean {
        const codexModal = document.getElementById('hud-codex-modal');
        return codexModal?.classList.contains('open') ?? false;
    }

    closeCodex(): void {
        const codexModal = document.getElementById('hud-codex-modal');
        if (codexModal?.classList.contains('open')) {
            sound.playClick();
            codexModal.classList.remove('open');
        }
    }

    setCameraMode(mode: CameraMode): void {
        const btnExplore = document.getElementById('btn-mode-explore');
        const btnBuild = document.getElementById('btn-mode-build');
        const btnOverview = document.getElementById('btn-mode-overview');
        btnExplore?.classList.remove('active');
        btnBuild?.classList.remove('active');
        btnOverview?.classList.remove('active');
        if (mode === 'explore') btnExplore?.classList.add('active');
        if (mode === 'build') btnBuild?.classList.add('active');
        if (mode === 'overview') btnOverview?.classList.add('active');
        this.activeCameraMode = mode;
        this.callbacks.onModeChange(mode);
    }
}
