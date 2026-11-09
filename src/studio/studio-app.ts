import type { BoundingBox } from 'playcanvas';
import {
    AnimComponentSystem,
    AppBase,
    AppOptions,
    CameraComponentSystem,
    Color,
    ContainerHandler,
    Entity,
    FILLMODE_FILL_WINDOW,
    LightComponentSystem,
    RESOLUTION_AUTO,
    RenderComponentSystem,
    StandardMaterial,
    TextureHandler,
    Vec3,
    createGraphicsDevice
} from 'playcanvas';

import { GlbAssetLoader } from '../rendering/asset-loader';
import type { LoadedGLB } from '../rendering/asset-loader';

export interface StudioModelStats {
    triangles: number;
    vertices: number;
    meshes: number;
    joints: number;
    boundingBox: { width: number; height: number; depth: number };
    animations: string[];
}

export class StudioApp {
    readonly app: AppBase;
    readonly assetLoader: GlbAssetLoader;

    // Entities
    private cameraEntity!: Entity;
    private sunLightEntity!: Entity;
    private ambientLightEntity!: Entity;
    private gridEntity!: Entity;
    private modelContainer!: Entity;
    private activeModelRoot: Entity | null = null;
    private activeGlb: LoadedGLB | null = null;
    private currentModelUrl = '';

    // Orbit Camera State
    private camTarget = new Vec3(0, 0.9, 0);
    private camYaw = 45;
    private camPitch = 25;
    private camDistance = 4.0;
    private isOrbiting = false;
    private isPanning = false;
    private lastPointerPos = { x: 0, y: 0 };

    // Material overrides
    private customMainMat: StandardMaterial | null = null;
    private customJointsMat: StandardMaterial | null = null;

    // Performance & Stats
    private fps = 60;
    private frameCount = 0;
    private lastFpsTime = performance.now();
    private drawCalls = 0;
    private currentStats: StudioModelStats = {
        triangles: 0,
        vertices: 0,
        meshes: 0,
        joints: 0,
        boundingBox: { width: 0, height: 0, depth: 0 },
        animations: []
    };

    // Callbacks
    private onStatsUpdated?: (stats: StudioModelStats, fps: number, drawCalls: number) => void;
    private onAnimClipChanged?: (clips: string[], activeClip: string) => void;

    private isAnimPlaying = true;
    private currentAnimClip = '';
    private animSpeed = 1.0;

    constructor() {
        this.app = null as any;
        this.assetLoader = null as any;
    }

    static async create(canvas: HTMLCanvasElement): Promise<StudioApp> {
        const studio = new StudioApp();
        await studio.initAsync(canvas);
        return studio;
    }

    private async initAsync(canvas: HTMLCanvasElement): Promise<void> {
        const device = await createGraphicsDevice(canvas);
        device.maxPixelRatio = Math.min(window.devicePixelRatio, 2);

        const options = new AppOptions();
        options.graphicsDevice = device;
        options.componentSystems = [
            RenderComponentSystem,
            LightComponentSystem,
            CameraComponentSystem,
            AnimComponentSystem
        ];
        options.resourceHandlers = [ContainerHandler, TextureHandler];

        (this as any).app = new AppBase(canvas);
        this.app.init(options);
        this.app.setCanvasFillMode(FILLMODE_FILL_WINDOW);
        this.app.setCanvasResolution(RESOLUTION_AUTO);
        (this as any).assetLoader = new GlbAssetLoader(this.app);

        this.setupScene();
        this.setupOrbitControls(canvas);
        this.app.start();

        // Main Studio Update Loop
        this.app.on('update', () => {
            this.updateStats();
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.app.resizeCanvas();
        });
    }

    private setupScene(): void {
        // Camera Entity
        this.cameraEntity = new Entity('studio_camera');
        this.cameraEntity.addComponent('camera', {
            clearColor: new Color(0.04, 0.06, 0.09),
            fov: 48,
            nearClip: 0.1,
            farClip: 200
        });
        this.app.root.addChild(this.cameraEntity);
        this.updateCameraTransform();

        // Sun Directional Light
        this.sunLightEntity = new Entity('studio_sun');
        this.sunLightEntity.addComponent('light', {
            type: 'directional',
            color: new Color(1.0, 0.95, 0.88),
            intensity: 1.45,
            castShadows: true,
            shadowDistance: 25,
            shadowResolution: 2048,
            shadowBias: 0.05,
            normalOffsetBias: 0.1
        });
        this.sunLightEntity.setEulerAngles(45, 35, 0);
        this.app.root.addChild(this.sunLightEntity);

        // Ambient Fill Light
        this.ambientLightEntity = new Entity('studio_ambient');
        this.ambientLightEntity.addComponent('light', {
            type: 'directional',
            color: new Color(0.35, 0.44, 0.58),
            intensity: 0.55,
            castShadows: false
        });
        this.ambientLightEntity.setEulerAngles(-60, 215, 0);
        this.app.root.addChild(this.ambientLightEntity);

        // Ground Grid Helper
        this.createGroundGrid();

        // Model Container
        this.modelContainer = new Entity('studio_model_container');
        this.app.root.addChild(this.modelContainer);
    }

    private createGroundGrid(): void {
        this.gridEntity = new Entity('studio_grid_root');
        this.app.root.addChild(this.gridEntity);

        // Ground circular disc / plane
        const ground = new Entity('studio_ground_plane');
        ground.addComponent('render', { type: 'cylinder' });
        ground.setLocalScale(16, 0.02, 16);
        ground.setLocalPosition(0, -0.01, 0);

        const groundMat = new StandardMaterial();
        groundMat.diffuse = new Color(0.06, 0.08, 0.12);
        groundMat.gloss = 0.2;
        groundMat.useMetalness = true;
        groundMat.metalness = 0.05;
        groundMat.update();
        if (ground.render) ground.render.material = groundMat;
        this.gridEntity.addChild(ground);

        // Subtle guide rings and axes
        const ring = new Entity('guide_ring');
        ring.addComponent('render', { type: 'torus' });
        ring.setLocalScale(4, 0.02, 4);
        ring.setLocalPosition(0, 0.005, 0);
        const ringMat = new StandardMaterial();
        ringMat.diffuse = new Color(0.18, 0.25, 0.38);
        ringMat.emissive = new Color(0.1, 0.15, 0.25);
        ringMat.update();
        if (ring.render) ring.render.material = ringMat;
        this.gridEntity.addChild(ring);
    }

    setGridVisible(visible: boolean): void {
        this.gridEntity.enabled = visible;
    }

    isGridVisible(): boolean {
        return this.gridEntity.enabled;
    }

    private setupOrbitControls(canvas: HTMLCanvasElement): void {
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        canvas.addEventListener('pointerdown', (e: PointerEvent) => {
            canvas.setPointerCapture(e.pointerId);
            this.lastPointerPos = { x: e.clientX, y: e.clientY };

            if (e.button === 2 || e.shiftKey) {
                this.isPanning = true;
            } else if (e.button === 0) {
                this.isOrbiting = true;
            }
        });

        canvas.addEventListener('pointermove', (e: PointerEvent) => {
            const dx = e.clientX - this.lastPointerPos.x;
            const dy = e.clientY - this.lastPointerPos.y;
            this.lastPointerPos = { x: e.clientX, y: e.clientY };

            if (this.isOrbiting) {
                this.camYaw -= dx * 0.45;
                this.camPitch = Math.max(-85, Math.min(85, this.camPitch + dy * 0.35));
                this.updateCameraTransform();
            } else if (this.isPanning) {
                // Pan parallel to camera right and up vectors
                const panSpeed = 0.003 * this.camDistance;
                const right = this.cameraEntity.right;
                const up = this.cameraEntity.up;

                this.camTarget.x -= right.x * dx * panSpeed - up.x * dy * panSpeed;
                this.camTarget.y -= right.y * dx * panSpeed - up.y * dy * panSpeed;
                this.camTarget.z -= right.z * dx * panSpeed - up.z * dy * panSpeed;
                this.updateCameraTransform();
            }
        });

        const onPointerUp = (e: PointerEvent) => {
            try {
                canvas.releasePointerCapture(e.pointerId);
            } catch {
                /* pointer capture release may fail if pointer was not captured */
            }
            this.isOrbiting = false;
            this.isPanning = false;
        };

        canvas.addEventListener('pointerup', onPointerUp);
        canvas.addEventListener('pointercancel', onPointerUp);

        // Zoom with wheel
        canvas.addEventListener(
            'wheel',
            (e: WheelEvent) => {
                e.preventDefault();
                const zoomFactor = e.deltaY > 0 ? 1.12 : 0.88;
                this.camDistance = Math.max(0.4, Math.min(60, this.camDistance * zoomFactor));
                this.updateCameraTransform();
            },
            { passive: false }
        );
    }

    private updateCameraTransform(): void {
        const radYaw = (this.camYaw * Math.PI) / 180;
        const radPitch = (this.camPitch * Math.PI) / 180;

        const cosPitch = Math.cos(radPitch);
        const sinPitch = Math.sin(radPitch);
        const sinYaw = Math.sin(radYaw);
        const cosYaw = Math.cos(radYaw);

        const offsetX = this.camDistance * cosPitch * sinYaw;
        const offsetY = this.camDistance * sinPitch;
        const offsetZ = this.camDistance * cosPitch * cosYaw;

        const posX = this.camTarget.x + offsetX;
        const posY = this.camTarget.y + offsetY;
        const posZ = this.camTarget.z + offsetZ;

        this.cameraEntity.setPosition(posX, posY, posZ);
        this.cameraEntity.lookAt(this.camTarget.x, this.camTarget.y, this.camTarget.z);
    }

    // Camera Presets
    setCameraView(type: 'front' | 'side' | 'top' | 'iso' | 'focus'): void {
        switch (type) {
            case 'front':
                this.camYaw = 0;
                this.camPitch = 5;
                break;
            case 'side':
                this.camYaw = 90;
                this.camPitch = 5;
                break;
            case 'top':
                this.camYaw = 0;
                this.camPitch = 88;
                break;
            case 'iso':
                this.camYaw = 45;
                this.camPitch = 30;
                break;
            case 'focus':
                this.focusOnModel();
                return;
        }
        this.updateCameraTransform();
    }

    focusOnModel(): void {
        if (!this.activeModelRoot) return;
        const { height, width, depth } = this.currentStats.boundingBox;
        const maxDim = Math.max(height, width, depth, 0.5);
        this.camTarget.set(0, height * 0.5, 0);
        this.camDistance = maxDim * 2.2;
        this.updateCameraTransform();
    }

    /**
     * Loads a 3D model GLB into the Studio Viewport.
     */
    async loadModel(url: string, assetName?: string): Promise<StudioModelStats> {
        this.currentModelUrl = url;
        try {
            const glb = await this.assetLoader.load(url, assetName);
            this.activeGlb = glb;

            if (this.activeModelRoot) {
                this.modelContainer.removeChild(this.activeModelRoot);
                this.activeModelRoot.destroy();
                this.activeModelRoot = null;
            }

            const modelEntity = glb.instantiate();
            modelEntity.name = 'studio_active_mesh';
            modelEntity.addComponent('anim', {
                activate: true,
                speed: this.animSpeed
            });

            this.modelContainer.addChild(modelEntity);
            this.activeModelRoot = modelEntity;

            // Extract all animation clip names
            const animAssets = (glb.resource.animations || []) as any[];
            const clipNames: string[] = [];
            for (const a of animAssets) {
                if (a.name) {
                    clipNames.push(a.name);
                    // Register clip into PlayCanvas anim component
                    if (a.resource) {
                        modelEntity.anim?.assignAnimation(a.name, a.resource, undefined, 1.0, true);
                    }
                }
            }

            // Play first animation if available
            if (clipNames.length > 0) {
                this.currentAnimClip = clipNames[0];
                modelEntity.anim?.baseLayer?.play(this.currentAnimClip);
            }

            // Compute geometric stats (triangles, vertices, bounding box)
            const stats = this.computeModelStats(modelEntity, clipNames);
            this.currentStats = stats;

            // Auto-focus camera on new model
            this.focusOnModel();

            // Notify UI
            if (this.onAnimClipChanged) {
                this.onAnimClipChanged(clipNames, this.currentAnimClip);
            }

            return stats;
        } catch (err) {
            console.error('[StudioApp] Error loading model:', err);
            throw err;
        }
    }

    private computeModelStats(root: Entity, animClips: string[]): StudioModelStats {
        let totalTriangles = 0;
        let totalVertices = 0;
        let meshCount = 0;
        let jointCount = 0;

        const min = new Vec3(Infinity, Infinity, Infinity);
        const max = new Vec3(-Infinity, -Infinity, -Infinity);

        const renders = root.findComponents('render');
        for (const r of renders) {
            const meshInstances = (r as any).meshInstances || [];
            meshCount += meshInstances.length;

            for (const mi of meshInstances) {
                const mesh = mi.mesh;
                if (mesh) {
                    const vb = mesh.vertexBuffer;
                    if (vb) {
                        totalVertices += vb.numVertices || 0;
                    }
                    const ib = mesh.indexBuffer[0];
                    if (ib) {
                        totalTriangles += (ib.numIndices || 0) / 3;
                    } else if (mesh.primitive && mesh.primitive[0]) {
                        totalTriangles += Math.floor((mesh.primitive[0].count || 0) / 3);
                    }
                }
                const aabb = mi.aabb as BoundingBox;
                if (aabb) {
                    const aMin = aabb.getMin();
                    const aMax = aabb.getMax();
                    min.min(aMin);
                    max.max(aMax);
                }
            }
        }

        // Skeletal joints (entities with names like Bone, Armature, Hips)
        const allChildren = root.find(() => true);
        for (const child of allChildren) {
            const n = child.name.toLowerCase();
            if (n.includes('bone') || n.includes('joint') || n.includes('hips') || n.includes('armature')) {
                jointCount++;
            }
        }

        const width = isFinite(max.x - min.x) ? Math.max(0, max.x - min.x) : 1;
        const height = isFinite(max.y - min.y) ? Math.max(0, max.y - min.y) : 1;
        const depth = isFinite(max.z - min.z) ? Math.max(0, max.z - min.z) : 1;

        return {
            triangles: Math.round(totalTriangles),
            vertices: Math.round(totalVertices),
            meshes: meshCount,
            joints: jointCount,
            boundingBox: {
                width: Number(width.toFixed(2)),
                height: Number(height.toFixed(2)),
                depth: Number(depth.toFixed(2))
            },
            animations: animClips
        };
    }

    // Transformations
    setScale(scale: number): void {
        if (!this.activeModelRoot) return;
        this.activeModelRoot.setLocalScale(scale, scale, scale);
    }

    setRotationY(degrees: number): void {
        if (!this.activeModelRoot) return;
        const current = this.activeModelRoot.getLocalEulerAngles();
        this.activeModelRoot.setLocalEulerAngles(current.x, degrees, current.z);
    }

    setPositionY(offsetY: number): void {
        if (!this.activeModelRoot) return;
        const current = this.activeModelRoot.getLocalPosition();
        this.activeModelRoot.setLocalPosition(current.x, offsetY, current.z);
    }

    // Animation Controls
    playAnimation(clipName: string): void {
        if (!this.activeModelRoot?.anim?.baseLayer) return;
        this.currentAnimClip = clipName;
        this.activeModelRoot.anim.baseLayer.play(clipName);
        this.isAnimPlaying = true;
    }

    transitionAnimation(clipName: string, duration = 0.25): void {
        if (!this.activeModelRoot?.anim?.baseLayer) return;
        this.currentAnimClip = clipName;
        this.activeModelRoot.anim.baseLayer.transition(clipName, duration);
        this.isAnimPlaying = true;
    }

    togglePlayPause(): boolean {
        if (!this.activeModelRoot?.anim?.baseLayer) return false;
        if (this.isAnimPlaying) {
            this.activeModelRoot.anim.baseLayer.pause();
            this.isAnimPlaying = false;
        } else {
            if (this.currentAnimClip) {
                this.activeModelRoot.anim.baseLayer.play(this.currentAnimClip);
            }
            this.isAnimPlaying = true;
        }
        return this.isAnimPlaying;
    }

    setAnimSpeed(speed: number): void {
        this.animSpeed = speed;
        if (this.activeModelRoot?.anim) {
            this.activeModelRoot.anim.speed = speed;
        }
    }

    // Material & Color Tuning
    setMaterialTints(tintMainHex: string, tintJointsHex: string): void {
        if (!this.activeModelRoot) return;

        const mainColor = this.hexToColor(tintMainHex);
        const jointsColor = this.hexToColor(tintJointsHex);

        if (!this.customMainMat) {
            this.customMainMat = new StandardMaterial();
            this.customMainMat.gloss = 0.35;
            this.customMainMat.useMetalness = true;
            this.customMainMat.metalness = 0.1;
        }
        this.customMainMat.diffuse = mainColor;
        this.customMainMat.update();

        if (!this.customJointsMat) {
            this.customJointsMat = new StandardMaterial();
            this.customJointsMat.gloss = 0.5;
            this.customJointsMat.useMetalness = true;
            this.customJointsMat.metalness = 0.2;
        }
        this.customJointsMat.diffuse = jointsColor;
        this.customJointsMat.update();

        const renders = this.activeModelRoot.findComponents('render');
        for (const r of renders) {
            const meshInstances = (r as any).meshInstances || [];
            for (const mi of meshInstances) {
                const name = mi.material?.name?.toLowerCase() || '';
                if (name.includes('main')) {
                    mi.material = this.customMainMat;
                } else if (name.includes('joint') || name.includes('accent')) {
                    mi.material = this.customJointsMat;
                }
            }
        }
    }

    // Environment & Sun
    setSunIntensity(intensity: number): void {
        if (this.sunLightEntity.light) {
            this.sunLightEntity.light.intensity = intensity;
        }
    }

    setSunColor(hex: string): void {
        if (this.sunLightEntity.light) {
            this.sunLightEntity.light.color = this.hexToColor(hex);
        }
    }

    setAmbientColor(hex: string): void {
        if (this.ambientLightEntity.light) {
            this.ambientLightEntity.light.color = this.hexToColor(hex);
        }
    }

    private hexToColor(hex: string): Color {
        const cleaned = hex.replace('#', '');
        if (cleaned.length === 6) {
            const r = parseInt(cleaned.slice(0, 2), 16) / 255;
            const g = parseInt(cleaned.slice(2, 4), 16) / 255;
            const b = parseInt(cleaned.slice(4, 6), 16) / 255;
            return new Color(r, g, b);
        }
        return new Color(1, 1, 1);
    }

    private updateStats(): void {
        this.frameCount++;
        const now = performance.now();
        if (now - this.lastFpsTime >= 500) {
            this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsTime));
            this.frameCount = 0;
            this.lastFpsTime = now;

            // Measure draw calls if available in graphicsDevice stats
            const devStats = (this.app.graphicsDevice as any)._drawCallsPerFrame || 0;
            this.drawCalls = devStats || this.currentStats.meshes || 12;

            if (this.onStatsUpdated) {
                this.onStatsUpdated(this.currentStats, this.fps, this.drawCalls);
            }
        }
    }

    onStats(cb: (stats: StudioModelStats, fps: number, drawCalls: number) => void): void {
        this.onStatsUpdated = cb;
    }

    onAnimClips(cb: (clips: string[], activeClip: string) => void): void {
        this.onAnimClipChanged = cb;
    }

    getActiveModelUrl(): string {
        return this.currentModelUrl;
    }

    getActiveGlb(): LoadedGLB | null {
        return this.activeGlb;
    }

    getStats(): StudioModelStats {
        return this.currentStats;
    }
}
