const r = await fetch('https://raw.githubusercontent.com/ToxSam/open-source-3D-assets/main/data/projects.json');
const data = await r.json();
const jsonStr = JSON.stringify(data);
const matches = [...jsonStr.matchAll(/"([^"]*chicken[^"]*)"/gi)].map(m => m[1]);
console.log('Matches:', [...new Set(matches)]);

