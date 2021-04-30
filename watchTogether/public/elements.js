/**
 * Helper class for constructing element trees
 * Version 1.2
 */
class Elm {
    /**
     * @param {string | HTMLElement} [tagNameOrElement]
     */
    constructor(tagNameOrElement) {
        if (typeof tagNameOrElement === "undefined") {
            this.elm = document.createElement("div");
        } else if (typeof tagNameOrElement === "string") {
            this.elm = document.createElement(tagNameOrElement);
        } else {
            this.elm = tagNameOrElement;
        }
    }

    /**
     * @param {(self: this) => any} func 
     */
    withSelf(func) {
        func(this);
        return this;
    }

    /**
     * @param {...string} classNames
     */
    class(...classNames) {
        this.elm.classList.add(...classNames);
        return this;
    }

    /**
     * @param {string} className 
     */
    removeClass(className) {
        this.elm.classList.remove(className);
    }

    /**
     * @param {...any} elms
     */
    append(...elms) {
        for (const elm of elms) {
            this.elm.appendChild(this._anyToNode(elm));
        }
        return this;
    }

    /**
     * @param {any} elm 
     */
    appendAsFirst(elm) {
        this.elm.insertBefore(this._anyToNode(elm), this.elm.firstChild);
    }

    /**
     * @param {any} any 
     * @return {Node}
     */
    _anyToNode(any) {
        if (any instanceof Elm) {
            return any.elm;
        } else if (typeof any === "string") {
            return document.createTextNode(any);
        } else if (any instanceof Node) {
            return any;
        } else if (any instanceof Component) {
            return any.elm.elm;
        } else {
            return document.createTextNode(any && any.toString() || "");
        }
    }

    /**
     * @param {HTMLElement | Elm} parent 
     */
    appendTo(parent) {
        if (parent instanceof Elm) {
            parent.append(this.elm);
        } else {
            parent.appendChild(this.elm);
        }
        return this;
    }

    clear() {
        while (this.elm.firstChild) {
            this.elm.removeChild(this.elm.firstChild);
        }
    }

    remove() {
        const parent = this.elm.parentElement;
        if (parent) {
            parent.removeChild(this.elm);
        }
    }

    /**
     * @param {keyof HTMLElementEventMap} event
     * @param {(this: HTMLElement, ev: any) => any} handler
     */
    on(event, handler) {
        this.elm.addEventListener(event, handler);
        return this;
    }

    /**
     * By click or keyboard
     * @param {(this: HTMLElement, ev: any) => any} handler
     */
    onActivate(handler) {
        this.on("click", handler);
        this.elm.addEventListener("keydown", e => {
            if (e.target !== this.elm) { return; }
            if (e.keyCode === 13 || e.keyCode === 32) { // enter or space
                handler.call(this.elm);
                e.preventDefault();
            }
        });
        return this;
    }

    /**
     * @param {string} key
     * @param {string} [value]
     */
    attribute(key, value) {
        this.elm.setAttribute(key, value || "true");
        return this;
    }
}

class InputElm extends Elm {
    constructor() {
        super("input");
    }

    /** @param {string} type */
    setType(type) {
        /** @type {HTMLInputElement} */
        (this.elm).type = type;
    }

    getValue() {
        return (
            /** @type {HTMLInputElement} */
            (this.elm).value
        );
    }
}

class Component {
    /** @param {String} name */
    constructor(name) {
        this.elm = new Elm();
        this.name = name;
        this.elm.class(this.name);
    }
}

export { Component, Elm, InputElm };
