import { Elm } from "./libs/elements.js";

export function wait(millis: number): Promise<void> {
    return new Promise((res) => {
        setTimeout(() => res(), millis);
    });
}

export function promptUser(message: string, parent?: Elm): Promise<string> {
    const promptContainer = new Elm().class("prompt").append(
        new Elm().append(message)
    );

    const input = document.createElement("input");
    const promise: Promise<string> = new Promise(res =>
        input.addEventListener("change", function () {
            res(input.value);
            promptContainer.remove();
        })
    );
    promptContainer.append(input);

    //* abbr -> temp fix; this function is temporary anyway
    (parent || new Elm<"abbr">(document.body)).append(promptContainer);

    return promise;
}

export function getCurrMinuteFloored(): number {
    return Math.floor(Date.now() / 60e3);
}

export function arrayCopy<T extends Array<any>>(arr: T): T {
    // @ts-ignore
    return arr.slice(0);
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
