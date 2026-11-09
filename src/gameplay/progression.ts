import { sound } from '../audio/sound';

export interface NinjaRank {
    level: number;
    title: string;
    requiredXp: number;
}

export const NINJA_RANKS: NinjaRank[] = [
    { level: 1, title: 'Field Novice', requiredXp: 0 },
    { level: 2, title: 'Skilled Cultivator', requiredXp: 100 },
    { level: 3, title: 'Master Harvester', requiredXp: 280 },
    { level: 4, title: 'Estate Warden', requiredXp: 650 },
    { level: 5, title: 'Grand Agronomist', requiredXp: 1300 }
];

export class NinjaProgressionSystem {
    private currentXp: number = 0;
    private currentLevel: number = 1;
    private onLevelUpCallback?: (level: number, title: string) => void;

    constructor(initialXp: number = 0, onLevelUp?: (level: number, title: string) => void) {
        this.onLevelUpCallback = onLevelUp;
        this.setXp(initialXp);
    }

    setXp(xp: number): void {
        this.currentXp = Math.max(0, xp);
        this.recalculateLevel(false);
    }

    getXp(): number {
        return this.currentXp;
    }

    getLevel(): number {
        return this.currentLevel;
    }

    getCurrentRank(): NinjaRank {
        return NINJA_RANKS[this.currentLevel - 1] ?? NINJA_RANKS[NINJA_RANKS.length - 1];
    }

    getNextRank(): NinjaRank | null {
        if (this.currentLevel >= NINJA_RANKS.length) return null;
        return NINJA_RANKS[this.currentLevel];
    }

    getXpProgress(): { current: number; max: number; percentage: number } {
        const currentRank = this.getCurrentRank();
        const nextRank = this.getNextRank();

        if (!nextRank) {
            return { current: this.currentXp, max: this.currentXp, percentage: 100 };
        }

        const currentInTier = this.currentXp - currentRank.requiredXp;
        const totalNeededInTier = nextRank.requiredXp - currentRank.requiredXp;
        const percentage = Math.min(100, Math.max(0, (currentInTier / totalNeededInTier) * 100));

        return {
            current: currentInTier,
            max: totalNeededInTier,
            percentage
        };
    }

    addXP(amount: number): { leveledUp: boolean; newLevel: number; title: string } {
        this.currentXp += amount;
        return this.recalculateLevel(true);
    }

    private recalculateLevel(notify: boolean): { leveledUp: boolean; newLevel: number; title: string } {
        let newLevel = 1;
        for (let i = NINJA_RANKS.length - 1; i >= 0; i--) {
            if (this.currentXp >= NINJA_RANKS[i].requiredXp) {
                newLevel = NINJA_RANKS[i].level;
                break;
            }
        }

        const didLevelUp = newLevel > this.currentLevel;
        this.currentLevel = newLevel;
        const rank = this.getCurrentRank();

        if (didLevelUp && notify) {
            sound.playLevelUp();
            this.onLevelUpCallback?.(this.currentLevel, rank.title);
        }

        return {
            leveledUp: didLevelUp,
            newLevel: this.currentLevel,
            title: rank.title
        };
    }
}

