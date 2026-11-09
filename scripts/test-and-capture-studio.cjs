const { chromium } = require('Z:/AI/node_modules/playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');

function waitServer(port, timeoutMs = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(`http://localhost:${port}/`, (res) => {
        if (res.statusCode === 200 || res.statusCode === 304) resolve();
        else setTimeout(check, 200);
      });
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) reject(new Error('Server start timed out'));
        else setTimeout(check, 200);
      });
    };
    check();
  });
}

async function run() {
  const port = 4182;
  const outDir = 'Z:\\AI\\Ninja_Farm_Project\\docs\\evidence\\studio';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  console.log('Starting vite preview on port', port, '...');
  const server = spawn('npx.cmd', ['vite', 'preview', '--port', String(port)], {
    cwd: 'Z:\\AI\\Ninja_Farm_Project',
    shell: true,
    stdio: 'pipe'
  });

  server.stdout.on('data', d => console.log('[Vite Preview]:', d.toString().trim()));
  server.stderr.on('data', d => console.error('[Vite Preview Err]:', d.toString().trim()));

  try {
    await waitServer(port);
    console.log('Vite preview is ready at http://localhost:' + port);

    const browser = await chromium.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: true,
      args: ['--enable-webgl', '--use-gl=angle', '--no-sandbox', '--disable-setuid-sandbox']
    });

    // 1. TEST STUDIO DESKTOP (1920x1080)
    console.log('\n--- 1. Testing Ninja Farm Studio (Desktop 1920x1080) ---');
    const desktopCtx = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1
    });
    const studioPage = await desktopCtx.newPage();

    studioPage.on('console', msg => console.log('[Studio Console]:', msg.text()));
    studioPage.on('pageerror', err => console.error('[Studio PageError]:', err.message));

    await studioPage.goto(`http://localhost:${port}/studio.html`, { waitUntil: 'domcontentloaded' });
    // Wait 3.5s for PlayCanvas to initialize and GLB to load
    await new Promise(r => setTimeout(r, 3500));

    // Verify Asset Catalog
    const assetCards = await studioPage.$$('.asset-card');
    console.log(`Found ${assetCards.length} asset cards in catalog.`);

    // Verify Title
    const brandTitle = await studioPage.$eval('.brand-title', el => el.textContent.trim());
    console.log('Brand title:', brandTitle);

    // Capture Desktop View
    const desktopShotPath = `${outDir}\\studio-desktop.png`;
    await studioPage.screenshot({ path: desktopShotPath });
    console.log('Saved studio desktop screenshot to:', desktopShotPath);

    // 2. TEST ANIMATIONS TAB
    console.log('\n--- 2. Testing Animations Inspector Tab ---');
    await studioPage.click('[data-tab="tab-animations"]');
    await new Promise(r => setTimeout(r, 600));

    const animClipsCount = await studioPage.$$eval('#all-clips-list > div', els => els.length);
    console.log(`Found ${animClipsCount} animation clips in model inspector.`);

    const animShotPath = `${outDir}\\studio-animations-tab.png`;
    await studioPage.screenshot({ path: animShotPath });
    console.log('Saved animations tab screenshot to:', animShotPath);

    // 3. TEST MOBILE PORTRAIT VIEWPORT PRESET
    console.log('\n--- 3. Testing Mobile Portrait Viewport Preset ---');
    await studioPage.click('[data-viewport="mobile-portrait"]');
    await new Promise(r => setTimeout(r, 1000));

    const mobilePortraitShotPath = `${outDir}\\studio-mobile-portrait.png`;
    await studioPage.screenshot({ path: mobilePortraitShotPath });
    console.log('Saved mobile portrait screenshot to:', mobilePortraitShotPath);

    // 4. TEST LIVE GAME (index.html)
    console.log('\n--- 4. Testing Live Farm Game (index.html) ---');
    const gamePage = await desktopCtx.newPage();
    gamePage.on('console', msg => console.log('[Game Console]:', msg.text()));
    gamePage.on('pageerror', err => console.error('[Game PageError]:', err.message));

    await gamePage.goto(`http://localhost:${port}/index.html`, { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 4000));

    // Check dev button
    const devBtn = await gamePage.$('#ninja-studio-dev-btn');
    console.log('Ninja Studio dev button present in game:', devBtn !== null);

    const gameShotPath = `${outDir}\\game-with-3d-ninja.png`;
    await gamePage.screenshot({ path: gameShotPath });
    console.log('Saved game screenshot to:', gameShotPath);

    await browser.close();
    console.log('\n✅ All browser tests and captures completed successfully!');
  } finally {
    server.kill();
  }
}

run().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
