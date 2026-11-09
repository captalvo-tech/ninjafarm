import { describe, it, expect, beforeEach, vi } from 'vitest';

import type { FarmSaveState } from '../../src/core/types';
import { AuthManager } from '../../src/persistence/auth';
import { CloudSaveManager } from '../../src/persistence/cloud-save';

describe('Fase A: Autenticação Google & Persistência em Nuvem', () => {
    let authManager: AuthManager;
    let cloudSaveManager: CloudSaveManager;
    let mockSessionToken: string | null = null;
    let serverStorage: Map<string, any>;

    beforeEach(() => {
        serverStorage = new Map();
        mockSessionToken = 'test_token_12345';

        const mockStore = new Map<string, string>();
        global.localStorage = {
            getItem: (key: string) => mockStore.get(key) || null,
            setItem: (key: string, val: string) => mockStore.set(key, val),
            removeItem: (key: string) => mockStore.delete(key),
            clear: () => mockStore.clear(),
            key: () => null,
            length: 0
        } as any;

        // Mock fetch para simular os endpoints da API
        global.fetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
            const urlStr = url.toString();

            // Mock /api/auth.php
            if (urlStr.includes('/api/auth.php')) {
                if (urlStr.includes('action=check')) {
                    if (mockSessionToken) {
                        return {
                            ok: true,
                            json: async () => ({
                                authenticated: true,
                                user: {
                                    sub: 'google_sub_998877',
                                    email: 'ninja@pinut.shop',
                                    name: 'Mestre Shinobi',
                                    picture: ''
                                }
                            })
                        };
                    } else {
                        return {
                            ok: true,
                            json: async () => ({ authenticated: false })
                        };
                    }
                }

                if (urlStr.includes('action=login')) {
                    mockSessionToken = 'new_session_token_abc';
                    return {
                        ok: true,
                        json: async () => ({
                            success: true,
                            user: {
                                sub: 'google_sub_998877',
                                email: 'ninja@pinut.shop',
                                name: 'Mestre Shinobi'
                            },
                            sessionToken: mockSessionToken
                        })
                    };
                }

                if (urlStr.includes('action=logout')) {
                    mockSessionToken = null;
                    return {
                        ok: true,
                        json: async () => ({ success: true })
                    };
                }
            }

            // Mock /api/save.php
            if (urlStr.includes('/api/save.php')) {
                if (!mockSessionToken) {
                    return {
                        ok: false,
                        status: 401,
                        json: async () => ({ success: false, error: 'Não autenticado' })
                    };
                }

                if (urlStr.includes('action=load')) {
                    const existing = serverStorage.get('current_save');
                    if (existing) {
                        return {
                            ok: true,
                            json: async () => ({ success: true, save: existing })
                        };
                    } else {
                        const starter: FarmSaveState = {
                            version: 1,
                            revision: 1,
                            userId: 'google_sub_998877',
                            savedAt: Date.now(),
                            resources: { wood: 50, metal: 20, parts: 10, food: 30, water: 40, energy: 50 },
                            buildings: [],
                            crops: [],
                            animals: [],
                            dayTime: 0.35,
                            elapsedGameDays: 1,
                            ninjaPosition: { x: 0, y: 0, z: 0 },
                            droid: {
                                id: 'farm_droid_01',
                                battery: 100,
                                maxBattery: 100,
                                state: 'idle',
                                position: { x: 0, y: 0, z: 0 },
                                workSpeedMultiplier: 1.0
                            }
                        };
                        serverStorage.set('current_save', starter);
                        return {
                            ok: true,
                            json: async () => ({ success: true, save: starter })
                        };
                    }
                }

                if (urlStr.includes('action=save')) {
                    const body = JSON.parse((init?.body as string) || '{}');
                    const clientRevision = body.clientRevision || 0;
                    const existing = serverStorage.get('current_save');
                    const serverRevision = existing?.revision || 1;

                    // Conflito de concorrência
                    if (clientRevision < serverRevision) {
                        return {
                            ok: false,
                            status: 409,
                            json: async () => ({
                                success: false,
                                error: 'Conflict',
                                serverRevision,
                                serverSave: existing
                            })
                        };
                    }

                    const nextRevision = serverRevision + 1;
                    const updatedSave = { ...body.save, revision: nextRevision };
                    serverStorage.set('current_save', updatedSave);

                    return {
                        ok: true,
                        json: async () => ({
                            success: true,
                            revision: nextRevision,
                            savedAt: Date.now()
                        })
                    };
                }

                if (urlStr.includes('action=reset')) {
                    const freshStarter: FarmSaveState = {
                        version: 1,
                        revision: 1,
                        userId: 'google_sub_998877',
                        savedAt: Date.now(),
                        resources: { wood: 50, metal: 20, parts: 10, food: 30, water: 40, energy: 50 },
                        buildings: [],
                        crops: [],
                        animals: [],
                        dayTime: 0.35,
                        elapsedGameDays: 1,
                        ninjaPosition: { x: 0, y: 0, z: 0 }
                    };
                    serverStorage.set('current_save', freshStarter);
                    return {
                        ok: true,
                        json: async () => ({
                            success: true,
                            message: 'Reset concluído',
                            save: freshStarter
                        })
                    };
                }
            }

            return {
                ok: false,
                status: 404,
                json: async () => ({ error: 'Not found' })
            };
        });

        authManager = new AuthManager({}, './api/auth.php');
        cloudSaveManager = new CloudSaveManager(() => mockSessionToken, './api/save.php');
    });

    it('1. Valida sessão de usuário autenticado via sub do Google', async () => {
        const authed = await authManager.checkSession();
        expect(authed).toBe(true);
        expect(authManager.getUser()?.sub).toBe('google_sub_998877');
        expect(authManager.getUser()?.name).toBe('Mestre Shinobi');
    });

    it('2. Logout encerra a sessão e limpa credenciais ativas', async () => {
        await authManager.logout();
        expect(authManager.isAuthenticated()).toBe(false);
        expect(authManager.getUser()).toBeNull();
        expect(mockSessionToken).toBeNull();
    });

    it('3. Carrega o save inicial autoritativo com Droid único vinculado à conta', async () => {
        const save = await cloudSaveManager.load();
        expect(save).not.toBeNull();
        expect(save?.revision).toBe(1);
        expect(save?.userId).toBe('google_sub_998877');
        expect(save?.droid?.id).toBe('farm_droid_01');
        expect(save?.droid?.battery).toBe(100);
    });

    it('4. Salva incremento de revisão no servidor autoritativo', async () => {
        const save = (await cloudSaveManager.load())!;
        save.resources.food += 15;

        const result = await cloudSaveManager.save(save);
        expect(result.success).toBe(true);
        expect(result.revision).toBe(2);
    });

    it('5. Detecta e rejeita conflito quando cliente envia revisão desatualizada', async () => {
        const save = (await cloudSaveManager.load())!;
        // Salva uma vez para avançar a revisão para 2
        await cloudSaveManager.save(save);

        // Simula outro cliente enviando save com revisão 1 desatualizada
        const outdatedSave = { ...save };
        (cloudSaveManager as any).currentRevision = 1;

        const conflictResult = await cloudSaveManager.save(outdatedSave);
        expect(conflictResult.success).toBe(false);
        expect(conflictResult.conflict).toBe(true);
    });

    it('6. Apaga progresso e restaura a fazenda ao estado inicial mantendo a identidade', async () => {
        const freshSave = await cloudSaveManager.resetProgress();
        expect(freshSave).not.toBeNull();
        expect(freshSave?.revision).toBe(1);
        expect(freshSave?.userId).toBe('google_sub_998877');
        expect(freshSave?.resources.food).toBe(30);
    });
});
