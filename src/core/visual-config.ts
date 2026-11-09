export interface CharacterVisualConfig {
    modelUrl: string;
    scale: number;
    rotationOffsetY: number;
    walkAnimSpeed: number;
    runAnimSpeed: number;
    animations: {
        idle: string;
        walk: string;
        run: string;
    };
    tintMain: string;
    tintJoints: string;
}

export interface FaunaVisualConfig {
    cow: {
        modelUrl: string;
        scale: number;
        animations: {
            idle: string;
            walk: string;
            eat: string;
        };
    };
    fox: {
        modelUrl: string;
        scale: number;
        animations: {
            idle: string;
            walk: string;
            run: string;
        };
    };
}

export interface BuildingVisualConfig {
    hq: {
        modelUrl: string;
        scale: number;
        offset: [number, number, number];
    };
    shed: {
        modelUrl: string;
        scale: number;
        offset: [number, number, number];
    };
}

export interface NatureVisualConfig {
    tree: {
        modelUrl: string;
        scale: number;
    };
}

export interface LightingVisualConfig {
    sunIntensity: number;
    sunColor: string; // hex #ffffff
    ambientDayIntensity: number;
    ambientDayColor: string;
    ambientNightIntensity: number;
    ambientNightColor: string;
}

export interface CameraVisualConfig {
    exploreDistance: number;
    explorePitch: number;
    buildDistance: number;
    buildPitch: number;
}

export interface VisualConfig {
    version: number;
    name: string;
    updatedAt: string;
    character: CharacterVisualConfig;
    fauna: FaunaVisualConfig;
    buildings: BuildingVisualConfig;
    nature: NatureVisualConfig;
    lighting: LightingVisualConfig;
    camera: CameraVisualConfig;
}

const STORAGE_KEY = 'ninja_farm_visual_config_v1';
let inMemoryConfig: VisualConfig | null = null;

export function getDefaultVisualConfig(): VisualConfig {
    return {
        version: 1,
        name: 'Default M1 Preset',
        updatedAt: '2026-11-09T01:00:00Z',
        character: {
            modelUrl: 'assets/models/character.glb',
            scale: 1.0,
            rotationOffsetY: 0,
            walkAnimSpeed: 1.25,
            runAnimSpeed: 1.35,
            animations: {
                idle: 'Idle_Loop',
                walk: 'Walk_Loop',
                run: 'Jog_Fwd_Loop'
            },
            tintMain: '#1e2029',
            tintJoints: '#dc2626'
        },
        fauna: {
            cow: {
                modelUrl: 'assets/models/Cow.glb',
                scale: 16.0,
                animations: {
                    idle: 'Idle',
                    walk: 'Walk',
                    eat: 'Eating'
                }
            },
            fox: {
                modelUrl: 'assets/models/fox.glb',
                scale: 0.012,
                animations: {
                    idle: 'Survey',
                    walk: 'Walk',
                    run: 'Run'
                }
            }
        },
        buildings: {
            hq: {
                modelUrl: 'assets/models/House1.glb',
                scale: 1.85,
                offset: [0, 0.35, 0]
            },
            shed: {
                modelUrl: 'assets/models/House2.glb',
                scale: 1.5,
                offset: [0, 0.25, 0]
            }
        },
        nature: {
            tree: {
                modelUrl: 'assets/models/CommonTree_1.glb',
                scale: 1.6
            }
        },
        lighting: {
            sunIntensity: 1.45,
            sunColor: '#fff2d9',
            ambientDayIntensity: 0.55,
            ambientDayColor: '#597094',
            ambientNightIntensity: 0.35,
            ambientNightColor: '#263861'
        },
        camera: {
            exploreDistance: 14,
            explorePitch: 30,
            buildDistance: 28,
            buildPitch: 45
        }
    };
}

export function getVisualConfig(): VisualConfig {
    if (inMemoryConfig) return inMemoryConfig;
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                const merged: VisualConfig = { ...getDefaultVisualConfig(), ...parsed };
                inMemoryConfig = merged;
                return merged;
            }
        }
    } catch (e) {
        console.warn('[VisualConfig] Failed to read localStorage, falling back to default:', e);
    }
    const def = getDefaultVisualConfig();
    inMemoryConfig = def;
    return def;
}

export function saveVisualConfig(partialConfig: Partial<VisualConfig>): VisualConfig {
    const current = getVisualConfig();
    const updated: VisualConfig = {
        ...current,
        ...partialConfig,
        updatedAt: new Date().toISOString()
    };
    inMemoryConfig = updated;
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            window.dispatchEvent(new CustomEvent('ninja_farm_visual_config_changed', { detail: updated }));
        }
    } catch (e) {
        console.error('[VisualConfig] Failed to save to localStorage:', e);
    }
    return updated;
}

export function onVisualConfigChange(callback: (config: VisualConfig) => void): () => void {
    if (typeof window === 'undefined') return () => undefined;
    const handler = (e: Event) => {
        const customEvent = e as CustomEvent<VisualConfig>;
        if (customEvent.detail) {
            callback(customEvent.detail);
        } else {
            callback(getVisualConfig());
        }
    };
    const storageHandler = (e: StorageEvent) => {
        if (e.key === STORAGE_KEY) {
            callback(getVisualConfig());
        }
    };
    window.addEventListener('ninja_farm_visual_config_changed', handler);
    window.addEventListener('storage', storageHandler);
    return () => {
        window.removeEventListener('ninja_farm_visual_config_changed', handler);
        window.removeEventListener('storage', storageHandler);
    };
}

export function resetVisualConfig(): VisualConfig {
    const def = getDefaultVisualConfig();
    inMemoryConfig = def;
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.removeItem(STORAGE_KEY);
            window.dispatchEvent(new CustomEvent('ninja_farm_visual_config_changed', { detail: def }));
        }
    } catch (e) {
        console.error('[VisualConfig] Failed to reset localStorage:', e);
    }
    return def;
}

export function exportVisualConfigJson(): string {
    const cfg = getVisualConfig();
    return JSON.stringify(cfg, null, 2);
}

export function importVisualConfigJson(jsonStr: string): boolean {
    try {
        const parsed = JSON.parse(jsonStr) as VisualConfig;
        if (!parsed || typeof parsed !== 'object') return false;
        saveVisualConfig(parsed);
        return true;
    } catch (e) {
        console.error('[VisualConfig] Failed to parse imported JSON:', e);
        return false;
    }
}
