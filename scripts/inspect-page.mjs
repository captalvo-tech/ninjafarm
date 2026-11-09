const res = await fetch('https://quaternius.com/packs/farmanimal.html');
const html = await res.text();
const regex = /<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
let match;
while ((match = regex.exec(html)) !== null) {
  console.log(`Text: ${match[2].replace(/<[^>]+>/g, '').trim()} -> ${match[1]}`);
}

