import { execSync } from 'child_process';
const filePath = 'Z:/AI/Ninja_Farm_Project/extracted_assets/animations/Universal Animation Library[Standard]/Unreal-Godot/UAL1_Standard.glb';
const out = execSync(`node "Z:/AI/Ninja_Farm_Project/.agents/skills/inspect-glb/scripts/inspect.mjs" "${filePath}"`, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
const json = JSON.parse(out);
console.log('Clips count:', json.clips?.length);
console.log('Clips:', json.clips);

