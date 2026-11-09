/**
 * Ninja Farm - Context Action Priorities
 * Deterministic priorities when an entity has multiple competing states.
 */

export const ACTION_PRIORITIES = {
    CRITICAL_WATER: 100,     // Sede crítica em animais ou plantas desidratadas
    ANIMAL_HUNGER: 90,       // Alimentação animal prioritária
    HARVEST_READY: 85,       // Plantação madura pronta para colheita
    COLLECT_PRODUCE: 80,     // Coleta de ovos ou produtos animais
    REPAIR_STRUCTURE: 75,    // Estrutura danificada que requer reparo
    SOIL_PREPARATION: 70,    // Arar ou preparar solo para plantio
    PLANT_SEEDS: 65,         // Semeadura em solo pronto
    WATER_CROP: 60,          // Rega de rotina em canteiro
    SOIL_RECOVERY: 55,       // Recuperação de solo exaurido
    REST_OR_TRADE: 50,       // Repouso na fogueira ou comércio com mercador
    PET_OR_TRAIN: 40,        // Acariciar animais ou treinar shuriken
    IDLE_NORMAL: 10          // Objeto em operação normal sem ação imediata
} as const;

export type ActionPriorityLevel = keyof typeof ACTION_PRIORITIES;

