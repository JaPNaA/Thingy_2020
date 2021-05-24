import { NoteType } from "../../database.js";
import { NoteTypeDataIntegrated } from "../../dataTypes.js";
import { Elm } from "../../libs/elements.js";
import { Deck } from "../../logic.js";
import { Immutable } from "../../utils.js";
import { ModalDialog } from "./ModalDialog.js";

export class EditNoteTypeDialog extends ModalDialog {
    private selectNoteElm: Elm;

    constructor(private deck: Deck) {
        super("editNoteTypeDialog");

        this.foregroundElm.append(
            new Elm("h2").append("Edit Note Template"),
            this.selectNoteElm = new Elm().withSelf(self => {
                for (const type of deck.database.getNoteTypes()) {
                    self.append(
                        new Elm("button").append(type.name)
                            .on("click", () => {
                                this.editNoteType(type);
                            })
                    );
                }
            })
        );
    }

    private async editNoteType(type: Immutable<NoteType>) {
        this.selectNoteElm.remove();

        const typeEdit = type.clone();
        const integratedNoteType = await typeEdit.getIntegratedNoteType() as NoteTypeDataIntegrated; // allowed because cloned

        const elm = new Elm();

        for (const cardType of integratedNoteType.cardTypes) {
            const frontTemplateTextarea = new Elm("textarea")
                .append(cardType.frontTemplate)
                .on("change", () => {
                    cardType.frontTemplate = frontTemplateTextarea.getHTMLElement().value;
                    this.deck.database.writeEdit(typeEdit);
                })
                .appendTo(elm);
            const backTemplateTextarea = new Elm("textarea")
                .append(cardType.backTemplate)
                .on("change", () => {
                    cardType.backTemplate = backTemplateTextarea.getHTMLElement().value;
                    this.deck.database.writeEdit(typeEdit);
                })
                .appendTo(elm);
        }

        this.foregroundElm.append(elm);
    }
}
