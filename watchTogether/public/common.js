/**
 * Utility Event class
 * @template T
 */
export class EventHandlers {
    constructor() {
        /** @type {((data: T) => any)[]} */
        this.handlers = [];
    }

    /** @param {(data: T) => any} handler */
    addHandler(handler) {
        this.handlers.push(handler);
    }

    /** @param {(data: T) => any} handler */
    removeHandler(handler) {
        const index = this.handlers.indexOf(handler);
        if (index < 0) { throw new Error("Tried to remove nonexistent handler"); }
        this.handlers.splice(index, 1);
    }

    /** @param {T} data */
    dispatch(data) {
        for (const handler of this.handlers) {
            handler(data);
        }
    }
}
