import { Component, Elm } from "./elements.js";

/** @typedef {import("./index.js").Japanese} Japanese */

export class Furigana extends Component {
    /**
     * @param {Japanese} item 
     */
    constructor(item) {
        super("furigana");
        if (item.word) {
            this.append(
                new Elm("ruby").class("word")
                    .append(
                        item.word,
                        new Elm("rp").class("reading").append("("),
                        new Elm("rt").class("reading").append(item.reading),
                        new Elm("rp").class("reading").append(")")
                    )
            );
        } else {
            this.append(
                new Elm("span").class("word").append(item.reading)
            );
        }
    }

    hideReading() {
        this.class("hideReading");
    }
}

export class Modal extends Component {
    constructor() {
        super("modal");

        this.append(
            new Elm().class("dialogue").append(
                this.content = new Elm().class("content"),

                this.buttons = new Elm().class("buttons").append(
                    this.closeButton = new Elm("button").class("close").append("Close")
                        .on("click", () => this.remove())
                )
            )
        );
    }

    /**
     * @param {any} content 
     */
    appendContent(content) {
        this.content.append(content);
    }

    showScrollbar() {
        this.content.class("scrollBar");
    }

    /**
     * @param {Elm} button
     */
    addButton(button) {
        button.appendTo(this.buttons);
        button.on("click", () => this.remove());
        this.closeButton.elm.innerHTML = "Cancel";
    }

    show() {
        this.appendTo(document.body);
    }
}

export class IPInput extends Component {
    constructor() {
        super("ipInput");

        this.ipPartInputs = this._createIPPartInputs();
        this.portInput = new Elm("input").class("port");
        /** @type {HTMLInputElement} */
        (this.portInput.elm).value = "65535";

        this.append(
            this.ipPartInputs[0],
            ".",
            this.ipPartInputs[1],
            ".",
            this.ipPartInputs[2],
            ".",
            this.ipPartInputs[3],
            ":",
            this.portInput
        );
    }

    getValue() {
        const ipParts = [];
        for (const input of this.ipPartInputs) {
            ipParts.push(
                /** @type {HTMLInputElement} */
                (input.elm).value
            );
        }

        return ipParts.join(".") + ":" +
            /** @type {HTMLInputElement} */
            (this.portInput.elm).value;
    }

    /** @param {string} value */
    setValue(value) {
        const splits = value.split(/[\.:]/g);

        for (let i = 0; i < 4; i++) {
            /** @type {HTMLInputElement} */
            (this.ipPartInputs[i].elm).value = splits[i];
        }

        /** @type {HTMLInputElement} */
        (this.portInput.elm).value = splits[4];
    }

    /** @param {number|undefined} inputIndex */
    focus(inputIndex) {
        if (inputIndex === undefined) {
            /** @type {HTMLInputElement} */
            (this.ipPartInputs[0].elm).select();
        } else {
            if (inputIndex >= 4) {
                /** @type {HTMLInputElement} */
                (this.portInput.elm).select();
            } else {
                /** @type {HTMLInputElement} */
                (this.ipPartInputs[inputIndex].elm).select();
            }
        }
    }

    _createIPPartInputs() {
        const arr = [];
        for (let i = 0; i < 4; i++) {
            arr.push(
                new Elm("input")
                    .class("part")
                    .attribute("type", "number")
                    .withSelf(e =>
                        /** @type {HTMLInputElement}*/
                        (e.elm).value = "255"
                    )
            );
        }
        return arr;
    }
}

/**
 * @template T
 * @param {T[]} arr1
 * @param {T[]} arr2
 * @return {boolean}
 */
export function arrayEquals(arr1, arr2) {
    if (arr1.length !== arr2.length) { return false; }

    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) { return false; }
    }

    return true;
}
