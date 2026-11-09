const packs = [
  'universalbasecharacters.html',
  'universalanimationlibrary.html'
];

for (const p of packs) {
  const res = await fetch(`https://quaternius.com/packs/${p}`);
  const html = await res.text();
  console.log(`\n=== ${p} ===`);
  const matches = [...html.matchAll(/window\.open\('([^']+)'/g)].map(m => m[1]);
  console.log(matches);
}
