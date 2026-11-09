import {
    AppBase,
    AppOptions,
    CameraComponentSystem,
    Color,
    ContainerHandler,
    Entity,
    FILLMODE_FILL_WINDOW,
    LightComponentSystem,
    RESOLUTION_AUTO,
    RenderComponentSystem,
    TextureHandler,
    Vec3,
    createGraphicsDevice
} from 'playcanvas';

import './starter.css';
import { FARM_CONFIG, BUILDING_CATALOG } from './core/config';
import { FarmGrid } from './core/grid';
import { SimulationClock } from './simulation/clock';
import { InventorySystem } from './simulation/inventory';
import { EnergySystem } from './simulation/energy';
import { WaterSystem } from './simulation/water';
import { CropSystem } from './simulation/crops';
import { createFarmMaterials } from './rendering/materials';
import { BuildingModelFactory } from './rendering/models';
import { FarmTerrain } from './rendering/terrain';
import { NinjaCharacter } from './rendering/character';
import { CameraController } from './rendering/camera-controller';
import { FarmHUD } from './ui/hud';
import { PersistenceManager } from './persistence/indexeddb';
import { sound } from './audio/sound';
import { FaunaManager } from './rendering/fauna';
import { ProximityInteractionManager } from './gameplay/interaction';
import { VirtualJoystick } from './input/touch-joystick';
import { triggerHaptic } from './input/haptics';
import { ShinobiMerchantManager } from './gameplay/merchant';
import { ObjectiveManager } from './ui/objectives';
import { t } from './ui/i18n';
import { VisualEffectsManager } from './rendering/vfx';
import { CelestialSkyManager } from './rendering/celestial';
import { HolographicGridOverlay } from './rendering/grid-overlay';
import { TrainingDummy } from './rendering/training-dummy';
import { WeatherSystem } from './rendering/weather';
import { NinjaProgressionSystem } from './gameplay/progression';
import { ShadowCloneManager } from './gameplay/shadow-clone';
import type { BuildingOrientation, BuildingType, CropType, FarmSaveState } from './core/types';

// ==========================================
// 1. BOOTSTRAP GRAPHICS DEVICE & PLAYCANVAS
// ==========================================
const canvas = document.getElementById('application-canvas') as HTMLCanvasElement;
const device = await createGraphicsDevice(canvas);
device.maxPixelRatio = Math.min(window.devicePixelRatio, 2);

const createOptions = new AppOptions();
createOptions.graphicsDevice = device;
createOptions.componentSystems = [RenderComponentSystem, CameraComponentSystem, LightComponentSystem];
createOptions.resourceHandlers = [TextureHandler, ContainerHandler];

const app = new AppBase(canvas);
app.init(createOptions);
app.start();

app.setCanvasFillMode(FILLMODE_FILL_WINDOW);
app.setCanvasResolution(RESOLUTION_AUTO);

const resize = () => {
    app.resizeCanvas();
    cameraCtrl.adaptToViewport(window.innerWidth, window.innerHeight);
};
window.addEventListener('resize', resize);

// ==========================================
// 2. CORE SYSTEMS & DOMAIN
// ==========================================
const grid = new FarmGrid();
const inventory = new InventorySystem();
const clock = new SimulationClock(0.45); // Começa às 10:48
const energySystem = new EnergySystem(grid, inventory, clock);
const waterSystem = new WaterSystem(grid, inventory, energySystem);
const cropSystem = new CropSystem(inventory, waterSystem);
const persistence = new PersistenceManager();
await persistence.init();

const objectives = new ObjectiveManager();
const progression = new NinjaProgressionSystem(0, (level, title) => {
    hud.showLevelUpBanner(level, title);
});

// ==========================================
// 3. 3D RENDERING & ATMOSPHERE SETUP
// ==========================================
const materials = createFarmMaterials();
const modelFactory = new BuildingModelFactory(materials);

// Terreno e limites
const terrain = new FarmTerrain(materials, modelFactory);
app.root.addChild(terrain.entity);

// Clima & Pétalas de Cerejeira caindo
const weather = new WeatherSystem(45);
app.root.addChild(weather.entity);

// Céu Celestial (Sol, Lua, Estrelas e Lanternas Noturnas)
const celestial = new CelestialSkyManager(clock);
app.root.addChild(celestial.entity);

// Grade holográfica (Tecla G)
const gridOverlay = new HolographicGridOverlay();
app.root.addChild(gridOverlay.entity);

// Sistema de Efeitos Visuais (VFX: Shurikens, Fumaça, Fagulhas, Água)
const vfx = new VisualEffectsManager();
app.root.addChild(vfx.entity);

// Boneco de Treino do Dojo (Training Dummy)
const dummy = new TrainingDummy(vfx, () => {
    progression.addXP(15);
    vfx.showFloatingText('🎯 HIT! +15 XP', undefined, undefined, '#F59E0B');
    objectives.recordProgress('shuriken');
});
const dummyPos = grid.gridToWorld(20, 10);
dummy.entity.setPosition(dummyPos.x, 0, dummyPos.z);
app.root.addChild(dummy.entity);

// Fauna animada (Galinhas no terreiro e Raposa nos limites)
const fauna = new FaunaManager(grid);
app.root.addChild(fauna.entity);

// Câmera adaptativa
const cameraCtrl = new CameraController();
app.root.addChild(cameraCtrl.entity);
cameraCtrl.adaptToViewport(window.innerWidth, window.innerHeight);

// Iluminação Solar Direcional com Sombras
const sunLight = new Entity('sun_light');
sunLight.addComponent('light', {
    type: 'directional',
    color: new Color(1.0, 0.95, 0.85),
    castShadows: true,
    shadowDistance: 80,
    shadowResolution: 2048,
    shadowBias: 0.05,
    normalOffsetBias: 0.1
});
sunLight.setEulerAngles(45, 30, 0);
app.root.addChild(sunLight);

// Luz ambiente / preenchimento do céu
const ambientLight = new Entity('ambient_light');
ambientLight.addComponent('light', {
    type: 'directional',
    color: new Color(0.25, 0.35, 0.5),
    castShadows: false,
    intensity: 0.4
});
ambientLight.setEulerAngles(-60, 200, 0);
app.root.addChild(ambientLight);

// Ninja Jogador
const ninja = new NinjaCharacter(materials);
app.root.addChild(ninja.entity);
const ninjaWorldPos = grid.gridToWorld(20, 16);
ninja.entity.setPosition(ninjaWorldPos.x, ninjaWorldPos.y, ninjaWorldPos.z);

// Sistema de Interações de Proximidade ([E]) com canteiros e fauna
const interactionMgr = new ProximityInteractionManager(grid, cropSystem, inventory, fauna);

// Kage Bunshin no Jutsu: Sistema de Clones das Sombras Autônomos
const shadowClone = new ShadowCloneManager(grid, cropSystem, vfx, materials, progression);
app.root.addChild(shadowClone.entity);

// Mercador Itinerante Shinobi (Wandering Merchant 3D & Trading Post)
const merchantEntity = modelFactory.createMerchantModel();
const merchantPos = grid.gridToWorld(20, 26);
merchantEntity.setPosition(merchantPos.x, 0, merchantPos.z);
merchantEntity.setEulerAngles(0, 180, 0);
app.root.addChild(merchantEntity);
interactionMgr.setMerchantPosition(merchantPos.x, merchantPos.z);

const merchantMgr = new ShinobiMerchantManager(inventory, () => {
    progression.addXP(20);
    hud.updateResources(inventory.getAll());
    vfx.showFloatingText('🪙 Troca Realizada! (+20 XP)');
    objectives.recordProgress('merchant');
    objectives.recordProgress('trade_merchant');
});

// Map de entidades 3D no mundo
const buildingEntities = new Map<string, Entity>();

function spawnBuilding3D(instanceId: string, type: BuildingType, gridX: number, gridY: number, orientation: BuildingOrientation): Entity {
    const entity = modelFactory.createBuildingEntity(type);
    const pos = grid.gridToWorld(gridX, gridY);
    const def = BUILDING_CATALOG[type];
    const rotated = grid.getRotatedFootprint(def.footprint, orientation);

    // Ajusta o centro do footprint
    const centerX = pos.x + ((rotated.width - 1) * grid.cellSize) / 2;
    const centerZ = pos.z + ((rotated.height - 1) * grid.cellSize) / 2;

    entity.setPosition(centerX, pos.y, centerZ);
    entity.setEulerAngles(0, orientation, 0);
    app.root.addChild(entity);
    buildingEntities.set(instanceId, entity);

    // Conecta lanternas da Sede, Postes de Luz, Portal Torii e Fogueiras ao gestor celestial
    if (type === 'hq' || type === 'lamp_post' || type === 'torii_gate') {
        celestial.registerLantern(entity, false);
    } else if (type === 'bonfire') {
        celestial.registerBonfire(entity);
    }

    return entity;
}

// Inicia construções padrão do assentamento
const initialBuildings = [
    { type: 'hq' as BuildingType, x: 14, y: 10, rot: 0 as BuildingOrientation },
    { type: 'solar_panel' as BuildingType, x: 24, y: 8, rot: 0 as BuildingOrientation },
    { type: 'battery' as BuildingType, x: 27, y: 8, rot: 0 as BuildingOrientation },
    { type: 'water_tank' as BuildingType, x: 24, y: 12, rot: 0 as BuildingOrientation },
    { type: 'water_pump' as BuildingType, x: 27, y: 12, rot: 0 as BuildingOrientation },
    { type: 'crop_field' as BuildingType, x: 14, y: 18, rot: 0 as BuildingOrientation },
    { type: 'crop_field' as BuildingType, x: 18, y: 18, rot: 0 as BuildingOrientation },
    { type: 'lamp_post' as BuildingType, x: 13, y: 14, rot: 0 as BuildingOrientation },
    { type: 'lamp_post' as BuildingType, x: 19, y: 14, rot: 0 as BuildingOrientation },
    { type: 'torii_gate' as BuildingType, x: 20, y: 31, rot: 0 as BuildingOrientation },
    { type: 'bonfire' as BuildingType, x: 16, y: 15, rot: 0 as BuildingOrientation },
    { type: 'fish_pond' as BuildingType, x: 8, y: 17, rot: 0 as BuildingOrientation }
];

for (let i = 0; i < initialBuildings.length; i++) {
    const b = initialBuildings[i];
    const instanceId = `init_${b.type}_${i}`;
    grid.placeBuilding({
        instanceId,
        type: b.type,
        gridX: b.x,
        gridY: b.y,
        orientation: b.rot,
        createdAt: Date.now(),
        health: BUILDING_CATALOG[b.type].maxHealth
    });
    spawnBuilding3D(instanceId, b.type, b.x, b.y, b.rot);

    if (b.type === 'crop_field') {
        cropSystem.plantCrop(instanceId, i % 2 === 0 ? 'rice' : 'vegetable');
    }
}

// ==========================================
// 4. NINJA JUTSU SKILLS & ACTIONS
// ==========================================
function throwShuriken(): void {
    const pos = ninja.entity.getPosition();
    const yaw = ninja.getFacing();
    vfx.spawnShuriken(pos.x, pos.y, pos.z, yaw);
    sound.playShuriken();
}

function smokeDash(): void {
    const pos = ninja.entity.getPosition();
    vfx.spawnSmokePuff(pos.x, pos.y, pos.z);
    sound.playSmokeDash();

    const rad = (ninja.getFacing() * Math.PI) / 180;
    const dashDist = 4.2;
    const targetX = pos.x + Math.sin(rad) * dashDist;
    const targetZ = pos.z + Math.cos(rad) * dashDist;

    const halfW = (grid.width * grid.cellSize) / 2;
    const halfH = (grid.height * grid.cellSize) / 2;
    const clampedX = Math.max(-halfW + 1, Math.min(halfW - 1, targetX));
    const clampedZ = Math.max(-halfH + 1, Math.min(halfH - 1, targetZ));

    const targetGrid = grid.worldToGrid(clampedX, clampedZ);
    const cell = grid.getCell(targetGrid.gridX, targetGrid.gridY);
    if (cell && cell.walkable) {
        ninja.entity.setPosition(clampedX, pos.y, clampedZ);
        vfx.spawnSmokePuff(clampedX, pos.y, clampedZ);
    }
}

function suitonWaterJutsu(): void {
    const pos = ninja.entity.getPosition();
    vfx.spawnSuitonRing(pos.x, pos.y, pos.z);
    sound.playWaterSplash();
    objectives.recordProgress('suiton');

    let watered = 0;
    for (const crop of cropSystem.getAllCrops()) {
        const b = grid.getBuilding(crop.buildingInstanceId);
        if (b) {
            const bPos = grid.gridToWorld(b.gridX, b.gridY);
            const dist = Math.hypot(pos.x - bPos.x, pos.z - bPos.z);
            if (dist <= 6.5) {
                crop.waterSupplied = true;
                watered++;
            }
        }
    }

    objectives.recordProgress('water_soil', Math.max(1, watered));

    if (watered > 0) {
        progression.addXP(10 * watered);
        vfx.showFloatingText(`🌊 Suiton: ${watered} Canteiros Irrigados! (+${10 * watered} XP)`, undefined, undefined, '#60A5FA');
    } else {
        vfx.showFloatingText('🌊 Suiton Jutsu Ativado!', undefined, undefined, '#60A5FA');
    }
}

function toggleGrid(): void {
    const vis = gridOverlay.toggle();
    hud.showToast(`Grade Holográfica: ${vis ? 'Ativada' : 'Desativada'}`);
}

function castShadowClone(): void {
    const pos = ninja.entity.getPosition();
    const yaw = ninja.getFacing();
    const success = shadowClone.spawnClone(pos.x, pos.y, pos.z, yaw);
    if (!success) {
        hud.showToast('Aguarde o chakra recarregar para invocar outro clone!');
    }
}

let currentSelectedCrop: CropType = 'rice';
let harvestComboCount = 0;
let lastHarvestTime = 0;

function registerHarvestCombo(): { combo: number; bonusXp: number; message: string } {
    const now = performance.now();
    if (now - lastHarvestTime < 4500) {
        harvestComboCount++;
    } else {
        harvestComboCount = 1;
    }
    lastHarvestTime = now;

    let bonusXp = 0;
    let message = '';

    if (harvestComboCount === 2) {
        bonusXp = 8;
        message = '🌾 COMBO x2! (+8 XP)';
    } else if (harvestComboCount === 3) {
        bonusXp = 18;
        message = '⚡ COMBO x3! (+18 XP)';
    } else if (harvestComboCount >= 4) {
        bonusXp = 30;
        message = `🔥 COLHEITA FRENÉTICA x${harvestComboCount}! (+30 XP)`;
    }

    return { combo: harvestComboCount, bonusXp, message };
}

function handleInteraction(): void {
    const prompt = interactionMgr.getCurrentPrompt();
    const actionType = prompt?.actionType;
    const res = interactionMgr.executeAction(currentSelectedCrop);
    if (res.executed) {
        if (res.isTrade) {
            merchantMgr.open();
            return;
        }
        if (res.message) {
            hud.showToast(res.message);
            hud.updateResources(inventory.getAll());
            if (res.xpReward) {
                progression.addXP(res.xpReward);
            }

            if (actionType === 'harvest') {
                const combo = registerHarvestCombo();
                if (combo.bonusXp > 0) {
                    progression.addXP(combo.bonusXp);
                    setTimeout(() => {
                        vfx.showFloatingText(combo.message, undefined, undefined, '#FBBF24');
                    }, 200);
                    if (combo.combo > 1) {
                        objectives.recordProgress('harvest_combo');
                    }
                }
                triggerHaptic('harvest');
                vfx.showFloatingText(res.message, undefined, undefined, '#34D399');
                objectives.recordProgress('harvest');
                objectives.recordCropHarvested(res.cropType || 'rice');
            } else if (actionType === 'plant') {
                triggerHaptic('light');
                vfx.showFloatingText(res.message, undefined, undefined, '#34D399');
                objectives.recordCropPlanted(res.cropType || currentSelectedCrop);
            } else if (actionType === 'fish') {
                triggerHaptic('success');
                vfx.showFloatingText(res.message, undefined, undefined, '#60A5FA');
                objectives.recordProgress('fish');
                objectives.recordProgress('fish_koi');
            } else if (actionType === 'rest') {
                triggerHaptic('light');
                vfx.showFloatingText(res.message, undefined, undefined, '#F97316');
                objectives.recordProgress('bonfire');
            } else if (actionType === 'pet_chicken' || actionType === 'pet_fox') {
                triggerHaptic('light');
                vfx.showFloatingText(res.message, undefined, undefined, '#EC4899');
                objectives.recordProgress('pet');
                objectives.recordProgress('feed_animals');
            } else {
                vfx.showFloatingText(res.message, undefined, undefined, '#E5E7EB');
            }
        }
    }
}

// ==========================================
// 5. GHOST PREVIEW & PLACEMENT / DEMOLISH LOGIC
// ==========================================
let activePlacementType: BuildingType | null = null;
let isDemolishMode = false;
let ghostEntity: Entity | null = null;
let currentGhostOrientation: BuildingOrientation = 0;
let currentGhostGridX = 0;
let currentGhostGridY = 0;
let isGhostPlacementValid = false;

function setPlacementType(type: BuildingType | null): void {
    isDemolishMode = false;
    if (ghostEntity) {
        app.root.removeChild(ghostEntity);
        ghostEntity.destroy();
        ghostEntity = null;
    }

    activePlacementType = type;
    if (type) {
        sound.playClick();
        ghostEntity = modelFactory.createGhost(type);
        app.root.addChild(ghostEntity);
        cameraCtrl.setMode('build');
        updateGhostPosition();
        joystick.setVisible(false);
    } else {
        joystick.setVisible(true);
    }
}

function rotateGhost(): void {
    currentGhostOrientation = ((currentGhostOrientation + 90) % 360) as BuildingOrientation;
    sound.playClick();
    if (ghostEntity) {
        ghostEntity.setEulerAngles(0, currentGhostOrientation, 0);
        updateGhostPosition();
    }
}

function updateGhostPosition(): void {
    if (!ghostEntity || !activePlacementType) return;

    const check = grid.canPlace(activePlacementType, currentGhostGridX, currentGhostGridY, currentGhostOrientation);
    const def = BUILDING_CATALOG[activePlacementType];
    const hasCost = inventory.has(def.cost);

    isGhostPlacementValid = check.valid && hasCost;
    modelFactory.applyGhostMaterial(ghostEntity, isGhostPlacementValid);

    const pos = grid.gridToWorld(currentGhostGridX, currentGhostGridY);
    const rotated = grid.getRotatedFootprint(def.footprint, currentGhostOrientation);
    const centerX = pos.x + ((rotated.width - 1) * grid.cellSize) / 2;
    const centerZ = pos.z + ((rotated.height - 1) * grid.cellSize) / 2;

    ghostEntity.setPosition(centerX, pos.y + 0.1, centerZ);
}

function commitPlacement(): void {
    if (!activePlacementType || !isGhostPlacementValid) return;

    const def = BUILDING_CATALOG[activePlacementType];
    if (!inventory.consumeBatch(def.cost)) {
        hud.showToast('Recursos insuficientes!');
        return;
    }

    const instanceId = 'bld_' + Math.random().toString(36).substring(2, 9);
    const success = grid.placeBuilding({
        instanceId,
        type: activePlacementType,
        gridX: currentGhostGridX,
        gridY: currentGhostGridY,
        orientation: currentGhostOrientation,
        createdAt: Date.now(),
        health: def.maxHealth
    });

    if (success) {
        sound.playBuild();
        spawnBuilding3D(instanceId, activePlacementType, currentGhostGridX, currentGhostGridY, currentGhostOrientation);

        if (activePlacementType === 'crop_field') {
            cropSystem.plantCrop(instanceId, 'rice');
            objectives.recordCropPlanted('rice');
        }

        progression.addXP(40);
        vfx.showFloatingText(`+40 XP 🏯 ${def.name}`, undefined, undefined, '#FBBF24');
        objectives.recordBuildingPlaced(activePlacementType);
        hud.showToast(`Construído: ${def.name}`);
        hud.updateResources(inventory.getAll());
    }
}

function handleDemolishAt(gridX: number, gridY: number): void {
    const cell = grid.getCell(gridX, gridY);
    if (!cell || !cell.occupiedBy) {
        hud.showToast('Nenhuma estrutura para desmontar nesta célula.');
        return;
    }

    const b = grid.getBuilding(cell.occupiedBy);
    if (!b) return;

    if (b.type === 'hq') {
        hud.showToast('Não é permitido demolir a Sede Principal (HQ).');
        return;
    }

    const def = BUILDING_CATALOG[b.type];
    // Reembolso de 60% dos materiais
    for (const [k, v] of Object.entries(def.cost)) {
        if (v && v > 0) {
            inventory.add(k as any, Math.floor(v * 0.6));
        }
    }

    // Remove do mundo 3D
    const entity = buildingEntities.get(b.instanceId);
    if (entity) {
        if (b.type === 'lamp_post' || b.type === 'torii_gate') {
            celestial.unregisterLantern(entity);
        } else if (b.type === 'bonfire') {
            celestial.unregisterBonfire(entity);
        }
        app.root.removeChild(entity);
        entity.destroy();
        buildingEntities.delete(b.instanceId);
    }

    grid.removeBuilding(b.instanceId);
    sound.playDemolish();
    hud.showToast(`Demolido: ${def.name} (+60% de reembolso)`);
    hud.updateResources(inventory.getAll());
}

// ==========================================
// 6. HUD & PERSISTENCE CALLBACKS
// ==========================================
const hud = new FarmHUD({
    onModeChange: (mode) => cameraCtrl.setMode(mode),
    onSelectBuilding: (type) => setPlacementType(type),
    onRotateBuilding: () => rotateGhost(),
    onDemolishMode: (active) => {
        isDemolishMode = active;
        setPlacementType(null);
        if (active) {
            joystick.setVisible(false);
        }
    },
    onSaveGame: async () => {
        const state: FarmSaveState = {
            version: 1,
            savedAt: Date.now(),
            resources: inventory.serialize(),
            buildings: grid.getAllBuildings(),
            crops: cropSystem.serialize(),
            animals: [],
            dayTime: clock.getTimeOfDay(),
            elapsedGameDays: clock.getTotalDays(),
            ninjaPosition: {
                x: ninja.entity.getPosition().x,
                y: ninja.entity.getPosition().y,
                z: ninja.entity.getPosition().z
            }
        };

        const ok = await persistence.save(state);
        if (ok) {
            sound.playHarvest();
            objectives.completeObjective('save');
            hud.showToast('Progresso salvo no navegador com sucesso!');
            vfx.showFloatingText('💾 Progresso Salvo!');
        }
    },
    onLoadGame: async () => {
        const saved = await persistence.load();
        if (saved) {
            inventory.load(saved.resources);
            clock.setTimeOfDay(saved.dayTime);
            hud.updateResources(inventory.getAll());
            hud.showToast('Dados restaurados!');
        }
    }
});

// Conecta o gerenciador de provas shinobi ao HUD e ao Almanaque
objectives.setRewardCallback((reward) => {
    progression.addXP(reward.xp);
    if (reward.resourceType && reward.resourceAmount) {
        inventory.add(reward.resourceType, reward.resourceAmount);
    }
    hud.updateResources(inventory.getAll());
    vfx.showFloatingText(`🎁 +${reward.xp} XP`, undefined, undefined, '#F59E0B');
    hud.showToast(t('trials.reward_claimed'));
    hud.updateCodexTrials();
});
hud.setTrialsProvider(() => objectives.renderTrialsListHtml(), (id) => objectives.claimReward(id));

// Virtual Joystick para Mobile (Ergonomia Mobile-First: Polegar Esquerdo = Direção/Auto-Sprint, Polegar Direito = Ação Contextual + Cluster de Jutsus)
const joystick = new VirtualJoystick({
    onAction: () => {
        const prompt = interactionMgr.getCurrentPrompt();
        if (prompt) {
            handleInteraction();
        } else {
            // Se livre no terreno, toque realiza esquiva ágil ninja
            smokeDash();
        }
    },
    onShuriken: () => {
        throwShuriken();
    },
    onDash: () => {
        smokeDash();
    },
    onWaterJutsu: () => {
        suitonWaterJutsu();
    },
    onCloneJutsu: () => {
        castShadowClone();
    },
    onSelectCrop: (crop) => {
        currentSelectedCrop = crop;
        const name = crop === 'lotus' ? 'Flor de Lótus 🪷' : crop === 'vegetable' ? 'Cenoura Ninja 🥕' : 'Arroz Tradicional 🌾';
        hud.showToast(`Semente selecionada: ${name}`);
    }
});

// Função unificada de cancelamento de ação (usada por Esc e pelo Botão Direito do Mouse)
function cancelCurrentAction(): void {
    let actionCancelled = false;

    // 1. Fecha modais se algum estiver aberto (Mercador, Missões, Almanaque)
    if (merchantMgr.getIsOpen()) {
        merchantMgr.close();
        actionCancelled = true;
    }
    if (objectives.isModalOpen()) {
        objectives.closeModal();
        actionCancelled = true;
    }
    if (hud.isCodexOpen()) {
        hud.closeCodex();
        actionCancelled = true;
    }

    // 2. Cancela colocação de construção ativa
    if (activePlacementType || ghostEntity) {
        setPlacementType(null);
        hud.clearSelection();
        actionCancelled = true;
    }

    // 3. Cancela modo de demolição
    if (isDemolishMode) {
        isDemolishMode = false;
        hud.clearSelection();
        joystick.setVisible(true);
        actionCancelled = true;
    }

    // 4. Se a câmera estiver em modo build ou overview e não houver outra ação, retorna a explore
    if (!actionCancelled && cameraCtrl.getMode() !== 'explore') {
        cameraCtrl.setMode('explore');
        hud.setCameraMode('explore');
        actionCancelled = true;
    }

    if (actionCancelled) {
        sound.playClick();
        triggerHaptic('light');
        vfx.showFloatingText('❌ Ação Cancelada', undefined, undefined, '#9CA3AF');
    }
}

// Desativa totalmente o menu de contexto do botão direito e cancela qualquer ação assim como o Esc faz
window.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    cancelCurrentAction();
    return false;
});

window.addEventListener('mousedown', (e) => {
    if (e.button === 2) {
        e.preventDefault();
        cancelCurrentAction();
    }
});

// ==========================================
// 7. INPUT HANDLING (DESKTOP & TOUCH)
// ==========================================
const keysDown = new Set<string>();
window.addEventListener('keydown', (e) => {
    keysDown.add(e.code);
    if (e.code === 'KeyR' && activePlacementType) {
        rotateGhost();
    }
    if (e.code === 'Escape') {
        e.preventDefault();
        cancelCurrentAction();
    }
    if (e.code === 'KeyE') {
        handleInteraction();
    }
    if (e.code === 'KeyF') {
        throwShuriken();
    }
    if (e.code === 'KeyQ') {
        smokeDash();
    }
    if (e.code === 'KeyC') {
        suitonWaterJutsu();
    }
    if (e.code === 'KeyB') {
        castShadowClone();
    }
    if (e.code === 'KeyG') {
        toggleGrid();
    }
    if (e.code === 'Digit1') {
        cameraCtrl.setMode('explore');
    }
    if (e.code === 'Digit2') {
        cameraCtrl.setMode('build');
    }
    if (e.code === 'Digit3') {
        cameraCtrl.setMode('overview');
    }
});
window.addEventListener('keyup', (e) => {
    keysDown.delete(e.code);
});

// Sistema Multi-Touch Mobile & Pointer (Órbita, Pinch-to-Zoom e Tap-to-Move)
const activePointers = new Map<number, { x: number; y: number }>();
let initialPinchDist: number | null = null;
let lastPointerPos = { x: 0, y: 0 };
let touchStartTime = 0;
let touchStartPos = { x: 0, y: 0 };
let hasMovedSignificantly = false;
let tapMoveTarget: Vec3 | null = null;

canvas.addEventListener('pointerdown', (e) => {
    if (e.button === 2) {
        e.preventDefault();
        cancelCurrentAction();
        return;
    }

    try {
        canvas.setPointerCapture?.(e.pointerId);
    } catch {
        // Ignora se não for suportado
    }

    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.size === 1) {
        touchStartTime = performance.now();
        touchStartPos = { x: e.clientX, y: e.clientY };
        lastPointerPos = { x: e.clientX, y: e.clientY };
        hasMovedSignificantly = false;
    } else if (activePointers.size === 2) {
        const pts = Array.from(activePointers.values());
        initialPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        hasMovedSignificantly = true;
    }
});

canvas.addEventListener('pointermove', (e) => {
    if (!activePointers.has(e.pointerId)) return;
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.size === 1) {
        const deltaX = e.clientX - lastPointerPos.x;
        const deltaY = e.clientY - lastPointerPos.y;
        lastPointerPos = { x: e.clientX, y: e.clientY };

        const totalDist = Math.hypot(e.clientX - touchStartPos.x, e.clientY - touchStartPos.y);
        if (totalDist > 8) {
            hasMovedSignificantly = true;
        }

        if (hasMovedSignificantly) {
            if (cameraCtrl.getMode() === 'build' && keysDown.has('Space')) {
                cameraCtrl.pan(-deltaX * 0.08, -deltaY * 0.08);
            } else {
                cameraCtrl.orbit(-deltaX * 0.35, -deltaY * 0.3);
            }
        }

        // Raycast aproximado no plano do solo (y = 0) para posicionar o ghost
        if ((activePlacementType || isDemolishMode) && cameraCtrl.entity.camera) {
            const ray = cameraCtrl.entity.camera.screenToWorld(e.clientX, e.clientY, 1.0);
            const camPos = cameraCtrl.entity.getPosition();
            const dir = new Vec3().sub2(ray, camPos).normalize();

            if (Math.abs(dir.y) > 0.001) {
                const t = -camPos.y / dir.y;
                if (t > 0) {
                    const hitX = camPos.x + dir.x * t;
                    const hitZ = camPos.z + dir.z * t;
                    const coords = grid.worldToGrid(hitX, hitZ);
                    if (coords.gridX !== currentGhostGridX || coords.gridY !== currentGhostGridY) {
                        currentGhostGridX = coords.gridX;
                        currentGhostGridY = coords.gridY;
                        if (activePlacementType) {
                            updateGhostPosition();
                        }
                    }
                }
            }
        }
    } else if (activePointers.size === 2) {
        hasMovedSignificantly = true;
        const pts = Array.from(activePointers.values());
        const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);

        if (initialPinchDist !== null && initialPinchDist > 0) {
            const delta = currentDist - initialPinchDist;
            cameraCtrl.zoom(-delta * 0.05);
        }
        initialPinchDist = currentDist;
    }
});

const onPointerEnd = (e: PointerEvent) => {
    if (e.button === 2) {
        e.preventDefault();
        return;
    }

    const wasSingleTouch = activePointers.size === 1;
    activePointers.delete(e.pointerId);

    if (activePointers.size < 2) {
        initialPinchDist = null;
    }

    if (wasSingleTouch && !hasMovedSignificantly) {
        const elapsed = performance.now() - touchStartTime;
        if (elapsed < 320) {
            handleTap(e.clientX, e.clientY);
        }
    }
};

canvas.addEventListener('pointerup', onPointerEnd);
canvas.addEventListener('pointercancel', onPointerEnd);

function handleTap(clientX: number, clientY: number): void {
    if (activePlacementType) {
        commitPlacement();
        return;
    }

    if (isDemolishMode) {
        handleDemolishAt(currentGhostGridX, currentGhostGridY);
        isDemolishMode = false;
        return;
    }

    // Em modo normal de exploração: raycast para interagir ou mover ninja
    if (cameraCtrl.entity.camera) {
        const ray = cameraCtrl.entity.camera.screenToWorld(clientX, clientY, 1.0);
        const camPos = cameraCtrl.entity.getPosition();
        const dir = new Vec3().sub2(ray, camPos).normalize();

        if (Math.abs(dir.y) > 0.001) {
            const t = -camPos.y / dir.y;
            if (t > 0) {
                const hitX = camPos.x + dir.x * t;
                const hitZ = camPos.z + dir.z * t;

                // 1. Tocou no Boneco de Treino do Dojo?
                const dDist = Math.hypot(hitX - dummyPos.x, hitZ - dummyPos.z);
                if (dDist <= 2.2) {
                    throwShuriken();
                    triggerHaptic('medium');
                    return;
                }

                // 2. Tocou em um canteiro próximo ou animal?
                const prompt = interactionMgr.getCurrentPrompt();
                if (prompt && prompt.distance <= 4.0) {
                    handleInteraction();
                    return;
                }

                // 3. Toque no terreno livre: Tap-to-Move com indicador visual!
                const coords = grid.worldToGrid(hitX, hitZ);
                const cell = grid.getCell(coords.gridX, coords.gridY);
                if (cell && cell.walkable) {
                    tapMoveTarget = new Vec3(hitX, 0, hitZ);
                    vfx.spawnMoveBeacon(hitX, 0, hitZ);
                    triggerHaptic('light');
                }
            }
        }
    }
}

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    cameraCtrl.zoom(e.deltaY * 0.03);
}, { passive: false });

// ==========================================
// 8. GAME LOOP & SIMULATION UPDATE
// ==========================================
let lastTime = performance.now();
let fpsCounter = 60;
let frameCount = 0;
let lastFpsUpdate = performance.now();
let footstepTimer = 0;
let sprintDustTimer = 0;
let autoSaveTimer = 0;
let exploreDistanceAccum = 0;

app.on('update', () => {
    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;

    frameCount++;
    if (now - lastFpsUpdate >= 500) {
        fpsCounter = (frameCount * 1000) / (now - lastFpsUpdate);
        frameCount = 0;
        lastFpsUpdate = now;
    }

    // 1. Simulação desacoplada
    clock.tick(dt);
    const energyMetrics = energySystem.tick(dt);
    const waterMetrics = waterSystem.tick(dt);
    cropSystem.tick(dt);

    // 2. Atualização das plantas 3D nos canteiros e umidade do solo
    for (const crop of cropSystem.getAllCrops()) {
        const entity = buildingEntities.get(crop.buildingInstanceId);
        if (entity) {
            const plantsGroup = entity.findByName('plants_group') as Entity;
            if (plantsGroup) {
                modelFactory.updateCropPlants(plantsGroup, crop.stage, crop.cropType);
            }
            modelFactory.updateCropSoil(entity, crop.waterSupplied);
        }
    }

    // 3. Atualização da fauna animada, clima (sakura e vagalumes), céu e clones
    fauna.update(dt);
    weather.update(dt, clock.isNight());
    celestial.update();
    dummy.update(dt);
    vfx.update(dt);
    shadowClone.update(dt, ninja.entity.getPosition());
    sound.updateAmbientMusic(dt, clock.isNight());

    // 4. Atualização da iluminação solar com o horário
    const sunlightFactor = clock.getSunlightFactor();
    const isNight = clock.isNight();

    if (sunLight.light) {
        sunLight.light.intensity = sunlightFactor * 1.3;
        // Tom mais quente no amanhecer/entardecer
        const warmth = 1.0 - Math.abs(sunlightFactor - 0.5) * 0.5;
        sunLight.light.color = new Color(1.0, 0.9 * warmth, 0.75 * warmth);
    }

    if (cameraCtrl.entity.camera) {
        // Céu dinâmico
        const skyR = isNight ? 0.05 : 0.45 * sunlightFactor;
        const skyG = isNight ? 0.08 : 0.65 * sunlightFactor;
        const skyB = isNight ? 0.15 : 0.95 * Math.max(0.2, sunlightFactor);
        cameraCtrl.entity.camera.clearColor = new Color(skyR, skyG, skyB);
    }

    // 5. Locomoção do Ninja (WASD + Virtual Joystick + Tap-to-Move)
    let moveX = 0;
    let moveZ = 0;

    if (keysDown.has('KeyW') || keysDown.has('ArrowUp')) moveZ -= 1;
    if (keysDown.has('KeyS') || keysDown.has('ArrowDown')) moveZ += 1;
    if (keysDown.has('KeyA') || keysDown.has('ArrowLeft')) moveX -= 1;
    if (keysDown.has('KeyD') || keysDown.has('ArrowRight')) moveX += 1;

    // Adiciona vetor do joystick touch mobile
    const joyVec = joystick.getVector();
    if (joyVec.intensity > 0.1) {
        moveX += joyVec.x;
        moveZ += joyVec.y;
        tapMoveTarget = null; // Joystick cancela o destino do toque
    } else if (tapMoveTarget) {
        const curPos = ninja.entity.getPosition();
        const toTargetX = tapMoveTarget.x - curPos.x;
        const toTargetZ = tapMoveTarget.z - curPos.z;
        const distToTarget = Math.hypot(toTargetX, toTargetZ);

        if (distToTarget < 0.4) {
            tapMoveTarget = null;
        } else {
            moveX = toTargetX / distToTarget;
            moveZ = toTargetZ / distToTarget;
        }
    }

    const isRunning = keysDown.has('ShiftLeft') || keysDown.has('ShiftRight') || joyVec.isSprinting;
    const isMoving = Math.hypot(moveX, moveZ) > 0.1;

    if (isMoving) {
        const len = Math.hypot(moveX, moveZ);
        const normX = moveX / len;
        const normZ = moveZ / len;

        const speed = isRunning ? FARM_CONFIG.NINJA_RUN_SPEED : FARM_CONFIG.NINJA_WALK_SPEED;
        const currentPos = ninja.entity.getPosition();

        const newX = currentPos.x + normX * speed * dt;
        const newZ = currentPos.z + normZ * speed * dt;

        // Limita movimento à grade e evita atravessar obstáculos
        const halfW = (grid.width * grid.cellSize) / 2;
        const halfH = (grid.height * grid.cellSize) / 2;
        const clampedX = Math.max(-halfW + 1, Math.min(halfW - 1, newX));
        const clampedZ = Math.max(-halfH + 1, Math.min(halfH - 1, newZ));

        const targetGrid = grid.worldToGrid(clampedX, clampedZ);
        const cell = grid.getCell(targetGrid.gridX, targetGrid.gridY);

        if (cell && cell.walkable) {
            ninja.entity.setPosition(clampedX, currentPos.y, clampedZ);
        }

        // Rotação para a direção de movimento
        const angle = Math.atan2(normX, normZ) * (180 / Math.PI);
        ninja.setFacing(angle);
        ninja.setState(isRunning ? 'run' : 'walk');

        exploreDistanceAccum += Math.hypot(normX, normZ) * speed * dt;
        if (exploreDistanceAccum >= 12) {
            objectives.recordProgress('explore');
            exploreDistanceAccum = 0;
        }

        // Partículas de poeira ao correr (Sprint Dust)
        if (isRunning) {
            sprintDustTimer += dt;
            if (sprintDustTimer >= 0.14) {
                vfx.spawnSprintDust(clampedX, currentPos.y, clampedZ);
                sprintDustTimer = 0;
            }
        }

        // Passos sonoros periódicos
        footstepTimer += dt;
        if (footstepTimer >= (isRunning ? 0.28 : 0.42)) {
            sound.playFootstep();
            footstepTimer = 0;
        }
    } else {
        ninja.setState('idle');
        footstepTimer = 0;
    }

    ninja.update(dt);

    // 6. Atualização de Proximidade e Interações (Contexto Dinâmico para o Botão Mobile)
    const nPos = ninja.entity.getPosition();
    interactionMgr.update(nPos.x, nPos.z);

    const prompt = interactionMgr.getCurrentPrompt();
    if (prompt) {
        if (prompt.actionType === 'harvest') {
            joystick.setActionState('🌾', 'Colher');
            joystick.showSeedPicker(false);
        } else if (prompt.actionType === 'plant') {
            joystick.setActionState('🌱', 'Plantar');
            joystick.showSeedPicker(true);
        } else if (prompt.actionType === 'pet_chicken') {
            joystick.setActionState('🥚', 'Alimentar');
            joystick.showSeedPicker(false);
        } else if (prompt.actionType === 'pet_fox') {
            joystick.setActionState('🦊', 'Acariciar');
            joystick.showSeedPicker(false);
        } else if (prompt.actionType === 'fish') {
            joystick.setActionState('🎣', 'Pescar');
            joystick.showSeedPicker(false);
        } else if (prompt.actionType === 'rest') {
            joystick.setActionState('🔥', 'Descansar');
            joystick.showSeedPicker(false);
        } else if (prompt.actionType === 'trade') {
            joystick.setActionState('🪙', 'Comerciar');
            joystick.showSeedPicker(false);
        } else {
            joystick.setActionState('🔍', 'Inspecionar');
            joystick.showSeedPicker(false);
        }
    } else {
        joystick.setActionState('💨', 'Esquiva');
        joystick.showSeedPicker(false);
    }

    // Respiração sutil do Mercador
    merchantEntity.setPosition(merchantPos.x, Math.sin(now * 0.003) * 0.03, merchantPos.z);

    // 7. Atualização da câmera
    cameraCtrl.update(dt, nPos);

    // 8. Atualização do HUD & Progressão Ninja
    const prog = progression.getXpProgress();
    hud.updateProgression(progression.getLevel(), progression.getCurrentRank().title, prog.current, prog.max, prog.percentage);
    hud.updateClock(clock.getFormattedTime(), clock.getTotalDays(), fpsCounter);
    hud.updateResources(inventory.getAll());
    hud.updateEnergy(energyMetrics);
    hud.updateWater(waterMetrics);

    // 9. Auto-Save silencioso em segundo plano a cada 30 segundos
    autoSaveTimer += dt;
    if (autoSaveTimer >= 30.0) {
        autoSaveTimer = 0;
        persistence.save({
            version: 1,
            savedAt: Date.now(),
            resources: inventory.serialize(),
            buildings: grid.getAllBuildings(),
            crops: cropSystem.serialize(),
            animals: [],
            dayTime: clock.getTimeOfDay(),
            elapsedGameDays: clock.getTotalDays(),
            ninjaPosition: {
                x: ninja.entity.getPosition().x,
                y: ninja.entity.getPosition().y,
                z: ninja.entity.getPosition().z
            }
        });
    }
});
