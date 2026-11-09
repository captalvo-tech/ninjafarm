import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
    // Relative URLs, so the build runs wherever it's served from: a domain root, a subpath such as
    // GitHub Pages or itch.io, or a Snapchat Web Lens
    base: './',
    build: {
        // A PlayCanvas build is 1-2.5 MB minified (300-600 kB gzipped), nearly all of it engine code the
        // first frame needs, so warn only for chunks well past that rather than at Vite's 500 kB default
        chunkSizeWarningLimit: 3000,
        rollupOptions: {
            input: {
                main: 'index.html',
                studio: 'studio.html'
            }
        }
    },
    plugins: [
        {
            // Dev only: install the PlayCanvas Inspector before the app starts (press ` to toggle)
            name: 'playcanvas-inspector',
            apply: 'serve',
            config: () => ({ optimizeDeps: { include: ['@playcanvas/inspector'] } }),
            transformIndexHtml: () => [
                { tag: 'script', attrs: { type: 'module', src: '/src/inspector.ts' }, injectTo: 'head-prepend' }
            ]
        },
        {
            // Dev only: Mock backend API endpoints when running Vite dev server locally
            name: 'ninja-api-dev-mock',
            apply: 'serve',
            configureServer(server) {
                let devCurrentUser: { sub: string; email: string; name: string; picture: string } | null = {
                    sub: 'dev_local_ninja_9988',
                    email: 'ninja.dev@pinut.shop',
                    name: 'Mestre Ninja Dev',
                    picture: ''
                };
                let devRevision = 1;
                let devSaveData: any = null;

                server.middlewares.use((req: any, res: any, next: any) => {
                    const url = req.url || '';
                    if (url.startsWith('/api/auth.php')) {
                        res.setHeader('Content-Type', 'application/json');
                        if (url.includes('action=logout')) {
                            devCurrentUser = null;
                            res.end(JSON.stringify({ success: true }));
                            return;
                        }
                        if (url.includes('action=login')) {
                            devCurrentUser = {
                                sub: 'dev_local_ninja_9988',
                                email: 'ninja.dev@pinut.shop',
                                name: 'Mestre Ninja Dev',
                                picture: ''
                            };
                            res.end(JSON.stringify({ success: true, user: devCurrentUser, sessionToken: 'dev_sess_token' }));
                            return;
                        }
                        if (devCurrentUser) {
                            res.end(JSON.stringify({ authenticated: true, user: devCurrentUser }));
                        } else {
                            res.end(JSON.stringify({ authenticated: false }));
                        }
                        return;
                    }

                    if (url.startsWith('/api/save.php')) {
                        res.setHeader('Content-Type', 'application/json');
                        if (!devCurrentUser) {
                            res.statusCode = 401;
                            res.end(JSON.stringify({ success: false, error: 'Não autenticado' }));
                            return;
                        }

                        if (url.includes('action=reset')) {
                            devRevision = 1;
                            devSaveData = null;
                            res.end(JSON.stringify({ success: true, message: 'Reset concluído' }));
                            return;
                        }

                        if (req.method === 'POST') {
                            let body = '';
                            req.on('data', (chunk: any) => { body += chunk; });
                            req.on('end', () => {
                                try {
                                    const parsed = JSON.parse(body);
                                    devRevision++;
                                    devSaveData = parsed.save;
                                    devSaveData.revision = devRevision;
                                    res.end(JSON.stringify({ success: true, revision: devRevision, savedAt: Date.now() }));
                                } catch (e) {
                                    res.statusCode = 400;
                                    res.end(JSON.stringify({ success: false, error: 'JSON inválido' }));
                                }
                            });
                            return;
                        }

                        // action=load
                        if (!devSaveData) {
                            devSaveData = {
                                version: 1,
                                revision: 1,
                                savedAt: Date.now(),
                                resources: { wood: 50, metal: 20, parts: 10, food: 30, water: 40, energy: 50 },
                                buildings: [
                                    { instanceId: 'hq_main', type: 'hq', gridX: 16, gridY: 12, orientation: 0, createdAt: Date.now(), health: 500 },
                                    { instanceId: 'crop_plot_init_1', type: 'crop_field', gridX: 16, gridY: 18, orientation: 0, createdAt: Date.now(), health: 100, customData: { soilStatus: 'raw' } },
                                    { instanceId: 'solar_panel_init_1', type: 'solar_panel', gridX: 12, gridY: 14, orientation: 0, createdAt: Date.now(), health: 80 },
                                    { instanceId: 'water_pump_init_1', type: 'water_pump', gridX: 22, gridY: 14, orientation: 0, createdAt: Date.now(), health: 100 },
                                    { instanceId: 'bonfire_init_1', type: 'bonfire', gridX: 20, gridY: 16, orientation: 0, createdAt: Date.now(), health: 60 }
                                ],
                                crops: [],
                                animals: [],
                                dayTime: 0.35,
                                elapsedGameDays: 1,
                                ninjaPosition: { x: 0, y: 0, z: 0 },
                                droid: { id: 'farm_droid_01', battery: 100, maxBattery: 100, state: 'idle', position: { x: -2, y: 0, z: 2 }, workSpeedMultiplier: 1.0 },
                                scheduler: { tasks: [], activeTaskId: null, lastProcessedTimestamp: Math.floor(Date.now() / 1000) },
                                geminiConfig: { mode: 'limited', hasCustomKey: false, model: 'gemini-1.5-flash' },
                                eventsLog: [{ id: 'evt_init', timestamp: Date.now(), type: 'welcome', title: 'Fundação da Propriedade', description: 'Fazenda iniciada com Droid.' }]
                            };
                        }
                        res.end(JSON.stringify({ success: true, save: devSaveData, serverTime: Math.floor(Date.now() / 1000) }));
                        return;
                    }

                    next();
                });
            }
        }
    ]
});
