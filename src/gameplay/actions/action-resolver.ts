/**
 * Ninja Farm - Context Action Resolver
 * Pure resolution of the exact ONE contextual action for any selected world entity.
 */

import type { CropType, ResourceInventory } from '../../core/types';
import { ACTION_PRIORITIES } from './action-priorities';
import type { ContextAction, SelectedTarget, SoilStatus } from './action-types';

export interface ResolverContext {
    inventory: ResourceInventory;
    seedInventory?: Partial<Record<CropType, number>>;
    selectedCropPreference?: CropType;
    ninjaPosition?: { x: number; y: number; z: number };
    canFish?: boolean;
    canRest?: boolean;
}

const CROP_NAMES: Record<CropType, string> = {
    rice: 'Arroz Hidropônico',
    vegetable: 'Hortaliça',
    lotus: 'Flor de Lótus'
};

export class ActionResolver {
    /**
     * Resolves the single highest-priority contextual action for the selected target.
     */
    public static resolve(target: SelectedTarget, context: ResolverContext): ContextAction {
        switch (target.type) {
            case 'plot':
                return this.resolvePlotAction(target, context);
            case 'animal':
                return this.resolveAnimalAction(target, context);
            case 'building':
                return this.resolveBuildingAction(target, context);
            case 'merchant':
                return this.resolveMerchantAction(target);
            case 'dummy':
                return this.resolveDummyAction(target);
            case 'bonfire':
                return this.resolveBonfireAction(target, context);
            case 'droid':
                return this.resolveDroidAction(target);
            default:
                return this.createIdleAction(target, 'Terreno livre', 'Nenhuma intervenção necessária.');
        }
    }

    /**
     * Solução contextual para áreas agrícolas / canteiros de cultivo.
     */
    private static resolvePlotAction(target: SelectedTarget, context: ResolverContext): ContextAction {
        const soilStatus: SoilStatus = target.soilStatus ?? 'raw';
        const preferredCrop: CropType = context.selectedCropPreference || target.cropType || 'rice';
        const cropName = CROP_NAMES[preferredCrop] || preferredCrop;

        switch (soilStatus) {
            case 'raw':
                return {
                    actionId: 'prepare_soil',
                    title: 'Preparar Solo',
                    subtitle: 'Arar e aerar terra para o plantio',
                    icon: '⛏️',
                    enabled: true,
                    durationSeconds: 1.2,
                    animState: 'interact',
                    interactionDistance: 3.2,
                    priority: ACTION_PRIORITIES.SOIL_PREPARATION,
                    target
                };

            case 'tilled': {
                // Solo preparado: checa sementes disponíveis
                const availableSeeds = context.seedInventory?.[preferredCrop] ?? 5; // sementes padrão no início se não especificado
                const hasSeeds = availableSeeds > 0;

                if (!hasSeeds) {
                    return {
                        actionId: 'plant_crop',
                        title: `Plantar ${cropName}`,
                        subtitle: 'Sementes esgotadas',
                        icon: '🌱',
                        enabled: false,
                        blockedReason: `Faltam sementes de ${cropName} no inventário.`,
                        missingResource: {
                            type: 'seed',
                            name: `Semente de ${cropName}`,
                            required: 1,
                            available: 0,
                            howToGet: 'Compre do Mercador Itinerante ou obtenha em colheitas.'
                        },
                        durationSeconds: 1.0,
                        animState: 'interact',
                        interactionDistance: 3.2,
                        priority: ACTION_PRIORITIES.PLANT_SEEDS,
                        target
                    };
                }

                return {
                    actionId: 'plant_crop',
                    title: `Plantar ${cropName}`,
                    subtitle: `Semear no canteiro preparado (${availableSeeds} disponíveis)`,
                    icon: '🌱',
                    enabled: true,
                    durationSeconds: 1.0,
                    animState: 'interact',
                    interactionDistance: 3.2,
                    priority: ACTION_PRIORITIES.PLANT_SEEDS,
                    target
                };
            }

            case 'thirsty':
            case 'growing':
            case 'planted': {
                // Se estiver com falta de água (ou thirsty explícito)
                const isThirsty = target.soilStatus === 'thirsty' || target.waterSupplied === false;

                if (isThirsty) {
                    const hasWater = context.inventory.water >= 1.0;
                    return {
                        actionId: 'water_crop',
                        title: 'Regar Canteiro',
                        subtitle: hasWater ? 'Hidratar solo sedento (-1.0 L Água)' : 'Reservatório sem água',
                        icon: '💧',
                        enabled: hasWater,
                        blockedReason: hasWater ? undefined : 'Água insuficiente. Ligue a Bomba de Captação!',
                        cost: { water: 1.0 },
                        missingResource: hasWater ? undefined : {
                            type: 'water',
                            name: 'Água',
                            required: 1.0,
                            available: context.inventory.water,
                            howToGet: 'Abasteça a cisterna ou ligue a bomba de água.'
                        },
                        durationSeconds: 1.2,
                        animState: 'interact',
                        interactionDistance: 3.2,
                        priority: ACTION_PRIORITIES.CRITICAL_WATER,
                        target
                    };
                }

                // Em crescimento normal e irrigado
                const pct = Math.floor((target.growthProgress ?? 0) * 100);
                return {
                    actionId: 'idle_ok',
                    title: `Crescendo (${pct}%)`,
                    subtitle: 'Solo bem irrigado. Em desenvolvimento saudável.',
                    icon: '⏳',
                    enabled: false,
                    blockedReason: 'Aguarde o ciclo biológico de maturação.',
                    durationSeconds: 0,
                    animState: 'idle',
                    interactionDistance: 3.2,
                    priority: ACTION_PRIORITIES.IDLE_NORMAL,
                    target
                };
            }

            case 'ready':
                return {
                    actionId: 'harvest_crop',
                    title: `Colher ${cropName}`,
                    subtitle: 'Safra madura pronta para o celeiro (+Alimento)',
                    icon: '🌾',
                    enabled: true,
                    durationSeconds: 1.0,
                    animState: 'interact',
                    interactionDistance: 3.2,
                    priority: ACTION_PRIORITIES.HARVEST_READY,
                    target
                };

            case 'exhausted':
                return {
                    actionId: 'recover_soil',
                    title: 'Recuperar Solo',
                    subtitle: 'Remover restos radiculares e adubar',
                    icon: '🪴',
                    enabled: true,
                    durationSeconds: 1.5,
                    animState: 'interact',
                    interactionDistance: 3.2,
                    priority: ACTION_PRIORITIES.SOIL_RECOVERY,
                    target
                };

            default:
                return this.createIdleAction(target, 'Canteiro Agrícola', 'Em operação normal.');
        }
    }

    /**
     * Solução contextual para animais da fazenda (galinhas, raposa, peixes).
     */
    private static resolveAnimalAction(target: SelectedTarget, context: ResolverContext): ContextAction {
        const animalType = target.animalType || 'chicken';
        const hunger = target.hunger ?? 0;

        if (animalType === 'chicken') {
            // Se galinheiro/galinha tem ovos disponíveis para coleta
            if (target.readyToCollect) {
                return {
                    actionId: 'collect_eggs',
                    title: 'Coletar Ovos',
                    subtitle: 'Ovos caipiras frescos disponíveis (+Alimento)',
                    icon: '🥚',
                    enabled: true,
                    durationSeconds: 0.8,
                    animState: 'interact',
                    interactionDistance: 3.0,
                    priority: ACTION_PRIORITIES.COLLECT_PRODUCE,
                    target
                };
            }

            // Se estiver com fome relevante (>= 50)
            if (hunger >= 50) {
                const hasFood = context.inventory.food >= 1 || (context.seedInventory?.rice ?? 0) >= 1;
                return {
                    actionId: 'feed_animal',
                    title: 'Alimentar Galinha',
                    subtitle: hasFood ? 'Distribuir grãos para as aves' : 'Faltam grãos no celeiro',
                    icon: '🌽',
                    enabled: hasFood,
                    blockedReason: hasFood ? undefined : 'Sem grãos ou alimentos disponíveis no celeiro.',
                    cost: { food: 1 },
                    durationSeconds: 1.0,
                    animState: 'interact',
                    interactionDistance: 3.0,
                    priority: ACTION_PRIORITIES.ANIMAL_HUNGER,
                    target
                };
            }

            // Se saudável e alimentada, interação afetuosa
            return {
                actionId: 'pet_animal',
                title: 'Acariciar Galinha',
                subtitle: 'Ave saudável e calma',
                icon: '🐔',
                enabled: true,
                durationSeconds: 0.8,
                animState: 'interact',
                interactionDistance: 3.0,
                priority: ACTION_PRIORITIES.PET_OR_TRAIN,
                target
            };
        }

        if (animalType === 'fox') {
            return {
                actionId: 'pet_animal',
                title: 'Acariciar Raposa',
                subtitle: 'Espírito guardião veloz da propriedade (+XP)',
                icon: '🦊',
                enabled: true,
                durationSeconds: 1.0,
                animState: 'interact',
                interactionDistance: 3.0,
                priority: ACTION_PRIORITIES.PET_OR_TRAIN,
                target
            };
        }

        return this.createIdleAction(target, 'Fauna', 'Animal descansando tranquilamente.');
    }

    /**
     * Solução contextual para edifícios e instalações.
     */
    private static resolveBuildingAction(target: SelectedTarget, context: ResolverContext): ContextAction {
        // 1. Necessidade de reparo
        if (target.buildingHealth !== undefined && target.maxHealth !== undefined && target.buildingHealth < target.maxHealth) {
            const hasWood = context.inventory.wood >= 2;
            const hasMetal = context.inventory.metal >= 1;
            const canRepair = hasWood && hasMetal;

            return {
                actionId: 'repair_building',
                title: 'Reparar Estrutura',
                subtitle: canRepair ? 'Consertar integridade (-2 Madeira, -1 Metal)' : 'Faltam materiais de reparo',
                icon: '🔨',
                enabled: canRepair,
                blockedReason: canRepair ? undefined : 'Materiais insuficientes (requer 2 Madeiras e 1 Metal).',
                cost: { wood: 2, metal: 1 },
                durationSeconds: 2.0,
                animState: 'interact',
                interactionDistance: 3.8,
                priority: ACTION_PRIORITIES.REPAIR_STRUCTURE,
                target
            };
        }

        // 2. Instalações específicas
        if (target.buildingType === 'fish_pond') {
            const canFish = context.canFish !== false;
            return {
                actionId: 'catch_fish',
                title: 'Pescar Carpa',
                subtitle: canFish ? 'Cardume de carpas koi ativo (+Alimento, +XP)' : 'Cardume disperso no fundo',
                icon: '🐟',
                enabled: canFish,
                blockedReason: canFish ? undefined : 'As carpas ainda estão se alimentando no fundo do lago.',
                durationSeconds: 1.8,
                animState: 'interact',
                interactionDistance: 4.0,
                priority: ACTION_PRIORITIES.REST_OR_TRADE,
                target
            };
        }

        if (target.buildingType === 'bonfire') {
            const canRest = context.canRest !== false;
            return {
                actionId: 'rest_bonfire',
                title: 'Descansar na Fogueira',
                subtitle: canRest ? 'Recuperar energia e vitalidade (+15 Energia)' : 'Fogueira em rescaldo',
                icon: '🔥',
                enabled: canRest,
                blockedReason: canRest ? undefined : 'Você já descansou há pouco tempo.',
                durationSeconds: 1.5,
                animState: 'interact',
                interactionDistance: 3.5,
                priority: ACTION_PRIORITIES.REST_OR_TRADE,
                target
            };
        }

        return this.createIdleAction(target, target.name || 'Instalação', 'Estrutura operacional funcionando normalmente.');
    }

    private static resolveMerchantAction(target: SelectedTarget): ContextAction {
        return {
            actionId: 'trade_merchant',
            title: 'Negociar com Mercador',
            subtitle: 'Comércio de recursos e suprimentos agrícolas',
            icon: '🛒',
            enabled: true,
            durationSeconds: 0,
            animState: 'interact',
            interactionDistance: 3.8,
            priority: ACTION_PRIORITIES.REST_OR_TRADE,
            target
        };
    }

    private static resolveDummyAction(target: SelectedTarget): ContextAction {
        return {
            actionId: 'train_dummy',
            title: 'Treinar Arremesso',
            subtitle: 'Prática de pontaria com shuriken de treino (+XP)',
            icon: '🎯',
            enabled: true,
            durationSeconds: 0.6,
            animState: 'interact',
            interactionDistance: 4.5,
            priority: ACTION_PRIORITIES.PET_OR_TRAIN,
            target
        };
    }

    private static resolveBonfireAction(target: SelectedTarget, context: ResolverContext): ContextAction {
        const canRest = context.canRest !== false;
        return {
            actionId: 'rest_bonfire',
            title: 'Descansar na Fogueira',
            subtitle: canRest ? 'Recuperar fôlego e energia (+15 Energia)' : 'Fogueira em rescaldo',
            icon: '🔥',
            enabled: canRest,
            blockedReason: canRest ? undefined : 'Você já repousou recentemente.',
            durationSeconds: 1.5,
            animState: 'interact',
            interactionDistance: 3.5,
            priority: ACTION_PRIORITIES.REST_OR_TRADE,
            target
        };
    }

    private static resolveDroidAction(target: SelectedTarget): ContextAction {
        return {
            actionId: 'inspect_droid',
            title: 'Agenda do Droid',
            subtitle: 'Visualizar status, bateria e fila de tarefas operacionais',
            icon: '📋',
            enabled: true,
            durationSeconds: 0,
            animState: 'idle',
            interactionDistance: 3.5,
            priority: ACTION_PRIORITIES.REST_OR_TRADE,
            target
        };
    }

    private static createIdleAction(target: SelectedTarget, title: string, subtitle: string): ContextAction {
        return {
            actionId: 'idle_ok',
            title,
            subtitle,
            icon: '✅',
            enabled: false,
            blockedReason: subtitle,
            durationSeconds: 0,
            animState: 'idle',
            interactionDistance: 3.0,
            priority: ACTION_PRIORITIES.IDLE_NORMAL,
            target
        };
    }
}
