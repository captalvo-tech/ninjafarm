/**
 * ============================================================================
 * NINJA FARM — CONTRATO OBRIGATÓRIO DO ROADMAP
 * ============================================================================
 * Módulo de Calibração Anatômica e Normalização Métrica da Fauna 3D
 *
 * Padrão Obrigatório do Mundo:
 * 1 unidade PlayCanvas = 1 metro do mundo real.
 * Grade da Fazenda = células de 2 metros (64x36 = 128m x 72m).
 *
 * Dimensões de Referência:
 * - Ninja Humano: ~1.83 m altura (character.glb scale 1.0)
 * - Droid Humanoide: ~1.85 m altura
 * - Vaca Adulta: ~1.45 m na cernelha (Cow.glb scale ~0.316)
 * - Touro Adulto: ~1.60 m na cernelha (Bull.glb scale ~0.349)
 * - Cavalo: ~1.60 m na cernelha (Horse.glb scale ~0.332)
 * - Burro: ~1.30 m na cernelha (Donkey.glb scale ~0.329)
 * - Raposa Selvagem: ~0.38 m na cernelha (fox.glb scale ~0.0048)
 * - Cão Shiba Inu: ~0.40 m na cernelha (ShibaInu.glb scale ~0.129)
 * - Galinha Caipira: ~0.40 m altura total
 * ============================================================================
 */

import { BoundingBox, type Entity, type RenderComponent } from 'playcanvas';

export interface ModelAABBMeasurement {
    min: [number, number, number];
    max: [number, number, number];
    width: number;
    height: number;
    length: number;
}

export interface CalibrationResult {
    rawBounds: ModelAABBMeasurement;
    appliedScale: number;
    offsetY: number;
    finalDimensions: {
        width: number;
        height: number;
        length: number;
    };
}

/**
 * Mede a BoundingBox combinada de todas as malhas renderizáveis da hierarquia da entidade.
 */
export function measureEntityAABB(entity: Entity): ModelAABBMeasurement {
    entity.syncHierarchy();

    let minX = Infinity;
    let minY = Infinity;
    let minZ = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxZ = -Infinity;

    let hasRenders = false;
    const renders = entity.findComponents('render') as RenderComponent[];

    for (const r of renders) {
        if (r.meshInstances && r.meshInstances.length > 0) {
            hasRenders = true;
            for (const mi of r.meshInstances) {
                const aabb: BoundingBox = mi.aabb;
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
    }

    if (!hasRenders || minX === Infinity) {
        // Fallback para dimensões unitárias padrão se não houver malhas
        return {
            min: [-0.5, 0, -0.5],
            max: [0.5, 1.0, 0.5],
            width: 1.0,
            height: 1.0,
            length: 1.0
        };
    }

    return {
        min: [minX, minY, minZ],
        max: [maxX, maxY, maxZ],
        width: maxX - minX,
        height: maxY - minY,
        length: maxZ - minZ
    };
}

/**
 * Calibra e normaliza anatomicamente a entidade para atingir a dimensão-alvo em metros.
 * Aplica fator de escala uniforme e ajusta o offset vertical para que as patas toquem o solo (Y = 0).
 */
export function calibrateAnimalEntity(
    entity: Entity,
    targetHeightMeters: number,
    manualScaleOverride?: number
): CalibrationResult {
    // 1. Instancia em escala unitária para medição neutra
    entity.setLocalScale(1.0, 1.0, 1.0);
    entity.setLocalPosition(0, 0, 0);

    const raw = measureEntityAABB(entity);

    // 2. Calcula a escala necessária ou utiliza override
    const calculatedScale = manualScaleOverride ?? (raw.height > 0 ? targetHeightMeters / raw.height : 1.0);

    // 3. Aplica escala uniforme nos 3 eixos (proporção anatômica estrita)
    entity.setLocalScale(calculatedScale, calculatedScale, calculatedScale);

    // 4. Calcula offset vertical para garantir contato perfeito das patas com o solo
    const offsetY = -raw.min[1] * calculatedScale;
    entity.setLocalPosition(0, offsetY, 0);

    entity.syncHierarchy();

    return {
        rawBounds: raw,
        appliedScale: calculatedScale,
        offsetY,
        finalDimensions: {
            width: raw.width * calculatedScale,
            height: raw.height * calculatedScale,
            length: raw.length * calculatedScale
        }
    };
}

/**
 * Tabela canônica de calibração padrão de modelos animais no Ninja Farm.
 */
export const CANONICAL_FAUNA_CALIBRATION: Record<
    string,
    { targetHeight: number; defaultScale: number; offsetY: number; walkSpeed: number; interactionRadius: number }
> = {
    cow: {
        targetHeight: 1.45,
        defaultScale: 0.316,
        offsetY: 0.018,
        walkSpeed: 1.1,
        interactionRadius: 2.2
    },
    bull: {
        targetHeight: 1.6,
        defaultScale: 0.349,
        offsetY: 0.019,
        walkSpeed: 1.2,
        interactionRadius: 2.4
    },
    horse: {
        targetHeight: 1.6,
        defaultScale: 0.332,
        offsetY: 0.004,
        walkSpeed: 1.6,
        interactionRadius: 2.2
    },
    donkey: {
        targetHeight: 1.3,
        defaultScale: 0.329,
        offsetY: -0.002,
        walkSpeed: 1.2,
        interactionRadius: 1.8
    },
    fox: {
        targetHeight: 0.38,
        defaultScale: 0.0048,
        offsetY: 0.001,
        walkSpeed: 2.0,
        interactionRadius: 1.2
    },
    shiba: {
        targetHeight: 0.4,
        defaultScale: 0.129,
        offsetY: -0.001,
        walkSpeed: 1.7,
        interactionRadius: 1.2
    },
    chicken: {
        targetHeight: 0.4,
        defaultScale: 1.0,
        offsetY: 0.0,
        walkSpeed: 1.0,
        interactionRadius: 1.0
    }
};
