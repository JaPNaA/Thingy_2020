import { Note } from "../../database.js";
import { Component, Elm } from "../../libs/elements.js";
import { Deck } from "../../logic.js";
import { boundBetween, Immutable } from "../../utils.js";
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
    private elmsList: Elm[] = [];
    private listElmsContainer = new Elm().class("elmsContainer");
    private bottomBufferElm = new Elm();

    private bufferedPixelsTop = 0;
    private bufferedPixelsBottom = 0;

    constructor(private dataList: T[], private listElmHeight: number) {
        super("recyclingList");

        for (let i = 0; i < 15; i++) {
            const recyclingListItem = new RecyclingListItem(listElmHeight);
            this.elmsList.push(recyclingListItem);
            this.listElmsContainer.append(recyclingListItem);
        }

        this.append(this.listElmsContainer);
        this.append(this.bottomBufferElm);

        this.on("scroll", () => this.scrollHandler());
        this.scrollHandler();
    }

    private scrollHandler() {
        if (this.bufferedElementsCoversViewbox()) { return; }

        const maxStartIndex = this.dataList.length - this.elmsList.length;
        const bufferStartIndex = boundBetween(0, Math.floor(this.elm.scrollTop / this.listElmHeight - this.elmsList.length / 2), maxStartIndex);

        this.bufferedPixelsTop = bufferStartIndex * this.listElmHeight;
        this.listElmsContainer.attribute("style", `margin-top: ${this.bufferedPixelsTop}px`);

        for (let i = 0; i < this.elmsList.length; i++) {
            const content = this.dataList[bufferStartIndex + i];
            this.elmsList[i].replaceContents(this.getContentForListItem(content));
        }

        this.bufferedPixelsBottom = (bufferStartIndex + this.elmsList.length) * this.listElmHeight;
        this.bottomBufferElm.attribute("style", `height: ${this.dataList.length * this.listElmHeight - this.bufferedPixelsBottom}px`);
    }

    private bufferedElementsCoversViewbox(): boolean {
        return this.bufferedPixelsTop < this.elm.scrollTop &&
            this.elm.scrollTop + this.elm.clientHeight < this.bufferedPixelsBottom;
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

