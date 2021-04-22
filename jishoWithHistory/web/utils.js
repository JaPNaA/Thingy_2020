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
