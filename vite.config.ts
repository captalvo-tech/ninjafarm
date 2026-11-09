import { defineConfig } from 'vite';
import * as fs from 'fs';
import * as path from 'path';

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
                studio: 'studio.html',
                admin: 'admin.html'
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
                let devAdminSession: { email: string; role: string; csrfToken: string } | null = {
                    email: 'mvioli7@gmail.com',
                    role: 'superadmin',
                    csrfToken: 'dev_admin_csrf_12345'
                };
                let devAlertsList = [
                    {
                        id: 'rep_dev_001',
                        type: 'tester_bug_report',
                        severity: 'Médio',
                        title: 'Relato de Testador: Teste de carregamento inicial...',
                        description: 'O Droid iniciou com 100% de bateria e executou as tarefas normalmente.',
                        firstOccurrence: Math.floor(Date.now() / 1000) - 3600,
                        lastOccurrence: Math.floor(Date.now() / 1000) - 1800,
                        occurrences: 1,
                        version: 'alpha-0.1',
                        module: 'gameplay',
                        status: 'Novo',
                        details: { browser: 'Chrome 131', platform: 'Windows', activeTask: 'plow_tile' }
                    }
                ];

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

                    if (url.startsWith('/api/ai.php')) {
                        res.setHeader('Content-Type', 'application/json');
                        if (url.includes('action=test')) {
                            res.end(JSON.stringify({ success: true, message: 'Conexão dev com Gemini OK!' }));
                            return;
                        }
                        if (req.method === 'POST') {
                            let body = '';
                            req.on('data', (chunk: any) => { body += chunk; });
                            req.on('end', () => {
                                try {
                                    const parsed = JSON.parse(body);
                                    const q = (parsed.question || '').toLowerCase();
                                    let reply = 'Mestre Shinobi, analisei a propriedade. A bateria do Droid está estável e o agendador está monitorando os canteiros.';
                                    if (q.includes('energia') || q.includes('bateria')) {
                                        reply = '⚡ Diagnóstico Energético: A rede solar opera conforme o ciclo diurno. Mantenha os painéis limpos e baterias recarregadas.';
                                    } else if (q.includes('plantar') || q.includes('arroz') || q.includes('cultura')) {
                                        reply = '🌾 Diagnóstico Agrícola: Recomendo arar o solo antes de semear. O arroz tradicional oferece excelente retorno de alimento.';
                                    } else if (q.includes('fazer') || q.includes('próximo')) {
                                        reply = '💡 Sugestão Shinobi: Verifique se há canteiros sedentos e agende a irrigação ou planeje um novo blueprint na grade!';
                                    }
                                    res.end(JSON.stringify({ success: true, reply }));
                                } catch (e) {
                                    res.statusCode = 400;
                                    res.end(JSON.stringify({ success: false, error: 'JSON inválido' }));
                                }
                            });
                            return;
                        }
                        res.end(JSON.stringify({ success: true, mode: 'limited' }));
                        return;
                    }

                    if (url === '/admin' || url === '/admin/') {
                        req.url = '/admin.html';
                        next();
                        return;
                    }

                    if (url.startsWith('/api/admin.php')) {
                        res.setHeader('Content-Type', 'application/json');
                        const urlObj = new URL(url, 'http://localhost');
                        const action = urlObj.searchParams.get('action') || '';

                        if (action === 'check') {
                            if (devAdminSession) {
                                res.end(JSON.stringify({ authenticated: true, email: devAdminSession.email, role: devAdminSession.role, csrfToken: devAdminSession.csrfToken }));
                            } else {
                                res.statusCode = 401;
                                res.end(JSON.stringify({ authenticated: false, need_setup: false }));
                            }
                            return;
                        }

                        if (action === 'logout') {
                            devAdminSession = null;
                            res.end(JSON.stringify({ success: true }));
                            return;
                        }

                        if (action === 'dashboard') {
                            res.end(JSON.stringify({
                                success: true,
                                serverTime: Math.floor(Date.now() / 1000),
                                system: {
                                    phpVersion: '8.3-dev',
                                    deployedVersion: 'Alpha 0.1.0',
                                    apiStatus: 'OPERATIONAL',
                                    databaseStatus: 'OPERATIONAL (Dev Mock / SQLite)'
                                },
                                players: { totalAccounts: 14, activeToday: 6, active7d: 11, active30d: 14 },
                                farms: { totalFarms: 14, farmsWithActiveCrops: 9, farmsHaltedEnergy: 1 },
                                droid: { totalDroids: 14, working: 8, recharging: 3, idle: 3, lowBattery: 1, operationalUtilization: 57.1 },
                                scheduler: { totalTasks: 42, scheduled: 18, completed: 21, waitingResources: 3 }
                            }));
                            return;
                        }

                        if (action === 'alerts') {
                            res.end(JSON.stringify({ success: true, alerts: devAlertsList, unresolvedCount: devAlertsList.filter(a => a.status !== 'Resolvido').length }));
                            return;
                        }

                        if (action === 'economy') {
                            res.end(JSON.stringify({
                                success: true,
                                aggregateResources: { wood: 1250, metal: 680, parts: 340, food: 920, water: 1150, energy: 1420 },
                                scarcityFarmsCount: { water: 1, energy: 2, wood: 0, metal: 1, parts: 3, food: 0 },
                                solarInfrastructure: { solarPanelsActiveCapacity: '324 W (pico solar)', farmsCount: 14 }
                            }));
                            return;
                        }

                        if (action === 'roadmap') {
                            const featuresPath = path.resolve(process.cwd(), 'project/roadmap/features.json');
                            const historyPath = path.resolve(process.cwd(), 'project/roadmap/history.jsonl');
                            const features = fs.existsSync(featuresPath) ? JSON.parse(fs.readFileSync(featuresPath, 'utf-8')) : [];
                            const historyLines = fs.existsSync(historyPath)
                                ? fs.readFileSync(historyPath, 'utf-8').split('\n').filter((l: string) => !!l.trim()).map((l: string) => JSON.parse(l))
                                : [];
                            res.end(JSON.stringify({ success: true, features, history: historyLines.reverse() }));
                            return;
                        }

                        if (action === 'audit_logs') {
                            res.end(JSON.stringify({
                                success: true,
                                logs: [
                                    { timestamp: Math.floor(Date.now() / 1000) - 120, date: new Date().toISOString(), admin: 'mvioli7@gmail.com', action: 'login', ip: '127.0.0.1' },
                                    { timestamp: Math.floor(Date.now() / 1000) - 3600, date: new Date(Date.now() - 3600000).toISOString(), admin: 'mvioli7@gmail.com', action: 'alert_status_updated', ip: '127.0.0.1', details: { alertId: 'rep_dev_001', status: 'Em análise' } }
                                ]
                            }));
                            return;
                        }

                        if (req.method === 'POST') {
                            let body = '';
                            req.on('data', (chunk: any) => { body += chunk; });
                            req.on('end', () => {
                                try {
                                    const parsed = JSON.parse(body);
                                    if (parsed.action === 'login') {
                                        devAdminSession = {
                                            email: parsed.email || 'mvioli7@gmail.com',
                                            role: 'superadmin',
                                            csrfToken: 'dev_admin_csrf_12345'
                                        };
                                        res.end(JSON.stringify({
                                            success: true,
                                            adminToken: 'dev_admin_bearer_token',
                                            csrfToken: 'dev_admin_csrf_12345',
                                            email: devAdminSession.email
                                        }));
                                        return;
                                    }
                                    if (parsed.action === 'alerts_update_status') {
                                        const alert = devAlertsList.find(a => a.id === parsed.alertId);
                                        if (alert) alert.status = parsed.status;
                                        res.end(JSON.stringify({ success: true }));
                                        return;
                                    }
                                    res.end(JSON.stringify({ success: true }));
                                } catch (e) {
                                    res.statusCode = 400;
                                    res.end(JSON.stringify({ success: false, error: 'JSON inválido' }));
                                }
                            });
                            return;
                        }

                        res.end(JSON.stringify({ success: true }));
                        return;
                    }

                    next();
                });
            }
        }
    ]
});
