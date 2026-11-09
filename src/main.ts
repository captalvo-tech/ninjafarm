import {
    AnimComponentSystem,
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
import { createFarmMaterials, loadPbrTextures } from './rendering/materials';
import { GlbAssetLoader } from './rendering/asset-loader';
import { BuildingModelFactory } from './rendering/models';
import { FarmTerrain } from './rendering/terrain';
import { NinjaCharacter } from './rendering/character';
import { CameraController } from './rendering/camera-controller';
import { FarmHUD } from './ui/hud';
import { AuthManager } from './persistence/auth';
import { CloudSaveManager } from './persistence/cloud-save';
import { LoginModal } from './ui/login-modal';
import { SettingsModal } from './ui/settings-modal';
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
import { getVisualConfig, onVisualConfigChange } from './core/visual-config';
import type { BuildingOrientation, BuildingType, CropType, FarmSaveState } from './core/types';
import { NavigationSystem, type PathNode } from './simulation/navigation';
import { ActionResolver, type ResolverContext } from './gameplay/actions/action-resolver';
import { ActionExecutor } from './gameplay/actions/action-executor';
import type { ContextAction, SelectedTarget, SoilStatus } from './gameplay/actions/action-types';
import { ContextActionUI } from './ui/context-action';
import { FarmDroid } from './rendering/droid';
import { TaskScheduler } from './simulation/task-scheduler';
import { SchedulerUI } from './ui/scheduler-ui';
import { GeminiService } from './ai/gemini-service';
import { DroidChatModal } from './ui/droid-chat';
import { EventJournal } from './simulation/event-journal';
import { InteractiveTutorial } from './ui/tutorial';
import { BugReportModal } from './ui/bug-report';
import { telemetry } from './core/telemetry';
import type { FarmTask, ResourceType } from './core/types';

// ==========================================
// 1. BOOTSTRAP GRAPHICS DEVICE & PLAYCANVAS
// ==========================================
const canvas = document.getElementById('application-canvas') as HTMLCanvasElement;
const device = await createGraphicsDevice(canvas);
device.maxPixelRatio = Math.min(window.devicePixelRatio, 2);

const createOptions = new AppOptions();
createOptions.graphicsDevice = device;
createOptions.componentSystems = [
    RenderComponentSystem,
    CameraComponentSystem,
    LightComponentSystem,
    AnimComponentSystem
];
createOptions.resourceHandlers = [TextureHandler, ContainerHandler];

const app = new AppBase(canvas);
app.init(createOptions);
app.start();

const assetLoader = new GlbAssetLoader(app);

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

// Persistência em nuvem vinculada à conta Google (Fase A)
const authManager = new AuthManager({
    onLogin: (user) => {
        hud.showToast(`Conectado como ${user.name}`);
    },
    onLogout: () => {
        loginModal.show();
    }
});
const cloudSave = new CloudSaveManager(() => authManager.getSessionToken());
await cloudSave.init();

// Diário de Eventos da Fazenda e do Droid (Fase C & Auditoria Alpha 0.1)
const eventJournal = new EventJournal(100);

function applySaveState(saved: FarmSaveState): void {
    inventory.load(saved.resources);
    clock.setTimeOfDay(saved.dayTime);
    if (saved.crops && saved.crops.length > 0) {
        cropSystem.load(saved.crops);
    }
    if (typeof fauna !== 'undefined' && saved.animals && saved.animals.length > 0) {
        fauna.load(saved.animals);
    }
    if (saved.eventsLog && saved.eventsLog.length > 0) {
        eventJournal.load(saved.eventsLog);
    }
    if (typeof droid !== 'undefined' && saved.droid) {
        droid.load(saved.droid);
    }
    if (typeof taskScheduler !== 'undefined' && saved.scheduler) {
        taskScheduler.load(saved.scheduler);

        // Reconciliação Determinística AFK Offline (Fase D & Auditoria Alpha 0.1)
        const nowSec = Math.floor(Date.now() / 1000);
        const lastSec = Math.floor(saved.savedAt / 1000);
        const elapsedSec = Math.max(0, nowSec - lastSec);

        if (elapsedSec > 10) {
            const notifs: string[] = [];

            if (typeof droid !== 'undefined') {
                const completed = taskScheduler.simulateOfflineSeconds(elapsedSec, droid, 1.2);
                if (completed > 0) {
                    notifs.push(`${completed} tarefas concluídas`);
                }
            }

            const cropRes = cropSystem.simulateOfflineSeconds(elapsedSec);
            if (cropRes.maturedCount > 0) {
                notifs.push(`${cropRes.maturedCount} colheitas prontas`);
            }

            if (typeof fauna !== 'undefined') {
                const faunaRes = fauna.simulateOfflineSeconds(elapsedSec);
                if (faunaRes.eggsProduced > 0) {
                    notifs.push(`${faunaRes.eggsProduced} ovos produzidos`);
                }
            }

            if (notifs.length > 0) {
                eventJournal.recordEvent({
                    type: 'afk_catchup',
                    title: 'Retorno AFK',
                    description: notifs.join(', ')
                });
                hud.showToast(`🌙 Retorno AFK (${Math.round(elapsedSec / 60)}m): ${notifs.join(', ')}!`);
                vfx.showFloatingText('🌙 Progresso AFK Sincronizado!', undefined, undefined, '#34D399');
            }
        }
    }
    hud.updateResources(inventory.getAll());
    if (typeof schedulerUI !== 'undefined' && schedulerUI.isOpen()) {
        schedulerUI.render();
    }
}

const objectives = new ObjectiveManager();
const progression = new NinjaProgressionSystem(0, (level, title) => {
    hud.showLevelUpBanner(level, title);
});

// ==========================================
// 3. 3D RENDERING & ATMOSPHERE SETUP
// ==========================================
const materials = createFarmMaterials();
loadPbrTextures(materials, app);

const modelFactory = new BuildingModelFactory(materials, assetLoader);
await modelFactory.preload();

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

// Fauna animada com modelos e rigs reais (Quaternius CC0: Vaca pastando e Raposa)
const fauna = new FaunaManager(grid, assetLoader);
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
    color: new Color(0.35, 0.44, 0.58),
    castShadows: false,
    intensity: 0.55
});
ambientLight.setEulerAngles(-60, 200, 0);
app.root.addChild(ambientLight);

// Ninja Jogador humanoide rigado com animações reais (Universal Animation Library CC0)
const visualConfig = getVisualConfig();
const ninja = new NinjaCharacter(materials, assetLoader, visualConfig.character);
app.root.addChild(ninja.entity);
const ninjaWorldPos = grid.gridToWorld(20, 16);
ninja.entity.setPosition(ninjaWorldPos.x, ninjaWorldPos.y, ninjaWorldPos.z);

// Droid Operacional Único da Fazenda (Fases B e C)
const droid = new FarmDroid(grid, materials, assetLoader);
app.root.addChild(droid.entity);

// Sincronização em tempo real com o Ninja Farm Studio (sem reiniciar o jogo)
onVisualConfigChange((updatedConfig) => {
    ninja.applyVisualConfig(updatedConfig.character);
    if (sunLight.light) {
        sunLight.light.intensity = updatedConfig.lighting.sunIntensity;
    }
});

// Acesso seguro ao Ninja Farm Studio em ambiente local/desenvolvimento
const isDev = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.search.includes('studio');
if (isDev) {
    const studioBtn = document.createElement('a');
    studioBtn.href = './studio.html';
    studioBtn.id = 'ninja-studio-dev-btn';
    studioBtn.innerHTML = '🛠️ Studio [F1]';
    studioBtn.title = 'Ninja Farm Studio (Visual 3D Editor)';
    studioBtn.style.position = 'fixed';
    studioBtn.style.bottom = '12px';
    studioBtn.style.left = '12px';
    studioBtn.style.zIndex = '99999';
    studioBtn.style.background = 'rgba(15, 23, 42, 0.85)';
    studioBtn.style.backdropFilter = 'blur(8px)';
    studioBtn.style.color = '#38bdf8';
    studioBtn.style.border = '1px solid rgba(56, 189, 248, 0.4)';
    studioBtn.style.borderRadius = '8px';
    studioBtn.style.padding = '6px 12px';
    studioBtn.style.fontSize = '12px';
    studioBtn.style.fontWeight = 'bold';
    studioBtn.style.textDecoration = 'none';
    studioBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
    studioBtn.style.fontFamily = 'monospace';
    studioBtn.style.cursor = 'pointer';
    document.body.appendChild(studioBtn);

    window.addEventListener('keydown', (e) => {
        if (e.key === 'F1') {
            e.preventDefault();
            window.location.href = './studio.html';
        }
    });
}

// Sistema de Interações de Proximidade ([E]) com canteiros e fauna
const interactionMgr = new ProximityInteractionManager(grid, cropSystem, inventory, fauna);

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

// ==========================================
// 4.1. SISTEMA CONTEXTUAL UNIFICADO (MARCO A)
// ==========================================
const navigation = new NavigationSystem(grid);
const actionExecutor = new ActionExecutor(grid, cropSystem, inventory, navigation);

let selectedWorldTarget: SelectedTarget | null = null;
let ninjaWaypoints: PathNode[] = [];
let pendingActionOnArrival: ContextAction | null = null;

function getResolverContext(): ResolverContext {
    const nPos = ninja.entity.getPosition();
    return {
        inventory: inventory.getAll(),
        seedInventory: { rice: 5, vegetable: 5, lotus: 5 },
        selectedCropPreference: currentSelectedCrop,
        ninjaPosition: { x: nPos.x, y: nPos.y, z: nPos.z },
        canFish: true,
        canRest: true
    };
}

function selectTarget(target: SelectedTarget): void {
    selectedWorldTarget = target;
    vfx.setSelectionHighlight(target.worldPosition, target.type === 'plot' ? 3.8 : 2.2);
    sound.playClick();
    triggerHaptic('light');

    updateSelectedAction();
    tutorial.triggerActionHook('target_selected');
}

function updateSelectedAction(): void {
    if (!selectedWorldTarget) {
        contextUI.hide();
        return;
    }

    // Se for canteiro, sincroniza estado mais recente da cultura e solo
    if (selectedWorldTarget.type === 'plot') {
        const b = grid.getBuilding(selectedWorldTarget.id);
        const crop = cropSystem.getCrop(selectedWorldTarget.id);
        if (crop) {
            selectedWorldTarget.growthProgress = crop.growthProgress;
            selectedWorldTarget.waterSupplied = crop.waterSupplied;
            selectedWorldTarget.cropType = crop.cropType;
            if (crop.stage === 'ready') {
                selectedWorldTarget.soilStatus = 'ready';
            } else if (crop.stage === 'growing' || crop.stage === 'planted') {
                selectedWorldTarget.soilStatus = crop.waterSupplied ? (crop.stage === 'growing' ? 'growing' : 'planted') : 'thirsty';
            }
        } else if (b?.customData?.soilStatus) {
            selectedWorldTarget.soilStatus = b.customData.soilStatus as SoilStatus;
        }
    }

    const context = getResolverContext();
    const action = ActionResolver.resolve(selectedWorldTarget, context);
    contextUI.showAction(action);

    // Sincroniza botão principal touch mobile
    joystick.setActionState(action.icon, action.title);
}

function deselectTarget(): void {
    selectedWorldTarget = null;
    vfx.setSelectionHighlight(null);
    contextUI.hide();
    joystick.setActionState('💨', 'Esquiva');
}

function executeDirectContextAction(action: ContextAction): void {
    if (action.actionId === 'inspect_droid') {
        droidChat.open();
        sound.playClick();
        triggerHaptic('light');
        return;
    }

    const physicalLaborActions = ['prepare_soil', 'plant_crop', 'water_crop', 'harvest_crop', 'recover_soil', 'feed_animal', 'collect_eggs'];
    if (physicalLaborActions.includes(action.actionId)) {
        const targetPos = grid.gridToWorld(action.target.gridX, action.target.gridY);
        const reqRes = action.actionId === 'water_crop' ? { water: 1 } : action.actionId === 'feed_animal' ? { food: 1 } : undefined;
        const prodRes = action.actionId === 'harvest_crop' ? { food: 25 } : action.actionId === 'collect_eggs' ? { food: 10 } : undefined;
        const dur = action.actionId === 'harvest_crop' ? 15 : action.actionId === 'plant_crop' ? 8 : action.actionId === 'water_crop' ? 10 : 12;

        const task = TaskScheduler.createStandardTask({
            category: action.target.type === 'plot' ? 'agriculture' : action.target.type === 'animal' ? 'animals' : 'general',
            type: action.actionId,
            title: action.title,
            targetId: action.target.id,
            targetPosition: { x: targetPos.x, y: 0, z: targetPos.z },
            totalDurationSeconds: dur,
            energyCostTotal: 3,
            requiredResources: reqRes,
            producedResources: prodRes,
            customData: {
                cropType: currentSelectedCrop
            }
        });

        taskScheduler.enqueueTask(task);
        tutorial.triggerActionHook('task_scheduled');
        sound.playClick();
        triggerHaptic('light');
        hud.showToast(`📋 Tarefa agendada para o Droid: ${action.title}`);
        vfx.showFloatingText(`📋 Agendado: ${action.title}`, undefined, undefined, '#34D399');
        schedulerUI.render();
        return;
    }

    const nPos = ninja.entity.getPosition();
    const ninjaCoords = grid.worldToGrid(nPos.x, nPos.z);
    const context = getResolverContext();

    const res = actionExecutor.execute(action.target, context, { x: ninjaCoords.gridX, y: ninjaCoords.gridY });

    if (res.requiresMovement && res.path && res.path.length > 0) {
        ninjaWaypoints = [...res.path];
        pendingActionOnArrival = action;
        tapMoveTarget = null;
        if (res.message) {
            hud.showToast(res.message);
        }
        return;
    }

    if (!res.success) {
        if (res.errorReason) {
            hud.showToast(res.errorReason);
            vfx.showFloatingText(`⚠️ ${res.errorReason}`, undefined, undefined, '#EF4444');
            sound.playClick();
            triggerHaptic('heavy');
        }
        return;
    }

    // Feedback audiovisual dinâmico por tipo de ação
    if (res.actionId === 'harvest_crop') {
        sound.playHarvest();
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
        objectives.recordProgress('harvest');
        objectives.recordCropHarvested(action.target.cropType || 'rice');
    } else if (res.actionId === 'plant_crop') {
        sound.playBuild();
        triggerHaptic('light');
        objectives.recordCropPlanted(action.target.cropType || currentSelectedCrop);
    } else if (res.actionId === 'prepare_soil' || res.actionId === 'recover_soil') {
        sound.playBuild();
        triggerHaptic('light');
    } else if (res.actionId === 'water_crop') {
        sound.playWaterSplash();
        triggerHaptic('light');
    } else if (res.actionId === 'catch_fish') {
        sound.playWaterSplash();
        triggerHaptic('success');
        objectives.recordProgress('fish');
        objectives.recordProgress('fish_koi');
    } else if (res.actionId === 'rest_bonfire') {
        triggerHaptic('light');
        objectives.recordProgress('bonfire');
    } else if (res.actionId === 'pet_animal' || res.actionId === 'feed_animal' || res.actionId === 'collect_eggs') {
        sound.playAnimalPet();
        triggerHaptic('light');
        objectives.recordProgress('pet');
        objectives.recordProgress('feed_animals');
    } else if (res.actionId === 'train_dummy') {
        throwShuriken();
        triggerHaptic('medium');
    } else if (res.actionId === 'trade_merchant') {
        merchantMgr.open();
    }

    if (res.xpReward) {
        progression.addXP(res.xpReward);
    }

    if (res.message) {
        hud.showToast(res.message);
        vfx.showFloatingText(res.message, undefined, undefined, '#34D399');
    }

    hud.updateResources(inventory.getAll());
    updateSelectedAction();
}

function findNearestSelectableTarget(ninjaX: number, ninjaZ: number, maxDist: number): SelectedTarget | null {
    let nearest: SelectedTarget | null = null;
    let minDist = maxDist;

    // 1. Canteiros
    for (const b of grid.getAllBuildings()) {
        if (b.type === 'crop_field') {
            const bWorld = grid.gridToWorld(b.gridX, b.gridY);
            const dist = Math.hypot(bWorld.x - ninjaX, bWorld.z - ninjaZ);
            if (dist < minDist) {
                minDist = dist;
                const crop = cropSystem.getCrop(b.instanceId);
                let soilStatus: SoilStatus = (b.customData?.soilStatus as SoilStatus) || 'raw';
                if (crop) {
                    if (crop.stage === 'ready') soilStatus = 'ready';
                    else if (crop.stage === 'growing') soilStatus = crop.waterSupplied ? 'growing' : 'thirsty';
                    else if (crop.stage === 'planted') soilStatus = crop.waterSupplied ? 'planted' : 'thirsty';
                    else if (crop.stage === 'harvested' || crop.stage === 'empty') soilStatus = 'tilled';
                }
                nearest = {
                    id: b.instanceId,
                    type: 'plot',
                    name: 'Canteiro Agrícola',
                    gridX: b.gridX,
                    gridY: b.gridY,
                    worldPosition: bWorld,
                    soilStatus,
                    cropType: crop?.cropType || currentSelectedCrop,
                    cropInstanceId: crop?.instanceId,
                    growthProgress: crop?.growthProgress ?? 0,
                    waterSupplied: crop?.waterSupplied ?? true
                };
            }
        }
    }

    // 2. Animais da fauna
    for (const anim of fauna.getAnimals()) {
        const dist = Math.hypot(anim.position.x - ninjaX, anim.position.z - ninjaZ);
        if (dist < minDist) {
            minDist = dist;
            nearest = {
                id: anim.id || `anim_${anim.type}`,
                type: 'animal',
                animalType: anim.type,
                name: anim.type === 'chicken' ? 'Galinha Caipira' : anim.type === 'cow' ? 'Vaca Leiteira' : 'Raposa Guardiã',
                hunger: anim.hunger ?? 20,
                readyToCollect: anim.readyToCollect ?? false,
                gridX: Math.floor(anim.position.x),
                gridY: Math.floor(anim.position.z),
                worldPosition: { x: anim.position.x, y: anim.position.y, z: anim.position.z }
            };
        }
    }

    // 3. Mercador Itinerante
    const mDist = Math.hypot(merchantPos.x - ninjaX, merchantPos.z - ninjaZ);
    if (mDist < minDist) {
        minDist = mDist;
        nearest = {
            id: 'wandering_merchant',
            type: 'merchant',
            name: 'Mercador Itinerante',
            gridX: 20,
            gridY: 26,
            worldPosition: { x: merchantPos.x, y: 0, z: merchantPos.z }
        };
    }

    // 4. Boneco de Treino
    const dDist = Math.hypot(dummyPos.x - ninjaX, dummyPos.z - ninjaZ);
    if (dDist < minDist) {
        minDist = dDist;
        nearest = {
            id: 'training_dummy',
            type: 'dummy',
            name: 'Boneco de Treino',
            gridX: 20,
            gridY: 10,
            worldPosition: { x: dummyPos.x, y: 0, z: dummyPos.z }
        };
    }

    // 5. Unidade Droid Operacional
    const dPos = droid.entity.getPosition();
    const droidDist = Math.hypot(dPos.x - ninjaX, dPos.z - ninjaZ);
    if (droidDist < 3.2 && droidDist < minDist) {
        minDist = droidDist;
        nearest = {
            id: 'farm_droid_unit',
            type: 'droid',
            name: 'Droid Shinobi',
            gridX: Math.floor(dPos.x),
            gridY: Math.floor(dPos.z),
            worldPosition: { x: dPos.x, y: 0, z: dPos.z }
        };
    }

    return nearest;
}

const contextUI = new ContextActionUI({
    onExecute: (action) => {
        executeDirectContextAction(action);
    },
    onDeselect: () => {
        deselectTarget();
    }
});

// Map de entidades 3D no mundo
const buildingEntities = new Map<string, Entity>();

function spawnBuilding3D(instanceId: string, type: BuildingType, gridX: number, gridY: number, orientation: BuildingOrientation, isBlueprint: boolean = false): Entity {
    const entity = modelFactory.createBuildingEntity(type);
    if (isBlueprint) {
        modelFactory.applyGhostMaterial(entity, true);
    }
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

    if (!isBlueprint) {
        // Conecta lanternas da Sede, Postes de Luz, Portal Torii e Fogueiras ao gestor celestial
        if (type === 'hq' || type === 'lamp_post' || type === 'torii_gate') {
            celestial.registerLantern(entity, false);
        } else if (type === 'bonfire') {
            celestial.registerBonfire(entity);
        }
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
// 3.1. DROID OPERACIONAL ÚNICO & AGENDADOR AFK
// ==========================================
function handleCompletedTask(task: FarmTask): void {
    sound.playHarvest();

    // Adiciona recursos gerados ao inventário
    if (task.producedResources) {
        for (const [res, amt] of Object.entries(task.producedResources)) {
            if (amt && amt > 0) {
                inventory.add(res as ResourceType, amt);
            }
        }
    }

    // Processamento de transições físicas de cada tipo de tarefa
    if (task.type === 'prepare_soil' || task.type === 'recover_soil') {
        const b = grid.getBuilding(task.targetId);
        if (b) {
            b.customData = b.customData || {};
            b.customData.soilStatus = 'tilled';
        }
        progression.addXP(10);
        vfx.showFloatingText('+10 XP Solo Preparado', undefined, undefined, '#10B981');
    } else if (task.type === 'plant_crop') {
        const cropType = (task.customData?.cropType as CropType) || 'rice';
        cropSystem.plantCrop(task.targetId, cropType);
        const b = grid.getBuilding(task.targetId);
        if (b) {
            b.customData = b.customData || {};
            b.customData.soilStatus = 'planted';
        }
        progression.addXP(15);
        objectives.recordCropPlanted(cropType);
        vfx.showFloatingText(`+15 XP Semeado (${cropType})`, undefined, undefined, '#10B981');
    } else if (task.type === 'water_crop') {
        const crop = cropSystem.getCrop(task.targetId);
        if (crop) crop.waterSupplied = true;
        const b = grid.getBuilding(task.targetId);
        if (b) {
            b.customData = b.customData || {};
            b.customData.soilStatus = 'growing';
        }
        progression.addXP(8);
        vfx.showFloatingText('💧 Canteiro Irrigado', undefined, undefined, '#60A5FA');
    } else if (task.type === 'harvest_crop') {
        const harvestRes = cropSystem.harvest(task.targetId);
        const b = grid.getBuilding(task.targetId);
        if (b) {
            b.customData = b.customData || {};
            b.customData.soilStatus = 'raw';
        }
        const xp = harvestRes.cropType === 'lotus' ? 45 : 25;
        progression.addXP(xp);
        vfx.showFloatingText(`+${xp} XP Colheita`, undefined, undefined, '#FBBF24');
    } else if (task.type === 'construct_building') {
        const b = grid.getBuilding(task.targetId);
        if (b) {
            b.isBlueprint = false;
            const existing = buildingEntities.get(b.instanceId);
            if (existing) {
                existing.destroy();
                buildingEntities.delete(b.instanceId);
            }
            spawnBuilding3D(b.instanceId, b.type, b.gridX, b.gridY, b.orientation, false);

            if (b.type === 'crop_field') {
                cropSystem.plantCrop(b.instanceId, 'rice');
                objectives.recordCropPlanted('rice');
            }

            progression.addXP(40);
            sound.playBuild();
            vfx.showFloatingText(`+40 XP 🏯 ${BUILDING_CATALOG[b.type].name}`, undefined, undefined, '#FBBF24');
            objectives.recordBuildingPlaced(b.type);
        }
    } else if (task.type === 'feed_animal') {
        fauna.feedAnimal(task.targetId);
        progression.addXP(12);
        vfx.showFloatingText('🌾 Animal Alimentado (+12 XP)', undefined, undefined, '#10B981');
    } else if (task.type === 'collect_eggs') {
        const eggsRes = fauna.collectEggs(task.targetId);
        const count = eggsRes.amount || 2;
        inventory.add('food', count * 5);
        progression.addXP(15);
        vfx.showFloatingText(`🥚 +${count} Ovos Coletados (+15 XP)`, undefined, undefined, '#F59E0B');
    }

    hud.updateResources(inventory.getAll());
    hud.showToast(`✅ Droid concluiu: ${task.title}`);

    eventJournal.recordEvent({
        type: task.category === 'agriculture' ? 'crop_harvested' : task.category === 'animals' ? 'animal_fed' : 'building_completed',
        title: task.title,
        description: `Concluído com sucesso pelo Droid.`
    });
}

const taskScheduler = new TaskScheduler(grid, navigation, inventory, {
    onTaskCompleted: (task) => {
        handleCompletedTask(task);
        schedulerUI.render();
    },
    onTaskStarted: () => {
        schedulerUI.render();
    },
    onTaskBlocked: (task, reason) => {
        hud.showToast(`⚠️ Droid pausou tarefa: ${reason}`);
        eventJournal.recordEvent({
            type: 'task_blocked',
            title: `Pausado: ${task.title}`,
            description: reason
        });
        schedulerUI.render();
    },
    onTaskCancelled: () => {
        schedulerUI.render();
    }
});

const schedulerUI = new SchedulerUI(taskScheduler, droid);

// ==========================================
// 3.2. SERVIÇO GEMINI AI & CHAT DO DROID (FASES E e F)
// ==========================================
const geminiService = new GeminiService();
const droidChat = new DroidChatModal(geminiService, {
    getContext: () => ({
        resources: inventory.getAll(),
        solarGenerationRate: energySystem.getMetrics().productionRate,
        farmStoredEnergy: inventory.get('energy'),
        farmStoredWater: inventory.get('water'),
        droidBattery: droid.getBattery(),
        droidState: droid.getState(),
        crops: cropSystem.getAllCrops(),
        buildingsCount: grid.getAllBuildings().length,
        queuedTasksCount: taskScheduler.getTasks().length,
        activeTaskTitle: taskScheduler.getActiveTask()?.title,
        ninjaRankTitle: progression.getCurrentRank().title,
        recentEvents: eventJournal.getRecentEvents(8)
    }),
    onOpenSettings: () => settingsModal.open()
});

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

function toggleGrid(): void {
    const vis = gridOverlay.toggle();
    hud.showToast(`Grade Holográfica: ${vis ? 'Ativada' : 'Desativada'}`);
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
    if (selectedWorldTarget) {
        const action = contextUI.getActiveAction();
        if (action && action.enabled) {
            executeDirectContextAction(action);
            return;
        }
    }

    const nPos = ninja.entity.getPosition();
    const nearest = findNearestSelectableTarget(nPos.x, nPos.z, 4.5);
    if (nearest) {
        selectTarget(nearest);
        const action = contextUI.getActiveAction();
        if (action && action.enabled) {
            executeDirectContextAction(action);
        }
    } else {
        smokeDash();
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
    const instanceId = 'bld_' + Math.random().toString(36).substring(2, 9);
    const success = grid.placeBuilding({
        instanceId,
        type: activePlacementType,
        gridX: currentGhostGridX,
        gridY: currentGhostGridY,
        orientation: currentGhostOrientation,
        createdAt: Date.now(),
        health: def.maxHealth,
        isBlueprint: true
    });

    if (success) {
        sound.playBuild();
        // Spawna holograma / blueprint translúcido
        spawnBuilding3D(instanceId, activePlacementType, currentGhostGridX, currentGhostGridY, currentGhostOrientation, true);

        // Enfileira a tarefa de construção física para o Droid
        const pos = grid.gridToWorld(currentGhostGridX, currentGhostGridY);
        const task = TaskScheduler.createStandardTask({
            category: 'construction',
            type: 'construct_building',
            title: `Construir ${def.name}`,
            targetId: instanceId,
            targetPosition: { x: pos.x, y: 0, z: pos.z },
            totalDurationSeconds: Math.max(30, Math.round(def.maxHealth / 5)),
            energyCostTotal: 15,
            requiredResources: { ...def.cost },
            customData: {
                buildingType: activePlacementType,
                gridX: currentGhostGridX,
                gridY: currentGhostGridY,
                orientation: currentGhostOrientation
            }
        });

        taskScheduler.enqueueTask(task);
        hud.showToast(`📐 Blueprint planejado! Agendado na fila do Droid.`);
        vfx.showFloatingText(`📐 Blueprint: ${def.name}`, undefined, undefined, '#60A5FA');
        schedulerUI.render();
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

    if (b.isBlueprint) {
        // Cancela tarefa no agendador
        const queued = taskScheduler.getTasks().find(t => t.targetId === b.instanceId);
        if (queued) {
            taskScheduler.cancelTask(queued.id);
            schedulerUI.render();
        }
        hud.showToast(`Blueprint de ${def.name} cancelado.`);
    } else {
        // Reembolso de 60% dos materiais
        for (const [k, v] of Object.entries(def.cost)) {
            if (v && v > 0) {
                inventory.add(k as any, Math.floor(v * 0.6));
            }
        }
        hud.showToast(`Demolido: ${def.name} (+60% de reembolso)`);
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
            animals: fauna.serialize(),
            dayTime: clock.getTimeOfDay(),
            elapsedGameDays: clock.getTotalDays(),
            ninjaPosition: {
                x: ninja.entity.getPosition().x,
                y: ninja.entity.getPosition().y,
                z: ninja.entity.getPosition().z
            },
            droid: droid.serialize(),
            scheduler: taskScheduler.serialize(),
            eventsLog: eventJournal.serialize()
        };

        const result = await cloudSave.save(state);
        if (result.success) {
            sound.playHarvest();
            objectives.completeObjective('save');
            hud.showToast(`Progresso salvo na nuvem! (Rev. #${result.revision})`);
            vfx.showFloatingText(`☁️ Salvo na Nuvem (Rev #${result.revision})`);
        } else if (result.conflict && result.serverSave) {
            applySaveState(result.serverSave);
            hud.showToast('Conflito resolvido: save mais recente da nuvem carregado.');
        }
    },
    onLoadGame: async () => {
        const saved = await cloudSave.load();
        if (saved) {
            applySaveState(saved);
            hud.showToast('Dados restaurados da nuvem!');
        }
    },
    onOpenSettings: () => {
        settingsModal.open();
    },
    onOpenScheduler: () => {
        schedulerUI.toggle();
        if (schedulerUI.isOpen()) {
            tutorial.triggerActionHook('agenda_opened');
        }
    },
    onOpenDroidChat: () => {
        droidChat.toggle();
    }
});

// Modais de Autenticação Google Obrigatória e Configurações da Conta
const tutorial = new InteractiveTutorial(() => {
    telemetry.track('tutorial_started');
});

const bugReportModal = new BugReportModal(() => ({
    version: 'Alpha 0.1.0',
    screen: cameraCtrl.getMode(),
    activeTask: taskScheduler.getActiveTask()?.title,
    recentErrors: []
}), (repId) => {
    hud.showToast(`Relatório enviado! ID: ${repId}`);
    sound.playHarvest();
});

const loginModal = new LoginModal(authManager, {
    onLoginSuccess: async (user) => {
        hud.showToast(`Autenticado como ${user.name}!`);
        telemetry.track('login_completed');
        const serverSave = await cloudSave.load();
        if (serverSave) {
            applySaveState(serverSave);
        }
        telemetry.track('farm_loaded');
        if (!tutorial.isCompleted()) {
            setTimeout(() => tutorial.start(), 1500);
        }
    }
});

const settingsModal = new SettingsModal(authManager, cloudSave, {
    onLogout: () => {
        loginModal.show();
    },
    onResetProgress: (freshSave) => {
        applySaveState(freshSave);
        hud.showToast('Progresso reinicializado com sucesso!');
        vfx.showFloatingText('🔄 Fazenda Reiniciada!', undefined, undefined, '#34D399');
    },
    onGeminiConfigChange: (cfg) => {
        hud.showToast(`Modo IA: ${cfg.mode === 'smart' ? 'Inteligente' : 'Limitado'}`);
    },
    onOpenBugReport: () => {
        bugReportModal.open();
    },
    onRestartTutorial: () => {
        tutorial.start(true);
    }
});

// Verifica autenticação Google obrigatória no boot
const isAuthed = await authManager.checkSession();
if (!isAuthed) {
    loginModal.show();
} else {
    telemetry.track('login_completed');
    const initialCloudSave = await cloudSave.load();
    if (initialCloudSave) {
        applySaveState(initialCloudSave);
    }
    telemetry.track('farm_loaded');
    if (!tutorial.isCompleted()) {
        setTimeout(() => tutorial.start(), 1500);
    }
}

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
    if (schedulerUI.isOpen()) {
        schedulerUI.close();
        actionCancelled = true;
    }
    if (droidChat.isOpen()) {
        droidChat.close();
        actionCancelled = true;
    }

    // 1.1. Desmarca alvo selecionado e oculta botão contextual
    if (selectedWorldTarget) {
        deselectTarget();
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

    // Em modo normal de exploração: raycast para selecionar entidade ou mover ninja (Seleção não é execução)
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
                if (dDist <= 2.6) {
                    selectTarget({
                        id: 'training_dummy',
                        type: 'dummy',
                        name: 'Boneco de Treino',
                        gridX: 20,
                        gridY: 10,
                        worldPosition: { x: dummyPos.x, y: 0, z: dummyPos.z }
                    });
                    return;
                }

                // 2. Tocou no Mercador Itinerante?
                const mDist = Math.hypot(hitX - merchantPos.x, hitZ - merchantPos.z);
                if (mDist <= 2.8) {
                    selectTarget({
                        id: 'wandering_merchant',
                        type: 'merchant',
                        name: 'Mercador Itinerante',
                        gridX: 20,
                        gridY: 26,
                        worldPosition: { x: merchantPos.x, y: 0, z: merchantPos.z }
                    });
                    return;
                }

                // 3. Tocou em animal da fauna?
                for (const anim of fauna.getAnimals()) {
                    const aDist = Math.hypot(hitX - anim.position.x, hitZ - anim.position.z);
                    if (aDist <= 2.5) {
                        selectTarget({
                            id: anim.id || `anim_${anim.type}`,
                            type: 'animal',
                            animalType: anim.type,
                            name: anim.type === 'chicken' ? 'Galinha Caipira' : anim.type === 'cow' ? 'Vaca Leiteira' : 'Raposa Guardiã',
                            hunger: anim.hunger ?? 20,
                            readyToCollect: anim.readyToCollect ?? false,
                            gridX: Math.floor(anim.position.x),
                            gridY: Math.floor(anim.position.z),
                            worldPosition: { x: anim.position.x, y: anim.position.y, z: anim.position.z }
                        });
                        return;
                    }
                }

                // 4. Tocou em um canteiro ou construção na grade?
                const coords = grid.worldToGrid(hitX, hitZ);
                const cell = grid.getCell(coords.gridX, coords.gridY);
                if (cell && cell.occupiedBy) {
                    const b = grid.getBuilding(cell.occupiedBy);
                    if (b) {
                        const bWorld = grid.gridToWorld(b.gridX, b.gridY);
                        if (b.type === 'crop_field') {
                            const crop = cropSystem.getCrop(b.instanceId);
                            let soilStatus: SoilStatus = (b.customData?.soilStatus as SoilStatus) || 'raw';
                            if (crop) {
                                if (crop.stage === 'ready') soilStatus = 'ready';
                                else if (crop.stage === 'growing') soilStatus = crop.waterSupplied ? 'growing' : 'thirsty';
                                else if (crop.stage === 'planted') soilStatus = crop.waterSupplied ? 'planted' : 'thirsty';
                                else if (crop.stage === 'harvested' || crop.stage === 'empty') soilStatus = 'tilled';
                            }
                            selectTarget({
                                id: b.instanceId,
                                type: 'plot',
                                name: 'Canteiro Agrícola',
                                gridX: b.gridX,
                                gridY: b.gridY,
                                worldPosition: bWorld,
                                soilStatus,
                                cropType: crop?.cropType || currentSelectedCrop,
                                cropInstanceId: crop?.instanceId,
                                growthProgress: crop?.growthProgress ?? 0,
                                waterSupplied: crop?.waterSupplied ?? true
                            });
                            return;
                        } else {
                            const def = BUILDING_CATALOG[b.type];
                            selectTarget({
                                id: b.instanceId,
                                type: 'building',
                                name: def?.name || b.type,
                                buildingType: b.type,
                                buildingHealth: b.health,
                                maxHealth: def?.maxHealth,
                                gridX: b.gridX,
                                gridY: b.gridY,
                                worldPosition: bWorld
                            });
                            return;
                        }
                    }
                }

                // 5. Toque no terreno livre: desmarca seleção anterior e move ninja até o ponto
                if (selectedWorldTarget) {
                    deselectTarget();
                }

                if (cell && cell.walkable) {
                    ninjaWaypoints = [];
                    pendingActionOnArrival = null;
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
    // shadowClone desativado reversivelmente (Tarefa 8)
    sound.updateAmbientMusic(dt, clock.isNight());

    // 3.1. Droid Operacional & Agendador AFK de Tarefas
    droid.update(dt);
    taskScheduler.tick(dt, droid, inventory.get('energy'));
    if (schedulerUI.isOpen()) {
        schedulerUI.render();
    }

    // 4. Atualização da iluminação solar e atmosfera
    const sunlightFactor = clock.getSunlightFactor();
    const isNight = clock.isNight();

    if (sunLight.light) {
        sunLight.light.intensity = sunlightFactor * 1.45;
        // Tom quente dourado equilibrado para a tarde e amanhecer
        const warmth = 1.0 - Math.abs(sunlightFactor - 0.5) * 0.4;
        sunLight.light.color = new Color(1.0, 0.92 * warmth, 0.78 * warmth);
    }

    if (ambientLight.light) {
        if (isNight) {
            // Noite iluminada por luar suave azulado para que a fazenda permaneça visível
            ambientLight.light.intensity = 0.45;
            ambientLight.light.color = new Color(0.20, 0.28, 0.45);
        } else {
            // Dia claro e radiante com preenchimento natural do céu
            ambientLight.light.intensity = 0.85;
            ambientLight.light.color = new Color(0.55, 0.65, 0.78);
        }
    }

    if (cameraCtrl.entity.camera) {
        // Céu dinâmico diurno/noturno sem escurecimento prematuro
        const skyR = isNight ? 0.05 : 0.42 * Math.max(0.35, sunlightFactor);
        const skyG = isNight ? 0.08 : 0.62 * Math.max(0.35, sunlightFactor);
        const skyB = isNight ? 0.18 : 0.92 * Math.max(0.4, sunlightFactor);
        cameraCtrl.entity.camera.clearColor = new Color(skyR, skyG, skyB);
    }

    // 5. Locomoção do Ninja (WASD + Virtual Joystick + Waypoints Automáticos + Tap-to-Move)
    let moveX = 0;
    let moveZ = 0;

    if (keysDown.has('KeyW') || keysDown.has('ArrowUp')) moveZ -= 1;
    if (keysDown.has('KeyS') || keysDown.has('ArrowDown')) moveZ += 1;
    if (keysDown.has('KeyA') || keysDown.has('ArrowLeft')) moveX -= 1;
    if (keysDown.has('KeyD') || keysDown.has('ArrowRight')) moveX += 1;

    // Se o jogador utilizou comandos manuais, cancela a rota automática
    if (moveX !== 0 || moveZ !== 0) {
        ninjaWaypoints = [];
        pendingActionOnArrival = null;
        tapMoveTarget = null;
    }

    // Adiciona vetor do joystick touch mobile
    const joyVec = joystick.getVector();
    if (joyVec.intensity > 0.1) {
        moveX += joyVec.x;
        moveZ += joyVec.y;
        tapMoveTarget = null;
        ninjaWaypoints = [];
        pendingActionOnArrival = null;
    } else if (ninjaWaypoints.length > 0) {
        const curPos = ninja.entity.getPosition();
        const wp = ninjaWaypoints[0];
        const worldWp = grid.gridToWorld(wp.x, wp.y);
        const toWpX = worldWp.x - curPos.x;
        const toWpZ = worldWp.z - curPos.z;
        const distWp = Math.hypot(toWpX, toWpZ);

        if (distWp < 0.6) {
            ninjaWaypoints.shift();
            if (ninjaWaypoints.length === 0 && pendingActionOnArrival) {
                const actionToRun = pendingActionOnArrival;
                pendingActionOnArrival = null;
                executeDirectContextAction(actionToRun);
            }
        } else {
            moveX = toWpX / distWp;
            moveZ = toWpZ / distWp;
        }
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

    // 6. Atualização de Proximidade e Interações Contextuais (Marco A)
    const nPos = ninja.entity.getPosition();
    if (selectedWorldTarget) {
        updateSelectedAction();
    } else {
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

    // 9. Auto-Save silencioso em segundo plano a cada 30 segundos na nuvem
    autoSaveTimer += dt;
    if (autoSaveTimer >= 30.0) {
        autoSaveTimer = 0;
        cloudSave.save({
            version: 1,
            savedAt: Date.now(),
            resources: inventory.serialize(),
            buildings: grid.getAllBuildings(),
            crops: cropSystem.serialize(),
            animals: fauna.serialize(),
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
