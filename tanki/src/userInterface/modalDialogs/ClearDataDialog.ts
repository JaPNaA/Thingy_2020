import { Elm } from "../../libs/elements.js";
import { Deck } from "../../logic.js";
import { EventHandler } from "../../utils.js";
import { ModalDialog } from "./ModalDialog.js";

export class ClearDataDialog extends ModalDialog {
    public onDataClear = new EventHandler();
    private clearOptionsElm: Elm;

    constructor(private deck: Deck) {
        super("clearDataDialog");

        this.foregroundElm.append(
            new Elm("h3").append("Clear data"),
            this.clearOptionsElm = new Elm().class("sourcesList").append(
                new Elm("button").append("Clear notes")
                    .on("click", () => this.clearNotes()),
                new Elm("button").append("Reset notes")
                    .on("click", () => this.resetNotes())
            )
        )
    }

    private clearNotes() {
        this.clearOptionsElm.remove();

        this.foregroundElm.append(
            new Elm().append("Delete all your notes and progress? You will still have your note types and settings."),
            new Elm("button").append("Clear everything").on("click", () => {
                const notes = this.deck.database.getNotes();
                this.deck.database.startUndoLogGroup();
                for (let i = notes.length - 1; i >= 0; i--) {
                    this.deck.database.removeNote(notes[i]);
                }
                this.deck.database.endUndoLogGroup();
                this.onDataClear.dispatch();
            })
        );
    }

    private resetNotes() {
        this.clearOptionsElm.remove();

        this.foregroundElm.append(
            new Elm().append("Delete all your progress? Your notes will all become 'new'."),
            new Elm("button").append("Reset notes").on("click", () => {
                const notes = this.deck.database.getNotes();
                this.deck.database.startUndoLogGroup();
                for (const note of notes) {
                    for (const cardUid of note.cardUids) {
                        this.deck.database.deactivateCard(this.deck.database.getCardByUid(cardUid));
                    }
                }
                this.deck.database.endUndoLogGroup();
                this.onDataClear.dispatch();
            })
        );
    }
}