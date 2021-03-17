import { CardState } from "../../dataTypes.js";
import { Component, Elm } from "../../libs/elements.js";
import { Deck } from "../../logic.js";
import { ModalDialog } from "./ModalDialog.js";

export class ManageNotesDialog extends ModalDialog {
    private notesList: Elm;

    constructor(deck: Deck) {
        super("manageNotesDialog");

        this.foregroundElm.append(
            new Elm("h1").append("Manage notes"),
            this.notesList = new Elm().class("notesList")
        );

        for (const item of deck.database.getNotes()) {
            const label = item.fields[0].slice(0, 20);
            new Elm()
                .append(
                    new Elm().class("label").append(label),
                    new Elm().class("cards").withSelf(cards => {
                        for (const cardUid of item.cardUids) {
                            const card = deck.database.getCardByUid(cardUid);
                            cards.append(
                                new Elm().class("card").append(CardState[card.state])
                            )
                        }
                    })
                )
                .appendTo(this.notesList);
        }
    }
}

class RecyclingList extends Component {
    constructor() {
        super("recyclingList");
    }
}
