import { Note, NoteType } from "../../database.js";
import { Component, Elm, InputElm } from "../../libs/elements.js";
import { Deck } from "../../logic.js";
import { EventHandler, Immutable } from "../../utils.js";
import { ModalDialog } from "./ModalDialog.js";

export class EditNoteDialog extends ModalDialog {
    public onSubmit = new EventHandler<Note>();

    private inputsContainer: Elm;
    private typeSelectElm: Elm<"select">;
    private cardPreview: CardPreview;

    private noteTypeIndex?: number;
    private inputElms?: InputElm[];

    constructor(private deck: Deck) {
        super("createNoteDialog");

        this.foregroundElm.append(
            new Elm().class("edit").append(
                new Elm("h2").append("Create Note"),
                this.typeSelectElm = new Elm("select").class("typeSelect")
                    .on("change", () => this.updateInputsElm()),
                this.inputsContainer = new Elm().class("inputs"),
                new Elm("button").append("Add")
                    .on("click", () => this.submit())
            ),
            new Elm().class("preview").append(
                new Elm("h3").append("Preview"),
                this.cardPreview = new CardPreview()
            )
        );

        this.loadNoteTypes();
    }

    public async setEditingNote(note: Immutable<Note>) {
        this.typeSelectElm.getHTMLElement().value =
            this.deck.database.getNoteTypes().indexOf(note.type).toString();
        await this.updateInputsElm();

        if (!this.inputElms) { throw new Error("Expected inputElms to be defined"); }

        for (let i = 0; i < this.inputElms.length; i++) {
            if (!note.fields[i]) { continue; }
            this.inputElms[i].setValue(note.fields[i]);
        }
    }

    public setCreatingNote() {
        this.updateInputsElm();
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
        this.cardPreview.setCardType(noteType);

        this.inputsContainer.clear();

        for (const fieldName of noteTypeIntegrated.fieldNames) {
            const inputElm = new InputElm().class("cardFieldInput");

            this.inputElms.push(inputElm);
            this.inputsContainer.append(
                new Elm("label").class("cardFieldLabel").append(fieldName, inputElm)
            );
        }
    }

    private submit() {
        if (this.noteTypeIndex === undefined || !this.inputElms) { return; }
        this.onSubmit.dispatch(Note.create(
            this.deck.database.getNoteTypes()[this.noteTypeIndex],
            this.inputElms.map(e => e.getValue() as string))
        );

        for (const inputElm of this.inputElms) {
            inputElm.setValue("");
        }
        this.inputElms[0].getHTMLElement().focus();
    }
}

class CardPreview extends Component {
    constructor() {
        super("cardPreview");
    }

    public async setCardType(noteType: Immutable<NoteType>) {
        this.elm.clear();

        const integrated = await noteType.getIntegratedNoteType();

        console.log(integrated);
        for (const cardType of integrated.cardTypes) {
            this.elm.append(cardType.frontTemplate);
        }
    }
}