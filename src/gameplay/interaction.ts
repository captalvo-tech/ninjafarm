import type { FarmGrid } from '../core/grid';
import type { CropSystem } from '../simulation/crops';
import type { InventorySystem } from '../simulation/inventory';
import type { FaunaManager } from '../rendering/fauna';
import type { CropType } from '../core/types';
import { sound } from '../audio/sound';

export interface InteractionPrompt {
    id: string;
    label: string;
    actionType: 'harvest' | 'plant' | 'inspect' | 'pet_chicken' | 'pet_fox' | 'fish' | 'rest' | 'trade';
    targetId: string;
    distance: number;
}

export class ProximityInteractionManager {
    private grid: FarmGrid;
    private cropSystem: CropSystem;
    private inventory: InventorySystem;
    private faunaManager?: FaunaManager;
    private promptElement: HTMLElement;
    private currentPrompt: InteractionPrompt | null = null;
    private lastFishingTime = 0;
    private lastRestingTime = 0;
    private merchantPos: { x: number; z: number } | null = null;

    setMerchantPosition(x: number, z: number): void {
        this.merchantPos = { x, z };
    }

    constructor(grid: FarmGrid, cropSystem: CropSystem, inventory: InventorySystem, faunaManager?: FaunaManager) {
        this.grid = grid;
        this.cropSystem = cropSystem;
        this.inventory = inventory;
        this.faunaManager = faunaManager;

        this.promptElement = document.createElement('div');
        this.promptElement.id = 'interaction-prompt';
        this.injectStyles();
        document.body.appendChild(this.promptElement);
    }

    setFaunaManager(fauna: FaunaManager): void {
        this.faunaManager = fauna;
    }

    private injectStyles(): void {
        const style = document.createElement('style');
        style.textContent = `
            #interaction-prompt {
                position: fixed;
                bottom: 110px;
                left: 50%;
                transform: translateX(-50%) scale(0.9);
                background: rgba(11, 15, 25, 0.95);
                border: 2px solid #10B981;
                border-radius: 50px;
                padding: 10px 24px;
                color: #FFFFFF;
                font-family: 'DM Sans', sans-serif;
                font-size: 14px;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 10px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(16, 185, 129, 0.4);
                opacity: 0;
                visibility: hidden;
                pointer-events: auto;
                cursor: pointer;
                transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                z-index: 150;
            }

            #interaction-prompt.visible {
                opacity: 1;
                visibility: visible;
                transform: translateX(-50%) scale(1);
            }

            #interaction-prompt:hover {
                background: rgba(16, 185, 129, 0.2);
                transform: translateX(-50%) scale(1.04);
            }

            .key-badge {
                background: #10B981;
                color: #0B0F19;
                font-weight: 900;
                font-size: 12px;
                padding: 3px 8px;
                border-radius: 6px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            }
        `;
        document.head.appendChild(style);

        this.promptElement.addEventListener('click', () => {
            this.executeAction();
        });
    }

    update(ninjaX: number, ninjaZ: number): void {
        let bestPrompt: InteractionPrompt | null = null;
        let minDistance = 5.0; // raio de proximidade em metros

        // 1. Checa proximidade com canteiros
        for (const crop of this.cropSystem.getAllCrops()) {
            const b = this.grid.getBuilding(crop.buildingInstanceId);
            if (!b) continue;

            const bPos = this.grid.gridToWorld(b.gridX, b.gridY);
            const dist = Math.hypot(bPos.x - ninjaX, bPos.z - ninjaZ);

            if (dist < minDistance) {
                minDistance = dist;
                if (crop.stage === 'ready') {
                    const cropLabel = crop.cropType === 'lotus' ? '🪷 Lótus Sagrada' : crop.cropType === 'vegetable' ? '🥕 Cenoura Orgânica' : '🌾 Arroz';
                    const yieldAmt = crop.cropType === 'lotus' ? 50 : crop.cropType === 'vegetable' ? 15 : 25;
                    bestPrompt = {
                        id: crop.instanceId,
                        label: `Colher ${cropLabel} (+${yieldAmt} Alimento)`,
                        actionType: 'harvest',
                        targetId: crop.buildingInstanceId,
                        distance: dist
                    };
                } else if (crop.stage === 'growing' || crop.stage === 'planted') {
                    const pct = Math.floor(crop.growthProgress * 100);
                    const cropLabel = crop.cropType === 'lotus' ? '🪷 Lótus Sagrada' : crop.cropType === 'vegetable' ? '🥕 Cenoura Orgânica' : '🌾 Arroz';
                    const moisture = crop.waterSupplied ? '💧 Solo Fértil Irrigado' : '⚠️ Solo Seco (Sem Água!)';
                    bestPrompt = {
                        id: crop.instanceId,
                        label: `${cropLabel} [${pct}%] — ${moisture}`,
                        actionType: 'inspect',
                        targetId: crop.buildingInstanceId,
                        distance: dist
                    };
                } else if (crop.stage === 'empty' || crop.stage === 'harvested') {
                    bestPrompt = {
                        id: crop.instanceId,
                        label: 'Semear Canteiro (Arroz / Cenoura / Lótus) [-1.5💧 Água]',
                        actionType: 'plant',
                        targetId: crop.buildingInstanceId,
                        distance: dist
                    };
                }
            }
        }

        // 2. Checa proximidade com animais da fazenda (galinhas e raposa)
        if (this.faunaManager) {
            for (const anim of this.faunaManager.getAnimals()) {
                const dist = Math.hypot(anim.position.x - ninjaX, anim.position.z - ninjaZ);
                if (dist < 3.0 && dist < minDistance) {
                    minDistance = dist;
                    if (anim.type === 'chicken') {
                        bestPrompt = {
                            id: 'anim_chicken',
                            label: 'Alimentar Galinha (+10 🥚 Alimento)',
                            actionType: 'pet_chicken',
                            targetId: 'chicken',
                            distance: dist
                        };
                    } else if (anim.type === 'fox') {
                        bestPrompt = {
                            id: 'anim_fox',
                            label: 'Acariciar Raposa Shinobi (+35 XP 🦊)',
                            actionType: 'pet_fox',
                            targetId: 'fox',
                            distance: dist
                        };
                    }
                }
            }
        }

        // 3. Checa proximidade com o Mercador Itinerante
        if (!bestPrompt && this.merchantPos) {
            const mDist = Math.hypot(this.merchantPos.x - ninjaX, this.merchantPos.z - ninjaZ);
            if (mDist < 3.8) {
                bestPrompt = {
                    id: 'wandering_merchant',
                    label: 'Negociar com o Mercador Shinobi (Troca de Recursos)',
                    actionType: 'trade',
                    targetId: 'merchant',
                    distance: mDist
                };
            }
        }

        // 4. Se não encontrou canteiro ou animal, checa estruturas (painel solar, lago de carpas, fogueira)
        if (!bestPrompt) {
            for (const b of this.grid.getAllBuildings()) {
                const bPos = this.grid.gridToWorld(b.gridX, b.gridY);
                const dist = Math.hypot(bPos.x - ninjaX, bPos.z - ninjaZ);

                if (dist < 4.8) {
                    if (b.type === 'fish_pond') {
                        const now = performance.now();
                        const canFish = (now - this.lastFishingTime) >= 20000;
                        bestPrompt = {
                            id: b.instanceId,
                            label: canFish ? 'Pescar Carpa Koi (+30 Alimento, +20 XP)' : 'Aguardando cardume de carpas...',
                            actionType: 'fish',
                            targetId: b.instanceId,
                            distance: dist
                        };
                        break;
                    } else if (b.type === 'bonfire') {
                        const now = performance.now();
                        const canRest = (now - this.lastRestingTime) >= 15000;
                        bestPrompt = {
                            id: b.instanceId,
                            label: canRest ? 'Descansar na Fogueira (+15 Energia, +15 XP)' : 'Fogueira em rescaldo...',
                            actionType: 'rest',
                            targetId: b.instanceId,
                            distance: dist
                        };
                        break;
                    } else if (b.type === 'solar_panel') {
                        bestPrompt = {
                            id: b.instanceId,
                            label: 'Inspecionar Painel Fotovoltaico (Geração Solar Ativa)',
                            actionType: 'inspect',
                            targetId: b.instanceId,
                            distance: dist
                        };
                        break;
                    }
                }
            }
        }

        this.currentPrompt = bestPrompt;

        if (bestPrompt) {
            this.promptElement.innerHTML = `<span class="key-badge">Toque</span><span>${bestPrompt.label}</span>`;
            this.promptElement.classList.add('visible');
        } else {
            this.promptElement.classList.remove('visible');
        }
    }

    getCurrentPrompt(): InteractionPrompt | null {
        return this.currentPrompt;
    }

    executeAction(chosenCrop: CropType = 'rice'): { executed: boolean; message?: string; xpReward?: number; isPet?: boolean; isTrade?: boolean; cropType?: CropType } {
        if (!this.currentPrompt) return { executed: false };

        if (this.currentPrompt.actionType === 'harvest') {
            const res = this.cropSystem.harvest(this.currentPrompt.targetId);
            if (res.success) {
                sound.playHarvest();
                const cropName = res.cropType === 'lotus' ? '🪷 Flor de Lótus Sagrada' : res.cropType === 'vegetable' ? '🥕 Cenoura Orgânica' : '🌾 Arroz Hidropônico';
                const xp = res.cropType === 'lotus' ? 45 : res.cropType === 'vegetable' ? 18 : 25;
                return { executed: true, message: `Colheita Realizada: +${res.harvestedAmount} Alimento (${cropName})`, xpReward: xp, cropType: res.cropType };
            }
        } else if (this.currentPrompt.actionType === 'plant') {
            if (this.inventory.get('water') < 1.5) {
                sound.playClick();
                return { executed: false, message: 'Reserva hídrica insuficiente (Requer 1.5 L de água para semeadura). Ligue a Bomba d\'Água!' };
            }
            const planted = this.cropSystem.plantCrop(this.currentPrompt.targetId, chosenCrop);
            if (planted) {
                this.inventory.consume('water', 1.5);
                sound.playBuild();
                const cropName = chosenCrop === 'lotus' ? '🪷 Lótus Sagrada' : chosenCrop === 'vegetable' ? '🥕 Cenoura Orgânica' : '🌾 Arroz Hidropônico';
                return { executed: true, message: `${cropName} semeado! (-1.5 L de água no solo). Mantenha a irrigação ativa.`, xpReward: 15, cropType: chosenCrop };
            }
        } else if (this.currentPrompt.actionType === 'pet_chicken') {
            sound.playAnimalPet();
            this.inventory.add('food', 10);
            this.faunaManager?.triggerAnimalReaction('chicken');
            return { executed: true, message: 'Galinha alimentada! Você colheu um ovo fresco (+10 Alimento, +15 XP) ❤️', xpReward: 15, isPet: true };
        } else if (this.currentPrompt.actionType === 'pet_fox') {
            sound.playAnimalPet();
            this.faunaManager?.triggerAnimalReaction('fox');
            return { executed: true, message: 'Vínculo com a fauna! A raposa kitsune abanou a cauda (+35 XP) 🦊', xpReward: 35, isPet: true };
        } else if (this.currentPrompt.actionType === 'fish') {
            const now = performance.now();
            if (now - this.lastFishingTime < 20000) {
                return { executed: false, message: 'As carpas ainda estão no fundo do lago! Aguarde um momento.' };
            }
            this.lastFishingTime = now;
            sound.playWaterSplash();
            this.inventory.add('food', 30);
            return { executed: true, message: 'Pesca Realizada! Você fisgou uma Carpa Koi Dourada (+30 Alimento, +20 XP) 🐟', xpReward: 20 };
        } else if (this.currentPrompt.actionType === 'rest') {
            const now = performance.now();
            if (now - this.lastRestingTime < 15000) {
                return { executed: false, message: 'Você já descansou recentemente. Aqueça-se em breve!' };
            }
            this.lastRestingTime = now;
            sound.playClick();
            this.inventory.add('energy', 15);
            return { executed: true, message: 'Repouso da Fogueira! Vitalidade e energia restaurados (+15 Energia, +15 XP) 🔥', xpReward: 15 };
        } else if (this.currentPrompt.actionType === 'trade') {
            sound.playClick();
            return { executed: true, isTrade: true };
        } else if (this.currentPrompt.actionType === 'inspect') {
            sound.playClick();
            const crop = this.cropSystem.getCrop(this.currentPrompt.targetId);
            if (crop) {
                const pct = Math.floor(crop.growthProgress * 100);
                const status = crop.waterSupplied ? 'Solo bem irrigado e fértil' : 'Crescimento estagnado por falta de água!';
                const cropName = crop.cropType === 'lotus' ? '🪷 Flor de Lótus' : crop.cropType === 'vegetable' ? '🥕 Cenoura' : '🌾 Arroz';
                return { executed: true, message: `${cropName}: ${pct}% desenvolvido (${status})` };
            }
            return { executed: true, message: 'Estrutura operacional da fazenda.' };
        }

        return { executed: false };
    }
}
