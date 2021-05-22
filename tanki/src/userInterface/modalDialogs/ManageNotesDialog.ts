import { Note } from "../../database.js";
import { CardState } from "../../dataTypes.js";
import { Component, Elm, InputElm } from "../../libs/elements.js";
import { Deck } from "../../logic.js";
import { boundBetween, EventHandler, Immutable } from "../../utils.js";
import { EditNoteDialog } from "./EditNoteDialog.js";
import { ModalDialog } from "./ModalDialog.js";

export class ManageNotesDialog extends ModalDialog {
    private notesList: NotesRecyclingList;

    constructor(deck: Deck) {
        super("manageNotesDialog");

        let searchBox: InputElm;

        this.foregroundElm.append(
            new Elm("h1").append("Manage notes"),
            new Elm().append(
                "Search: ",
                searchBox = new InputElm().on("change", () => {
                    const search = searchBox.getValue() as string;
                    if (!search) {
                        this.notesList.setDataList(deck.database.getNotes() as Immutable<Note>[]);
                        return;
                    }

                    const results = deck.database.getNotes().filter(note => {
                        for (const field of note.fields) {
                            if (field.includes(search)) {
                                return true;
                            }
                        }
                        return false;
                    });

                    this.notesList.setDataList(results);
                })
            ),
            this.notesList = new NotesRecyclingList(
                deck.database.getNotes() as Immutable<Note>[], deck
            )
        );

        this.notesList.onClick.addHandler(selectedCard => {
            console.log(selectedCard);

            const editNoteDialog = new EditNoteDialog(deck);
            editNoteDialog.setEditingNote(selectedCard);
            editNoteDialog.appendTo(this.elm);

            editNoteDialog.onSubmit.addHandler(editReturnCard => {
                const selectedCardEdit = selectedCard.clone();
                selectedCardEdit.fields = editReturnCard.fields;
                deck.database.writeEdit(selectedCardEdit);
                editNoteDialog.remove();
            });

            editNoteDialog.onDeleteButtonClick.addHandler(() => {
                if (confirm("Delete note?\n(Delete note is WIP)")) {
                    deck.database.removeNote(selectedCard);
                    this.notesList.update();
                    editNoteDialog.remove();
                }
            });
        });
    }
}

abstract class RecyclingList<T> extends Component {
    public onClick: EventHandler<T> = new EventHandler();

    private elmsList: RecyclingListItem<T>[] = [];
    private listElmsContainer = new Elm().class("elmsContainer");
    private bottomBufferElm = new Elm();

    private bufferedPixelsTop = 0;
    private bufferedPixelsBottom = 0;

    constructor(private dataList: T[], private listElmHeight: number) {
        super("recyclingList");

        for (let i = 0; i < 15; i++) {
            const recyclingListItem = new RecyclingListItem<T>(listElmHeight);
            recyclingListItem.onClick.addHandler(data => this.onClick.dispatch(data));
            this.elmsList.push(recyclingListItem);
            this.listElmsContainer.append(recyclingListItem);
        }

        this.elm.append(this.listElmsContainer);
        this.elm.append(this.bottomBufferElm);

        this.elm.on("scroll", () => this.scrollHandler());
    }

    public setDataList(dataList: T[]) {
        this.dataList = dataList;
        this.elm.getHTMLElement().scrollTop = 0;
        this.update();
    }

    public update() {
        const maxStartIndex = this.dataList.length - this.elmsList.length;
        const bufferStartIndex = boundBetween(0, Math.floor(this.elm.getHTMLElement().scrollTop / this.listElmHeight - this.elmsList.length / 2), maxStartIndex);

        this.bufferedPixelsTop = bufferStartIndex * this.listElmHeight;
        this.listElmsContainer.attribute("style", `margin-top: ${this.bufferedPixelsTop}px`);

        for (let i = 0; i < this.elmsList.length; i++) {
            const content = this.dataList[bufferStartIndex + i];
            if (content) {
                this.elmsList[i].setContent(
                    content, this.getContentForListItem(content)
                );
            }
        }

        this.bufferedPixelsBottom = (bufferStartIndex + this.elmsList.length) * this.listElmHeight;
        this.bottomBufferElm.attribute("style", `height: ${this.dataList.length * this.listElmHeight - this.bufferedPixelsBottom}px`);
    }

    private scrollHandler() {
        if (this.bufferedElementsCoversViewbox()) { return; }
        this.update();
    }

    private bufferedElementsCoversViewbox(): boolean {
        const htmlElm = this.elm.getHTMLElement();
        return this.bufferedPixelsTop < htmlElm.scrollTop &&
            htmlElm.scrollTop + htmlElm.clientHeight < this.bufferedPixelsBottom;
    }

    protected abstract getContentForListItem(item: T): Elm;
}

class RecyclingListItem<T> extends Component {
    public onClick: EventHandler<T> = new EventHandler();

    private itemData?: T;

    constructor(elmHeight: number) {
        super("recyclingListItem");

        this.elm.attribute("style", "height: " + elmHeight + "px");

        this.elm.append("Owo");

        this.elm.on("click", () => {
            if (!this.itemData) { return; }
            this.onClick.dispatch(this.itemData);
        });
    }

    public setContent(item: T, elm: Elm) {
        this.elm.replaceContents(elm);
        this.itemData = item;
    }
}

class NotesRecyclingList extends RecyclingList<Immutable<Note>> {
    constructor(items: Immutable<Note>[], private deck: Deck) {
        super(items, 64);
        this.update();
    }

    protected getContentForListItem(note: Immutable<Note>): Elm {
        const label = note.fields[0].slice(0, 20) + "...";
        return new Elm().append(
            new Elm().class("label").append(label),
            new Elm().class("cards").withSelf(cards => {
                for (const cardUid of note.cardUids) {
                    const card = this.deck.database.getCardByUid(cardUid);
                    const cardState = CardState[card.state];
                    cards.append(
                        new Elm().class("card", cardState).append(cardState)
                    );
                }
            })
        );
    }
}

