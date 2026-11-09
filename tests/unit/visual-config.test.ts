import { describe, expect, it, beforeEach } from 'vitest';

import {
    getDefaultVisualConfig,
    getVisualConfig,
    saveVisualConfig,
    resetVisualConfig,
    exportVisualConfigJson,
    importVisualConfigJson
} from '../../src/core/visual-config';

describe('VisualConfig & Ninja Farm Studio Presets', () => {
    beforeEach(() => {
        resetVisualConfig();
    });

    it('deve fornecer configuração padrão com valores do M1', () => {
        const config = getDefaultVisualConfig();
        expect(config.version).toBe(1);
        expect(config.character.modelUrl).toBe('assets/models/character.glb');
        expect(config.character.scale).toBe(1.0);
        expect(config.character.animations.idle).toBe('Idle_Loop');
        expect(config.character.animations.walk).toBe('Walk_Loop');
        expect(config.character.animations.run).toBe('Jog_Fwd_Loop');
        expect(config.character.tintMain).toBe('#1e2029');
        expect(config.character.tintJoints).toBe('#dc2626');
        expect(config.lighting.sunIntensity).toBe(1.45);
        expect(config.camera.exploreDistance).toBe(14);
    });

    it('deve salvar e recuperar alterações parciais de configuração', () => {
        const updated = saveVisualConfig({
            character: {
                ...getDefaultVisualConfig().character,
                scale: 1.5,
                tintMain: '#881337'
            }
        });

        expect(updated.character.scale).toBe(1.5);
        expect(updated.character.tintMain).toBe('#881337');

        const loaded = getVisualConfig();
        expect(loaded.character.scale).toBe(1.5);
        expect(loaded.character.tintMain).toBe('#881337');
    });

    it('deve exportar JSON válido e permitir importação', () => {
        saveVisualConfig({
            character: {
                ...getDefaultVisualConfig().character,
                walkAnimSpeed: 2.0
            }
        });

        const exported = exportVisualConfigJson();
        expect(typeof exported).toBe('string');
        expect(exported).toContain('"walkAnimSpeed": 2');

        resetVisualConfig();
        expect(getVisualConfig().character.walkAnimSpeed).toBe(1.25);

        const success = importVisualConfigJson(exported);
        expect(success).toBe(true);
        expect(getVisualConfig().character.walkAnimSpeed).toBe(2.0);
    });

    it('deve rejeitar JSON inválido com elegância', () => {
        const invalid = importVisualConfigJson('{ invalid json string ...');
        expect(invalid).toBe(false);
    });
});
