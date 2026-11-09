// ==========================================
// NINJA FARM - HAPTIC FEEDBACK ENGINE (MOBILE-FIRST)
// ==========================================

export type HapticPattern = 'light' | 'medium' | 'heavy' | 'harvest' | 'plant' | 'tool' | 'levelUp' | 'success';

let hapticsEnabled = true;

export function setHapticsEnabled(enabled: boolean): void {
    hapticsEnabled = enabled;
}

export function isHapticsEnabled(): boolean {
    return hapticsEnabled;
}

export function triggerHaptic(pattern: HapticPattern = 'light'): void {
    if (!hapticsEnabled || typeof window === 'undefined' || typeof navigator === 'undefined' || !navigator.vibrate) {
        return;
    }

    try {
        switch (pattern) {
            case 'light':
                navigator.vibrate(12);
                break;
            case 'medium':
                navigator.vibrate(24);
                break;
            case 'heavy':
                navigator.vibrate(40);
                break;
            case 'harvest':
                navigator.vibrate([18, 30, 24]);
                break;
            case 'plant':
                navigator.vibrate([14, 20, 16]);
                break;
            case 'tool':
                navigator.vibrate([22, 18, 30]);
                break;
            case 'levelUp':
                navigator.vibrate([40, 50, 40, 50, 80]);
                break;
            case 'success':
                navigator.vibrate([20, 30, 45]);
                break;
        }
    } catch {
        // Ignora silenciosamente se o navegador rejeitar vibração sem interação direta
    }
}
