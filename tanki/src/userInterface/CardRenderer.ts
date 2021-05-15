import { Component, Elm } from "../libs/elements.js";
import { Immutable, setImmediatePolyfill } from "../utils.js";

export class CardRenderer extends Component {
    private cardIFrame = new Elm("iframe").class("card").appendTo(this.elm);
    private cardIFrameDocument?: Document;

    constructor() {
        super("cardRenderer");

        this.cardIFrame.on("load", () => {
            const iframeWindow = this.cardIFrame.getHTMLElement().contentWindow;
            if (!iframeWindow) { throw new Error("iframe loaded but no window"); }
            this.cardIFrameDocument = iframeWindow.document;
            this.setPropogateKeyEvents(iframeWindow);
        });
    }

    public render(
        contentTemplate: string, fieldNames: Immutable<string[]>, fields: Immutable<string[]>,
        styles: string | undefined, scripts: (string | undefined)[]
    ): void {
        const regexMatches = /{{(.+?)}}/g;
        let outString = "";
        let lastIndex = 0;

        for (let match; match = regexMatches.exec(contentTemplate);) {
            outString += contentTemplate.slice(lastIndex, match.index);
            const replaceFieldName = match[1];
            outString += fields[fieldNames.indexOf(replaceFieldName)] || "&lt;&lt;undefined&gt;&gt;";
            lastIndex = match.index + match[0].length;
        }

        outString += contentTemplate.slice(lastIndex);

        if (!this.cardIFrameDocument) { throw new Error("Tried to create card in unopened iframe"); }

        this.cardIFrameDocument.body.innerHTML = outString;
        if (styles) {
            this.cardIFrameDocument.body.appendChild(
                new Elm("style").append(styles).getHTMLElement()
            );
        }

        try {
            //* dangerous!
            new Function("require", ...fieldNames, scripts.join("\n"))
                .call(this.cardIFrameDocument, undefined, ...fields);
        } catch (err) {
            console.warn("Error while running script for card", err);
        }
    }

    private setPropogateKeyEvents(iframeWindow: Window) {
        iframeWindow.addEventListener("keydown", e => {
            setImmediatePolyfill(
                () => this.cardIFrame.getHTMLElement().dispatchEvent(e)
            );
        });
    }
}