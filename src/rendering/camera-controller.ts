import { Entity, Vec3 } from 'playcanvas';

export type CameraMode = 'explore' | 'build' | 'overview';

export class CameraController {
    readonly entity: Entity;
    private mode: CameraMode = 'explore';

    // Parâmetros de órbita e posição
    private yaw: number = 45; // graus
    private pitch: number = 38; // graus
    private distance: number = 18; // metros
    private targetPos = new Vec3(0, 0, 0);
    private currentPos = new Vec3(0, 15, 20);

    // Limites de controle
    private minDistance = 6;
    private maxDistance = 75;
    private minPitch = 15;
    private maxPitch = 70;

    constructor() {
        this.entity = new Entity('main_camera');
        this.entity.addComponent('camera', {
            fov: 52,
            nearClip: 0.5,
            farClip: 350
        });

        this.updatePosition(1.0);
    }

    setMode(newMode: CameraMode): void {
        this.mode = newMode;
        if (newMode === 'overview') {
            this.distance = 55;
            this.pitch = 50;
            this.targetPos.set(0, 0, 0);
        } else if (newMode === 'build') {
            this.distance = 28;
            this.pitch = 45;
        } else if (newMode === 'explore') {
            this.distance = 14;
            this.pitch = 30;
        }
    }

    getMode(): CameraMode {
        return this.mode;
    }

    setTarget(x: number, y: number, z: number): void {
        this.targetPos.set(x, y, z);
    }

    orbit(deltaYaw: number, deltaPitch: number): void {
        this.yaw = (this.yaw + deltaYaw) % 360;
        this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch + deltaPitch));
    }

    pan(deltaX: number, deltaZ: number): void {
        // Converte o pan relativo ao ângulo yaw da câmera
        const rad = (this.yaw * Math.PI) / 180;
        const forwardX = -Math.sin(rad);
        const forwardZ = -Math.cos(rad);
        const rightX = Math.cos(rad);
        const rightZ = -Math.sin(rad);

        this.targetPos.x += rightX * deltaX + forwardX * deltaZ;
        this.targetPos.z += rightZ * deltaX + forwardZ * deltaZ;
    }

    zoom(delta: number): void {
        this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance + delta));
    }

    // Adaptação suave ao aspect ratio (Portrait vs Landscape)
    adaptToViewport(width: number, height: number): void {
        const aspect = width / height;
        if (!this.entity.camera) return;

        if (aspect < 1.0) {
            // Modo Retrato (Mobile portrait)
            // Aumenta o FOV e a distância para enquadrar confortavelmente sem deformar
            this.entity.camera.fov = 64;
            this.minDistance = 10;
        } else {
            // Modo Paisagem (Desktop ou Mobile landscape)
            this.entity.camera.fov = 50;
            this.minDistance = 6;
        }
    }

    update(dt: number, followTarget?: Vec3): void {
        if (this.mode === 'explore' && followTarget) {
            // Suaviza o acompanhamento do ninja
            this.targetPos.lerp(this.targetPos, followTarget, Math.min(1.0, dt * 8.0));
        }

        this.updatePosition(dt);
    }

    private updatePosition(dt: number): void {
        const yawRad = (this.yaw * Math.PI) / 180;
        const pitchRad = (this.pitch * Math.PI) / 180;

        const offsetX = this.distance * Math.sin(yawRad) * Math.cos(pitchRad);
        const offsetY = this.distance * Math.sin(pitchRad);
        const offsetZ = this.distance * Math.cos(yawRad) * Math.cos(pitchRad);

        const desiredPos = new Vec3(
            this.targetPos.x + offsetX,
            this.targetPos.y + offsetY,
            this.targetPos.z + offsetZ
        );

        this.currentPos.lerp(this.currentPos, desiredPos, Math.min(1.0, dt * 10.0));
        this.entity.setPosition(this.currentPos);
        this.entity.lookAt(this.targetPos);
    }
}

