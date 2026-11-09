const { chromium } = require('Z:/AI/node_modules/playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const path = require('path');

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
    const port = 4173;
    const outDir = 'Z:\\AI\\Ninja_Farm_Project\\docs\\evidence\\m1';
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    console.log('Starting vite preview on port', port, '...');
    const server = spawn('npx.cmd', ['vite', 'preview', '--port', String(port)], {
        cwd: 'Z:\\AI\\Ninja_Farm_Project',
        shell: true,
        stdio: 'pipe'
    });

    server.stdout.on('data', (d) => console.log('[Vite Preview]:', d.toString().trim()));
    server.stderr.on('data', (d) => console.error('[Vite Preview Err]:', d.toString().trim()));

    await waitServer(port);
    console.log('Vite preview is ready at http://localhost:' + port);

    const browser = await chromium.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: true,
        args: ['--enable-webgl', '--use-gl=angle', '--no-sandbox', '--disable-setuid-sandbox']
    });

    const consoleLogs = [];
    const errors = [];

    // 1. DESKTOP 1920x1080
    console.log('\n--- Testing Desktop 1920x1080 ---');
    const desktopCtx = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1
    });
    const page = await desktopCtx.newPage();

    page.on('console', (msg) => {
        const t = msg.text();
        consoleLogs.push({ type: msg.type(), text: t });
        if (msg.type() === 'error') errors.push(t);
    });
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' });
    // Wait for 3D assets to load and render loop to settle
    await page.waitForTimeout(4000);

    // Measure performance (FPS and memory)
    const perfData = await page.evaluate(async () => {
        return new Promise((resolve) => {
            let frameCount = 0;
            const start = performance.now();
            function tick() {
                frameCount++;
                if (performance.now() - start < 2000) {
                    requestAnimationFrame(tick);
                } else {
                    const elapsed = (performance.now() - start) / 1000;
                    const fps = frameCount / elapsed;
                    const mem =
                        performance && performance.memory
                            ? {
                                  usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / (1024 * 1024)) + ' MB',
                                  totalJSHeapSize:
                                      Math.round(performance.memory.totalJSHeapSize / (1024 * 1024)) + ' MB'
                              }
                            : 'N/A';
                    resolve({ fps: Math.round(fps), frames: frameCount, elapsed, mem });
                }
            }
            requestAnimationFrame(tick);
        });
    });

    console.log('Measured Performance on Desktop:', perfData);
    await page.screenshot({ path: path.join(outDir, 'desktop-1920x1080.png') });
    console.log('Saved desktop-1920x1080.png');

    // Test character locomotion (walk & run)
    console.log('Testing ninja movement (WASD)...');
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(outDir, 'ninja-walking.png') });
    console.log('Saved ninja-walking.png');
    await page.keyboard.up('KeyW');
    await page.waitForTimeout(500);

    // Test build mode camera
    console.log('Testing build mode (Digit2)...');
    await page.keyboard.press('Digit2');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, 'camera-build-mode.png') });
    console.log('Saved camera-build-mode.png');

    // Switch back to explore mode
    await page.keyboard.press('Digit1');
    await page.waitForTimeout(500);

    await desktopCtx.close();

    // 2. MOBILE PORTRAIT 390x844
    console.log('\n--- Testing Mobile Portrait 390x844 ---');
    const mobilePortraitCtx = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2
    });
    const mobilePortraitPage = await mobilePortraitCtx.newPage();
    await mobilePortraitPage.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' });
    await mobilePortraitPage.waitForTimeout(3000);
    await mobilePortraitPage.screenshot({ path: path.join(outDir, 'mobile-portrait-390x844.png') });
    console.log('Saved mobile-portrait-390x844.png');
    await mobilePortraitCtx.close();

    // 3. MOBILE LANDSCAPE 844x390
    console.log('\n--- Testing Mobile Landscape 844x390 ---');
    const mobileLandscapeCtx = await browser.newContext({
        viewport: { width: 844, height: 390 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 2
    });
    const mobileLandscapePage = await mobileLandscapeCtx.newPage();
    await mobileLandscapePage.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' });
    await mobileLandscapePage.waitForTimeout(3000);
    await mobileLandscapePage.screenshot({ path: path.join(outDir, 'mobile-landscape-844x390.png') });
    console.log('Saved mobile-landscape-844x390.png');
    await mobileLandscapeCtx.close();

    await browser.close();
    server.kill();

    const report = {
        testDate: new Date().toISOString(),
        browser: 'Google Chrome (Headless) / Playwright 1.63.0',
        viewportTests: [
            { mode: 'Desktop', dimensions: '1920x1080', file: 'desktop-1920x1080.png' },
            { mode: 'Mobile Portrait', dimensions: '390x844', file: 'mobile-portrait-390x844.png' },
            { mode: 'Mobile Landscape', dimensions: '844x390', file: 'mobile-landscape-844x390.png' },
            { mode: 'Locomotion Action', file: 'ninja-walking.png' },
            { mode: 'Build Camera View', file: 'camera-build-mode.png' }
        ],
        performance: perfData,
        consoleErrorsCount: errors.length,
        consoleErrors: errors,
        logSample: consoleLogs.slice(0, 20)
    };

    fs.writeFileSync(path.join(outDir, 'test-report.json'), JSON.stringify(report, null, 2));
    console.log('\nReport written to docs/evidence/m1/test-report.json');
    console.log(`Finished test run! Total console errors: ${errors.length}`);
}

run().catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
