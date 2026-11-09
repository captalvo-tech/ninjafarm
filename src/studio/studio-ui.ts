import { StudioApp, type StudioModelStats } from './studio-app';
import {
    exportVisualConfigJson,
    getVisualConfig,
    importVisualConfigJson,
    resetVisualConfig,
    saveVisualConfig,
    type VisualConfig
} from '../core/visual-config';

interface ManifestAsset {
    assetId: string;
    category: string;
    runtimePath: string;
    creator: string;
    license: string;
    animations?: string[];
    fileBytesMeasured?: number;
    notes?: string;
}

export class StudioUI {
    private app: StudioApp;
    private config: VisualConfig;
    private manifestAssets: ManifestAsset[] = [];
    private activeCategory: string = 'all';
    private searchQuery: string = '';
    private activeAssetId: string = '';

    constructor(app: StudioApp) {
        this.app = app;
        this.config = getVisualConfig();
    }

    async init(): Promise<void> {
        this.checkAuthGate();
        this.bindGlobalActions();
        this.bindViewportSwitcher();
        this.bindCameraGizmo();
        this.bindInspectorTabs();
        this.bindTransformControls();
        this.bindAnimationControls();
        this.bindMaterialControls();
        this.bindEnvironmentControls();

        // Listen to StudioApp performance updates
        this.app.onStats((stats, fps, drawCalls) => {
            this.updateStatsDisplay(stats, fps, drawCalls);
        });

        this.app.onAnimClips((clips, activeClip) => {
            this.updateAnimationClips(clips, activeClip);
        });

        // Load asset catalog
        await this.loadCatalog();

        // Load default character into viewport
        const initialModel = this.config.character.modelUrl || 'assets/models/character.glb';
        await this.loadModelIntoStudio(initialModel);
    }

    private checkAuthGate(): void {
        const isDev = (import.meta as any).env?.DEV ||
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.protocol === 'file:';

        const authModal = document.getElementById('auth-gate-modal');
        const authKeyInput = document.getElementById('auth-key-input') as HTMLInputElement;
        const authSubmitBtn = document.getElementById('auth-submit-btn');
        const authErrorMsg = document.getElementById('auth-error-msg');

        if (!authModal) return;

        const hasSessionAuth = sessionStorage.getItem('ninja_studio_auth') === 'granted';

        if (isDev || hasSessionAuth) {
            authModal.style.display = 'none';
        } else {
            authModal.style.display = 'flex';
            authSubmitBtn?.addEventListener('click', () => {
                const entered = authKeyInput?.value?.trim();
                // Developer secret passphrase for staging/production review
                if (entered === 'shinobi-dev-2026' || entered === 'ninjafarm') {
                    sessionStorage.setItem('ninja_studio_auth', 'granted');
                    authModal.style.display = 'none';
                } else if (authErrorMsg) {
                    authErrorMsg.style.display = 'block';
                }
            });
        }
    }

    private bindGlobalActions(): void {
        const btnSave = document.getElementById('btn-save-game');
        const btnExport = document.getElementById('btn-export-json');
        const btnImport = document.getElementById('btn-import-json');
        const fileInput = document.getElementById('json-file-input') as HTMLInputElement;
        const btnReset = document.getElementById('btn-reset-defaults');
        const btnPreview = document.getElementById('btn-preview-game');
        const btnClosePreview = document.getElementById('btn-close-preview');
        const previewModal = document.getElementById('game-preview-modal');
        const previewIframe = document.getElementById('game-preview-iframe') as HTMLIFrameElement;

        // Save
        btnSave?.addEventListener('click', () => {
            this.saveCurrentToGame();
            this.showBanner('💾 Saved to Game!');
        });

        // Export JSON
        btnExport?.addEventListener('click', () => {
            const jsonStr = exportVisualConfigJson();
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ninja-farm-visual-config-v${this.config.version}.json`;
            a.click();
            URL.revokeObjectURL(url);
            this.showBanner('📥 Config exported as JSON');
        });

        // Import JSON
        btnImport?.addEventListener('click', () => {
            fileInput?.click();
        });

        fileInput?.addEventListener('change', (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (re) => {
                const text = re.target?.result as string;
                if (text && importVisualConfigJson(text)) {
                    this.config = getVisualConfig();
                    this.syncControlsFromConfig();
                    this.showBanner('📤 Config successfully imported!');
                } else {
                    alert('Failed to parse visual config JSON.');
                }
            };
            reader.readAsText(file);
        });

        // Reset
        btnReset?.addEventListener('click', () => {
            if (confirm('Reset visual settings to default factory values?')) {
                this.config = resetVisualConfig();
                this.syncControlsFromConfig();
                this.showBanner('🔄 Reset to default preset');
            }
        });

        // Preview in Farm
        btnPreview?.addEventListener('click', () => {
            this.saveCurrentToGame();
            if (previewModal && previewIframe) {
                previewIframe.src = './index.html?t=' + Date.now();
                previewModal.classList.add('visible');
            }
        });

        btnClosePreview?.addEventListener('click', () => {
            if (previewModal) {
                previewModal.classList.remove('visible');
                // Re-sync with potential changes
                this.config = getVisualConfig();
                this.app.app.resizeCanvas();
            }
        });
    }

    private bindViewportSwitcher(): void {
        const switcher = document.getElementById('viewport-switcher');
        const frame = document.getElementById('viewport-frame');
        if (!switcher || !frame) return;

        const buttons = switcher.querySelectorAll('.vp-btn');
        buttons.forEach((btn) => {
            btn.addEventListener('click', () => {
                buttons.forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');

                const vp = btn.getAttribute('data-viewport');
                frame.classList.remove('mobile-portrait', 'mobile-landscape');

                if (vp === 'mobile-portrait') {
                    frame.classList.add('mobile-portrait');
                } else if (vp === 'mobile-landscape') {
                    frame.classList.add('mobile-landscape');
                }

                setTimeout(() => {
                    this.app.app.resizeCanvas();
                }, 320);
            });
        });
    }

    private bindCameraGizmo(): void {
        document.getElementById('cam-front')?.addEventListener('click', () => this.app.setCameraView('front'));
        document.getElementById('cam-side')?.addEventListener('click', () => this.app.setCameraView('side'));
        document.getElementById('cam-top')?.addEventListener('click', () => this.app.setCameraView('top'));
        document.getElementById('cam-iso')?.addEventListener('click', () => this.app.setCameraView('iso'));
        document.getElementById('cam-focus')?.addEventListener('click', () => this.app.setCameraView('focus'));

        const btnGrid = document.getElementById('cam-grid');
        btnGrid?.addEventListener('click', () => {
            const next = !this.app.isGridVisible();
            this.app.setGridVisible(next);
            btnGrid.style.color = next ? '#38bdf8' : '#94a3b8';
        });
    }

    private bindInspectorTabs(): void {
        const tabs = document.querySelectorAll('.inspector-tabs .tab-btn');
        const contents = document.querySelectorAll('.tab-content');

        tabs.forEach((tab) => {
            tab.addEventListener('click', () => {
                tabs.forEach((t) => t.classList.remove('active'));
                contents.forEach((c) => c.classList.remove('active'));

                tab.classList.add('active');
                const targetId = tab.getAttribute('data-tab');
                if (targetId) {
                    document.getElementById(targetId)?.classList.add('active');
                }
            });
        });
    }

    private bindTransformControls(): void {
        const scaleSlider = document.getElementById('scale-slider') as HTMLInputElement;
        const scaleInput = document.getElementById('scale-input') as HTMLInputElement;
        const rotYSlider = document.getElementById('rot-y-slider') as HTMLInputElement;
        const rotYInput = document.getElementById('rot-y-input') as HTMLInputElement;
        const posYSlider = document.getElementById('pos-y-slider') as HTMLInputElement;
        const posYInput = document.getElementById('pos-y-input') as HTMLInputElement;
        const walkSpeedSlider = document.getElementById('walk-speed-slider') as HTMLInputElement;
        const walkSpeedInput = document.getElementById('walk-speed-input') as HTMLInputElement;
        const runSpeedSlider = document.getElementById('run-speed-slider') as HTMLInputElement;
        const runSpeedInput = document.getElementById('run-speed-input') as HTMLInputElement;
        const btnAssignNinja = document.getElementById('btn-assign-as-ninja');

        // Scale
        const updateScale = (val: number) => {
            this.config.character.scale = val;
            this.app.setScale(val);
            if (scaleSlider) scaleSlider.value = String(val);
            if (scaleInput) scaleInput.value = String(val);
        };
        scaleSlider?.addEventListener('input', () => updateScale(parseFloat(scaleSlider.value)));
        scaleInput?.addEventListener('change', () => updateScale(parseFloat(scaleInput.value)));

        // Rotation
        const updateRotY = (val: number) => {
            this.config.character.rotationOffsetY = val;
            this.app.setRotationY(val);
            if (rotYSlider) rotYSlider.value = String(val);
            if (rotYInput) rotYInput.value = String(val);
        };
        rotYSlider?.addEventListener('input', () => updateRotY(parseFloat(rotYSlider.value)));
        rotYInput?.addEventListener('change', () => updateRotY(parseFloat(rotYInput.value)));

        // Position Y
        const updatePosY = (val: number) => {
            this.app.setPositionY(val);
            if (posYSlider) posYSlider.value = String(val);
            if (posYInput) posYInput.value = String(val);
        };
        posYSlider?.addEventListener('input', () => updatePosY(parseFloat(posYSlider.value)));
        posYInput?.addEventListener('change', () => updatePosY(parseFloat(posYInput.value)));

        // Speeds
        walkSpeedSlider?.addEventListener('input', () => {
            const v = parseFloat(walkSpeedSlider.value);
            this.config.character.walkAnimSpeed = v;
            if (walkSpeedInput) walkSpeedInput.value = String(v);
        });
        runSpeedSlider?.addEventListener('input', () => {
            const v = parseFloat(runSpeedSlider.value);
            this.config.character.runAnimSpeed = v;
            if (runSpeedInput) runSpeedInput.value = String(v);
        });

        // Assign as Ninja Model
        btnAssignNinja?.addEventListener('click', () => {
            const currentUrl = this.app.getActiveModelUrl();
            if (currentUrl) {
                this.config.character.modelUrl = currentUrl;
                this.saveCurrentToGame();
                this.showBanner('🥷 Active model assigned to Ninja Character!');
            }
        });
    }

    private bindAnimationControls(): void {
        const btnPlayToggle = document.getElementById('anim-play-toggle');
        const clipSelect = document.getElementById('anim-clip-select') as HTMLSelectElement;
        const timeSlider = document.getElementById('anim-time-slider') as HTMLInputElement;
        const timeLabel = document.getElementById('anim-time-label');
        timeSlider?.addEventListener('input', () => {
            if (timeLabel) timeLabel.textContent = `${timeSlider.value}%`;
        });

        const roleIdle = document.getElementById('role-idle-select') as HTMLSelectElement;
        const roleWalk = document.getElementById('role-walk-select') as HTMLSelectElement;
        const roleRun = document.getElementById('role-run-select') as HTMLSelectElement;

        const testIdle = document.getElementById('test-idle-btn');
        const testWalk = document.getElementById('test-walk-btn');
        const testRun = document.getElementById('test-run-btn');

        btnPlayToggle?.addEventListener('click', () => {
            const isPlaying = this.app.togglePlayPause();
            if (btnPlayToggle) btnPlayToggle.textContent = isPlaying ? '⏸' : '▶';
        });

        clipSelect?.addEventListener('change', () => {
            const clip = clipSelect.value;
            if (clip) {
                this.app.playAnimation(clip);
                if (btnPlayToggle) btnPlayToggle.textContent = '⏸';
            }
        });

        // Speed buttons
        document.getElementById('anim-speed-down')?.addEventListener('click', () => this.app.setAnimSpeed(0.5));
        document.getElementById('anim-speed-normal')?.addEventListener('click', () => this.app.setAnimSpeed(1.0));
        document.getElementById('anim-speed-up')?.addEventListener('click', () => this.app.setAnimSpeed(1.5));

        // Role selectors
        roleIdle?.addEventListener('change', () => {
            this.config.character.animations.idle = roleIdle.value;
        });
        roleWalk?.addEventListener('change', () => {
            this.config.character.animations.walk = roleWalk.value;
        });
        roleRun?.addEventListener('change', () => {
            this.config.character.animations.run = roleRun.value;
        });

        // Transition testing
        testIdle?.addEventListener('click', () => {
            const clip = this.config.character.animations.idle;
            if (clip) this.app.transitionAnimation(clip, 0.25);
        });
        testWalk?.addEventListener('click', () => {
            const clip = this.config.character.animations.walk;
            if (clip) this.app.transitionAnimation(clip, 0.18);
        });
        testRun?.addEventListener('click', () => {
            const clip = this.config.character.animations.run;
            if (clip) this.app.transitionAnimation(clip, 0.15);
        });
    }

    private bindMaterialControls(): void {
        const colorMain = document.getElementById('color-main-input') as HTMLInputElement;
        const colorJoints = document.getElementById('color-joints-input') as HTMLInputElement;
        const hexMain = document.getElementById('color-main-hex');
        const hexJoints = document.getElementById('color-joints-hex');

        const updateColors = () => {
            const main = colorMain?.value || '#1e2029';
            const joints = colorJoints?.value || '#dc2626';
            this.config.character.tintMain = main;
            this.config.character.tintJoints = joints;
            if (hexMain) hexMain.textContent = main;
            if (hexJoints) hexJoints.textContent = joints;
            this.app.setMaterialTints(main, joints);
        };

        colorMain?.addEventListener('input', updateColors);
        colorJoints?.addEventListener('input', updateColors);

        // Preset palettes
        document.querySelectorAll('[data-palette]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const pal = btn.getAttribute('data-palette');
                if (pal === 'tactical') {
                    if (colorMain) colorMain.value = '#1e2029';
                    if (colorJoints) colorJoints.value = '#dc2626';
                } else if (pal === 'crimson') {
                    if (colorMain) colorMain.value = '#881337';
                    if (colorJoints) colorJoints.value = '#fb7185';
                } else if (pal === 'shinobi') {
                    if (colorMain) colorMain.value = '#0f172a';
                    if (colorJoints) colorJoints.value = '#38bdf8';
                } else if (pal === 'golden') {
                    if (colorMain) colorMain.value = '#78350f';
                    if (colorJoints) colorJoints.value = '#f59e0b';
                }
                updateColors();
            });
        });
    }

    private bindEnvironmentControls(): void {
        const sunIntensity = document.getElementById('sun-intensity-slider') as HTMLInputElement;
        const sunIntensityInput = document.getElementById('sun-intensity-input') as HTMLInputElement;
        const sunColor = document.getElementById('sun-color-input') as HTMLInputElement;
        const skyColor = document.getElementById('sky-color-input') as HTMLInputElement;
        const camDist = document.getElementById('cam-explore-dist-slider') as HTMLInputElement;
        const camPitch = document.getElementById('cam-explore-pitch-slider') as HTMLInputElement;

        sunIntensity?.addEventListener('input', () => {
            const val = parseFloat(sunIntensity.value);
            this.config.lighting.sunIntensity = val;
            if (sunIntensityInput) sunIntensityInput.value = String(val);
            this.app.setSunIntensity(val);
        });

        sunColor?.addEventListener('input', () => {
            this.config.lighting.sunColor = sunColor.value;
            this.app.setSunColor(sunColor.value);
        });

        skyColor?.addEventListener('input', () => {
            this.config.lighting.ambientDayColor = skyColor.value;
            this.app.setAmbientColor(skyColor.value);
        });

        camDist?.addEventListener('input', () => {
            this.config.camera.exploreDistance = parseFloat(camDist.value);
        });

        camPitch?.addEventListener('input', () => {
            this.config.camera.explorePitch = parseFloat(camPitch.value);
        });
    }

    private async loadCatalog(): Promise<void> {
        try {
            const resp = await fetch('assets/manifest.json');
            const data = await resp.json();
            this.manifestAssets = data.assets || [];

            const countBadge = document.getElementById('asset-count-badge');
            if (countBadge) countBadge.textContent = `${this.manifestAssets.length} Assets`;

            this.bindCatalogFilters();
            this.renderCatalog();
        } catch (err) {
            console.error('[StudioUI] Failed to load manifest:', err);
        }
    }

    private bindCatalogFilters(): void {
        const searchInput = document.getElementById('catalog-search-input') as HTMLInputElement;
        const pills = document.querySelectorAll('#category-pills .category-pill');

        searchInput?.addEventListener('input', () => {
            this.searchQuery = searchInput.value.toLowerCase().trim();
            this.renderCatalog();
        });

        pills.forEach((pill) => {
            pill.addEventListener('click', () => {
                pills.forEach((p) => p.classList.remove('active'));
                pill.classList.add('active');
                this.activeCategory = pill.getAttribute('data-category') || 'all';
                this.renderCatalog();
            });
        });
    }

    private renderCatalog(): void {
        const container = document.getElementById('asset-list-container');
        if (!container) return;
        container.innerHTML = '';

        const filtered = this.manifestAssets.filter((asset) => {
            const matchesCat = this.activeCategory === 'all' || asset.category === this.activeCategory;
            const matchesSearch = !this.searchQuery ||
                asset.assetId.toLowerCase().includes(this.searchQuery) ||
                asset.runtimePath.toLowerCase().includes(this.searchQuery);
            return matchesCat && matchesSearch;
        });

        for (const asset of filtered) {
            const card = document.createElement('div');
            card.className = `asset-card ${asset.assetId === this.activeAssetId ? 'active' : ''}`;

            const sizeKb = asset.fileBytesMeasured ? `${Math.round(asset.fileBytesMeasured / 1024)} KB` : '';
            const animsCount = asset.animations?.length || 0;

            card.innerHTML = `
                <div class="card-top">
                    <span class="card-title">${asset.runtimePath.split('/').pop()?.replace('.glb', '')}</span>
                    <span class="card-badge">${asset.category}</span>
                </div>
                <div class="card-meta">
                    <span>${sizeKb}</span>
                    ${animsCount > 0 ? `<span>🎬 ${animsCount} anims</span>` : ''}
                    <span>${asset.creator}</span>
                </div>
            `;

            card.addEventListener('click', () => {
                this.activeAssetId = asset.assetId;
                this.renderCatalog();
                this.loadModelIntoStudio(asset.runtimePath);
            });

            container.appendChild(card);
        }
    }

    private async loadModelIntoStudio(url: string): Promise<void> {
        try {
            await this.app.loadModel(url);
            const targetName = document.getElementById('target-model-name');
            const targetPath = document.getElementById('target-model-path');

            if (targetName) targetName.textContent = url.split('/').pop() || 'Model';
            if (targetPath) targetPath.textContent = url;

            // Apply scale if character
            const isCharacter = url.includes('character');
            const currentScale = isCharacter ? (this.config.character.scale || 1.0) : 1.0;
            this.app.setScale(currentScale);
            this.app.setMaterialTints(this.config.character.tintMain, this.config.character.tintJoints);

            const scaleSlider = document.getElementById('scale-slider') as HTMLInputElement;
            const scaleInput = document.getElementById('scale-input') as HTMLInputElement;
            if (scaleSlider) scaleSlider.value = String(currentScale);
            if (scaleInput) scaleInput.value = String(currentScale);
        } catch (err) {
            console.error('[StudioUI] Failed to load into studio:', err);
        }
    }

    private updateAnimationClips(clips: string[], activeClip: string): void {
        const clipSelect = document.getElementById('anim-clip-select') as HTMLSelectElement;
        const roleIdle = document.getElementById('role-idle-select') as HTMLSelectElement;
        const roleWalk = document.getElementById('role-walk-select') as HTMLSelectElement;
        const roleRun = document.getElementById('role-run-select') as HTMLSelectElement;
        const allClipsList = document.getElementById('all-clips-list');

        if (clipSelect) {
            clipSelect.innerHTML = '';
            for (const clip of clips) {
                const opt = document.createElement('option');
                opt.value = clip;
                opt.textContent = clip;
                if (clip === activeClip) opt.selected = true;
                clipSelect.appendChild(opt);
            }
        }

        const populateRole = (sel: HTMLSelectElement | null, currentVal: string) => {
            if (!sel) return;
            sel.innerHTML = '';
            for (const clip of clips) {
                const opt = document.createElement('option');
                opt.value = clip;
                opt.textContent = clip;
                if (clip === currentVal || clip.toLowerCase().includes(currentVal.toLowerCase())) {
                    opt.selected = true;
                }
                sel.appendChild(opt);
            }
        };

        populateRole(roleIdle, this.config.character.animations.idle);
        populateRole(roleWalk, this.config.character.animations.walk);
        populateRole(roleRun, this.config.character.animations.run);

        if (allClipsList) {
            allClipsList.innerHTML = '';
            for (const clip of clips) {
                const row = document.createElement('div');
                row.style.display = 'flex';
                row.style.alignItems = 'center';
                row.style.justifyContent = 'space-between';
                row.style.padding = '4px 6px';
                row.style.background = 'var(--bg-darkest)';
                row.style.borderRadius = '4px';
                row.style.fontSize = '11px';

                row.innerHTML = `
                    <span style="font-family: var(--font-mono); color: #ffffff;">${clip}</span>
                    <button class="studio-btn" style="padding: 2px 6px; font-size: 10px;">▶ Play</button>
                `;

                row.querySelector('button')?.addEventListener('click', () => {
                    this.app.playAnimation(clip);
                    if (clipSelect) clipSelect.value = clip;
                });

                allClipsList.appendChild(row);
            }
        }
    }

    private updateStatsDisplay(stats: StudioModelStats, fps: number, drawCalls: number): void {
        const statFps = document.getElementById('stat-fps');
        const statTriangles = document.getElementById('stat-triangles');
        const statDrawCalls = document.getElementById('stat-drawcalls');

        const diagSize = document.getElementById('diag-file-size');
        const diagDims = document.getElementById('diag-dimensions');
        const diagMeshes = document.getElementById('diag-meshes');
        const diagJoints = document.getElementById('diag-joints');
        const diagAnims = document.getElementById('diag-anims');

        if (statFps) statFps.textContent = String(fps);
        if (statTriangles) statTriangles.textContent = stats.triangles.toLocaleString();
        if (statDrawCalls) statDrawCalls.textContent = String(drawCalls);

        if (diagSize) {
            const asset = this.manifestAssets.find((a) => a.runtimePath === this.app.getActiveModelUrl());
            diagSize.textContent = asset?.fileBytesMeasured ? `${Math.round(asset.fileBytesMeasured / 1024)} KB` : 'Dynamic GLB';
        }
        if (diagDims) diagDims.textContent = `${stats.boundingBox.width}m × ${stats.boundingBox.height}m × ${stats.boundingBox.depth}m`;
        if (diagMeshes) diagMeshes.textContent = String(stats.meshes);
        if (diagJoints) diagJoints.textContent = String(stats.joints);
        if (diagAnims) diagAnims.textContent = String(stats.animations.length);
    }

    private syncControlsFromConfig(): void {
        const c = this.config;
        const scaleSlider = document.getElementById('scale-slider') as HTMLInputElement;
        const scaleInput = document.getElementById('scale-input') as HTMLInputElement;
        const rotYSlider = document.getElementById('rot-y-slider') as HTMLInputElement;
        const walkSpeed = document.getElementById('walk-speed-slider') as HTMLInputElement;
        const runSpeed = document.getElementById('run-speed-slider') as HTMLInputElement;
        const colorMain = document.getElementById('color-main-input') as HTMLInputElement;
        const colorJoints = document.getElementById('color-joints-input') as HTMLInputElement;
        const sunIntensity = document.getElementById('sun-intensity-slider') as HTMLInputElement;

        if (scaleSlider) scaleSlider.value = String(c.character.scale);
        if (scaleInput) scaleInput.value = String(c.character.scale);
        if (rotYSlider) rotYSlider.value = String(c.character.rotationOffsetY);
        if (walkSpeed) walkSpeed.value = String(c.character.walkAnimSpeed);
        if (runSpeed) runSpeed.value = String(c.character.runAnimSpeed);
        if (colorMain) colorMain.value = c.character.tintMain;
        if (colorJoints) colorJoints.value = c.character.tintJoints;
        if (sunIntensity) sunIntensity.value = String(c.lighting.sunIntensity);

        this.app.setScale(c.character.scale);
        this.app.setRotationY(c.character.rotationOffsetY);
        this.app.setMaterialTints(c.character.tintMain, c.character.tintJoints);
        this.app.setSunIntensity(c.lighting.sunIntensity);
    }

    private saveCurrentToGame(): void {
        saveVisualConfig(this.config);
    }

    private showBanner(msg: string): void {
        const banner = document.getElementById('studio-banner');
        if (!banner) return;
        banner.textContent = msg;
        banner.classList.add('visible');
        setTimeout(() => {
            banner.classList.remove('visible');
        }, 2400);
    }
}
