/**
 * Helper class for constructing element trees
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
     * @param {...HTMLElement | Elm | string} elms
     */
    append(...elms) {
        for (const elm of elms) {
            if (elm instanceof Elm) {
                elm.appendTo(this.elm);
            } else if (typeof elm === "string") {
                this.elm.appendChild(document.createTextNode(elm));
            } else {
                this.elm.appendChild(elm);
            }
        }
        return this;
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

    remove() {
        const parent = this.elm.parentElement;
        if (parent) {
            parent.removeChild(this.elm);
        }
    }

    /**
     * @param {string} event
     * @param {(this: HTMLElement, ev: Event) => any} handler
     */
    on(event, handler) {
        this.elm.addEventListener(event, handler);
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

class Component extends Elm {
    /** @param {String} name */
    constructor(name) {
        super();
        this.name = name;
        this.class(this.name);
    }
}

export { Component, Elm };
