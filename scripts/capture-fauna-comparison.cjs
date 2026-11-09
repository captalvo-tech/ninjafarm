const { chromium } = require('Z:/AI/node_modules/playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
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
    const port = 4198;
    const evidenceDir = 'Z:/AI/Ninja_Farm_Project/docs/evidence/fauna';
    const artifactDir = 'C:/Users/VIOLI/.gemini/antigravity/brain/9fb73629-b51b-4019-8146-d365220a2f2c';

    for (const d of [evidenceDir, artifactDir]) {
        if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
    }

    console.log('[FaunaCapture] Starting vite preview on port ' + port + '...');
    const server = spawn('npx.cmd', ['vite', 'preview', '--port', String(port)], {
        cwd: 'Z:\\AI\\Ninja_Farm_Project',
        shell: true,
        stdio: 'pipe'
    });

    try {
        await waitServer(port);
        console.log('[FaunaCapture] Preview server ready at http://localhost:' + port);

        const browser = await chromium.launch({
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            headless: true,
            args: ['--enable-webgl', '--use-gl=angle', '--no-sandbox']
        });

        // 1. DESKTOP VIEWPORT (1920x1080)
        const desktopCtx = await browser.newContext({
            viewport: { width: 1920, height: 1080 },
            deviceScaleFactor: 1
        });
        const page = await desktopCtx.newPage();

        await page.goto(`http://localhost:${port}/studio.html`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2500);

        // Configura a cena de alinhamento comparativo
        const setupResult = await page.evaluate(async () => {
            const studioApp = window.__studioApp;
            if (!studioApp || !studioApp.app) return { error: 'Studio not initialized' };

            const app = studioApp.app;
            const EntityClass = app.root.constructor;
            const loader = studioApp.assetLoader;

            // Remove objetos de prévia anteriores
            const comparisonRoot = new EntityClass('fauna_comparison_root');
            app.root.addChild(comparisonRoot);

            // Carrega modelos
            const lineup = [
                {
                    id: 'ninja',
                    url: 'assets/models/character.glb',
                    scale: 1.0,
                    offsetY: 0,
                    x: -7,
                    name: 'Ninja (1.83m)'
                },
                {
                    id: 'cow',
                    url: 'assets/models/Cow.glb',
                    scale: 0.316,
                    offsetY: 0.018,
                    x: -3.5,
                    name: 'Vaca (1.45m)'
                },
                {
                    id: 'bull',
                    url: 'assets/models/Bull.glb',
                    scale: 0.349,
                    offsetY: 0.019,
                    x: 0,
                    name: 'Touro (1.60m)'
                },
                {
                    id: 'horse',
                    url: 'assets/models/Horse.glb',
                    scale: 0.332,
                    offsetY: 0.004,
                    x: 3.5,
                    name: 'Cavalo (1.60m)'
                },
                {
                    id: 'fox',
                    url: 'assets/models/fox.glb',
                    scale: 0.0048,
                    offsetY: 0.001,
                    x: 6.5,
                    name: 'Raposa (0.38m)'
                },
                {
                    id: 'shiba',
                    url: 'assets/models/ShibaInu.glb',
                    scale: 0.129,
                    offsetY: -0.001,
                    x: 8.5,
                    name: 'Shiba (0.40m)'
                }
            ];

            for (const item of lineup) {
                const loaded = await loader.load(item.url, item.id);
                if (loaded) {
                    const ent = loaded.instantiate();
                    ent.name = item.id;
                    ent.setLocalScale(item.scale, item.scale, item.scale);
                    ent.setLocalPosition(item.x, item.offsetY, 0);
                    ent.setLocalEulerAngles(0, 0, 0); // Frente para a câmera
                    comparisonRoot.addChild(ent);

                    // Animação idle se disponível
                    const idleTrack = loaded.getTrack('Idle') || loaded.getTrack('Survey');
                    if (idleTrack) {
                        ent.addComponent('anim', { activate: true });
                        ent.anim.assignAnimation('idle', idleTrack, undefined, 1.0, true);
                    }
                }
            }

            // Cria galinha procedural ao lado do ninja
            const chickRoot = new EntityClass('procedural_chicken');
            chickRoot.setLocalPosition(-5.5, 0, 0);
            const chickBody = new EntityClass('chick_body');
            chickBody.addComponent('render', { type: 'box' });
            chickBody.setLocalScale(0.35, 0.35, 0.45);
            chickBody.setLocalPosition(0, 0.25, 0);
            chickRoot.addChild(chickBody);
            const chickHead = new EntityClass('chick_head');
            chickHead.addComponent('render', { type: 'box' });
            chickHead.setLocalScale(0.18, 0.22, 0.18);
            chickHead.setLocalPosition(0, 0.48, 0.18);
            chickRoot.addChild(chickHead);
            comparisonRoot.addChild(chickRoot);

            return { success: true, count: lineup.length + 1 };
        });

        console.log('[FaunaCapture] Setup result:', setupResult);
        await page.waitForTimeout(1000);

        // Helper para salvar em ambos os diretórios
        const saveScreen = async (filename, p = page) => {
            const p1 = path.join(evidenceDir, filename);
            const p2 = path.join(artifactDir, filename);
            await p.screenshot({ path: p1, fullPage: false });
            fs.copyFileSync(p1, p2);
            console.log('  📸 Captured:', filename);
        };

        // 1. Visão Frontal (Alinhamento lado a lado)
        await page.evaluate(() => {
            const studioApp = window.__studioApp;
            studioApp.setCameraView('front');
            studioApp.camDistance = 14;
            studioApp.camTarget.x = 0.5;
            studioApp.camTarget.y = 0.8;
            studioApp.camTarget.z = 0;
            studioApp.updateCameraTransform();
        });
        await page.waitForTimeout(600);
        await saveScreen('fauna-front-comparison.png');

        // 2. Visão Lateral (Proporção de comprimento e cernelha)
        await page.evaluate(() => {
            const studioApp = window.__studioApp;
            studioApp.setCameraView('side');
            studioApp.camDistance = 14;
            studioApp.camTarget.x = 0.5;
            studioApp.camTarget.y = 0.8;
            studioApp.camTarget.z = 0;
            studioApp.updateCameraTransform();
        });
        await page.waitForTimeout(600);
        await saveScreen('fauna-side-comparison.png');

        // 3. Perspectiva Isométrica / Jogador
        await page.evaluate(() => {
            const studioApp = window.__studioApp;
            studioApp.setCameraView('iso');
            studioApp.camDistance = 14;
            studioApp.camTarget.x = 0.5;
            studioApp.camTarget.y = 0.8;
            studioApp.camTarget.z = 0;
            studioApp.updateCameraTransform();
        });
        await page.waitForTimeout(600);
        await saveScreen('fauna-perspective-comparison.png');

        // 4. Teste em Jogo Real (index.html com visão geral da fazenda)
        console.log('\n--- Capturing In-Game Farm with Fauna ---');
        const gamePage = await desktopCtx.newPage();
        await gamePage.goto(`http://localhost:${port}/`, { waitUntil: 'domcontentloaded' });
        await gamePage.waitForTimeout(3000);

        // Autentica dev ou fecha modal
        await gamePage.evaluate(() => {
            const overlay = document.getElementById('login-modal-overlay');
            if (overlay) overlay.style.display = 'none';
        });
        await gamePage.waitForTimeout(2000);
        await saveScreen('fauna-farm-overview.png', gamePage);

        // 5. Mobile Retrato (390x844)
        console.log('\n--- Capturing Mobile Portrait (390x844) ---');
        const mobilePortraitCtx = await browser.newContext({
            viewport: { width: 390, height: 844 },
            deviceScaleFactor: 2
        });
        const mobilePPage = await mobilePortraitCtx.newPage();
        await mobilePPage.goto(`http://localhost:${port}/`, { waitUntil: 'domcontentloaded' });
        await mobilePPage.waitForTimeout(2500);
        await mobilePPage.evaluate(() => {
            const overlay = document.getElementById('login-modal-overlay');
            if (overlay) overlay.style.display = 'none';
        });
        await mobilePPage.waitForTimeout(1500);
        await saveScreen('fauna-mobile-portrait.png', mobilePPage);

        // 6. Mobile Paisagem (844x390)
        console.log('\n--- Capturing Mobile Landscape (844x390) ---');
        const mobileLandscapeCtx = await browser.newContext({
            viewport: { width: 844, height: 390 },
            deviceScaleFactor: 2
        });
        const mobileLPage = await mobileLandscapeCtx.newPage();
        await mobileLPage.goto(`http://localhost:${port}/`, { waitUntil: 'domcontentloaded' });
        await mobileLPage.waitForTimeout(2500);
        await mobileLPage.evaluate(() => {
            const overlay = document.getElementById('login-modal-overlay');
            if (overlay) overlay.style.display = 'none';
        });
        await mobileLPage.waitForTimeout(1500);
        await saveScreen('fauna-mobile-landscape.png', mobileLPage);

        await browser.close();
        server.kill();
        console.log('\n✅ All Fauna visual validation screenshots successfully captured and saved!');
    } catch (err) {
        console.error('[FaunaCapture Err]', err);
        server.kill();
    }
}

run();
