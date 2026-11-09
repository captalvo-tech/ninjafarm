import { describe, expect, it, vi } from 'vitest';
import { NinjaProgressionSystem, NINJA_RANKS } from '../../src/gameplay/progression';

describe('NinjaProgressionSystem', () => {
    it('initializes at level 1 Genin Farmer with 0 XP', () => {
        const prog = new NinjaProgressionSystem();
        expect(prog.getLevel()).toBe(1);
        expect(prog.getXp()).toBe(0);
        expect(prog.getCurrentRank().title).toBe('Genin Farmer');
    });

    it('advances to Chunin Cultivator upon reaching 100 XP', () => {
        const onLevelUp = vi.fn();
        const prog = new NinjaProgressionSystem(0, onLevelUp);

        const res = prog.addXP(105);
        expect(res.leveledUp).toBe(true);
        expect(res.newLevel).toBe(2);
        expect(res.title).toBe('Chunin Cultivator');
        expect(prog.getLevel()).toBe(2);
        expect(onLevelUp).toHaveBeenCalledWith(2, 'Chunin Cultivator');
    });

    it('calculates tier progress percentage accurately', () => {
        const prog = new NinjaProgressionSystem(50);
        const p = prog.getXpProgress();
        expect(p.current).toBe(50);
        expect(p.max).toBe(100);
        expect(p.percentage).toBe(50);
    });

    it('caps at maximum level gracefully', () => {
        const prog = new NinjaProgressionSystem(3000);
        expect(prog.getLevel()).toBe(NINJA_RANKS.length);
        expect(prog.getNextRank()).toBeNull();
        expect(prog.getXpProgress().percentage).toBe(100);
    });
});

