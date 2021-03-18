import { Note } from "../../database.js";
import { Component, Elm } from "../../libs/elements.js";
import { Deck } from "../../logic.js";
import { Immutable } from "../../utils.js";
import { ModalDialog } from "./ModalDialog.js";

export class ManageNotesDialog extends ModalDialog {
    private notesList: Elm;

    constructor(deck: Deck) {
        super("manageNotesDialog");

        this.foregroundElm.append(
            new Elm("h1").append("Manage notes"),
            this.notesList = new NotesRecyclingList(
                deck.database.getNotes() as Immutable<Note>[], deck
            )
        );
    }
}

abstract class RecyclingList<T> extends Component {
    private listElms: Elm[] = [];
    private listElmsContainer = new Elm().class("elmsContainer");
    private bottomBufferElm = new Elm();

    constructor(private list: T[], private listElmHeight: number) {
        super("recyclingList");

        for (let i = 0; i < 15; i++) {
            const recyclingListItem = new RecyclingListItem(listElmHeight);
            this.listElms.push(recyclingListItem);
            this.listElmsContainer.append(recyclingListItem);
        }

        this.append(this.listElmsContainer);
        this.append(this.bottomBufferElm);

        this.on("scroll", () => this.scrollHandler());
    }

    private scrollHandler() {
        const maxStartIndex = this.list.length - this.listElms.length;
        const startIndex = Math.min(Math.floor(this.elm.scrollTop / this.listElmHeight), maxStartIndex);
        this.listElmsContainer.attribute("style", `margin-top: ${startIndex * this.listElmHeight}px`);

        for (let i = 0; i < this.listElms.length; i++) {
            const content = this.list[startIndex + i];
            this.listElms[i].replaceContents(this.getContentForListItem(content));
        }

        this.bottomBufferElm.attribute("style", `height: ${(this.list.length - (startIndex + this.listElms.length)) * this.listElmHeight
            }px`);
    }

    protected abstract getContentForListItem(item: T): Elm;
}

class RecyclingListItem extends Component {
    constructor(elmHeight: number) {
        super("recyclingListItem");

        this.attribute("style", "height: " + elmHeight + "px");

        this.append("Owo");
    }
}

class NotesRecyclingList extends RecyclingList<Immutable<Note>> {
    constructor(items: Immutable<Note>[], private deck: Deck) {
        super(items, 64);
    }

    protected getContentForListItem(note: Immutable<Note>): Elm {
        const label = note.fields[0].slice(0, 20);
        return new Elm().append(
            new Elm().class("label").append(label),
            new Elm().class("cards").withSelf(cards => {
                // for (const cardUid of note.cardUids) {
                //     const card = this.deck.database.getCardByUid(cardUid);
                //     cards.append(
                //         new Elm().class("card").append(CardState[card.state])
                //     )
                // }
            })
        );
    }
}
