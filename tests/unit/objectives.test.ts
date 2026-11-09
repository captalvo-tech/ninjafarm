import { describe, expect, it, vi } from 'vitest';
import { ObjectiveManager } from '../../src/ui/objectives';

describe('ObjectiveManager (Farm Expansion & Building Trials)', () => {
    it('initializes with all farm trials unclaimed and incomplete', () => {
        const mgr = new ObjectiveManager();
        const trials = mgr.getTrials();
        expect(trials.length).toBeGreaterThanOrEqual(15);
        expect(mgr.getCompletedCount()).toBe(0);
        expect(mgr.getUnclaimedCount()).toBe(0);

        for (const t of trials) {
            expect(t.completed).toBe(false);
            expect(t.claimed).toBe(false);
            expect(t.currentCount).toBe(0);
            expect(t.targetCount).toBeGreaterThan(0);
            expect(t.reward.xp).toBeGreaterThan(0);
        }
    });

    it('records progress incrementally towards target count and completes', () => {
        const mgr = new ObjectiveManager();
        // harvest target is 3
        mgr.recordProgress('harvest', 1);
        expect(mgr.getCompletedCount()).toBe(0);
        expect(mgr.getTrials().find(t => t.id === 'harvest')?.currentCount).toBe(1);

        mgr.recordProgress('harvest', 2);
        expect(mgr.getCompletedCount()).toBeGreaterThanOrEqual(1);
        expect(mgr.getUnclaimedCount()).toBeGreaterThanOrEqual(1);
        expect(mgr.getTrials().find(t => t.id === 'harvest')?.completed).toBe(true);
        expect(mgr.getTrials().find(t => t.id === 'harvest')?.claimed).toBe(false);
    });

    it('records building construction specifically', () => {
        const mgr = new ObjectiveManager();
        mgr.recordBuildingPlaced('solar_panel');
        expect(mgr.getTrials().find(t => t.id === 'build_solar')?.completed).toBe(true);
        expect(mgr.getTrials().find(t => t.id === 'build')?.completed).toBe(true);

        mgr.recordBuildingPlaced('water_pump');
        expect(mgr.getTrials().find(t => t.id === 'build_pump')?.completed).toBe(true);
    });

    it('records crop planting and harvesting specifically', () => {
        const mgr = new ObjectiveManager();
        mgr.recordCropPlanted('rice');
        expect(mgr.getTrials().find(t => t.id === 'plant')?.currentCount).toBe(1);
        expect(mgr.getTrials().find(t => t.id === 'plant_rice')?.currentCount).toBe(1);

        mgr.recordCropHarvested('rice');
        expect(mgr.getTrials().find(t => t.id === 'harvest')?.currentCount).toBe(1);
        expect(mgr.getTrials().find(t => t.id === 'harvest_first')?.currentCount).toBe(1);
    });

    it('immediately completes trial when completeObjective is called', () => {
        const mgr = new ObjectiveManager();
        mgr.completeObjective('fish');
        const trial = mgr.getTrials().find(t => t.id === 'fish');
        expect(trial?.completed).toBe(true);
        expect(trial?.currentCount).toBe(trial?.targetCount);
        expect(mgr.getUnclaimedCount()).toBeGreaterThanOrEqual(1);
    });

    it('claims reward and invokes onClaimReward callback accurately', () => {
        const onClaim = vi.fn();
        const mgr = new ObjectiveManager({ onClaimReward: onClaim });

        mgr.completeObjective('bonfire');
        const initialUnclaimed = mgr.getUnclaimedCount();
        expect(initialUnclaimed).toBeGreaterThanOrEqual(1);

        mgr.claimReward('bonfire');
        const trial = mgr.getTrials().find(t => t.id === 'bonfire');
        expect(trial?.claimed).toBe(true);
        expect(mgr.getUnclaimedCount()).toBe(initialUnclaimed - 1);
        expect(onClaim).toHaveBeenCalledWith(
            expect.objectContaining({
                xp: 25,
                resourceType: 'energy',
                resourceAmount: 25
            }),
            trial
        );
    });

    it('prevents double-claiming rewards', () => {
        const onClaim = vi.fn();
        const mgr = new ObjectiveManager({ onClaimReward: onClaim });

        mgr.completeObjective('irrigation');
        mgr.claimReward('irrigation');
        expect(onClaim).toHaveBeenCalledTimes(1);

        // Attempt second claim
        mgr.claimReward('irrigation');
        expect(onClaim).toHaveBeenCalledTimes(1);
    });

    it('renders clean HTML markup with chapters for trials list', () => {
        const mgr = new ObjectiveManager();
        mgr.completeObjective('plant_rice');
        const html = mgr.renderTrialsListHtml();
        expect(html).toContain('🌾');
        expect(html).toContain('chapter-banner');
        expect(html).toContain('data-claim="plant_rice"');
    });
});
