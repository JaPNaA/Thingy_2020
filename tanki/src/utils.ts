export function wait(millis: number): Promise<void> {
    return new Promise((res) => {
        setTimeout(() => res(), millis);
    });
}

export function getCurrMinuteFloored(): number {
    return Math.floor(Date.now() / 60e3);
}

export interface PromiseRejectFunc { (reason?: any): void; }
export interface PromiseResolveFunc<T> { (result: T): void; }

type EventHandlerFunction<T> = (data: T) => void;

export class EventHandler<T> {
    private handlers: EventHandlerFunction<T>[] = [];

    public addHandler(handler: EventHandlerFunction<T>) {
        this.handlers.push(handler);
    }

    public removeHandler(handler: EventHandlerFunction<T>) {
        const index = this.handlers.indexOf(handler);
        if (index < 0) { throw new Error("Can't remove handler that doesn't exist"); }
        this.handlers.splice(index, 1);
    }

    public dispatch(data: T) {
        for (const handler of this.handlers) {
            handler(data);
        }
    }
}
