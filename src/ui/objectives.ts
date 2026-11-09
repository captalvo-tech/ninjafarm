import { t } from './i18n';
import { sound } from '../audio/sound';
import { triggerHaptic } from '../input/haptics';
import type { BuildingType, CropType } from '../core/types';

export interface TrialReward {
    xp: number;
    resourceType?: 'wood' | 'metal' | 'parts' | 'food' | 'water' | 'energy';
    resourceAmount?: number;
}

export interface ShinobiTrial {
    id: string;
    chapter: number;
    titleKey: string;
    descKey: string;
    icon: string;
    targetCount: number;
    currentCount: number;
    completed: boolean;
    claimed: boolean;
    reward: TrialReward;
}

export interface ObjectiveManagerOptions {
    onClaimReward?: (reward: TrialReward, trial: ShinobiTrial) => void;
}

export class ObjectiveManager {
    private trials: ShinobiTrial[] = [
        // ==================== CAPÍTULO I: FUNDAÇÕES AGRÍCOLAS ====================
        {
            id: 'plant_rice',
            chapter: 1,
            titleKey: 'trial.plant_rice.title',
            descKey: 'trial.plant_rice.desc',
            icon: '🌾',
            targetCount: 2,
            currentCount: 0,
            completed: false,
            claimed: false,
            reward: { xp: 30, resourceType: 'wood', resourceAmount: 30 }
        },
        {
            id: 'water_soil',
            chapter: 1,
            titleKey: 'trial.water_soil.title',
            descKey: 'trial.water_soil.desc',
            icon: '💧',
            targetCount: 2,
            currentCount: 0,
            completed: false,
            claimed: false,
            reward: { xp: 35, resourceType: 'energy', resourceAmount: 30 }
        },
        {
            id: 'harvest_first',
            chapter: 1,
            titleKey: 'trial.harvest_first.title',
            descKey: 'trial.harvest_first.desc',
            icon: '🍙',
            targetCount: 3,
            currentCount: 0,
            completed: false,
            claimed: false,
            reward: { xp: 40, resourceType: 'food', resourceAmount: 35 }
        },

        // ==================== CAPÍTULO II: REDE HÍDRICA & SOLAR ====================
        {
            id: 'build_solar',
            chapter: 2,
            titleKey: 'trial.build_solar.title',
            descKey: 'trial.build_solar.desc',
            icon: '☀️',
            targetCount: 1,
            currentCount: 0,
            completed: false,
            claimed: false,
            reward: { xp: 45, resourceType: 'metal', resourceAmount: 35 }
        },
        {
            id: 'build_battery',
            chapter: 2,
            titleKey: 'trial.build_battery.title',
            descKey: 'trial.build_battery.desc',
            icon: '🔋',
            targetCount: 1,
            currentCount: 0,
            completed: false,
            claimed: false,
            reward: { xp: 50, resourceType: 'parts', resourceAmount: 25 }
        },
        {
            id: 'build_pump',
            chapter: 2,
            titleKey: 'trial.build_pump.title',
            descKey: 'trial.build_pump.desc',
            icon: '🚰',
            targetCount: 1,
            currentCount: 0,
            completed: false,
            claimed: false,
            reward: { xp: 60, resourceType: 'water', resourceAmount: 50 }
        },
        {
            id: 'build_cistern',
            chapter: 2,
            titleKey: 'trial.build_cistern.title',
            descKey: 'trial.build_cistern.desc',
            icon: '🪣',
            targetCount: 1,
            currentCount: 0,
            completed: false,
            claimed: false,
            reward: { xp: 55, resourceType: 'wood', resourceAmount: 40 }
        },

        // ==================== CAPÍTULO III: DIVERSIFICAÇÃO AGROECOLÓGICA ====================
        {
            id: 'plant_carrot',
            chapter: 3,
            titleKey: 'trial.plant_carrot.title',
            descKey: 'trial.plant_carrot.desc',
            icon: '🥕',
            targetCount: 2,
            currentCount: 0,
            completed: false,
            claimed: false,
            reward: { xp: 35, resourceType: 'water', resourceAmount: 30 }
        },
        {
            id: 'plant_lotus',
            chapter: 3,
            titleKey: 'trial.plant_lotus.title',
            descKey: 'trial.plant_lotus.desc',
            icon: '🪷',
            targetCount: 1,
            currentCount: 0,
            completed: false,
            claimed: false,
            reward: { xp: 65, resourceType: 'food', resourceAmount: 50 }
        },
        {
            id: 'harvest_combo',
            chapter: 3,
            titleKey: 'trial.harvest_combo.title',
            descKey: 'trial.harvest_combo.desc',
            icon: '⚡',
            targetCount: 1,
            currentCount: 0,
            completed: false,
            claimed: false,
            reward: { xp: 50, resourceType: 'wood', resourceAmount: 35 }
        },

        // ==================== CAPÍTULO IV: PECUÁRIA & AQUAPONIA ====================
        {
            id: 'build_chicken_coop',
            chapter: 4,
            titleKey: 'trial.build_chicken_coop.title',
            descKey: 'trial.build_chicken_coop.desc',
            icon: '🐔',
            targetCount: 1,
            currentCount: 0,
            completed: false,
            claimed: false,
            reward: { xp: 65, resourceType: 'wood', resourceAmount: 45 }
        },
        {
            id: 'feed_animals',
            chapter: 4,
            titleKey: 'trial.feed_animals.title',
            descKey: 'trial.feed_animals.desc',
            icon: '🥚',
            targetCount: 2,
            currentCount: 0,
            completed: false,
            claimed: false,
            reward: { xp: 40, resourceType: 'food', resourceAmount: 25 }
        },
        {
            id: 'build_fish_pond',
            chapter: 4,
            titleKey: 'trial.build_fish_pond.title',
            descKey: 'trial.build_fish_pond.desc',
            icon: '🐟',
            targetCount: 1,
            currentCount: 0,
            completed: false,
            claimed: false,
            reward: { xp: 70, resourceType: 'parts', resourceAmount: 30 }
        },
        {
            id: 'fish_koi',
            chapter: 4,
            titleKey: 'trial.fish_koi.title',
            descKey: 'trial.fish_koi.desc',
            icon: '🎣',
            targetCount: 1,
            currentCount: 0,
            completed: false,
            claimed: false,
            reward: { xp: 45, resourceType: 'food', resourceAmount: 40 }
        },

        // ==================== CAPÍTULO V: SANTUÁRIO AUTOSSUSTENTÁVEL ====================
        {
            id: 'build_shed',
            chapter: 5,
            titleKey: 'trial.build_shed.title',
            descKey: 'trial.build_shed.desc',
            icon: '🛖',
            targetCount: 1,
            currentCount: 0,
            completed: false,
            claimed: false,
            reward: { xp: 75, resourceType: 'metal', resourceAmount: 40 }
        },
        {
            id: 'build_lamp',
            chapter: 5,
            titleKey: 'trial.build_lamp.title',
            descKey: 'trial.build_lamp.desc',
            icon: '🏮',
            targetCount: 2,
            currentCount: 0,
            completed: false,
            claimed: false,
            reward: { xp: 45, resourceType: 'metal', resourceAmount: 25 }
        },
        {
            id: 'build_bonfire',
            chapter: 5,
            titleKey: 'trial.build_bonfire.title',
            descKey: 'trial.build_bonfire.desc',
            icon: '🔥',
            targetCount: 1,
            currentCount: 0,
            completed: false,
            claimed: false,
            reward: { xp: 50, resourceType: 'energy', resourceAmount: 35 }
        },
        {
            id: 'trade_merchant',
            chapter: 5,
            titleKey: 'trial.trade_merchant.title',
            descKey: 'trial.trade_merchant.desc',
            icon: '🪙',
            targetCount: 1,
            currentCount: 0,
            completed: false,
            claimed: false,
            reward: { xp: 80, resourceType: 'metal', resourceAmount: 50 }
        },
        {
            id: 'build_torii',
            chapter: 5,
            titleKey: 'trial.build_torii.title',
            descKey: 'trial.build_torii.desc',
            icon: '⛩️',
            targetCount: 1,
            currentCount: 0,
            completed: false,
            claimed: false,
            reward: { xp: 150, resourceType: 'wood', resourceAmount: 100 }
        },

        // ==================== OBJETIVOS GERAIS (COMPATIBILIDADE) ====================
        {
            id: 'explore',
            chapter: 1,
            titleKey: 'trial.explore.title',
            descKey: 'trial.explore.desc',
            icon: '🏃',
            targetCount: 1,
            currentCount: 0,
            completed: false,
            claimed: false,
            reward: { xp: 20, resourceType: 'wood', resourceAmount: 25 }
        },
        {
            id: 'harvest',
            chapter: 1,
            titleKey: 'trial.harvest.title',
            descKey: 'trial.harvest.desc',
            icon: '🌾',
            targetCount: 3,
            currentCount: 0,
            completed: false,
            claimed: false,
            reward: { xp: 35, resourceType: 'food', resourceAmount: 30 }
        },
        {
            id: 'plant',
            chapter: 1,
            titleKey: 'trial.plant.title',
            descKey: 'trial.plant.desc',
            icon: '🌱',
            targetCount: 2,
            currentCount: 0,
            completed: false,
            claimed: false,
            reward: { xp: 25, resourceType: 'water', resourceAmount: 25 }
        },
        {
            id: 'suiton',
            chapter: 1,
            titleKey: 'trial.suiton.title',
            descKey: 'trial.suiton.desc',
            icon: '🌊',
            targetCount: 1,
            currentCount: 0,
            completed: false,
            claimed: false,
            reward: { xp: 30, resourceType: 'energy', resourceAmount: 30 }
        },
        {
            id: 'fish',
            chapter: 4,
            titleKey: 'trial.fish.title',
            descKey: 'trial.fish.desc',
            icon: '🐟',
            targetCount: 1,
            currentCount: 0,
            completed: false,
            claimed: false,
            reward: { xp: 30, resourceType: 'food', resourceAmount: 35 }
        },
        {
            id: 'bonfire',
            chapter: 5,
            titleKey: 'trial.bonfire.title',
            descKey: 'trial.bonfire.desc',
            icon: '🔥',
            targetCount: 1,
            currentCount: 0,
            completed: false,
            claimed: false,
            reward: { xp: 25, resourceType: 'energy', resourceAmount: 25 }
        },
        {
            id: 'merchant',
            chapter: 5,
            titleKey: 'trial.merchant.title',
            descKey: 'trial.merchant.desc',
            icon: '🪙',
            targetCount: 1,
            currentCount: 0,
            completed: false,
            claimed: false,
            reward: { xp: 45, resourceType: 'metal', resourceAmount: 35 }
        },
        {
            id: 'pet',
            chapter: 4,
            titleKey: 'trial.pet.title',
            descKey: 'trial.pet.desc',
            icon: '🦊',
            targetCount: 2,
            currentCount: 0,
            completed: false,
            claimed: false,
            reward: { xp: 30, resourceType: 'food', resourceAmount: 20 }
        },
        {
            id: 'shuriken',
            chapter: 1,
            titleKey: 'trial.shuriken.title',
            descKey: 'trial.shuriken.desc',
            icon: '🎯',
            targetCount: 2,
            currentCount: 0,
            completed: false,
            claimed: false,
            reward: { xp: 30, resourceType: 'wood', resourceAmount: 25 }
        },
        {
            id: 'build',
            chapter: 2,
            titleKey: 'trial.build.title',
            descKey: 'trial.build.desc',
            icon: '🏗️',
            targetCount: 1,
            currentCount: 0,
            completed: false,
            claimed: false,
            reward: { xp: 50, resourceType: 'parts', resourceAmount: 40 }
        }
    ];

    private options: ObjectiveManagerOptions;
    private pillElement?: HTMLElement;
    private modalElement?: HTMLElement;
    private isOpen = false;

    constructor(options: ObjectiveManagerOptions = {}) {
        this.options = options;

        if (typeof document !== 'undefined') {
            this.pillElement = document.createElement('div');
            this.pillElement.id = 'ninja-trials-pill';

            this.modalElement = document.createElement('div');
            this.modalElement.id = 'ninja-trials-modal';

            this.injectStyles();
            document.body.appendChild(this.pillElement);
            document.body.appendChild(this.modalElement);

            this.setupEvents();
            this.renderPill();
            this.renderModal();
        }
    }

    setRewardCallback(cb: (reward: TrialReward, trial: ShinobiTrial) => void): void {
        this.options.onClaimReward = cb;
    }

    isModalOpen(): boolean {
        return this.isOpen;
    }

    private injectStyles(): void {
        const style = document.createElement('style');
        style.textContent = `
            /* FLOATING MOBILE PILL */
            #ninja-trials-pill {
                position: fixed;
                top: 56px;
                left: 12px;
                background: rgba(15, 23, 42, 0.94);
                backdrop-filter: blur(14px);
                border: 1.5px solid rgba(16, 185, 129, 0.45);
                border-radius: 24px;
                padding: 6px 14px;
                color: #FFFFFF;
                font-family: 'DM Sans', -apple-system, sans-serif;
                font-size: 12px;
                font-weight: 800;
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                z-index: 120;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
                transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                user-select: none;
                pointer-events: auto;
            }

            #ninja-trials-pill:active {
                transform: scale(0.96);
            }

            .trials-pill-badge {
                background: rgba(16, 185, 129, 0.2);
                border: 1px solid #10B981;
                color: #34D399;
                padding: 1px 7px;
                border-radius: 10px;
                font-size: 11px;
            }

            .trials-claim-badge {
                background: linear-gradient(135deg, #F59E0B, #D97706);
                color: #FFFFFF;
                padding: 1px 7px;
                border-radius: 10px;
                font-size: 11px;
                animation: pulseClaim 1.5s infinite ease-in-out;
            }

            @keyframes pulseClaim {
                0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.6); }
                50% { transform: scale(1.08); box-shadow: 0 0 0 6px rgba(245, 158, 11, 0); }
                100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
            }

            /* TRIALS MODAL / BOTTOM SHEET */
            #ninja-trials-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(11, 15, 25, 0.85);
                backdrop-filter: blur(12px);
                z-index: 260;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 16px;
                box-sizing: border-box;
                opacity: 0;
                transition: opacity 0.25s ease;
                pointer-events: auto;
            }

            #ninja-trials-modal.open {
                display: flex;
                opacity: 1;
            }

            .trials-card {
                background: rgba(15, 23, 42, 0.98);
                border: 1.5px solid rgba(16, 185, 129, 0.45);
                border-radius: 20px;
                width: 100%;
                max-width: 520px;
                max-height: 86vh;
                display: flex;
                flex-direction: column;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7);
                overflow: hidden;
            }

            .trials-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 16px 20px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            }

            .trials-header-title {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .trials-header-title h2 {
                margin: 0;
                font-size: 16px;
                color: #FFFFFF;
                font-weight: 800;
                letter-spacing: 0.3px;
            }

            .trials-header-title span {
                font-size: 11px;
                color: #9CA3AF;
            }

            .trials-close-btn {
                background: rgba(255, 255, 255, 0.1);
                border: none;
                color: #FFFFFF;
                font-size: 16px;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s;
            }

            .trials-close-btn:active {
                background: rgba(255, 255, 255, 0.25);
            }

            .trials-list {
                padding: 14px 18px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 12px;
                max-height: 68vh;
                -webkit-overflow-scrolling: touch;
            }

            .chapter-banner {
                background: rgba(16, 185, 129, 0.12);
                border-left: 3px solid #10B981;
                border-radius: 6px;
                padding: 6px 10px;
                font-size: 12px;
                font-weight: 800;
                color: #34D399;
                letter-spacing: 0.5px;
                margin-top: 6px;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .trial-row {
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 14px;
                padding: 12px 14px;
                display: flex;
                flex-direction: column;
                gap: 8px;
                transition: all 0.2s ease;
            }

            .trial-row.completed:not(.claimed) {
                border-color: rgba(245, 158, 11, 0.6);
                background: rgba(245, 158, 11, 0.08);
            }

            .trial-row.claimed {
                opacity: 0.6;
                border-color: rgba(16, 185, 129, 0.2);
            }

            .trial-top {
                display: flex;
                align-items: center;
                gap: 12px;
                justify-content: space-between;
            }

            .trial-info {
                display: flex;
                align-items: center;
                gap: 10px;
                flex: 1;
            }

            .trial-icon {
                font-size: 22px;
                width: 34px;
                height: 34px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(255, 255, 255, 0.06);
                border-radius: 10px;
                flex-shrink: 0;
            }

            .trial-texts {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .trial-name {
                font-size: 13px;
                font-weight: 800;
                color: #FFFFFF;
            }

            .trial-desc {
                font-size: 11px;
                color: #9CA3AF;
                line-height: 1.3;
            }

            .trial-progress-bar-bg {
                width: 100%;
                height: 6px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                overflow: hidden;
            }

            .trial-progress-bar-fill {
                height: 100%;
                background: linear-gradient(90deg, #10B981, #34D399);
                border-radius: 4px;
                transition: width 0.3s ease;
            }

            .trial-bottom {
                display: flex;
                align-items: center;
                justify-content: space-between;
                font-size: 11px;
                margin-top: 2px;
            }

            .trial-reward-label {
                color: #FBBF24;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 5px;
            }

            .trial-claim-btn {
                background: linear-gradient(135deg, #10B981, #059669);
                border: 1px solid #34D399;
                color: #FFFFFF;
                font-weight: 800;
                font-size: 11px;
                padding: 6px 14px;
                border-radius: 12px;
                cursor: pointer;
                transition: all 0.2s;
                display: inline-flex;
                align-items: center;
                gap: 4px;
            }

            .trial-claim-btn:active {
                transform: scale(0.95);
            }

            .trial-claimed-badge {
                color: #34D399;
                font-weight: 800;
                font-size: 11px;
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .trial-pending-badge {
                color: #9CA3AF;
                font-weight: 700;
                font-size: 11px;
            }

            @media (max-width: 900px) {
                #ninja-trials-pill {
                    top: calc(48px + env(safe-area-inset-top, 0px));
                    left: 10px;
                    padding: 5px 10px;
                    font-size: 11px;
                }
                .trials-card {
                    max-height: 82vh;
                    border-radius: 16px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    private setupEvents(): void {
        this.pillElement?.addEventListener('click', () => {
            triggerHaptic('light');
            sound.playClick();
            this.openModal();
        });

        this.modalElement?.addEventListener('click', (e) => {
            if (e.target === this.modalElement) {
                this.closeModal();
            }
        });
    }

    openModal(): void {
        this.isOpen = true;
        this.renderModal();
        this.modalElement?.classList.add('open');
    }

    closeModal(): void {
        this.isOpen = false;
        this.modalElement?.classList.remove('open');
    }

    toggleModal(): void {
        if (this.isOpen) {
            this.closeModal();
        } else {
            this.openModal();
        }
    }

    recordProgress(id: string, amount: number = 1): void {
        const trial = this.trials.find(t => t.id === id);
        if (!trial || trial.completed) return;

        trial.currentCount = Math.min(trial.targetCount, trial.currentCount + amount);
        if (trial.currentCount >= trial.targetCount && !trial.completed) {
            trial.completed = true;
            sound.playQuestComplete();
            triggerHaptic('success');
        }

        this.renderPill();
        if (this.isOpen) {
            this.renderModal();
        }
    }

    recordBuildingPlaced(type: BuildingType): void {
        this.recordProgress('build', 1);
        switch (type) {
            case 'solar_panel':
                this.recordProgress('build_solar', 1);
                break;
            case 'battery':
                this.recordProgress('build_battery', 1);
                break;
            case 'water_pump':
                this.recordProgress('build_pump', 1);
                break;
            case 'water_tank':
                this.recordProgress('build_cistern', 1);
                break;
            case 'chicken_coop':
                this.recordProgress('build_chicken_coop', 1);
                break;
            case 'fish_pond':
                this.recordProgress('build_fish_pond', 1);
                break;
            case 'shed':
                this.recordProgress('build_shed', 1);
                break;
            case 'lamp_post':
                this.recordProgress('build_lamp', 1);
                break;
            case 'bonfire':
                this.recordProgress('build_bonfire', 1);
                break;
            case 'torii_gate':
                this.recordProgress('build_torii', 1);
                break;
        }
    }

    recordCropPlanted(cropType: CropType): void {
        this.recordProgress('plant', 1);
        if (cropType === 'rice') {
            this.recordProgress('plant_rice', 1);
        } else if (cropType === 'vegetable') {
            this.recordProgress('plant_carrot', 1);
        } else if (cropType === 'lotus') {
            this.recordProgress('plant_lotus', 1);
        }
    }

    recordCropHarvested(_cropType: CropType): void {
        this.recordProgress('harvest', 1);
        this.recordProgress('harvest_first', 1);
    }

    completeObjective(id: string): void {
        const trial = this.trials.find(t => t.id === id);
        if (trial && !trial.completed) {
            trial.currentCount = trial.targetCount;
            trial.completed = true;
            sound.playQuestComplete();
            triggerHaptic('success');
            this.renderPill();
            if (this.isOpen) {
                this.renderModal();
            }
        }
    }

    claimReward(id: string): void {
        const trial = this.trials.find(t => t.id === id);
        if (!trial || !trial.completed || trial.claimed) return;

        trial.claimed = true;
        sound.playQuestComplete();
        triggerHaptic('success');

        if (this.options.onClaimReward) {
            this.options.onClaimReward(trial.reward, trial);
        }

        this.renderPill();
        this.renderModal();
    }

    getCompletedCount(): number {
        return this.trials.filter(t => t.completed).length;
    }

    getUnclaimedCount(): number {
        return this.trials.filter(t => t.completed && !t.claimed).length;
    }

    getTrials(): ShinobiTrial[] {
        return this.trials;
    }

    private renderPill(): void {
        if (!this.pillElement) return;

        const completed = this.getCompletedCount();
        const unclaimed = this.getUnclaimedCount();
        const total = this.trials.length;

        let giftBadgeHtml = '';
        if (unclaimed > 0) {
            giftBadgeHtml = `<span class="trials-claim-badge">🎁 ${unclaimed}</span>`;
        }

        this.pillElement.innerHTML = `
            <span>📜</span>
            <span>${t('trials.pill')}</span>
            <span class="trials-pill-badge">${completed}/${total}</span>
            ${giftBadgeHtml}
        `;
    }

    private formatReward(reward: TrialReward): string {
        const parts: string[] = [`+${reward.xp} XP`];
        if (reward.resourceType && reward.resourceAmount) {
            const iconMap: Record<string, string> = {
                wood: '🪵',
                metal: '⚙️',
                parts: '🔩',
                food: '🍙',
                water: '💧',
                energy: '⚡'
            };
            const icon = iconMap[reward.resourceType] || '📦';
            parts.push(`+${reward.resourceAmount} ${icon}`);
        }
        return parts.join(' | ');
    }

    renderTrialsListHtml(): string {
        const chapterGroups: Record<number, ShinobiTrial[]> = {};
        for (const trial of this.trials) {
            if (!chapterGroups[trial.chapter]) {
                chapterGroups[trial.chapter] = [];
            }
            chapterGroups[trial.chapter].push(trial);
        }

        const chapterOrder = [1, 2, 3, 4, 5];
        return chapterOrder.map(chNum => {
            const trialsInChapter = chapterGroups[chNum];
            if (!trialsInChapter || trialsInChapter.length === 0) return '';

            const chapterTitle = t(`chapter.${chNum}`);
            const cardsHtml = trialsInChapter.map(trial => {
                const pct = Math.min(100, Math.round((trial.currentCount / trial.targetCount) * 100));
                const rewardLabel = this.formatReward(trial.reward);

                let actionHtml = '';
                if (trial.claimed) {
                    actionHtml = `<span class="trial-claimed-badge">✓ ${t('trials.claimed')}</span>`;
                } else if (trial.completed) {
                    actionHtml = `<button class="trial-claim-btn" data-claim="${trial.id}">🎁 ${t('trials.claim')}</button>`;
                } else {
                    actionHtml = `<span class="trial-pending-badge">${trial.currentCount}/${trial.targetCount}</span>`;
                }

                return `
                    <div class="trial-row ${trial.completed ? 'completed' : ''} ${trial.claimed ? 'claimed' : ''}">
                        <div class="trial-top">
                            <div class="trial-info">
                                <div class="trial-icon">${trial.icon}</div>
                                <div class="trial-texts">
                                    <span class="trial-name">${t(trial.titleKey)}</span>
                                    <span class="trial-desc">${t(trial.descKey)}</span>
                                </div>
                            </div>
                        </div>
                        <div class="trial-progress-bar-bg">
                            <div class="trial-progress-bar-fill" style="width: ${pct}%;"></div>
                        </div>
                        <div class="trial-bottom">
                            <span class="trial-reward-label">✨ ${rewardLabel}</span>
                            ${actionHtml}
                        </div>
                    </div>
                `;
            }).join('');

            return `
                <div class="chapter-section">
                    <div class="chapter-banner">🌱 ${chapterTitle}</div>
                    <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 6px;">
                        ${cardsHtml}
                    </div>
                </div>
            `;
        }).join('');
    }

    private renderModal(): void {
        if (!this.modalElement) return;

        this.modalElement.innerHTML = `
            <div class="trials-card">
                <div class="trials-header">
                    <div class="trials-header-title">
                        <h2>📜 ${t('trials.title')}</h2>
                        <span>${t('trials.subtitle')}</span>
                    </div>
                    <button class="trials-close-btn" id="btn-trials-close">✕</button>
                </div>
                <div class="trials-list">
                    ${this.renderTrialsListHtml()}
                </div>
            </div>
        `;

        const closeBtn = this.modalElement.querySelector('#btn-trials-close');
        closeBtn?.addEventListener('click', () => {
            sound.playClick();
            this.closeModal();
        });

        // Event listener para botões de resgate
        const claimBtns = this.modalElement.querySelectorAll('[data-claim]');
        claimBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = (btn as HTMLElement).dataset.claim;
                if (id) {
                    this.claimReward(id);
                }
            });
        });
    }
}
