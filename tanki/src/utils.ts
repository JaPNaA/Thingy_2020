export function wait(millis: number): Promise<void> {
    return new Promise((res) => {
        setTimeout(() => res(), millis);
    });
}

export function getCurrMinuteFloored(): number {
    return Math.floor(Date.now() / 60e3);
}

export const setImmediatePolyfill = window.setImmediate || (f => setTimeout(f, 1));

/**
 * Returns the boundary at which isPastCheck first fails
 */
export function binaryBoundarySearch<T>(
    array: T[], isPastCheck: (a: T) => boolean
): number {
    let bottom = 0;
    let top = array.length;

    // while(true) loop with protection
    for (
        let i = 0, max = Math.log2(array.length) + 2;
        i < max; i++
    ) {
        const middle = Math.floor((bottom + top) / 2);
        if (middle === bottom) {
            if (isPastCheck(array[middle])) {
                return top - 1;
            } else {
                return top;
            }
        }

        if (isPastCheck(array[middle])) {
            top = middle;
        } else {
            bottom = middle;
        }
    }

    throw new Error("Looped too many times. Is array sorted (smallest first)?");
}

export interface PromiseRejectFunc { (reason?: any): void; }
export interface PromiseResolveFunc<T> { (result: T): void; }

type EventHandlerFunction<T = void> = (data: T) => void;

export class EventHandler<T = void> {
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
