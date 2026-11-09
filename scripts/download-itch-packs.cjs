const { chromium } = require('Z:/AI/node_modules/playwright');
const fs = require('fs');
const path = require('path');

async function downloadPack(page, url, targetDir) {
    console.log(`\nNavigating to ${url}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // Click direct download button if present
    const directBtn = await page.$('a.direct_download_btn');
    if (directBtn) {
        await directBtn.click();
        await page.waitForTimeout(2000);
    }

    // Find download button
    const downloadBtns = await page.$$('a.download_btn');
    console.log(`Found ${downloadBtns.length} download button(s).`);

    for (let i = 0; i < downloadBtns.length; i++) {
        const btn = downloadBtns[i];
        const uploadRow = await btn.evaluate((el) =>
            el.closest('.upload')?.querySelector('.upload_name')?.innerText?.trim()
        );
        console.log(`Initiating download for: ${uploadRow || 'item ' + i}...`);

        const [download] = await Promise.all([page.waitForEvent('download', { timeout: 120000 }), btn.click()]);

        const suggestedFilename = download.suggestedFilename();
        const savePath = path.join(targetDir, suggestedFilename);
        console.log(`Saving to ${savePath}...`);
        await download.saveAs(savePath);
        console.log(`Saved ${suggestedFilename} (${fs.statSync(savePath).size} bytes)`);
    }
}

async function main() {
    const targetDir = 'Z:\\AI\\Ninja_Farm_Project\\downloads';
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    const browser = await chromium.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: true,
        downloadsPath: targetDir
    });

    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();

    const packs = [
        'https://quaternius.itch.io/lowpoly-animated-animals/purchase',
        'https://quaternius.itch.io/lowpoly-farm-buildings/purchase',
        'https://quaternius.itch.io/universal-animation-library/purchase',
        'https://quaternius.itch.io/universal-base-characters/purchase'
    ];

    for (const url of packs) {
        try {
            await downloadPack(page, url, targetDir);
        } catch (err) {
            console.error(`Failed to download ${url}:`, err);
        }
    }

    await browser.close();
    console.log('\nAll downloads finished!');
}

main().catch(console.error);
