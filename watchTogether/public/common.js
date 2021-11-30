/**
 * Utility Event class
 * @template T
 */
export class EventHandlers {
    constructor() {
        /** @type {((data: T) => any)[]} */
        this.handlers = [];
        /** @type {function[]} */
        this.nextPromiseResolutions = [];
    }

    /** @param {(data: T) => any} handler */
    addHandler(handler) {
        this.handlers.push(handler);
    }

    /** @returns {Promise<T>} */
    nextPromise() {
        return new Promise(res => {
            this.nextPromiseResolutions.push(res);
        });
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
        for (const res of this.nextPromiseResolutions) {
            res();
        }
        this.nextPromiseResolutions.length = 0;
    }
}

/** @template T */
export class TrackableObject {
    /** @param {T} initialObject */
    constructor(initialObject) {
        this._obj = initialObject;

        /** @type { (keyof T)[] } */ // @ts-ignore
        this._keys = Object.keys(initialObject);

        /** @type { { [K in keyof T]: string } } */ // @ts-ignore
        this._types = {};
        /** @type { { [K in keyof T]: boolean } } */ // @ts-ignore
        this._dirtiness = {};

        for (const key of this._keys) {
            this._types[key] = typeof this._obj[key];
            this._dirtiness[key] = false;
        }
    }

    /**
     * Attempts to set object[key] to value, if the typeof's match up
     * @param {keyof T} key 
     * @param {any} value 
     */
    setIfPossible(key, value) {
        if (typeof value === this._types[key] && this._obj[key] !== value) {
            this._obj[key] = value;
            this._dirtiness[key] = true;
        }
    }

    /**
     * Writes data from an object onto trackable object, if possible
     * @param {Partial<T>} obj 
     */
    writeOverIfPossible(obj) {
        for (const key of this._keys) {
            this.setIfPossible(key, obj[key]);
        }
    }

    /**
     * Extracts all key/value pairs that have changed into an object
     */
    extractDirtInObject() {
        /** @type {Partial<T>} */
        const dirt = {};

        for (const key of this._keys) {
            if (this._dirtiness[key]) {
                dirt[key] = this._obj[key];
            }
        }

        return dirt;
    }

    /**
     * @returns {Readonly<T>}
     */
    getCurrObj() {
        return this._obj;
    }

    /**
     * @param {string} key
     * @returns {Readonly<T>}
     */
    get(key) {
        return this._obj[key];
    }

    clean() {
        for (const key of this._keys) {
            this._dirtiness[key] = false;
        }
    }
}