import { Color, Entity } from 'playcanvas';
import type { FarmMaterials } from './materials';
import type { BuildingType, CropStage, CropType } from '../core/types';

export class BuildingModelFactory {
    private materials: FarmMaterials;

    constructor(materials: FarmMaterials) {
        this.materials = materials;
    }

    createBuildingEntity(type: BuildingType): Entity {
        switch (type) {
            case 'hq':
                return this.createHQ();
            case 'shed':
                return this.createShed();
            case 'solar_panel':
                return this.createSolarPanel();
            case 'battery':
                return this.createBattery();
            case 'water_tank':
                return this.createWaterTank();
            case 'water_pump':
                return this.createWaterPump();
            case 'crop_field':
                return this.createCropBed('empty');
            case 'chicken_coop':
                return this.createChickenCoop();
            case 'fish_pond':
                return this.createFishPond();
            case 'lamp_post':
                return this.createLampPost();
            case 'torii_gate':
                return this.createToriiGate();
            case 'bonfire':
                return this.createBonfire();
            default:
                return this.createHQ();
        }
    }

    // Sede Ninja / HQ 3D detalhada (4x4 células = 8m x 8m)
    createHQ(): Entity {
        const root = new Entity('building_hq');

        // Fundação / Deck de pedra e madeira
        const foundation = new Entity('foundation');
        foundation.addComponent('render', {
            type: 'box',
            material: this.materials.wood
        });
        foundation.setLocalScale(7.2, 0.4, 7.2);
        foundation.setLocalPosition(0, 0.2, 0);
        root.addChild(foundation);

        // Corpo principal das paredes
        const walls = new Entity('walls');
        walls.addComponent('render', {
            type: 'box',
            material: this.materials.wood
        });
        walls.setLocalScale(5.6, 2.4, 5.6);
        walls.setLocalPosition(0, 1.6, 0);
        root.addChild(walls);

        // Telhado inferior inclinado (beiral)
        const lowerRoof = new Entity('lower_roof');
        lowerRoof.addComponent('render', {
            type: 'box',
            material: this.materials.roof
        });
        lowerRoof.setLocalScale(7.6, 0.35, 7.6);
        lowerRoof.setLocalPosition(0, 2.9, 0);
        root.addChild(lowerRoof);

        // Segundo andar da sede
        const upperWalls = new Entity('upper_walls');
        upperWalls.addComponent('render', {
            type: 'box',
            material: this.materials.wood
        });
        upperWalls.setLocalScale(3.8, 1.8, 3.8);
        upperWalls.setLocalPosition(0, 3.9, 0);
        root.addChild(upperWalls);

        // Telhado superior com cume pagoda
        const upperRoof = new Entity('upper_roof');
        upperRoof.addComponent('render', {
            type: 'box',
            material: this.materials.roof
        });
        upperRoof.setLocalScale(5.2, 0.4, 5.2);
        upperRoof.setLocalPosition(0, 4.9, 0);
        root.addChild(upperRoof);

        // Pináculo decorativo
        const spire = new Entity('spire');
        spire.addComponent('render', {
            type: 'cone',
            material: this.materials.metal
        });
        spire.setLocalScale(0.4, 1.2, 0.4);
        spire.setLocalPosition(0, 5.6, 0);
        root.addChild(spire);

        // Lanternas de entrada iluminadas
        const lantern1 = new Entity('lantern_left');
        lantern1.addComponent('render', {
            type: 'box',
            material: this.materials.lanternGlow
        });
        lantern1.setLocalScale(0.35, 0.5, 0.35);
        lantern1.setLocalPosition(-2.5, 1.2, 3.2);
        root.addChild(lantern1);

        const lantern2 = new Entity('lantern_right');
        lantern2.addComponent('render', {
            type: 'box',
            material: this.materials.lanternGlow
        });
        lantern2.setLocalScale(0.35, 0.5, 0.35);
        lantern2.setLocalPosition(2.5, 1.2, 3.2);
        root.addChild(lantern2);

        // Luz de lanterna acolhedora na fachada da Sede
        const hqLight = new Entity('lantern_point_light');
        hqLight.addComponent('light', {
            type: 'omni',
            color: new Color(1.0, 0.75, 0.35),
            range: 16,
            intensity: 0.0
        });
        hqLight.setLocalPosition(0, 1.6, 3.2);
        root.addChild(hqLight);

        return root;
    }

    // Galpão de Suprimentos (3x3 células = 6m x 6m)
    createShed(): Entity {
        const root = new Entity('building_shed');

        const base = new Entity('shed_base');
        base.addComponent('render', {
            type: 'box',
            material: this.materials.wood
        });
        base.setLocalScale(5.2, 2.2, 5.2);
        base.setLocalPosition(0, 1.1, 0);
        root.addChild(base);

        // Telhado metálico em duas águas
        const roof = new Entity('shed_roof');
        roof.addComponent('render', {
            type: 'box',
            material: this.materials.metal
        });
        roof.setLocalScale(5.8, 0.3, 5.8);
        roof.setLocalPosition(0, 2.35, 0);
        roof.setLocalEulerAngles(0, 0, 5);
        root.addChild(roof);

        // Caixotes de carga
        const crate1 = new Entity('crate1');
        crate1.addComponent('render', {
            type: 'box',
            material: this.materials.wood
        });
        crate1.setLocalScale(0.8, 0.8, 0.8);
        crate1.setLocalPosition(-2.2, 0.4, 2.2);
        root.addChild(crate1);

        return root;
    }

    // Painel Solar Fotovoltaico (2x1 células = 4m x 2m)
    createSolarPanel(): Entity {
        const root = new Entity('building_solar');

        // Estrutura de suporte metálica
        const standLeft = new Entity('stand_left');
        standLeft.addComponent('render', {
            type: 'cylinder',
            material: this.materials.metal
        });
        standLeft.setLocalScale(0.12, 1.4, 0.12);
        standLeft.setLocalPosition(-1.4, 0.7, 0);
        root.addChild(standLeft);

        const standRight = new Entity('stand_right');
        standRight.addComponent('render', {
            type: 'cylinder',
            material: this.materials.metal
        });
        standRight.setLocalScale(0.12, 1.4, 0.12);
        standRight.setLocalPosition(1.4, 0.7, 0);
        root.addChild(standRight);

        // Painel inclinado 30 graus voltado para o sol
        const panel = new Entity('panel_surface');
        panel.addComponent('render', {
            type: 'box',
            material: this.materials.solarCell
        });
        panel.setLocalScale(3.6, 0.08, 1.6);
        panel.setLocalPosition(0, 1.35, 0);
        panel.setLocalEulerAngles(32, 0, 0);
        root.addChild(panel);

        // Moldura metálica externa
        const frame = new Entity('panel_frame');
        frame.addComponent('render', {
            type: 'box',
            material: this.materials.metal
        });
        frame.setLocalScale(3.7, 0.05, 1.7);
        frame.setLocalPosition(0, 1.32, 0);
        frame.setLocalEulerAngles(32, 0, 0);
        root.addChild(frame);

        return root;
    }

    // Banco de Baterias (1x1 célula = 2m x 2m)
    createBattery(): Entity {
        const root = new Entity('building_battery');

        const casing = new Entity('battery_casing');
        casing.addComponent('render', {
            type: 'box',
            material: this.materials.batteryCasing
        });
        casing.setLocalScale(1.5, 1.8, 1.2);
        casing.setLocalPosition(0, 0.9, 0);
        root.addChild(casing);

        // Indicador de status luminoso
        const led = new Entity('battery_led');
        led.addComponent('render', {
            type: 'box',
            material: this.materials.lanternGlow
        });
        led.setLocalScale(0.8, 0.15, 0.05);
        led.setLocalPosition(0, 1.4, 0.61);
        root.addChild(led);

        return root;
    }

    // Cisterna / Tanque Hídrico (2x2 células = 4m x 4m)
    createWaterTank(): Entity {
        const root = new Entity('building_water_tank');

        // Pernas de sustentação
        const legPositions = [
            [-1.3, -1.3],
            [1.3, -1.3],
            [-1.3, 1.3],
            [1.3, 1.3]
        ];

        for (let i = 0; i < legPositions.length; i++) {
            const leg = new Entity('leg_' + i);
            leg.addComponent('render', {
                type: 'cylinder',
                material: this.materials.metal
            });
            leg.setLocalScale(0.18, 1.6, 0.18);
            leg.setLocalPosition(legPositions[i][0], 0.8, legPositions[i][1]);
            root.addChild(leg);
        }

        // Cilindro do tanque
        const tank = new Entity('tank_body');
        tank.addComponent('render', {
            type: 'cylinder',
            material: this.materials.metal
        });
        tank.setLocalScale(3.2, 2.2, 3.2);
        tank.setLocalPosition(0, 2.4, 0);
        root.addChild(tank);

        // Tampa cônica superior
        const cap = new Entity('tank_cap');
        cap.addComponent('render', {
            type: 'cone',
            material: this.materials.metal
        });
        cap.setLocalScale(3.3, 0.7, 3.3);
        cap.setLocalPosition(0, 3.8, 0);
        root.addChild(cap);

        return root;
    }

    // Bomba d'Água (1x1 célula = 2m x 2m)
    createWaterPump(): Entity {
        const root = new Entity('building_water_pump');

        const base = new Entity('pump_base');
        base.addComponent('render', {
            type: 'box',
            material: this.materials.metal
        });
        base.setLocalScale(1.4, 0.3, 1.4);
        base.setLocalPosition(0, 0.15, 0);
        root.addChild(base);

        const motor = new Entity('pump_motor');
        motor.addComponent('render', {
            type: 'cylinder',
            material: this.materials.batteryCasing
        });
        motor.setLocalScale(0.8, 1.0, 0.8);
        motor.setLocalPosition(0, 0.8, 0);
        root.addChild(motor);

        const pipe = new Entity('pump_pipe');
        pipe.addComponent('render', {
            type: 'cylinder',
            material: this.materials.metal
        });
        pipe.setLocalScale(0.2, 1.5, 0.2);
        pipe.setLocalPosition(0.4, 0.9, 0);
        pipe.setLocalEulerAngles(0, 0, 45);
        root.addChild(pipe);

        return root;
    }

    // Canteiro Agrícola (2x2 células = 4m x 4m)
    createCropBed(stage: CropStage = 'empty'): Entity {
        const root = new Entity('building_crop_field');

        // Caixa de contenção em madeira
        const frame = new Entity('bed_frame');
        frame.addComponent('render', {
            type: 'box',
            material: this.materials.wood
        });
        frame.setLocalScale(3.8, 0.35, 3.8);
        frame.setLocalPosition(0, 0.17, 0);
        root.addChild(frame);

        // Solo fértil interno
        const soil = new Entity('bed_soil');
        soil.addComponent('render', {
            type: 'box',
            material: this.materials.soil
        });
        soil.setLocalScale(3.5, 0.38, 3.5);
        soil.setLocalPosition(0, 0.2, 0);
        root.addChild(soil);

        // Plantas no canteiro conforme o estágio
        const plantsGroup = new Entity('plants_group');
        plantsGroup.setLocalPosition(0, 0.4, 0);
        root.addChild(plantsGroup);

        this.updateCropPlants(plantsGroup, stage);
        return root;
    }

    updateCropSoil(bedEntity: Entity, isWatered: boolean): void {
        const soilEntity = bedEntity.findByName('bed_soil') as Entity;
        if (soilEntity && soilEntity.render) {
            soilEntity.render.material = isWatered ? this.materials.wetSoil : this.materials.soil;
        }
    }

    updateCropPlants(group: Entity, stage: CropStage, cropType: CropType = 'rice'): void {
        // Limpa filhos existentes
        const children = [...group.children];
        for (const c of children) {
            group.removeChild(c);
            c.destroy();
        }

        if (stage === 'empty' || stage === 'harvested') return;

        const rows = 3;
        const cols = 3;

        if (cropType === 'rice') {
            // ARROZ TRADICIONAL JAPONÊS
            const stalkMat = stage === 'ready' ? this.materials.riceGolden : this.materials.foliage;
            const stalkHeight = stage === 'planted' ? 0.25 : stage === 'growing' ? 0.65 : 1.15;

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const plant = new Entity(`rice_${r}_${c}`);
                    const posX = (c - 1) * 0.95;
                    const posZ = (r - 1) * 0.95;

                    // Haste principal do arroz
                    const stalk = new Entity('stalk');
                    stalk.addComponent('render', {
                        type: 'cylinder',
                        material: stalkMat
                    });
                    stalk.setLocalScale(0.08, stalkHeight, 0.08);
                    stalk.setLocalPosition(0, stalkHeight / 2, 0);
                    plant.addChild(stalk);

                    // Se estiver pronto para colher: espiga de arroz dourada curvada
                    if (stage === 'ready') {
                        const grainEar = new Entity('grain_ear');
                        grainEar.addComponent('render', {
                            type: 'cone',
                            material: this.materials.riceGolden
                        });
                        grainEar.setLocalScale(0.18, 0.45, 0.18);
                        grainEar.setLocalPosition(0.08, stalkHeight - 0.05, 0.06);
                        grainEar.setEulerAngles(35, (r * 40 + c * 50) % 360, 0);
                        plant.addChild(grainEar);
                    }

                    plant.setLocalPosition(posX, 0, posZ);
                    group.addChild(plant);
                }
            }
        } else if (cropType === 'vegetable') {
            // HORTALIÇA / CENOURA NINJA
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    const plant = new Entity(`carrot_${r}_${c}`);
                    const posX = (c - 1) * 0.95;
                    const posZ = (r - 1) * 0.95;

                    if (stage === 'planted') {
                        // Broto inicial
                        const sprout = new Entity('sprout');
                        sprout.addComponent('render', {
                            type: 'cone',
                            material: this.materials.carrotGreens
                        });
                        sprout.setLocalScale(0.2, 0.22, 0.2);
                        sprout.setLocalPosition(0, 0.11, 0);
                        plant.addChild(sprout);
                    } else if (stage === 'growing') {
                        // Folhagem densa crescendo
                        const greens = new Entity('greens');
                        greens.addComponent('render', {
                            type: 'cone',
                            material: this.materials.carrotGreens
                        });
                        greens.setLocalScale(0.45, 0.55, 0.45);
                        greens.setLocalPosition(0, 0.27, 0);
                        plant.addChild(greens);
                    } else {
                        // CENOURA MADURA: Raiz laranja saindo do solo + coroa folhosa viçosa
                        const carrotRoot = new Entity('root');
                        carrotRoot.addComponent('render', {
                            type: 'cone',
                            material: this.materials.carrotOrange
                        });
                        carrotRoot.setLocalScale(0.24, 0.5, 0.24);
                        carrotRoot.setEulerAngles(180, 0, 0);
                        carrotRoot.setLocalPosition(0, 0.16, 0);
                        plant.addChild(carrotRoot);

                        const greens = new Entity('greens');
                        greens.addComponent('render', {
                            type: 'cone',
                            material: this.materials.carrotGreens
                        });
                        greens.setLocalScale(0.5, 0.65, 0.5);
                        greens.setLocalPosition(0, 0.42, 0);
                        plant.addChild(greens);
                    }

                    plant.setLocalPosition(posX, 0, posZ);
                    group.addChild(plant);
                }
            }
        } else if (cropType === 'lotus') {
            // FLOR DE LÓTUS SAGRADA SHINOBI (Canteiro com água e flores místicas)
            // 4 almofadas de vitória-régia distribuídas
            const positions = [
                [-0.6, -0.6], [0.6, -0.6],
                [-0.6, 0.6], [0.6, 0.6]
            ];

            for (let i = 0; i < positions.length; i++) {
                const [posX, posZ] = positions[i];
                const lotusCluster = new Entity(`lotus_${i}`);

                // Vitória-régia verde esmeralda no chão
                const lilyPad = new Entity('pad');
                lilyPad.addComponent('render', {
                    type: 'cylinder',
                    material: this.materials.lotusPad
                });
                lilyPad.setLocalScale(0.75, 0.04, 0.75);
                lilyPad.setLocalPosition(0, 0.02, 0);
                lotusCluster.addChild(lilyPad);

                if (stage === 'growing') {
                    // Botão fechado rosa
                    const bud = new Entity('bud');
                    bud.addComponent('render', {
                        type: 'cone',
                        material: this.materials.lotusPink
                    });
                    bud.setLocalScale(0.25, 0.35, 0.25);
                    bud.setLocalPosition(0, 0.18, 0);
                    lotusCluster.addChild(bud);
                } else if (stage === 'ready') {
                    // Flor de Lótus exuberante e desabrochada com núcleo brilhante
                    const flowerBase = new Entity('petals');
                    flowerBase.addComponent('render', {
                        type: 'cone',
                        material: this.materials.lotusPink
                    });
                    flowerBase.setLocalScale(0.55, 0.45, 0.55);
                    flowerBase.setLocalPosition(0, 0.22, 0);
                    lotusCluster.addChild(flowerBase);

                    const core = new Entity('core');
                    core.addComponent('render', {
                        type: 'sphere',
                        material: this.materials.lanternGlow
                    });
                    core.setLocalScale(0.2, 0.2, 0.2);
                    core.setLocalPosition(0, 0.38, 0);
                    lotusCluster.addChild(core);
                }

                lotusCluster.setLocalPosition(posX, 0, posZ);
                group.addChild(lotusCluster);
            }
        }
    }

    // Galinheiro (3x2 células)
    createChickenCoop(): Entity {
        const root = new Entity('building_chicken_coop');

        const coopBody = new Entity('coop_body');
        coopBody.addComponent('render', {
            type: 'box',
            material: this.materials.wood
        });
        coopBody.setLocalScale(4.5, 1.8, 3.0);
        coopBody.setLocalPosition(0, 0.9, 0);
        root.addChild(coopBody);

        const coopRoof = new Entity('coop_roof');
        coopRoof.addComponent('render', {
            type: 'box',
            material: this.materials.roof
        });
        coopRoof.setLocalScale(5.0, 0.25, 3.5);
        coopRoof.setLocalPosition(0, 1.9, 0);
        root.addChild(coopRoof);

        return root;
    }

    // Tanque de Peixes (3x3 células)
    createFishPond(): Entity {
        const root = new Entity('building_fish_pond');

        const border = new Entity('pond_border');
        border.addComponent('render', {
            type: 'box',
            material: this.materials.wood
        });
        border.setLocalScale(5.5, 0.6, 5.5);
        border.setLocalPosition(0, 0.3, 0);
        root.addChild(border);

        const water = new Entity('pond_water');
        water.addComponent('render', {
            type: 'box',
            material: this.materials.water
        });
        water.setLocalScale(5.0, 0.5, 5.0);
        water.setLocalPosition(0, 0.35, 0);
        root.addChild(water);

        // Carpas Koi Japonesas nadando no lago
        const koi1 = new Entity('pond_koi_1');
        koi1.addComponent('render', {
            type: 'cylinder',
            material: this.materials.carrotOrange
        });
        koi1.setLocalScale(0.24, 0.65, 0.14);
        koi1.setLocalPosition(1.2, 0.38, 0.8);
        koi1.setLocalEulerAngles(90, 45, 0);
        root.addChild(koi1);

        const koi2 = new Entity('pond_koi_2');
        koi2.addComponent('render', {
            type: 'cylinder',
            material: this.materials.ninjaCrimson
        });
        koi2.setLocalScale(0.22, 0.55, 0.12);
        koi2.setLocalPosition(-1.1, 0.38, -0.9);
        koi2.setLocalEulerAngles(90, -135, 0);
        root.addChild(koi2);

        // Vitória-régia no canto com flor de lótus flutuante
        const pad = new Entity('pond_lilypad');
        pad.addComponent('render', {
            type: 'cylinder',
            material: this.materials.lotusPad
        });
        pad.setLocalScale(0.85, 0.04, 0.85);
        pad.setLocalPosition(-1.4, 0.45, 1.3);
        root.addChild(pad);

        const lotus = new Entity('pond_lotus');
        lotus.addComponent('render', {
            type: 'cone',
            material: this.materials.lotusPink
        });
        lotus.setLocalScale(0.35, 0.3, 0.35);
        lotus.setLocalPosition(-1.4, 0.55, 1.3);
        root.addChild(lotus);

        return root;
    }

    // Poste de Iluminação / Lanterna Tradicional Tōrō (1x1 célula = 2m x 2m)
    createLampPost(): Entity {
        const root = new Entity('building_lamp_post');

        // Base de pedra/metal no solo
        const base = new Entity('lamp_base');
        base.addComponent('render', {
            type: 'box',
            material: this.materials.metal
        });
        base.setLocalScale(0.5, 0.15, 0.5);
        base.setLocalPosition(0, 0.075, 0);
        root.addChild(base);

        // Poste vertical de madeira nobre
        const pole = new Entity('lamp_pole');
        pole.addComponent('render', {
            type: 'cylinder',
            material: this.materials.wood
        });
        pole.setLocalScale(0.18, 2.7, 0.18);
        pole.setLocalPosition(0, 1.35, 0);
        root.addChild(pole);

        // Suporte / braço horizontal
        const arm = new Entity('lamp_arm');
        arm.addComponent('render', {
            type: 'box',
            material: this.materials.wood
        });
        arm.setLocalScale(0.65, 0.12, 0.12);
        arm.setLocalPosition(0.2, 2.65, 0);
        root.addChild(arm);

        // Caixa da lanterna com material emissivo de brilho quente
        const lantern = new Entity('lantern_box');
        lantern.addComponent('render', {
            type: 'box',
            material: this.materials.lanternGlow
        });
        lantern.setLocalScale(0.42, 0.48, 0.42);
        lantern.setLocalPosition(0.42, 2.38, 0);
        root.addChild(lantern);

        // Telhadinho da lanterna em estilo pagoda
        const roof = new Entity('lantern_roof');
        roof.addComponent('render', {
            type: 'cone',
            material: this.materials.roof
        });
        roof.setLocalScale(0.65, 0.22, 0.65);
        roof.setLocalPosition(0.42, 2.72, 0);
        root.addChild(roof);

        // Fonte de luz pontual acolhedora (omni light)
        const light = new Entity('lantern_point_light');
        light.addComponent('light', {
            type: 'omni',
            color: new Color(1.0, 0.75, 0.35),
            range: 16,
            intensity: 0.0
        });
        light.setLocalPosition(0.42, 2.38, 0);
        root.addChild(light);

        return root;
    }

    // Portal Torii Sagrado Japonês (3x1 células = 6m x 2m)
    createToriiGate(): Entity {
        const root = new Entity('building_torii_gate');

        // Pilares esquerdo e direito (Hashira)
        const pillarDist = 2.1;
        const leftPillar = new Entity('torii_pillar_left');
        leftPillar.addComponent('render', {
            type: 'cylinder',
            material: this.materials.ninjaCrimson
        });
        leftPillar.setLocalScale(0.36, 4.2, 0.36);
        leftPillar.setLocalPosition(-pillarDist, 2.1, 0);
        root.addChild(leftPillar);

        const rightPillar = new Entity('torii_pillar_right');
        rightPillar.addComponent('render', {
            type: 'cylinder',
            material: this.materials.ninjaCrimson
        });
        rightPillar.setLocalScale(0.36, 4.2, 0.36);
        rightPillar.setLocalPosition(pillarDist, 2.1, 0);
        root.addChild(rightPillar);

        // Bases de pedra preta das colunas (Kamebara)
        const leftBase = new Entity('torii_base_left');
        leftBase.addComponent('render', {
            type: 'cylinder',
            material: this.materials.roof
        });
        leftBase.setLocalScale(0.55, 0.35, 0.55);
        leftBase.setLocalPosition(-pillarDist, 0.175, 0);
        root.addChild(leftBase);

        const rightBase = new Entity('torii_base_right');
        rightBase.addComponent('render', {
            type: 'cylinder',
            material: this.materials.roof
        });
        rightBase.setLocalScale(0.55, 0.35, 0.55);
        rightBase.setLocalPosition(pillarDist, 0.175, 0);
        root.addChild(rightBase);

        // Viga intermediária (Nuki)
        const nuki = new Entity('torii_nuki');
        nuki.addComponent('render', {
            type: 'box',
            material: this.materials.ninjaCrimson
        });
        nuki.setLocalScale(5.4, 0.22, 0.25);
        nuki.setLocalPosition(0, 3.1, 0);
        root.addChild(nuki);

        // Dintel superior (Shimaki)
        const shimaki = new Entity('torii_shimaki');
        shimaki.addComponent('render', {
            type: 'box',
            material: this.materials.ninjaCrimson
        });
        shimaki.setLocalScale(6.4, 0.28, 0.36);
        shimaki.setLocalPosition(0, 4.1, 0);
        root.addChild(shimaki);

        // Viga mestra curva do topo (Kasagi) com acabamento preto
        const kasagi = new Entity('torii_kasagi');
        kasagi.addComponent('render', {
            type: 'box',
            material: this.materials.roof
        });
        kasagi.setLocalScale(6.8, 0.22, 0.42);
        kasagi.setLocalPosition(0, 4.3, 0);
        root.addChild(kasagi);

        // Tabuleta sagrada central (Gakuzuka)
        const tablet = new Entity('torii_tablet');
        tablet.addComponent('render', {
            type: 'box',
            material: this.materials.wood
        });
        tablet.setLocalScale(0.5, 0.72, 0.12);
        tablet.setLocalPosition(0, 3.6, 0);
        root.addChild(tablet);

        // Lanternas suspensas ornamentais dos dois lados
        const leftLantern = new Entity('torii_lantern_left');
        leftLantern.addComponent('render', {
            type: 'box',
            material: this.materials.lanternGlow
        });
        leftLantern.setLocalScale(0.35, 0.42, 0.35);
        leftLantern.setLocalPosition(-pillarDist, 2.7, 0.3);
        root.addChild(leftLantern);

        const rightLantern = new Entity('torii_lantern_right');
        rightLantern.addComponent('render', {
            type: 'box',
            material: this.materials.lanternGlow
        });
        rightLantern.setLocalScale(0.35, 0.42, 0.35);
        rightLantern.setLocalPosition(pillarDist, 2.7, 0.3);
        root.addChild(rightLantern);

        // Ponto de luz acolhedor entre as lanternas do Torii
        const toriiLight = new Entity('lantern_point_light');
        toriiLight.addComponent('light', {
            type: 'omni',
            color: new Color(1.0, 0.72, 0.35),
            range: 15,
            intensity: 0.0
        });
        toriiLight.setLocalPosition(0, 2.7, 0.3);
        root.addChild(toriiLight);

        return root;
    }

    // Fogueira Shinobi de Acampamento (1x1 célula = 2m x 2m)
    createBonfire(): Entity {
        const root = new Entity('building_bonfire');

        // Círculo de pedras do rio ao redor
        const stoneCount = 8;
        const radius = 0.65;
        for (let i = 0; i < stoneCount; i++) {
            const angle = (i / stoneCount) * Math.PI * 2;
            const stone = new Entity(`fire_stone_${i}`);
            stone.addComponent('render', {
                type: 'sphere',
                material: this.materials.roof
            });
            stone.setLocalScale(0.28, 0.18, 0.28);
            stone.setLocalPosition(Math.cos(angle) * radius, 0.09, Math.sin(angle) * radius);
            root.addChild(stone);
        }

        // Troncos de madeira cruzados na fogueira
        const angles = [30, 90, 150];
        for (let i = 0; i < angles.length; i++) {
            const log = new Entity(`fire_log_${i}`);
            log.addComponent('render', {
                type: 'cylinder',
                material: this.materials.trunk
            });
            log.setLocalScale(0.12, 0.85, 0.12);
            log.setLocalPosition(0, 0.12 + i * 0.06, 0);
            log.setLocalEulerAngles(65, angles[i], 0);
            root.addChild(log);
        }

        // Labareda brilhante animada / emissiva
        const flame = new Entity('bonfire_flame');
        flame.addComponent('render', {
            type: 'cone',
            material: this.materials.lanternGlow
        });
        flame.setLocalScale(0.5, 0.85, 0.5);
        flame.setLocalPosition(0, 0.48, 0);
        root.addChild(flame);

        // Luz omnidirecional acolhedora
        const light = new Entity('bonfire_light');
        light.addComponent('light', {
            type: 'omni',
            color: new Color(1.0, 0.6, 0.18),
            range: 12,
            intensity: 1.5,
            castShadows: false
        });
        light.setLocalPosition(0, 0.6, 0);
        root.addChild(light);

        return root;
    }

    // Modelo 3D do Mercador Itinerante Shinobi
    createMerchantModel(): Entity {
        const root = new Entity('wandering_merchant_npc');

        // Manto / Kimono de viagem azul índigo
        const body = new Entity('merchant_body');
        body.addComponent('render', {
            type: 'cylinder',
            material: this.materials.solarCell
        });
        body.setLocalScale(0.48, 1.25, 0.48);
        body.setLocalPosition(0, 0.625, 0);
        root.addChild(body);

        // Faixa / Obi de cintura
        const obi = new Entity('merchant_obi');
        obi.addComponent('render', {
            type: 'cylinder',
            material: this.materials.wood
        });
        obi.setLocalScale(0.52, 0.16, 0.52);
        obi.setLocalPosition(0, 0.68, 0);
        root.addChild(obi);

        // Cabeça
        const head = new Entity('merchant_head');
        head.addComponent('render', {
            type: 'sphere',
            material: this.materials.soil
        });
        head.setLocalScale(0.38, 0.4, 0.38);
        head.setLocalPosition(0, 1.38, 0);
        root.addChild(head);

        // Chapéu cônico de palha tradicional Sandogasa
        const hat = new Entity('merchant_sandogasa');
        hat.addComponent('render', {
            type: 'cone',
            material: this.materials.trunk
        });
        hat.setLocalScale(1.25, 0.32, 1.25);
        hat.setLocalPosition(0, 1.6, 0);
        root.addChild(hat);

        // Mochila de mercador nas costas com fardos
        const pack = new Entity('merchant_pack');
        pack.addComponent('render', {
            type: 'box',
            material: this.materials.wood
        });
        pack.setLocalScale(0.52, 0.72, 0.36);
        pack.setLocalPosition(0, 0.85, -0.38);
        root.addChild(pack);

        // Lanterna de viagem pendurada na mochila
        const lantern = new Entity('merchant_lantern');
        lantern.addComponent('render', {
            type: 'sphere',
            material: this.materials.lanternGlow
        });
        lantern.setLocalScale(0.18, 0.22, 0.18);
        lantern.setLocalPosition(0.26, 1.15, -0.42);
        root.addChild(lantern);

        return root;
    }

    // Árvore 3D estilizada
    createTree(): Entity {
        const root = new Entity('tree');

        // Tronco
        const trunk = new Entity('trunk');
        trunk.addComponent('render', {
            type: 'cylinder',
            material: this.materials.trunk
        });
        trunk.setLocalScale(0.5, 3.2, 0.5);
        trunk.setLocalPosition(0, 1.6, 0);
        root.addChild(trunk);

        // Camada inferior da copa
        const canopy1 = new Entity('canopy_lower');
        canopy1.addComponent('render', {
            type: 'cone',
            material: this.materials.foliage
        });
        canopy1.setLocalScale(3.2, 2.4, 3.2);
        canopy1.setLocalPosition(0, 3.2, 0);
        root.addChild(canopy1);

        // Camada superior da copa
        const canopy2 = new Entity('canopy_upper');
        canopy2.addComponent('render', {
            type: 'cone',
            material: this.materials.foliage
        });
        canopy2.setLocalScale(2.4, 2.0, 2.4);
        canopy2.setLocalPosition(0, 4.4, 0);
        root.addChild(canopy2);

        return root;
    }

    // Ghost visual para preview de construção
    createGhost(type: BuildingType): Entity {
        const ghost = this.createBuildingEntity(type);
        this.applyGhostMaterial(ghost, true);
        return ghost;
    }

    applyGhostMaterial(entity: Entity, isValid: boolean): void {
        const mat = isValid ? this.materials.ghostValid : this.materials.ghostInvalid;
        if (entity.render) {
            entity.render.material = mat;
        }
        for (const child of entity.children) {
            this.applyGhostMaterial(child as Entity, isValid);
        }
    }
}
