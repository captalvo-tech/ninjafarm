const url = 'https://raw.githubusercontent.com/trebeljahr/quaternius-showcase/main/public/glb/animals_pack/Cow.glb';
const outPath = 'Z:/AI/Ninja_Farm_Project/extracted_assets/Cow.glb';
const res = await fetch(url);
const buf = Buffer.from(await res.arrayBuffer());
import fs from 'node:fs';
fs.writeFileSync(outPath, buf);
console.log('Saved Cow.glb, size:', buf.length);
