try {
  const r = await fetch('https://drive.google.com/drive/folders/1is1ax2V0mIEDS7BbbzBV_x2Pabya1dVJ?usp=sharing');
  const html = await r.text();
  console.log('Drive html length:', html.length);
  const matches = [...html.matchAll(/"([^"]+\.(?:zip|glb|fbx|gltf))"/gi)].map(m => m[1]);
  console.log('Files found:', [...new Set(matches)]);
  
  // also look for drive folder or file IDs
  const idMatches = [...html.matchAll(/data-id="([a-zA-Z0-9_-]{25,})"/g)].map(m => m[1]);
  console.log('IDs found:', [...new Set(idMatches)]);
  
  const titleMatches = [...html.matchAll(/aria-label="([^"]+)"/g)].map(m => m[1]);
  console.log('Aria labels:', titleMatches.slice(0, 30));
} catch (err) {
  console.error(err);
}

