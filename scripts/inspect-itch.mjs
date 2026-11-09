const urls = [
  'https://quaternius.itch.io/universal-base-characters',
  'https://quaternius.itch.io/universal-animation-library'
];

for (const url of urls) {
  const r = await fetch(url);
  const html = await r.text();
  console.log(`\n=== ${url} ===`);
  const matches = [...html.matchAll(/class="upload_name"[^>]*>([^<]+)<\/span>/g)].map(m => m[1]);
  console.log('Upload names:', matches);
  const btnMatches = [...html.matchAll(/data-label="([^"]+)"/g)].map(m => m[1]);
  console.log('Data labels:', btnMatches);
}

