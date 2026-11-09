const { chromium } = require('Z:/AI/node_modules/playwright');
const path = require('path');
const fs = require('fs');

async function capture(url, outDir) {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--enable-webgl', '--use-gl=angle', '--no-sandbox']
  });

  const targets = [
    { name: 'desktop-1920x1080.png', width: 1920, height: 1080, isMobile: false },
    { name: 'mobile-portrait-390x844.png', width: 390, height: 844, isMobile: true, hasTouch: true },
    { name: 'mobile-landscape-844x390.png', width: 844, height: 390, isMobile: true, hasTouch: true }
  ];

  for (const t of targets) {
    const context = await browser.newContext({
      viewport: { width: t.width, height: t.height },
      isMobile: t.isMobile,
      hasTouch: t.hasTouch,
      deviceScaleFactor: 2
    });
    const page = await context.newPage();
    console.log(`Navigating to ${url} for ${t.name}...`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    // Wait 3 seconds for PlayCanvas render loops and canvas frames
    await page.waitForTimeout(3000);

    const outPath = path.join(outDir, t.name);
    await page.screenshot({ path: outPath, fullPage: false });
    console.log(`Saved screenshot: ${outPath}`);
    await context.close();
  }

  await browser.close();
  console.log('Capture complete!');
}

const targetUrl = process.argv[2] || 'https://pinut.shop/';
const outDir = process.argv[3] || 'Z:\\AI\\Ninja_Farm_Project\\docs\\evidence\\baseline';
capture(targetUrl, outDir).catch(err => {
  console.error('Error during capture:', err);
  process.exit(1);
});

