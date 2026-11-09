import fs from 'node:fs';
import path from 'node:path';

const BASE_RAW = 'https://raw.githubusercontent.com/trebeljahr/quaternius-showcase/main/public/glb';

const modelsToFetch = [
    // Animals
    { folder: 'animals_pack', name: 'Cow.glb' },
    { folder: 'animals_pack', name: 'Bull.glb' },
    { folder: 'animals_pack', name: 'Horse.glb' },
    { folder: 'animals_pack', name: 'ShibaInu.glb' },
    { folder: 'animals_pack', name: 'Donkey.glb' },

    // Buildings
    { folder: 'buildings_pack_2', name: 'House1.glb' },
    { folder: 'buildings_pack_2', name: 'House2.glb' },
    { folder: 'buildings_pack_2', name: 'Building1_Large.glb' },
    { folder: 'modular_medieval_buildings_pack', name: 'Well.glb' },

    // Crops
    { folder: 'crops_pack', name: 'Rice_1.glb' },
    { folder: 'crops_pack', name: 'Rice_2.glb' },
    { folder: 'crops_pack', name: 'Rice_3.glb' },
    { folder: 'crops_pack', name: 'Rice_4.glb' },
    { folder: 'crops_pack', name: 'Carrot_1.glb' },
    { folder: 'crops_pack', name: 'Carrot_2.glb' },
    { folder: 'crops_pack', name: 'Carrot_3.glb' },
    { folder: 'crops_pack', name: 'Carrot_4.glb' },
    { folder: 'crops_pack', name: 'Flower_1.glb' },
    { folder: 'crops_pack', name: 'Flower_2.glb' },
    { folder: 'crops_pack', name: 'Flower_3.glb' },
    { folder: 'crops_pack', name: 'Flower_4.glb' },
    { folder: 'crops_pack', name: 'Bamboo_1.glb' },
    { folder: 'crops_pack', name: 'Bamboo_2.glb' },
    { folder: 'crops_pack', name: 'Bamboo_3.glb' },
    { folder: 'crops_pack', name: 'Bamboo_4.glb' },

    // Nature & Vegetation
    { folder: 'nature_pack', name: 'CommonTree_1.glb' },
    { folder: 'nature_pack', name: 'CommonTree_2.glb' },
    { folder: 'nature_pack', name: 'BirchTree_1.glb' },
    { folder: 'nature_pack', name: 'PineTree_1.glb' },
    { folder: 'nature_pack', name: 'Bush_1.glb' },
    { folder: 'nature_pack', name: 'BushBerries_1.glb' },
    { folder: 'nature_pack', name: 'Rock_1.glb' },
    { folder: 'nature_pack', name: 'Rock_2.glb' },
    { folder: 'nature_pack', name: 'Lilypad.glb' },
    { folder: 'nature_pack', name: 'Grass_Short.glb' }
];

const targetDir = 'Z:/AI/Ninja_Farm_Project/public/assets/models';
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

console.log(`Downloading ${modelsToFetch.length} models...`);

for (const item of modelsToFetch) {
    const url = `${BASE_RAW}/${item.folder}/${item.name}`;
    const out = path.join(targetDir, item.name);
    if (fs.existsSync(out)) {
        console.log(`Skipping ${item.name} (already exists)`);
        continue;
    }
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(out, buf);
        console.log(`Downloaded ${item.name} (${buf.length} bytes)`);
    } catch (err) {
        console.error(`Failed ${item.name}:`, err.message);
    }
}

// Download Poly Haven PBR textures
const texTargetDir = 'Z:/AI/Ninja_Farm_Project/public/assets/textures';
if (!fs.existsSync(texTargetDir)) {
    fs.mkdirSync(texTargetDir, { recursive: true });
}

const texturesToFetch = [
    {
        url: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/grass_ground/grass_ground_diff_1k.jpg',
        name: 'grass_diff_1k.jpg'
    },
    {
        url: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/grass_ground/grass_ground_nor_gl_1k.jpg',
        name: 'grass_nor_1k.jpg'
    },
    {
        url: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/dirt_floor/dirt_floor_diff_1k.jpg',
        name: 'soil_diff_1k.jpg'
    },
    {
        url: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/dirt_floor/dirt_floor_nor_gl_1k.jpg',
        name: 'soil_nor_1k.jpg'
    }
];

console.log(`Downloading ${texturesToFetch.length} textures...`);
for (const item of texturesToFetch) {
    const out = path.join(texTargetDir, item.name);
    if (fs.existsSync(out)) {
        console.log(`Skipping texture ${item.name} (already exists)`);
        continue;
    }
    try {
        const res = await fetch(item.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(out, buf);
        console.log(`Downloaded texture ${item.name} (${buf.length} bytes)`);
    } catch (err) {
        console.error(`Failed texture ${item.name}:`, err.message);
    }
}

console.log('Finished asset downloads!');
