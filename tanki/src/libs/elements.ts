/**
 * Helper class for constructing element trees
 * Version 1.4 (typescript)
 */
class Elm<T extends keyof HTMLElementTagNameMap = "div"> {
    protected elm: HTMLElementTagNameMap[T];

    constructor();
    constructor(tagNameOrElement: T);
    constructor(tagNameOrElement: HTMLElementTagNameMap[T]);
    constructor(tagNameOrElement?: HTMLElementTagNameMap[T] | T) {
        if (typeof tagNameOrElement === "undefined") {
            // @ts-ignore
            this.elm = document.createElement("div");
        } else if (typeof tagNameOrElement === "string") {
            this.elm = document.createElement(tagNameOrElement);
        } else {
            this.elm = tagNameOrElement;
        }
    }

    withSelf(func: (self: this) => any) {
        func(this);
        return this;
    }

    class(...classNames: string[]) {
        this.elm.classList.add(...classNames);
        return this;
    }

    removeClass(className: string) {
        this.elm.classList.remove(className);
    }

    append(...elms: any[]) {
        for (const elm of elms) {
            this.elm.appendChild(this._anyToNode(elm));
        }
        return this;
    }

    appendAsFirst(elm: any) {
        this.elm.insertBefore(this._anyToNode(elm), this.elm.firstChild);
    }

    appendTo(parent: HTMLElement | Elm) {
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

    replaceContents(...elms: any[]) {
        this.clear();
        this.append(...elms);
    }

    remove() {
        const parent = this.elm.parentElement;
        if (parent) {
            parent.removeChild(this.elm);
        }
    }

    on<E extends keyof HTMLElementEventMap>(
        event: E, handler: (e: HTMLElementEventMap[E]) => void
    ) {
        // @ts-ignore
        this.elm.addEventListener(event, handler);
        return this;
    }

    /**
     * By click or keyboard
     */
    onActivate(handler: (this: HTMLElement, ev: MouseEvent | KeyboardEvent) => any) {
        this.on("click", handler);
        this.on("keydown", e => {
            if (e.target !== this.elm) { return; }
            if (e.keyCode === 13 || e.keyCode === 32) { // enter or space
                handler.call(this.elm, e);
                e.preventDefault();
            }
        });
        return this;
    }

    attribute(key: string, value: string) {
        this.elm.setAttribute(key, value || "true");
        return this;
    }

    getHTMLElement(): HTMLElementTagNameMap[T] {
        return this.elm;
    }

    private _anyToNode(any: any): Node {
        if (any instanceof Elm) {
            return any.elm;
        } else if (typeof any === "string") {
            return document.createTextNode(any);
        } else if (any instanceof Node) {
            return any;
        } else if (any instanceof Component) {
            return any.elm.elm;
        } else if (any !== undefined && any !== null) {
            return document.createTextNode(any.toString());
        } else {
            return document.createTextNode("");
        }
    }
}

class InputElm extends Elm<"input"> {
    constructor() {
        super("input");
    }

    setType(type: string) {
        this.elm.type = type;
        return this;
    }

    getValue(): string | boolean {
        if (this.elm.type === "checkbox") {
            return this.elm.checked;
        } else {
            return this.elm.value;
        }
    }

    setValue(value: boolean | string | number) {
        if (this.elm.type === "checkbox" && typeof value === "boolean") {
            this.elm.checked = value;
        } else if (this.elm.type === "number" && typeof value === "number") {
            this.elm.value = value.toString();
        } else {
            this.elm.value = value.toString();
        }
        return this;
    }
}

class Component {
    public elm: Elm;

    constructor(protected name: string) {
        this.elm = new Elm();
        this.elm.class(name);
    }

    appendTo(parent: HTMLElement | Elm) {
        this.elm.appendTo(parent);
        return this;
    }
}

export { Component, Elm, InputElm };
