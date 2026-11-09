// ==========================================
// NINJA FARM - WANDERING SHINOBI MERCHANT
// ==========================================

import type { ResourceType } from '../core/types';
import { InventorySystem } from '../simulation/inventory';
import { sound } from '../audio/sound';
import { triggerHaptic } from '../input/haptics';
import { t } from '../ui/i18n';

export interface TradeOffer {
    id: string;
    title: string;
    costType: ResourceType;
    costAmount: number;
    giveType: ResourceType;
    giveAmount: number;
    xpReward: number;
    icon: string;
}

export const MERCHANT_TRADES: TradeOffer[] = [
    {
        id: 'trade_food_to_wood',
        title: 'Vender Alimento por Madeira',
        costType: 'food',
        costAmount: 20,
        giveType: 'wood',
        giveAmount: 18,
        xpReward: 15,
        icon: '🪵'
    },
    {
        id: 'trade_food_to_metal',
        title: 'Vender Alimento por Metal',
        costType: 'food',
        costAmount: 25,
        giveType: 'metal',
        giveAmount: 14,
        xpReward: 20,
        icon: '⚙️'
    },
    {
        id: 'trade_food_to_parts',
        title: 'Vender Alimento por Peças Nobres',
        costType: 'food',
        costAmount: 30,
        giveType: 'parts',
        giveAmount: 8,
        xpReward: 25,
        icon: '🔩'
    },
    {
        id: 'trade_wood_to_energy',
        title: 'Comprar Tônico de Ervas Revigorante',
        costType: 'wood',
        costAmount: 15,
        giveType: 'energy',
        giveAmount: 35,
        xpReward: 18,
        icon: '⚡'
    }
];

export class ShinobiMerchantManager {
    private inventory: InventorySystem;
    private modalElement: HTMLElement;
    private isOpen = false;
    private onTradeCallback?: () => void;

    constructor(inventory: InventorySystem, onTrade?: () => void) {
        this.inventory = inventory;
        this.onTradeCallback = onTrade;

        this.modalElement = document.createElement('div');
        this.modalElement.id = 'merchant-trading-modal';
        this.injectStyles();
        this.buildLayout();
        document.body.appendChild(this.modalElement);
        this.setupEvents();
    }

    private injectStyles(): void {
        const style = document.createElement('style');
        style.textContent = `
            #merchant-trading-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(11, 15, 25, 0.78);
                backdrop-filter: blur(10px);
                z-index: 260;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 16px;
                box-sizing: border-box;
                user-select: none;
            }

            #merchant-trading-modal.open {
                display: flex;
            }

            .merchant-dialog {
                background: rgba(15, 23, 42, 0.96);
                border: 2px solid rgba(245, 158, 11, 0.5);
                border-radius: 22px;
                width: 100%;
                max-width: 440px;
                max-height: 85vh;
                display: flex;
                flex-direction: column;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.7), 0 0 25px rgba(245, 158, 11, 0.2);
                overflow: hidden;
                font-family: 'DM Sans', sans-serif;
            }

            .merchant-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 14px 18px;
                background: linear-gradient(135deg, rgba(245, 158, 11, 0.18), rgba(217, 119, 6, 0.08));
                border-bottom: 1px solid rgba(245, 158, 11, 0.25);
            }

            .merchant-header-info h2 {
                margin: 0;
                font-size: 16px;
                color: #FBBF24;
                font-weight: 800;
                display: flex;
                align-items: center;
                gap: 6px;
            }

            .merchant-header-info p {
                margin: 2px 0 0 0;
                font-size: 11px;
                color: #9CA3AF;
            }

            .merchant-close-btn {
                background: rgba(255, 255, 255, 0.1);
                border: none;
                color: #FFFFFF;
                font-size: 16px;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s;
            }

            .merchant-close-btn:active {
                background: rgba(255, 255, 255, 0.25);
            }

            .merchant-body {
                padding: 14px 16px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 12px;
                max-height: 60vh;
            }

            .trade-card {
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: rgba(255, 255, 255, 0.04);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 16px;
                padding: 12px 14px;
                gap: 10px;
                transition: border-color 0.2s, background 0.2s;
            }

            .trade-card:hover {
                border-color: rgba(245, 158, 11, 0.4);
                background: rgba(245, 158, 11, 0.04);
            }

            .trade-info {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .trade-title {
                font-size: 13px;
                font-weight: 700;
                color: #FFFFFF;
            }

            .trade-exchange {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 12px;
                font-weight: 800;
            }

            .trade-cost {
                color: #F87171;
            }

            .trade-arrow {
                color: #9CA3AF;
                font-size: 10px;
            }

            .trade-give {
                color: #34D399;
            }

            .trade-xp {
                font-size: 10px;
                color: #FBBF24;
                font-weight: 700;
            }

            .trade-btn {
                background: linear-gradient(135deg, #F59E0B, #D97706);
                border: none;
                color: #0B0F19;
                font-family: inherit;
                font-size: 12px;
                font-weight: 800;
                padding: 9px 14px;
                border-radius: 12px;
                cursor: pointer;
                touch-action: manipulation;
                transition: transform 0.1s, opacity 0.2s;
                white-space: nowrap;
            }

            .trade-btn:active {
                transform: scale(0.92);
            }

            .trade-btn.disabled {
                background: rgba(255, 255, 255, 0.1);
                color: #6B7280;
                cursor: not-allowed;
                transform: none;
            }
        `;
        document.head.appendChild(style);
    }

    private buildLayout(): void {
        this.modalElement.innerHTML = `
            <div class="merchant-dialog">
                <div class="merchant-header">
                    <div class="merchant-header-info">
                        <h2>🧳 ${t('merchant.title')}</h2>
                        <p>${t('merchant.subtitle')}</p>
                    </div>
                    <button class="merchant-close-btn" id="btn-merchant-close">✕</button>
                </div>
                <div class="merchant-body" id="merchant-trades-list"></div>
            </div>
        `;
    }

    private renderTrades(): void {
        const list = document.getElementById('merchant-trades-list');
        if (!list) return;

        list.innerHTML = '';
        MERCHANT_TRADES.forEach(trade => {
            const hasResource = this.inventory.has({ [trade.costType]: trade.costAmount });
            const card = document.createElement('div');
            card.className = 'trade-card';

            const costName = trade.costType === 'food' ? 'Alimento 🍙' : trade.costType === 'wood' ? 'Madeira 🪵' : trade.costType;
            const giveName = trade.giveType === 'wood' ? 'Madeira 🪵' : trade.giveType === 'metal' ? 'Metal ⚙️' : trade.giveType === 'parts' ? 'Peças 🔩' : 'Energia ⚡';

            card.innerHTML = `
                <div class="trade-info">
                    <span class="trade-title">${trade.title}</span>
                    <div class="trade-exchange">
                        <span class="trade-cost">-${trade.costAmount} ${costName}</span>
                        <span class="trade-arrow">➔</span>
                        <span class="trade-give">+${trade.giveAmount} ${giveName}</span>
                    </div>
                    <span class="trade-xp">+${trade.xpReward} XP Recompensa</span>
                </div>
                <button class="trade-btn ${hasResource ? '' : 'disabled'}" data-id="${trade.id}">
                    ${t('merchant.trade_btn')}
                </button>
            `;

            const btn = card.querySelector('.trade-btn') as HTMLElement;
            btn.addEventListener('click', () => {
                this.executeTrade(trade);
            });

            list.appendChild(card);
        });
    }

    private executeTrade(trade: TradeOffer): void {
        if (!this.inventory.consume(trade.costType, trade.costAmount)) {
            triggerHaptic('light');
            return;
        }

        this.inventory.add(trade.giveType, trade.giveAmount);
        sound.playCoins();
        triggerHaptic('medium');

        this.renderTrades();
        this.onTradeCallback?.();
    }

    private setupEvents(): void {
        const closeBtn = document.getElementById('btn-merchant-close');
        closeBtn?.addEventListener('click', () => {
            this.close();
        });

        this.modalElement.addEventListener('click', (e) => {
            if (e.target === this.modalElement) {
                this.close();
            }
        });
    }

    open(): void {
        this.isOpen = true;
        sound.playClick();
        triggerHaptic('light');
        this.renderTrades();
        this.modalElement.classList.add('open');
    }

    close(): void {
        this.isOpen = false;
        sound.playClick();
        this.modalElement.classList.remove('open');
    }

    getIsOpen(): boolean {
        return this.isOpen;
    }
}

