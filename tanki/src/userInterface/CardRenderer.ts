import { Card, Note } from "../database.js";
import { CardTypeData } from "../dataTypes.js";
import { Component, Elm } from "../libs/elements.js";
import { Immutable, setImmediatePolyfill } from "../utils.js";

export class CardRenderer extends Component {
    private cardIFrame = new Elm("iframe").class("card").appendTo(this.elm);
    private cardIFrameDocument?: Document;
    private loadPromise: Promise<void>;

    constructor() {
        super("cardRenderer");

        this.loadPromise = this.loadIFrame();
    }

    public async renderFront(card: Immutable<Card>) {
        const integratedNoteType = await card.parentNote.type.getIntegratedNoteType();
        const cardType = integratedNoteType.cardTypes[card.cardTypeID];
        return this.renderFrontNote(card.parentNote, cardType);
    }

    public async renderFrontNote(note: Immutable<Note>, cardType: Immutable<CardTypeData>) {
        const integratedNoteType = await note.type.getIntegratedNoteType();

        return this.setContent(
            cardType.frontTemplate,
            integratedNoteType.fieldNames,
            note.fields,
            integratedNoteType.style,
            [integratedNoteType.script, cardType.frontScript]
        );
    }

    public async renderBack(card: Immutable<Card>) {
        const integratedNoteType = await card.parentNote.type.getIntegratedNoteType();
        const cardType = integratedNoteType.cardTypes[card.cardTypeID];
        return this.renderBackNote(card.parentNote, cardType);
    }

    public async renderBackNote(note: Immutable<Note>, cardType: Immutable<CardTypeData>) {
        const integratedNoteType = await note.type.getIntegratedNoteType();

        return this.setContent(
            cardType.backTemplate.replace("{{frontTemplate}}", cardType.frontTemplate),
            integratedNoteType.fieldNames,
            note.fields,
            integratedNoteType.style,
            [integratedNoteType.script, cardType.backScript]
        );
    }


    private async setContent(
        contentTemplate: string, fieldNames: Immutable<string[]>, fields: Immutable<string[]>,
        styles: string | undefined, scripts: (string | undefined)[]
    ) {
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

        await this.loadPromise;
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

    private loadIFrame() {
        return new Promise<void>(res => {
            this.cardIFrame.on("load", () => {
                const iframeWindow = this.cardIFrame.getHTMLElement().contentWindow;
                if (!iframeWindow) { throw new Error("iframe loaded but no window"); }
                this.cardIFrameDocument = iframeWindow.document;
                this.setPropogateKeyboardAndMouseEvents(iframeWindow);
                res();
            });
        });
    }

    private setPropogateKeyboardAndMouseEvents(iframeWindow: Window) {
        for (const event of ["keydown", "keyup", "click", "mousedown", "mouseup"]) {
            this.setPropogate(event, iframeWindow);
        }
    }

    private setPropogate(eventName: string, iframeWindow: Window) {
        iframeWindow.addEventListener(eventName, e => {
            setImmediatePolyfill(
                () => this.cardIFrame.getHTMLElement().dispatchEvent(e)
            );
        });
    }
}