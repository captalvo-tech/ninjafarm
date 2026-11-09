import fs from 'node:fs';

const gltfPath = 'Z:/AI/Ninja_Farm_Project/extracted_assets/characters/Universal Base Characters[Standard]/Base Characters/Godot - UE/Superhero_Male_FullBody.gltf';
const gltf = JSON.parse(fs.readFileSync(gltfPath, 'utf8'));

console.log('Meshes:', gltf.meshes?.map(m => m.name));
console.log('Materials:', gltf.materials?.map(m => m.name));
console.log('Nodes count:', gltf.nodes?.length);
console.log('Nodes with mesh:', gltf.nodes?.filter(n => n.mesh !== undefined).map(n => n.name));
console.log('First 20 joint node names:', gltf.nodes?.slice(0, 20).map(n => n.name));

