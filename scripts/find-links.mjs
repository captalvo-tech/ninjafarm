const urls = [
    'https://quaternius.com/packs/universalbasecharacters.html',
    'https://quaternius.com/packs/universalanimationlibrary.html',
    'https://quaternius.com/packs/farmanimal.html'
];

for (const url of urls) {
    try {
        const res = await fetch(url);
        const html = await res.text();
        console.log(`\n=== URL: ${url} ===`);
        const regex = /href=["']([^"']+)["']/g;
        let match;
        const found = [];
        while ((match = regex.exec(html)) !== null) {
            const link = match[1];
            if (
                link.includes('drive') ||
                link.includes('download') ||
                link.includes('itch') ||
                link.includes('.zip') ||
                link.includes('mediafire') ||
                link.includes('patreon')
            ) {
                found.push(link);
            }
        }
        console.log([...new Set(found)]);
    } catch (err) {
        console.error(`Error fetching ${url}:`, err.message);
    }
}
