/**
 * Ninja Farm - Unified Context Action System
 * Rule: Exactly ONE contextual action per selected object.
 */

import type { CropType, ResourceInventory, ResourceType } from '../../core/types';

export type SelectableTargetType =
    | 'plot'           // Canteiro agrícola / solo
    | 'building'       // Instalações (HQ, galpão, cisterna, bomba, painel solar, bateria)
    | 'animal'         // Galinhas, vacas, peixes, raposa
    | 'merchant'       // Mercador itinerante
    | 'dummy'          // Boneco de treino
    | 'bonfire'        // Fogueira
    | 'terrain';       // Terreno livre

export type SoilStatus =
    | 'raw'            // Terra natural cultivável não preparada
    | 'tilled'         // Solo preparado e pronto para sementeira
    | 'planted'        // Sementes recém-plantadas
    | 'growing'        // Em crescimento
    | 'thirsty'        // Crescendo mas estagnado por falta de água
    | 'ready'          // Maduro e pronto para colheita
    | 'exhausted';     // Esgotado após colheitas, necessita de nova preparação

export interface SelectedTarget {
    id: string;
    type: SelectableTargetType;
    name: string;
    description?: string;
    gridX: number;
    gridY: number;
    worldPosition: { x: number; y: number; z: number };
    soilStatus?: SoilStatus;
    cropInstanceId?: string;
    cropType?: CropType;
    growthProgress?: number; // 0.0 to 1.0
    waterSupplied?: boolean;
    buildingType?: string;
    buildingHealth?: number;
    maxHealth?: number;
    animalId?: string;
    animalType?: string;
    hunger?: number;
    readyToCollect?: boolean;
    isMerchant?: boolean;
}

export type ContextActionId =
    | 'prepare_soil'     // Preparar solo / arar terra
    | 'plant_crop'       // Plantar cultura selecionada
    | 'water_crop'       // Regar canteiro sedento
    | 'harvest_crop'     // Colher safra madura
    | 'recover_soil'     // Recuperar solo exaurido
    | 'feed_animal'      // Alimentar galinha ou animal
    | 'give_water_animal'// Dar água para animal com sede
    | 'collect_eggs'     // Coletar ovos do galinheiro
    | 'pet_animal'       // Acariciar raposa / animal
    | 'catch_fish'       // Pescar peixe no tanque
    | 'rest_bonfire'     // Descansar na fogueira
    | 'trade_merchant'   // Negociar com mercador
    | 'repair_building'  // Reparar estrutura danificada
    | 'refill_water'     // Abastecer cisterna / tanque
    | 'train_dummy'      // Treinar arremesso de shuriken no alvo
    | 'idle_ok';         // Funcionando normalmente (ação desabilitada)

export interface ContextAction {
    actionId: ContextActionId;
    title: string;
    subtitle?: string;
    icon: string;
    enabled: boolean;
    blockedReason?: string;
    cost?: Partial<ResourceInventory>;
    missingResource?: {
        type: ResourceType | 'seed';
        name: string;
        required: number;
        available: number;
        howToGet: string;
    };
    durationSeconds: number;
    animState: 'idle' | 'walk' | 'run' | 'interact';
    interactionDistance: number;
    priority: number;
    target: SelectedTarget;
}
