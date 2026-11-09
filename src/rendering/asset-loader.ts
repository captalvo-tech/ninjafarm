import type { AppBase, ContainerResource, Entity } from 'playcanvas';
import { Asset } from 'playcanvas';

export interface LoadedGLB {
    asset: Asset;
    resource: ContainerResource;
    instantiate: () => Entity;
    animations: Asset[];
    getTrack: (nameSubstring: string) => any;
}

export class GlbAssetLoader {
    private app: AppBase;
    private cache = new Map<string, Promise<LoadedGLB>>();

    constructor(app: AppBase) {
        this.app = app;
    }

    /**
     * Loads a GLB container asset asynchronously and caches the resource.
     * Each call to `loaded.instantiate()` produces a new instance of the render hierarchy.
     */
    load(url: string, assetName?: string): Promise<LoadedGLB> {
        if (this.cache.has(url)) {
            return this.cache.get(url)!;
        }

        const promise = new Promise<LoadedGLB>((resolve, reject) => {
            const cleanName = assetName || url.split('/').pop()?.replace('.glb', '') || 'glb_container';
            const asset = new Asset(cleanName, 'container', { url });

            asset.ready((loadedAsset) => {
                const resource = loadedAsset.resource as ContainerResource;
                const loadedGlb: LoadedGLB = {
                    asset: loadedAsset,
                    resource,
                    instantiate: () => resource.instantiateRenderEntity(),
                    animations: (resource.animations || []) as Asset[],
                    getTrack: (nameSub: string) => {
                        const anims = (resource.animations as Asset[]) || [];
                        const match = anims.find((a) => a.name.toLowerCase().includes(nameSub.toLowerCase()));
                        return match?.resource;
                    }
                };
                resolve(loadedGlb);
            });

            asset.on('error', (err) => {
                console.error(`[GlbAssetLoader] Failed to load ${url}:`, err);
                reject(new Error(`Failed to load GLB: ${url} (${err})`));
            });

            this.app.assets.add(asset);
            this.app.assets.load(asset);
        });

        this.cache.set(url, promise);
        return promise;
    }
}
