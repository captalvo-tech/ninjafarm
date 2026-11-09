import type { FarmSaveState } from '../core/types';

const DB_NAME = 'NinjaFarmDB';
const DB_VERSION = 1;
const STORE_NAME = 'saves';
const SAVE_KEY = 'current_farm_state';

export class PersistenceManager {
    private db: IDBDatabase | null = null;

    async init(): Promise<void> {
        if (!('indexedDB' in window)) {
            console.warn('IndexedDB não suportado. Usando fallback localStorage.');
            return;
        }

        return new Promise((resolve) => {
            const req = indexedDB.open(DB_NAME, DB_VERSION);

            req.onupgradeneeded = (e) => {
                const db = (e.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };

            req.onsuccess = () => {
                this.db = req.result;
                resolve();
            };

            req.onerror = () => {
                console.warn('Erro ao abrir IndexedDB. Fallback ativo.');
                resolve();
            };
        });
    }

    async save(state: FarmSaveState): Promise<boolean> {
        state.savedAt = Date.now();

        if (this.db) {
            return new Promise((resolve) => {
                try {
                    const tx = this.db!.transaction(STORE_NAME, 'readwrite');
                    const store = tx.objectStore(STORE_NAME);
                    const req = store.put(state, SAVE_KEY);

                    req.onsuccess = () => resolve(true);
                    req.onerror = () => {
                        // Fallback
                        this.saveLocalStorage(state);
                        resolve(true);
                    };
                } catch {
                    this.saveLocalStorage(state);
                    resolve(true);
                }
            });
        }

        this.saveLocalStorage(state);
        return true;
    }

    async load(): Promise<FarmSaveState | null> {
        if (this.db) {
            return new Promise((resolve) => {
                try {
                    const tx = this.db!.transaction(STORE_NAME, 'readonly');
                    const store = tx.objectStore(STORE_NAME);
                    const req = store.get(SAVE_KEY);

                    req.onsuccess = () => {
                        if (req.result) {
                            resolve(req.result as FarmSaveState);
                        } else {
                            resolve(this.loadLocalStorage());
                        }
                    };

                    req.onerror = () => {
                        resolve(this.loadLocalStorage());
                    };
                } catch {
                    resolve(this.loadLocalStorage());
                }
            });
        }

        return this.loadLocalStorage();
    }

    private saveLocalStorage(state: FarmSaveState): void {
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(state));
        } catch (e) {
            console.error('Falha ao salvar no localStorage:', e);
        }
    }

    private loadLocalStorage(): FarmSaveState | null {
        try {
            const str = localStorage.getItem(SAVE_KEY);
            return str ? JSON.parse(str) : null;
        } catch {
            return null;
        }
    }
}

