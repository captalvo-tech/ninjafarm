type EventHandler<T = any> = (data: T) => void;

export class DomainEventEmitter {
    private handlers = new Map<string, Set<EventHandler>>();

    on<T = any>(event: string, handler: EventHandler<T>): () => void {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, new Set());
        }
        this.handlers.get(event)!.add(handler);

        return () => {
            this.handlers.get(event)?.delete(handler);
        };
    }

    emit<T = any>(event: string, data: T): void {
        const set = this.handlers.get(event);
        if (set) {
            for (const handler of set) {
                try {
                    handler(data);
                } catch (err) {
                    console.error(`Erro no listener do evento ${event}:`, err);
                }
            }
        }
    }

    clear(): void {
        this.handlers.clear();
    }
}

export const domainEvents = new DomainEventEmitter();
