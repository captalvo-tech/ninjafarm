const { chromium } = require('Z:/AI/node_modules/playwright');

async function searchPolyPizza() {
    const browser = await chromium.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: true
    });
    const page = await browser.newPage();
    await page.goto('https://poly.pizza/s/Chicken', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const items = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href^="/m/"]')).map((a) => ({
            href: a.href,
            title: a.innerText.trim()
        }));
    });
    console.log('Poly Pizza items:', items.slice(0, 10));
    await browser.close();
}

searchPolyPizza().catch(console.error);
