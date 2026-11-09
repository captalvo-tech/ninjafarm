const { chromium } = require('Z:/AI/node_modules/playwright');
const { spawn } = require('child_process');
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

async function main() {
    const port = 4195;
    console.log('[Measure] Starting vite preview on port ' + port + '...');
    const server = spawn('npx.cmd', ['vite', 'preview', '--port', String(port)], {
        cwd: 'Z:\\AI\\Ninja_Farm_Project',
        shell: true,
        stdio: 'pipe'
    });

    try {
        await waitServer(port);
        console.log('[Measure] Server ready at http://localhost:' + port);

        const browser = await chromium.launch({
            executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            headless: true,
            args: ['--enable-webgl', '--use-gl=angle', '--no-sandbox']
        });

        const page = await browser.newPage();
        await page.goto(`http://localhost:${port}/studio.html`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(2000);

        const measurements = await page.evaluate(async () => {
            const studioApp = window.__studioApp;
            if (!studioApp || !studioApp.app) {
                return { error: 'PlayCanvas __studioApp not found on page' };
            }
            const app = studioApp.app;
            const pc = window.pc;

            const models = [
                { id: 'character', file: 'assets/models/character.glb', targetH: 1.83, name: 'Ninja Humano' },
                { id: 'cow', file: 'assets/models/Cow.glb', targetH: 1.45, name: 'Vaca Adulta' },
                { id: 'bull', file: 'assets/models/Bull.glb', targetH: 1.60, name: 'Touro Adulto' },
                { id: 'horse', file: 'assets/models/Horse.glb', targetH: 1.60, name: 'Cavalo' },
                { id: 'donkey', file: 'assets/models/Donkey.glb', targetH: 1.30, name: 'Burro' },
                { id: 'fox', file: 'assets/models/fox.glb', targetH: 0.38, name: 'Raposa' },
                { id: 'shiba', file: 'assets/models/ShibaInu.glb', targetH: 0.40, name: 'Shiba Inu' }
            ];

            const results = [];

            for (const item of models) {
                const loaded = await studioApp.assetLoader.load(item.file, item.id);
                if (!loaded) continue;

                const entity = loaded.instantiate();
                entity.setLocalScale(1, 1, 1);
                entity.setLocalPosition(0, 0, 0);
                app.root.addChild(entity);

                entity.syncHierarchy();

                // Compute exact BoundingBox
                const renders = entity.findComponents('render');
                let minX = Infinity, minY = Infinity, minZ = Infinity;
                let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

                for (const r of renders) {
                    for (const mi of r.meshInstances) {
                        const aabb = mi.aabb;
                        const miMin = aabb.getMin();
                        const miMax = aabb.getMax();
                        minX = Math.min(minX, miMin.x);
                        minY = Math.min(minY, miMin.y);
                        minZ = Math.min(minZ, miMin.z);
                        maxX = Math.max(maxX, miMax.x);
                        maxY = Math.max(maxY, miMax.y);
                        maxZ = Math.max(maxZ, miMax.z);
                    }
                }

                const rawWidth = maxX - minX;
                const rawHeight = maxY - minY;
                const rawLength = maxZ - minZ;

                const scale = item.targetH / rawHeight;
                const finalH = rawHeight * scale;
                const finalW = rawWidth * scale;
                const finalL = rawLength * scale;
                const bottomOffsetY = -minY * scale;

                results.push({
                    id: item.id,
                    name: item.name,
                    file: item.file,
                    rawBounds: {
                        min: [minX, minY, minZ],
                        max: [maxX, maxY, maxZ],
                        width: rawWidth,
                        height: rawHeight,
                        length: rawLength
                    },
                    targetHeight: item.targetH,
                    calculatedScale: scale,
                    finalDimensions: {
                        width: finalW,
                        height: finalH,
                        length: finalL
                    },
                    bottomOffsetY
                });

                entity.destroy();
            }

            return { success: true, results };
        });

        await browser.close();
        server.kill();

        console.log('\n======================================================');
        console.log('PLAYCANVAS GLB DIMENSION & CALIBRATION RESULTS:');
        console.log('======================================================\n');
        console.log(JSON.stringify(measurements, null, 2));

    } catch (err) {
        console.error('[Measure Err]', err);
        server.kill();
    }
}

main();
