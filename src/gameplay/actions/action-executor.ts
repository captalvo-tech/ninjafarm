/**
 * Ninja Farm - Context Action Executor
 * Handles atomic execution, validation, pathfinding dispatch and state transitions.
 */

import { domainEvents } from '../../core/events';
import type { FarmGrid } from '../../core/grid';
import type { ResourceInventory } from '../../core/types';
import type { CropSystem } from '../../simulation/crops';
import type { InventorySystem } from '../../simulation/inventory';
import type { NavigationSystem, PathNode } from '../../simulation/navigation';

import { ActionResolver } from './action-resolver';
import type { ResolverContext } from './action-resolver';
import type { ContextAction, ContextActionId, SelectedTarget, SoilStatus } from './action-types';

export interface ActionExecutionResult {
    success: boolean;
    actionId?: ContextActionId;
    message?: string;
    xpReward?: number;
    resourceChanges?: Partial<ResourceInventory>;
    newSoilStatus?: SoilStatus;
    requiresMovement?: boolean;
    path?: PathNode[];
    errorReason?: string;
    isTrade?: boolean;
    isPet?: boolean;
}

export class ActionExecutor {
    private grid: FarmGrid;
    private cropSystem: CropSystem;
    private inventory: InventorySystem;
    private navigation: NavigationSystem;
    private activeExecutions = new Set<string>();
    private harvestCounts = new Map<string, number>();
    private lastExecutionTime = new Map<string, number>();
    private cooldownMs = 300;

    constructor(grid: FarmGrid, cropSystem: CropSystem, inventory: InventorySystem, navigation: NavigationSystem) {
        this.grid = grid;
        this.cropSystem = cropSystem;
        this.inventory = inventory;
        this.navigation = navigation;
    }

    /**
     * Executes the contextual action for the given target, with race-condition prevention.
     */
    public execute(
        target: SelectedTarget,
        context: ResolverContext,
        ninjaGridPos?: { x: number; y: number }
    ): ActionExecutionResult {
        const now = Date.now();
        const lastTime = this.lastExecutionTime.get(target.id) ?? 0;

        // 1. Prevenção de concorrência / clique duplo acidental (debounce)
        if (this.activeExecutions.has(target.id) || now - lastTime < this.cooldownMs) {
            return {
                success: false,
                errorReason: 'Ação já em execução ou clique duplo detectado.'
            };
        }

        // 2. Re-avaliação determinística no instante da execução
        const action = ActionResolver.resolve(target, context);
        if (!action.enabled) {
            return {
                success: false,
                actionId: action.actionId,
                errorReason: action.blockedReason || 'Ação indisponível no momento.'
            };
        }

        // 3. Verificação de distância e rota necessária
        if (context.ninjaPosition) {
            const dist = Math.hypot(
                context.ninjaPosition.x - target.worldPosition.x,
                context.ninjaPosition.z - target.worldPosition.z
            );

            if (dist > action.interactionDistance) {
                if (ninjaGridPos) {
                    const path = this.navigation.findPath(ninjaGridPos.x, ninjaGridPos.y, target.gridX, target.gridY);
                    if (path.length > 0) {
                        return {
                            success: true,
                            actionId: action.actionId,
                            requiresMovement: true,
                            path,
                            message: `Caminhando até ${target.name}...`
                        };
                    } else {
                        return {
                            success: false,
                            actionId: action.actionId,
                            errorReason: 'Não há rota caminhável até o alvo.'
                        };
                    }
                }
            }
        }

        // 4. Bloqueia execução concorrente durante a aplicação atômica
        this.activeExecutions.add(target.id);
        this.lastExecutionTime.set(target.id, Date.now());
        try {
            return this.applyAction(action, context);
        } finally {
            this.activeExecutions.delete(target.id);
        }
    }

    private applyAction(action: ContextAction, context: ResolverContext): ActionExecutionResult {
        const target = action.target;

        switch (action.actionId) {
            case 'prepare_soil': {
                // Atualiza customData do canteiro
                const building = this.grid.getBuilding(target.id);
                if (building) {
                    building.customData = building.customData || {};
                    building.customData.soilStatus = 'tilled';
                }
                target.soilStatus = 'tilled';
                domainEvents.emit('soil.prepared', { buildingId: target.id, gridX: target.gridX, gridY: target.gridY });
                return {
                    success: true,
                    actionId: 'prepare_soil',
                    newSoilStatus: 'tilled',
                    xpReward: 10,
                    message: 'Solo preparado e aerado! Pronto para semeadura.'
                };
            }

            case 'plant_crop': {
                const preferredCrop = context.selectedCropPreference || target.cropType || 'rice';

                // Consome semente se disponível
                if (context.seedInventory && context.seedInventory[preferredCrop] !== undefined) {
                    context.seedInventory[preferredCrop] = Math.max(0, context.seedInventory[preferredCrop]! - 1);
                }

                // Registra cultura no CropSystem
                const cropState = this.cropSystem.plantCrop(target.id, preferredCrop);
                if (!cropState) {
                    return {
                        success: false,
                        actionId: 'plant_crop',
                        errorReason: 'Não foi possível semear neste canteiro.'
                    };
                }

                const building = this.grid.getBuilding(target.id);
                if (building) {
                    building.customData = building.customData || {};
                    building.customData.soilStatus = 'planted';
                }
                target.soilStatus = 'planted';
                target.cropType = preferredCrop;
                target.growthProgress = 0;
                target.waterSupplied = true;

                const cropName =
                    preferredCrop === 'rice' ? 'Arroz' : preferredCrop === 'vegetable' ? 'Hortaliça' : 'Lótus';
                return {
                    success: true,
                    actionId: 'plant_crop',
                    newSoilStatus: 'planted',
                    xpReward: 15,
                    message: `${cropName} semeado no canteiro! Mantenha irrigado.`
                };
            }

            case 'water_crop': {
                if (this.inventory.get('water') < 1.0) {
                    return {
                        success: false,
                        actionId: 'water_crop',
                        errorReason: 'Água insuficiente no reservatório.'
                    };
                }

                this.inventory.consume('water', 1.0);
                const crop = this.cropSystem.getCrop(target.id);
                if (crop) {
                    crop.waterSupplied = true;
                }
                target.waterSupplied = true;
                target.soilStatus = 'growing';

                const building = this.grid.getBuilding(target.id);
                if (building) {
                    building.customData = building.customData || {};
                    building.customData.soilStatus = 'growing';
                }

                domainEvents.emit('crop.watered', { buildingId: target.id });
                return {
                    success: true,
                    actionId: 'water_crop',
                    newSoilStatus: 'growing',
                    resourceChanges: { water: -1.0 },
                    xpReward: 8,
                    message: 'Canteiro irrigado com sucesso (-1.0 L de Água).'
                };
            }

            case 'harvest_crop': {
                const harvestRes = this.cropSystem.harvest(target.id);
                if (!harvestRes.success) {
                    return {
                        success: false,
                        actionId: 'harvest_crop',
                        errorReason: 'A cultura ainda não está pronta para colheita.'
                    };
                }

                // Contador de ciclos de colheita no solo
                const currentCount = (this.harvestCounts.get(target.id) ?? 0) + 1;
                this.harvestCounts.set(target.id, currentCount);

                // A cada 3 colheitas, o solo fica exaurido e precisa de recuperação
                let newStatus: SoilStatus = 'raw';
                if (currentCount >= 3) {
                    newStatus = 'exhausted';
                    this.harvestCounts.set(target.id, 0);
                }

                const building = this.grid.getBuilding(target.id);
                if (building) {
                    building.customData = building.customData || {};
                    building.customData.soilStatus = newStatus;
                }
                target.soilStatus = newStatus;
                target.growthProgress = 0;

                const cropLabel =
                    harvestRes.cropType === 'lotus'
                        ? 'Flor de Lótus'
                        : harvestRes.cropType === 'vegetable'
                          ? 'Hortaliça'
                          : 'Arroz';
                const xp = harvestRes.cropType === 'lotus' ? 45 : harvestRes.cropType === 'vegetable' ? 20 : 25;

                return {
                    success: true,
                    actionId: 'harvest_crop',
                    newSoilStatus: newStatus,
                    resourceChanges: { food: harvestRes.harvestedAmount },
                    xpReward: xp,
                    message: `Colheita realizada! +${harvestRes.harvestedAmount} Alimento (${cropLabel}).`
                };
            }

            case 'recover_soil': {
                const building = this.grid.getBuilding(target.id);
                if (building) {
                    building.customData = building.customData || {};
                    building.customData.soilStatus = 'tilled';
                }
                target.soilStatus = 'tilled';
                this.harvestCounts.set(target.id, 0);

                return {
                    success: true,
                    actionId: 'recover_soil',
                    newSoilStatus: 'tilled',
                    xpReward: 15,
                    message: 'Solo recuperado e adubado com compostagem orgânica!'
                };
            }

            case 'feed_animal': {
                this.inventory.consume('food', 1);
                target.hunger = Math.max(0, (target.hunger ?? 60) - 50);
                return {
                    success: true,
                    actionId: 'feed_animal',
                    resourceChanges: { food: -1 },
                    xpReward: 12,
                    isPet: true,
                    message: 'Animal alimentado com grãos frescos! Satisfeito e calmo.'
                };
            }

            case 'collect_eggs': {
                this.inventory.add('food', 10);
                target.readyToCollect = false;
                return {
                    success: true,
                    actionId: 'collect_eggs',
                    resourceChanges: { food: 10 },
                    xpReward: 15,
                    message: 'Ovos colhidos do ninho (+10 Alimento, +15 XP)!'
                };
            }

            case 'pet_animal': {
                return {
                    success: true,
                    actionId: 'pet_animal',
                    xpReward: 20,
                    isPet: true,
                    message: 'Vínculo com a fauna fortalecido! Carinho retribuído.'
                };
            }

            case 'catch_fish': {
                this.inventory.add('food', 25);
                return {
                    success: true,
                    actionId: 'catch_fish',
                    resourceChanges: { food: 25 },
                    xpReward: 20,
                    message: 'Pesca realizada! Peixes frescos para a despensa (+25 Alimento).'
                };
            }

            case 'rest_bonfire': {
                this.inventory.add('energy', 15);
                return {
                    success: true,
                    actionId: 'rest_bonfire',
                    resourceChanges: { energy: 15 },
                    xpReward: 15,
                    message: 'Repouso reconfortante ao lado da fogueira (+15 Energia)!'
                };
            }

            case 'trade_merchant': {
                return {
                    success: true,
                    actionId: 'trade_merchant',
                    isTrade: true,
                    message: 'Negociações abertas com o Mercador Itinerante.'
                };
            }

            case 'train_dummy': {
                return {
                    success: true,
                    actionId: 'train_dummy',
                    xpReward: 15,
                    message: 'Acerto preciso no centro do alvo de treino (+15 XP)!'
                };
            }

            case 'inspect_droid': {
                return {
                    success: true,
                    actionId: 'inspect_droid',
                    message: 'Status e agenda da unidade Droid abertos.'
                };
            }

            case 'repair_building': {
                this.inventory.consume('wood', 2);
                this.inventory.consume('metal', 1);
                if (target.maxHealth) {
                    target.buildingHealth = target.maxHealth;
                }
                const b = this.grid.getBuilding(target.id);
                if (b) {
                    b.health = target.maxHealth ?? b.health;
                }
                return {
                    success: true,
                    actionId: 'repair_building',
                    resourceChanges: { wood: -2, metal: -1 },
                    xpReward: 30,
                    message: 'Estrutura restaurada à capacidade total (-2 Madeira, -1 Metal).'
                };
            }

            default:
                return {
                    success: false,
                    actionId: action.actionId,
                    errorReason: 'Nenhuma ação executável para este alvo.'
                };
        }
    }
}
