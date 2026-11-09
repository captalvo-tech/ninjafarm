import fs from 'node:fs';

const buf = fs.readFileSync(
    'Z:/AI/Ninja_Farm_Project/extracted_assets/animations/Universal Animation Library[Standard]/Unreal-Godot/UAL1_Standard.glb'
);
// Read JSON chunk
const jsonLen = buf.readUInt32LE(12);
const jsonStr = buf.toString('utf8', 20, 20 + jsonLen);
const gltf = JSON.parse(jsonStr);

console.log(
    'Meshes:',
    gltf.meshes?.map((m) => m.name)
);
console.log(
    'Materials:',
    gltf.materials?.map((m) => m.name)
);
console.log(
    'Nodes with mesh:',
    gltf.nodes?.filter((n) => n.mesh !== undefined).map((n) => n.name)
);
console.log('Skins:', gltf.skins?.length);
console.log(
    'Animations:',
    gltf.animations?.map((a) => a.name)
);
