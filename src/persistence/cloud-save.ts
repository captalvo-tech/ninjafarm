/**
 * Ninja Farm - Cloud Save Manager
 * Authoritative cloud persistence, optimistic concurrency control & IndexedDB cache.
 */

import type { FarmSaveState } from '../core/types';
import { PersistenceManager } from './indexeddb';

export interface CloudSaveResult {
    success: boolean;
    revision?: number;
    savedAt?: number;
    conflict?: boolean;
    serverSave?: FarmSaveState;
    error?: string;
}

export class CloudSaveManager {
    private localCache: PersistenceManager;
    private baseUrl: string;
    private currentRevision: number = 0;
    private getSessionToken: () => string | null;

    constructor(getSessionToken: () => string | null, baseUrl: string = './api/save.php') {
        this.getSessionToken = getSessionToken;
        this.baseUrl = baseUrl;
        this.localCache = new PersistenceManager();
    }

    public async init(): Promise<void> {
        await this.localCache.init();
    }

    /**
     * Carrega o save autoritativo do servidor (com fallback para cache local se offline).
     */
    public async load(): Promise<FarmSaveState | null> {
        const token = this.getSessionToken();
        const headers: Record<string, string> = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const res = await fetch(`${this.baseUrl}?action=load`, {
                method: 'GET',
                headers
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success && data.save) {
                    const serverSave: FarmSaveState = data.save;
                    this.currentRevision = serverSave.revision || 1;
                    // Atualiza cache local
                    await this.localCache.save(serverSave);
                    return serverSave;
                }
            }
        } catch (err) {
            console.warn('[CloudSaveManager] Falha ao carregar save da nuvem. Utilizando cache local:', err);
        }

        // Fallback para o cache do IndexedDB
        const cached = await this.localCache.load();
        if (cached) {
            this.currentRevision = cached.revision || 1;
        }
        return cached;
    }

    /**
     * Salva o estado da fazenda na nuvem com controle de concorrência por revisão.
     */
    public async save(state: FarmSaveState): Promise<CloudSaveResult> {
        const token = this.getSessionToken();
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        state.revision = this.currentRevision;
        state.savedAt = Date.now();

        try {
            const res = await fetch(`${this.baseUrl}?action=save`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    save: state,
                    clientRevision: this.currentRevision
                })
            });

            if (res.status === 409) {
                const conflictData = await res.json();
                console.warn('[CloudSaveManager] Conflito de versão detectado:', conflictData);
                return {
                    success: false,
                    conflict: true,
                    serverSave: conflictData.serverSave,
                    error: 'Conflito de versão no servidor.'
                };
            }

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    this.currentRevision = data.revision;
                    state.revision = data.revision;
                    state.savedAt = data.savedAt;

                    // Atualiza cache local de forma consistente
                    await this.localCache.save(state);

                    return {
                        success: true,
                        revision: data.revision,
                        savedAt: data.savedAt
                    };
                }
            }
        } catch (err) {
            console.warn('[CloudSaveManager] Erro de rede ao sincronizar save. Armazenando localmente:', err);
        }

        // Se a requisição de rede falhar, armazena no cache local
        await this.localCache.save(state);
        return {
            success: true,
            revision: this.currentRevision,
            savedAt: state.savedAt
        };
    }

    /**
     * Reinicializa o progresso do usuário do zero no servidor e limpa cache local.
     */
    public async resetProgress(): Promise<FarmSaveState | null> {
        const token = this.getSessionToken();
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const res = await fetch(`${this.baseUrl}?action=reset`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ confirm: true })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success && data.save) {
                    const freshSave: FarmSaveState = data.save;
                    this.currentRevision = freshSave.revision || 1;
                    await this.localCache.save(freshSave);
                    return freshSave;
                }
            }
        } catch (err) {
            console.error('[CloudSaveManager] Erro ao resetar progresso no servidor:', err);
        }

        return null;
    }

    public getCurrentRevision(): number {
        return this.currentRevision;
    }
}

