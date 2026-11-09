/**
 * Ninja Farm - Core Types
 * Phase 1: Self-Sustaining Farm (Fazenda Autossustentável)
 */

export type ResourceType = 'wood' | 'metal' | 'parts' | 'food' | 'water' | 'energy';

export interface ResourceInventory {
    wood: number;
    metal: number;
    parts: number;
    food: number;
    water: number;
    energy: number;
}

export type BuildingType =
    | 'hq'             // Sede principal
    | 'shed'           // Galpão de armazenamento
    | 'crop_field'     // Canteiro de cultivo
    | 'solar_panel'    // Painel solar fotovoltaico
    | 'battery'        // Banco de baterias
    | 'water_tank'     // Cisterna / reservatório hídrico
    | 'water_pump'     // Bomba de captação
    | 'chicken_coop'   // Galinheiro
    | 'fish_pond'      // Tanque de peixes
    | 'lamp_post'      // Poste de luz / lanterna noturna
    | 'torii_gate'     // Portal Torii sagrado japonês
    | 'bonfire';       // Fogueira shinobi com repouso e luz

export type BuildingOrientation = 0 | 90 | 180 | 270;

export interface Footprint {
    width: number;  // em células
    height: number; // em células
}

export interface BuildingDefinition {
    id: BuildingType;
    name: string;
    description: string;
    footprint: Footprint;
    cost: Partial<ResourceInventory>;
    maxHealth: number;
    energyProduction?: number; // Watts / unidades por segundo no pico
    energyConsumption?: number; // Watts / unidades por segundo contínuo
    waterProduction?: number;  // Litros / unidades por segundo
    waterConsumption?: number; // Litros / unidades por segundo
    storageCapacity?: Partial<ResourceInventory>;
}

export interface PlacedBuilding {
    instanceId: string;
    type: BuildingType;
    gridX: number;
    gridY: number;
    orientation: BuildingOrientation;
    createdAt: number;
    health: number;
    customData?: Record<string, unknown>;
}

export type CropType = 'rice' | 'vegetable' | 'lotus';
export type CropStage = 'empty' | 'planted' | 'growing' | 'ready' | 'harvested';

export interface CropState {
    instanceId: string;
    buildingInstanceId: string;
    cropType: CropType;
    stage: CropStage;
    growthProgress: number; // 0.0 to 1.0
    waterSupplied: boolean;
    plantedAt: number;
    lastUpdated: number;
}

export type AnimalType = 'chicken' | 'fish';
export type AnimalState = 'idle' | 'walking' | 'eating' | 'swimming';

export interface AnimalData {
    id: string;
    type: AnimalType;
    state: AnimalState;
    posX: number;
    posY: number;
    hunger: number; // 0 (saciado) a 100 (faminto)
    lastFedAt: number;
    productionProgress: number; // 0.0 a 1.0
    readyToCollect: boolean;
}

export interface FarmSaveState {
    version: number;
    savedAt: number;
    resources: ResourceInventory;
    buildings: PlacedBuilding[];
    crops: CropState[];
    animals: AnimalData[];
    dayTime: number; // 0.0 to 1.0 (0.25 = sunrise, 0.5 = noon, 0.75 = sunset, 1.0 = midnight)
    elapsedGameDays: number;
    ninjaPosition: { x: number; y: number; z: number };
}

