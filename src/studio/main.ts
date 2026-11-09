import { StudioApp } from './studio-app';
import { StudioUI } from './studio-ui';

async function bootstrapStudio(): Promise<void> {
    const canvas = document.getElementById('studio-canvas') as HTMLCanvasElement;
    if (!canvas) {
        console.error('[Studio] Missing #studio-canvas element');
        return;
    }

    try {
        const app = await StudioApp.create(canvas);
        const ui = new StudioUI(app);
        await ui.init();

        // Attach for dev console access
        (window as any).__studioApp = app;
        (window as any).__studioUI = ui;

        console.log('✅ Ninja Farm Studio initialized successfully.');
    } catch (err) {
        console.error('[Studio] Failed to initialize Studio:', err);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrapStudio);
} else {
    bootstrapStudio();
}
