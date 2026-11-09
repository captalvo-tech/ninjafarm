try {
  const resp = await fetch('https://poly.pizza/bundle/Animated-Animals-o0b6863V0X');
  const html = await resp.text();
  console.log('Status:', resp.status);
  const links = [...html.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
  console.log(links.filter(l => l.includes('Chicken') || l.includes('chicken') || l.includes('/m/')));
} catch (e) {
  console.error(e);
}
