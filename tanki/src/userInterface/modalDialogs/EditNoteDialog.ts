import { Note, NoteType } from "../../database.js";
import { Component, Elm, InputElm } from "../../libs/elements.js";
import { Deck } from "../../logic.js";
import { EventHandler, Immutable } from "../../utils.js";
import { CardRenderer } from "../CardRenderer.js";
import { ModalDialog } from "./ModalDialog.js";

export class EditNoteDialog extends ModalDialog {
    public onSubmit = new EventHandler<Note>();
    public onDeleteButtonClick = new EventHandler();

    private title: Elm<"h2">;
    private inputsContainer: Elm;
    private typeSelectElm: Elm<"select">;
    private actionButtons: Elm;
    private cardPreview: CardPreview;

    private noteTypeIndex?: number;
    private inputElms?: InputElm[];

    constructor(private deck: Deck) {
        super("editNoteDialog");

        this.foregroundElm.append(
            new Elm().class("edit").append(
                this.title = new Elm("h2").append("Create Note"),
                this.typeSelectElm = new Elm("select").class("typeSelect")
                    .on("change", () => this.updateInputsElm()),
                this.inputsContainer = new Elm().class("inputs"),
                this.actionButtons = new Elm().append(
                    new Elm("button").append("Add")
                        .on("click", () => this.addButtonClickHandler())
                )
            ),
            new Elm().class("preview").append(
                new Elm("h3").append("Preview"),
                this.cardPreview = new CardPreview()
            )
        );

        this.loadNoteTypes();
    }

    public async setEditingNote(note: Immutable<Note>) {
        this.setEditMode();
        this.typeSelectElm.getHTMLElement().value =
            this.deck.database.getNoteTypes().indexOf(note.type).toString();
        await this.updateInputsElm();

        if (!this.inputElms) { throw new Error("Expected inputElms to be defined"); }

        for (let i = 0; i < this.inputElms.length; i++) {
            if (!note.fields[i]) { continue; }
            this.inputElms[i].setValue(note.fields[i]);
        }

        this.updatePreview();
    }

    public setCreatingNote() {
        this.updateInputsElm();
    }

    private setEditMode() {
        this.title.replaceContents("Edit note");
        this.actionButtons.replaceContents(
            new Elm("button").append("Save")
                .on("click", () => this.dispatchSubmit()),
            new Elm("button").append("Delete")
                .on("click", () => this.onDeleteButtonClick.dispatch())
        );
        this.typeSelectElm.attribute("disabled", "disabled");
    }

    private loadNoteTypes() {
        const noteTypes = this.deck.database.getNoteTypes();

        for (let i = 0; i < noteTypes.length; i++) {
            const noteType = noteTypes[i];
            this.typeSelectElm.append(
                new Elm("option").append(noteType.name).attribute("value", i.toString())
            );
        }
    }

    private async updateInputsElm() {
        const noteTypes = this.deck.database.getNoteTypes();

        this.noteTypeIndex = parseInt(this.typeSelectElm.getHTMLElement().value);
        this.inputElms = [];

        const noteType = noteTypes[this.noteTypeIndex];
        const noteTypeIntegrated = await NoteType.getIntegratedNoteType(noteType);
        this.updatePreview();

        this.inputsContainer.clear();

        for (const fieldName of noteTypeIntegrated.fieldNames) {
            const inputElm = new InputElm().class("cardFieldInput");

            inputElm.on("change", () => this.inputChangeHandler());

            this.inputElms.push(inputElm);
            this.inputsContainer.append(
                new Elm("label").class("cardFieldLabel").append(fieldName, inputElm)
            );
        }
    }

    private updatePreview() {
        if (this.noteTypeIndex === undefined || !this.inputElms) { return; }
        const noteTypes = this.deck.database.getNoteTypes();
        const noteType = noteTypes[this.noteTypeIndex];
        this.cardPreview.setNote(Note.create(noteType, this.getFields()));
    }

    private inputChangeHandler() {
        this.updatePreview();
    }

    private addButtonClickHandler() {
        if (!this.inputElms) { return; }

        this.dispatchSubmit();

        for (const inputElm of this.inputElms) {
            inputElm.setValue("");
        }
        this.inputElms[0].getHTMLElement().focus();
    }

    private dispatchSubmit() {
        if (this.noteTypeIndex === undefined) { return; }
        this.onSubmit.dispatch(Note.create(
            this.deck.database.getNoteTypes()[this.noteTypeIndex],
            this.getFields()
        ));
    }

    private getFields() {
        return this.inputElms?.map(e => e.getValue() as string) || [];
    }
}

class CardPreview extends Component {
    private rendererPool: CardRenderer[] = [];
    private rendererIndex = 0;
    private numRenderersShowing = 0;

    constructor() {
        super("cardPreview");
    }

    public async setNote(note: Note) {
        const integratedNoteType = await note.type.getIntegratedNoteType();

        this.rendererIndex = 0;

        for (const cardType of integratedNoteType.cardTypes) {
            let showingBack = false;

            const renderer = this.getAndShowRenderer();
            renderer.renderFrontNote(note, cardType);

            renderer.elm.on("click", () => {
                if (showingBack) {
                    renderer.renderFrontNote(note, cardType);
                    showingBack = false;
                } else {
                    renderer.renderBackNote(note, cardType);
                    showingBack = true;
                }
            });
        }

        this.hideUnusedRenderers();
    }

    private getAndShowRenderer(): CardRenderer {
        const renderer = this.getRenderer();
        renderer.elm.removeClass("hidden");
        if (this.rendererIndex > this.numRenderersShowing) {
            this.numRenderersShowing = this.rendererIndex;
        }
        return renderer;
    }

    private hideUnusedRenderers() {
        for (let i = this.rendererIndex; i < this.numRenderersShowing; i++) {
            this.rendererPool[i].elm.class("hidden");
        }
        this.numRenderersShowing = this.rendererIndex;
    }

    private getRenderer(): CardRenderer {
        const currIndex = this.rendererIndex++;
        const availRenderer = this.rendererPool[currIndex];
        if (availRenderer) {
            return availRenderer;
        } else {
            const newRenderer = new CardRenderer().appendTo(this.elm);
            this.rendererPool[currIndex] = newRenderer;
            return newRenderer;
        }
    }
}
