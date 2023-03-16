import { Component, Elm } from "./libs/elements.js";

export function wait(millis: number): Promise<void> {
    return new Promise((res) => {
        setTimeout(() => res(), millis);
    });
}

export function getCurrMinuteFloored(): number {
    return Math.floor(Date.now() / 60e3);
}

export function minutesToHumanString(minutes: number): string {
    const minsAbs = Math.abs(minutes);
    let resultStr;

    if (minsAbs < 60) {
        resultStr = Math.round(minsAbs) + " minute" + (minsAbs === 1 ? "" : "s");
    } else if (minsAbs < 24 * 60) {
        const hours = Math.round(minsAbs / 60);
        resultStr = hours + " hour" + (hours === 1 ? "" : "s");
    } else if (minsAbs < 24 * 60 * 7) {
        const days = Math.round(minsAbs / 60 / 24);
        resultStr = days + " day" + (days === 1 ? "" : "s");
    } else {
        const weeks = Math.round(minsAbs / 60 / 24 / 7);
        resultStr = weeks + " week" + (weeks === 1 ? "" : "s");
    }

    if (minutes < 0) {
        resultStr += " ago";
    }

    return resultStr;
}

export const setImmediatePolyfill = window.setImmediate || ((f: Function) => setTimeout(f, 1));

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

export function arrayRemoveTrailingUndefinedOrNull<T extends readonly any[]>(arr: T): T {
    let i;
    for (i = arr.length - 1; i >= 0; i--) {
        if (arr[i] !== undefined && arr[i] !== null) {
            break;
        }
    }

    // @ts-ignore
    return arr.slice(0, i + 1);
}

export interface PromiseRejectFunc { (reason?: any): void; }
export interface PromiseResolveFunc<T> { (result: T): void; }

export type Immutable<T> =
    T extends (infer R)[] ? ImmutableArray<R> :
    T extends Function ? T :
    T extends ImmutableArray<any> ? T :
    T extends object ? ImmutableObject<T> :
    T;

interface ImmutableArray<T> extends ReadonlyArray<Immutable<T>> { }

type ImmutableObject<T> = {
    readonly [P in keyof T]: Immutable<T[P]>;
};

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

export function boundBetween(min: number, x: number, max: number): number {
    return Math.min(Math.max(x, min), max);
}

export class Watchable<T> {
    public change = new EventHandler<T>();

    constructor(private value: T) { }

    public get(): Readonly<T> {
        return this.value;
    }

    public set(v: T) {
        this.value = v;
        this.change.dispatch(v);
    }
}

/**
 * Not to be confused with ReactComponent from React. An element that
 * updates when a watchable updates.
 */
export class ReactElm<T extends keyof HTMLElementTagNameMap = "div"> extends Elm<T> {
    private watchChangeHandler = () => this.update();
    private watchables: Watchable<any>[] = [];
    private updateHandler?: (self: this) => void;

    constructor(public type: T) {
        super(type);
    }

    public update(): void {
        if (this.updateHandler) {
            this.updateHandler(this);
        }
    }

    public setUpdateHandler(handler: (self: this) => void) {
        this.updateHandler = handler;
        return this;
    }

    public addWatchable(...watchables: Watchable<any>[]) {
        for (const watchable of watchables) {
            watchable.change.addHandler(this.watchChangeHandler);
            this.watchables.push(watchable);
        }
        return this;
    }

    public dispose() {
        for (const watchable of this.watchables) {
            watchable.change.removeHandler(this.watchChangeHandler);
        }
    }
}

