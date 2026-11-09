import { FARM_CONFIG } from '../core/config';
import { domainEvents } from '../core/events';
import type { ResourceInventory, ResourceType } from '../core/types';

export class InventorySystem {
    private resources: ResourceInventory;
    private capacity: ResourceInventory;

    constructor(initialResources?: Partial<ResourceInventory>, initialCapacity?: Partial<ResourceInventory>) {
        this.resources = {
            ...FARM_CONFIG.INITIAL_RESOURCES,
            ...initialResources
        };

        this.capacity = {
            ...FARM_CONFIG.DEFAULT_STORAGE_CAPACITY,
            ...initialCapacity
        };
    }

    get(type: ResourceType): number {
        return this.resources[type];
    }

    set(type: ResourceType, amount: number): void {
        this.resources[type] = Math.max(0, amount);
        domainEvents.emit('inventory.changed', { type, current: this.resources[type], added: 0 });
    }

    getAll(): Readonly<ResourceInventory> {
        return { ...this.resources };
    }

    getCapacity(type: ResourceType): number {
        return this.capacity[type];
    }

    getAllCapacity(): Readonly<ResourceInventory> {
        return { ...this.capacity };
    }

    setCapacity(type: ResourceType, amount: number): void {
        this.capacity[type] = Math.max(0, amount);
        // Clampa se exceder nova capacidade
        if (this.resources[type] > this.capacity[type]) {
            this.resources[type] = this.capacity[type];
        }
    }

    addCapacity(type: ResourceType, amount: number): void {
        this.setCapacity(type, this.capacity[type] + amount);
    }

    has(costs: Partial<ResourceInventory>): boolean {
        for (const [key, val] of Object.entries(costs)) {
            const resType = key as ResourceType;
            if ((val ?? 0) > 0 && this.resources[resType] < (val ?? 0)) {
                return false;
            }
        }
        return true;
    }

    add(type: ResourceType, amount: number): number {
        if (amount <= 0) return 0;
        const availableSpace = this.capacity[type] - this.resources[type];
        const added = Math.min(amount, Math.max(0, availableSpace));
        this.resources[type] = Number((this.resources[type] + added).toFixed(2));

        domainEvents.emit('inventory.changed', { type, current: this.resources[type], added });
        return added;
    }

    consume(type: ResourceType, amount: number): boolean {
        if (amount <= 0) return true;
        if (this.resources[type] < amount) {
            return false;
        }

        this.resources[type] = Number((this.resources[type] - amount).toFixed(2));
        domainEvents.emit('inventory.changed', { type, current: this.resources[type], consumed: amount });
        return true;
    }

    consumeBatch(costs: Partial<ResourceInventory>): boolean {
        if (!this.has(costs)) return false;

        for (const [key, val] of Object.entries(costs)) {
            const resType = key as ResourceType;
            if (val && val > 0) {
                this.consume(resType, val);
            }
        }
        return true;
    }

    serialize(): ResourceInventory {
        return { ...this.resources };
    }

    load(saved: ResourceInventory): void {
        this.resources = { ...saved };
    }
}
