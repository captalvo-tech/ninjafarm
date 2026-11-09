import { AppBase, Asset, Color, StandardMaterial, Vec2 } from 'playcanvas';

export interface FarmMaterials {
    grass: StandardMaterial;
    soil: StandardMaterial;
    wood: StandardMaterial;
    roof: StandardMaterial;
    solarCell: StandardMaterial;
    metal: StandardMaterial;
    water: StandardMaterial;
    batteryCasing: StandardMaterial;
    foliage: StandardMaterial;
    trunk: StandardMaterial;
    ninjaCharcoal: StandardMaterial;
    ninjaCrimson: StandardMaterial;
    lanternGlow: StandardMaterial;
    ghostValid: StandardMaterial;
    ghostInvalid: StandardMaterial;
    riceGolden: StandardMaterial;
    carrotOrange: StandardMaterial;
    carrotGreens: StandardMaterial;
    lotusPink: StandardMaterial;
    lotusPad: StandardMaterial;
    wetSoil: StandardMaterial;
    exhaustedSoil: StandardMaterial;
}

export function createFarmMaterials(): FarmMaterials {
    // Grama estilizada PBR
    const grass = new StandardMaterial();
    grass.diffuse = new Color(0.35, 0.65, 0.32);
    grass.gloss = 0.05;
    grass.useMetalness = false;
    grass.update();

    // Terra arada
    const soil = new StandardMaterial();
    soil.diffuse = new Color(0.38, 0.25, 0.16);
    soil.gloss = 0.05;
    soil.useMetalness = false;
    soil.update();

    // Madeira nobre para estruturas
    const wood = new StandardMaterial();
    wood.diffuse = new Color(0.42, 0.26, 0.16);
    wood.gloss = 0.3;
    wood.useMetalness = true;
    wood.metalness = 0.05;
    wood.update();

    // Telhado de ardósia / estilo oriental
    const roof = new StandardMaterial();
    roof.diffuse = new Color(0.16, 0.20, 0.28);
    roof.gloss = 0.45;
    roof.useMetalness = true;
    roof.metalness = 0.2;
    roof.update();

    // Célula solar fotovoltaica (reflexiva e brilhante)
    const solarCell = new StandardMaterial();
    solarCell.diffuse = new Color(0.06, 0.12, 0.32);
    solarCell.specular = new Color(0.8, 0.85, 1.0);
    solarCell.gloss = 0.85;
    solarCell.useMetalness = true;
    solarCell.metalness = 0.75;
    solarCell.update();

    // Metal industrial
    const metal = new StandardMaterial();
    metal.diffuse = new Color(0.65, 0.68, 0.72);
    metal.gloss = 0.65;
    metal.useMetalness = true;
    metal.metalness = 0.8;
    metal.update();

    // Água transparente límpida
    const water = new StandardMaterial();
    water.diffuse = new Color(0.12, 0.45, 0.75);
    water.specular = new Color(1.0, 1.0, 1.0);
    water.gloss = 0.9;
    water.useMetalness = true;
    water.metalness = 0.1;
    water.opacity = 0.8;
    water.blendType = 2; // BLEND_NORMAL
    water.update();

    // Bateria / acumulador
    const batteryCasing = new StandardMaterial();
    batteryCasing.diffuse = new Color(0.14, 0.18, 0.24);
    batteryCasing.gloss = 0.6;
    batteryCasing.useMetalness = true;
    batteryCasing.metalness = 0.6;
    batteryCasing.emissive = new Color(0.05, 0.35, 0.2); // led verde sutil
    batteryCasing.update();

    // Folhagem de árvores
    const foliage = new StandardMaterial();
    foliage.diffuse = new Color(0.14, 0.52, 0.24);
    foliage.gloss = 0.25;
    foliage.useMetalness = true;
    foliage.metalness = 0.05;
    foliage.update();

    // Tronco de árvore
    const trunk = new StandardMaterial();
    trunk.diffuse = new Color(0.32, 0.20, 0.12);
    trunk.gloss = 0.1;
    trunk.update();

    // Traje do Ninja (charcoal)
    const ninjaCharcoal = new StandardMaterial();
    ninjaCharcoal.diffuse = new Color(0.10, 0.11, 0.15);
    ninjaCharcoal.gloss = 0.35;
    ninjaCharcoal.useMetalness = true;
    ninjaCharcoal.metalness = 0.1;
    ninjaCharcoal.update();

    // Faixa / detalhes em carmesim
    const ninjaCrimson = new StandardMaterial();
    ninjaCrimson.diffuse = new Color(0.85, 0.12, 0.22);
    ninjaCrimson.gloss = 0.5;
    ninjaCrimson.update();

    // Luz de lanterna HQ
    const lanternGlow = new StandardMaterial();
    lanternGlow.diffuse = new Color(1.0, 0.7, 0.2);
    lanternGlow.emissive = new Color(1.0, 0.6, 0.1);
    lanternGlow.update();

    // Ghost válido para construção (verde translúcido)
    const ghostValid = new StandardMaterial();
    ghostValid.diffuse = new Color(0.1, 0.9, 0.3);
    ghostValid.emissive = new Color(0.1, 0.6, 0.2);
    ghostValid.opacity = 0.55;
    ghostValid.blendType = 2;
    ghostValid.update();

    // Ghost inválido (vermelho translúcido)
    const ghostInvalid = new StandardMaterial();
    ghostInvalid.diffuse = new Color(0.95, 0.15, 0.2);
    ghostInvalid.emissive = new Color(0.7, 0.1, 0.1);
    ghostInvalid.opacity = 0.55;
    ghostInvalid.blendType = 2;
    ghostInvalid.update();

    // Espigas de Arroz Douradas (maturação radiante)
    const riceGolden = new StandardMaterial();
    riceGolden.diffuse = new Color(0.88, 0.74, 0.22);
    riceGolden.emissive = new Color(0.25, 0.18, 0.04);
    riceGolden.gloss = 0.35;
    riceGolden.update();

    // Cenoura Laranja Vibrante
    const carrotOrange = new StandardMaterial();
    carrotOrange.diffuse = new Color(0.96, 0.44, 0.05);
    carrotOrange.gloss = 0.3;
    carrotOrange.update();

    // Folhagem Plumosa da Cenoura
    const carrotGreens = new StandardMaterial();
    carrotGreens.diffuse = new Color(0.12, 0.58, 0.22);
    carrotGreens.gloss = 0.25;
    carrotGreens.update();

    // Flor de Lótus Sagrada Shinobi (Pétalas Rosa com brilho suave)
    const lotusPink = new StandardMaterial();
    lotusPink.diffuse = new Color(0.96, 0.48, 0.72);
    lotusPink.emissive = new Color(0.35, 0.10, 0.22);
    lotusPink.gloss = 0.5;
    lotusPink.update();

    // Vitória-Régia / Almofada de Folha do Lótus
    const lotusPad = new StandardMaterial();
    lotusPad.diffuse = new Color(0.08, 0.42, 0.24);
    lotusPad.gloss = 0.6;
    lotusPad.update();

    // Terra arada irrigada e fértil (rica, escura e com brilho acetinado de umidade)
    const wetSoil = new StandardMaterial();
    wetSoil.diffuse = new Color(0.12, 0.08, 0.05);
    wetSoil.specular = new Color(0.35, 0.38, 0.42);
    wetSoil.gloss = 0.65;
    wetSoil.useMetalness = true;
    wetSoil.metalness = 0.15;
    wetSoil.update();

    // Solo exaurido (seco e acinzentado)
    const exhaustedSoil = new StandardMaterial();
    exhaustedSoil.diffuse = new Color(0.46, 0.42, 0.37);
    exhaustedSoil.gloss = 0.05;
    exhaustedSoil.useMetalness = false;
    exhaustedSoil.update();

    return {
        grass,
        soil,
        wood,
        roof,
        solarCell,
        metal,
        water,
        batteryCasing,
        foliage,
        trunk,
        ninjaCharcoal,
        ninjaCrimson,
        lanternGlow,
        ghostValid,
        ghostInvalid,
        riceGolden,
        carrotOrange,
        carrotGreens,
        lotusPink,
        lotusPad,
        wetSoil,
        exhaustedSoil
    };
}

/**
 * Carrega texturas PBR gratuitas (Poly Haven CC0) para grama e solo fértil
 */
export function loadPbrTextures(materials: FarmMaterials, app: AppBase): void {
    const loadTex = (name: string, url: string, cb: (tex: any) => void) => {
        const asset = new Asset(name, 'texture', { url });
        asset.ready((loaded) => cb(loaded.resource));
        app.assets.add(asset);
        app.assets.load(asset);
    };

    // Grama PBR (Albedo + Normal)
    loadTex('grass_diff', 'assets/textures/grass_diff_1k.jpg', (tex) => {
        materials.grass.diffuse = new Color(1.0, 1.0, 1.0);
        materials.grass.diffuseMap = tex;
        materials.grass.diffuseMapTiling = new Vec2(32, 18);
        materials.grass.update();
    });
    loadTex('grass_nor', 'assets/textures/grass_nor_1k.jpg', (tex) => {
        materials.grass.normalMap = tex;
        materials.grass.normalMapTiling = new Vec2(32, 18);
        materials.grass.bumpiness = 1.0;
        materials.grass.update();
    });

    // Solo PBR (Albedo + Normal)
    loadTex('soil_diff', 'assets/textures/soil_diff_1k.jpg', (tex) => {
        materials.soil.diffuse = new Color(1.0, 1.0, 1.0);
        materials.soil.diffuseMap = tex;
        materials.soil.diffuseMapTiling = new Vec2(16, 9);
        materials.soil.update();

        materials.wetSoil.diffuse = new Color(0.6, 0.6, 0.6);
        materials.wetSoil.diffuseMap = tex;
        materials.wetSoil.diffuseMapTiling = new Vec2(2, 2);
        materials.wetSoil.update();
    });
    loadTex('soil_nor', 'assets/textures/soil_nor_1k.jpg', (tex) => {
        materials.soil.normalMap = tex;
        materials.soil.normalMapTiling = new Vec2(16, 9);
        materials.soil.bumpiness = 1.0;
        materials.soil.update();

        materials.wetSoil.normalMap = tex;
        materials.wetSoil.normalMapTiling = new Vec2(2, 2);
        materials.wetSoil.bumpiness = 1.2;
        materials.wetSoil.update();
    });
}
