import { Note, NoteType } from "../../database.js";
import { Elm, InputElm } from "../../libs/elements.js";
import { Deck } from "../../logic.js";
import { EventHandler } from "../../utils.js";
import { ModalDialog } from "./ModalDialog.js";

export class CreateNoteDialog extends ModalDialog {
    public onNoteCreated = new EventHandler<Note>();

    private inputsContainer: Elm;
    private typeSelectElm: Elm<"select">;

    private noteTypeIndex?: number;
    private inputElms?: InputElm[];

    constructor(private deck: Deck) {
        super("createNoteDialog");

        this.foregroundElm.append(
            new Elm("h2").append("Create Note"),
            this.typeSelectElm = new Elm("select").class("typeSelect")
                .on("change", () => this.updateInputsElm()),
            this.inputsContainer = new Elm().class("inputs"),
            new Elm("button").append("Add")
                .on("click", () => this.submit())
        );

        this.loadNoteTypes();
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
        this.inputsContainer.clear();

        const noteType = noteTypes[this.noteTypeIndex];

        for (const fieldName of
            (await NoteType.getIntegratedNoteType(noteType)).fieldNames
        ) {
            const inputElm = new InputElm().class("cardFieldInput");

            this.inputElms.push(inputElm);
            this.inputsContainer.append(
                new Elm("label").class("cardFieldLabel").append(fieldName, inputElm)
            );
        }
    }

    private submit() {
        if (this.noteTypeIndex === undefined || !this.inputElms) { return; }
        this.onNoteCreated.dispatch(Note.create(
            this.deck.database.getNoteTypes()[this.noteTypeIndex],
            this.inputElms.map(e => e.getValue() as string))
        );

        for (const inputElm of this.inputElms) {
            inputElm.setValue("");
        }
        this.inputElms[0].getHTMLElement().focus();
    }
}
