import { ActivatedCard, Card, Note } from "../database.js";
import { Component, Elm } from "../libs/elements.js";
import { Deck } from "../logic.js";
import { writeOut } from "../storage.js";
import { DeckTimeline } from "./DeckTimeline.js";
import { EventHandler, Immutable, PromiseRejectFunc, PromiseResolveFunc, setImmediatePolyfill, wait } from "../utils.js";
import { ManageNotesDialog } from "./modalDialogs/ManageNotesDialog.js";
import { EditNoteDialog } from "./modalDialogs/EditNoteDialog.js";
import { ImportNotesDialog } from "./modalDialogs/ImportNotesDialog.js";
import AnimateInOutElm from "./AnimateInOutElm.js";
import { CardFlag, CardState } from "../dataTypes.js";
import jishoWithHistory from "../jishoWithHistory.js";
import { CardRenderer } from "./CardRenderer.js";
import { ModalDialog } from "./modalDialogs/ModalDialog.js";
import { EditNoteTypeDialog } from "./modalDialogs/EditNoteTypeDialog.js";

export class TankiInterface extends Component {
    private deckPresenter: DeckPresenter;

    constructor(deck: Deck) {
        super("tankiInterface");
        this.deckPresenter = new DeckPresenter(deck);
        this.elm.append(this.deckPresenter);
        this.elm.append(
            new Elm("button").class("writeOut")
                .append("Write Out")
                .on("click", () => {
                    writeOut(deck);
                })
        );

        //* temporary
        addEventListener("keydown", e => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            if (e.code === "KeyZ") {
                deck.database.undo();
            }
        });

        deck.database.onUndo.addHandler(() =>
            this.showSnackbar("Undid", 1500)
        );

        this.deckPresenter.onExit.addHandler(() => writeOut(deck));
    }

    public async showSnackbar(content: any, time: number) {
        const snackbar = new Snackbar(content);
        this.elm.append(snackbar);
        await wait(time);
        snackbar.remove();
    }
}

class DeckPresenter extends Component {
    public onExit = new EventHandler();

    private cardPresenter: CardPresenter;
    private deckTimeline: DeckTimeline;

    private cardPresenterContainer: Elm;

    private presenting: boolean = false;

    constructor(private deck: Deck) {
        super("deckPresenter");

        this.cardPresenter = new CardPresenter();
        this.deckTimeline = new DeckTimeline(this.deck);

        this.elm.append(
            this.cardPresenterContainer = new Elm().class("cardPresenterContainer")
                .append(this.cardPresenter),
            new Elm().class("timeline").append(this.deckTimeline),
            new Elm().append(
                new Elm("button").class("exitButton")
                    .append("Exit")
                    .on("click", () => this.exitCardPresenter()),
                new Elm("button").class("enterButton")
                    .append("Enter")
                    .on("click", () => this.enterCardPresenter())
            ),
            new Elm().append(
                new Elm("button").class("createNote")
                    .append("Create Note")
                    .on("click", () => this.openCreateNoteDialog()),
                new Elm("button").class("importNotes")
                    .append("Import Notes")
                    .on("click", () => this.openImportNotesDialog()),
                new Elm("button").class("manageNotes")
                    .append("Manage Notes")
                    .on("click", () => this.openDialog(ManageNotesDialog)),
                new Elm("button").class("editNoteType")
                    .append("Edit Note Templates")
                    .on("click", () => this.openDialog(EditNoteTypeDialog)),
                new Elm("button").class("graduateNotes")
                    .append("Graduate Notes")
                    .on("click", () => {
                        //* this button is temporary
                        // todo: automatically gradate cards

                        this.deck.database.startUndoLogGroup();
                        const cards = this.deck.database.getCards();
                        for (const card of cards) {
                            if (
                                card instanceof ActivatedCard &&
                                card.state === CardState.active &&
                                card.interval > 21 * 24 * 60
                            ) {
                                const cardEdit = card.clone();
                                cardEdit.state = CardState.inactive;
                                cardEdit.addFlag(CardFlag.graduated);
                                this.deck.database.writeEdit(cardEdit);
                            }
                        }
                        this.deck.database.endUndoLogGroup();
                    })
            ),
            new Elm().append(
                new Elm("button").class("JishoWithHistory")
                    .append("Jisho With History")
                    .on("click", () => {
                        jishoWithHistory.openWindow();
                    })
            ),
            new Elm("button").class("undo")
                .append("Undo")
                .on("click", () => deck.database.undo())
        );

        this.escKeyExitHandler = this.escKeyExitHandler.bind(this);

        jishoWithHistory.getData.addHandler(data => {
            this.openImportNotesDialogWithJishoApiData(data);
        });

        this.enterCardPresenter();
    }

    private async presentingLoop() {
        if (this.presenting) { return; }
        this.presenting = true;

        while (true) {
            const selectedCard = this.deck.selectCard();
            if (selectedCard) {
                let result;
                try {
                    result = await this.cardPresenter.presentCard(selectedCard);
                } catch (interrupt) {
                    console.log(interrupt);
                    break;
                }

                this.deck.database.startUndoLogGroup();
                this.deck.applyResultToCard(selectedCard, result);
                this.deck.database.endUndoLogGroup();
            } else {
                break;
            }
        }

        this.exitCardPresenter();
        this.onExit.dispatch();
        this.presenting = false;
    }

    private addEscKeyExitHandler() {
        addEventListener("keydown", this.escKeyExitHandler);
    }

    private removeEscKeyExitHandler() {
        removeEventListener("keydown", this.escKeyExitHandler);
    }

    private escKeyExitHandler(event: KeyboardEvent) {
        if (event.key === "Escape") {
            this.exitCardPresenter();
        }
    }

    private async openCreateNoteDialog() {
        this.exitCardPresenter();

        const createNoteDialog = new EditNoteDialog(this.deck).appendTo(this.elm).setPositionFixed();
        createNoteDialog.setCreatingNote();

        createNoteDialog.onSubmit.addHandler(note => {
            this.deck.database.startUndoLogGroup();
            this.deck.database.addNote(note);
            this.deck.database.endUndoLogGroup();
        });
    }

    private async openImportNotesDialogWithJishoApiData(data: string) {
        const dialog = this.openImportNotesDialog();
        dialog.setJishoAPIData(data);
    }

    private openImportNotesDialog() {
        const importNotesDialog = this.openDialog(ImportNotesDialog);
        importNotesDialog.onImported.addHandler(() => {
            importNotesDialog.remove();
        });

        return importNotesDialog;
    }

    private openDialog<T extends ModalDialog>(dialog: new (deck: Deck) => T): T {
        this.exitCardPresenter();
        return new dialog(this.deck).appendTo(this.elm).setPositionFixed();
    }

    private exitCardPresenter() {
        this.cardPresenter.discardState();
        this.removeEscKeyExitHandler();
        this.cardPresenterContainer.class("hidden");
    }

    private enterCardPresenter() {
        this.cardPresenterContainer.removeClass("hidden");
        this.presentingLoop();
        this.addEscKeyExitHandler();
    }
}

class CardPresenter extends Component {
    public rating?: number;

    private inputGetter = new QuickUserInputGetter();
    private currentState?: {
        card: Immutable<Card>;
    };

    private cardRenderer: CardRenderer = new CardRenderer();

    constructor() {
        super("cardPresenter");
        this.elm.append(this.cardRenderer, this.inputGetter);
    }

    public async presentCard(card: Immutable<Card>): Promise<number> {
        if (this.currentState) {
            this.discardState();
        }

        this.currentState = { card };

        this.cardRenderer.renderFront(card);
        await this.inputGetter.options(["Show back"]);

        this.cardRenderer.renderBack(card);
        const rating = await this.inputGetter.options(["Forgot", "Remembered"], 1);

        this.discardState();

        return rating;
    }

    public discardState() {
        if (!this.currentState) { return; }
        this.inputGetter.discardState();
        this.currentState = undefined;
    }
}


/**
 * Can recieve inputs quickly from user
 */
class QuickUserInputGetter extends Component {
    private state?: {
        promiseReject: PromiseRejectFunc,
        documentKeydownListener: (e: KeyboardEvent) => void,
        elm: HTMLDivElement
    };

    constructor() {
        super("quickUserInputGetter");
    }

    public options(items: string[], defaultIndex?: number): Promise<number> {
        this.discardState();

        const optionsContainer = document.createElement("div");

        let promiseRes: PromiseResolveFunc<number>,
            promiseRej!: PromiseRejectFunc;
        const promise: Promise<number> = new Promise((res, rej) => {
            promiseRej = rej;
            promiseRes = res;
        });

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const button = document.createElement("button");
            button.innerText = item;
            button.addEventListener("click", () => {
                promiseRes(i);
                this.discardState();
            });
            optionsContainer.appendChild(button);
        }

        this.elm.append(optionsContainer);

        const keydownHandler = (e: KeyboardEvent) => {
            if (e.repeat) { return; }

            const numberKey = parseInt(e.key) - 1;
            let wasValidInput = true;
            if (!isNaN(numberKey) && numberKey < items.length && numberKey >= 0) {
                promiseRes(numberKey);
            } else if (e.key === " " || e.key === "Enter") {
                promiseRes(defaultIndex ?? 0);
            } else {
                wasValidInput = false;
            }

            if (wasValidInput) {
                e.preventDefault();
                this.discardState();
            }
        };

        document.addEventListener("keydown", keydownHandler);

        this.state = {
            promiseReject: promiseRej,
            elm: optionsContainer,
            documentKeydownListener: keydownHandler
        };

        return promise;
    }

    public discardState() {
        if (!this.state) { return; }
        this.elm.getHTMLElement().removeChild(this.state.elm);
        document.removeEventListener("keydown", this.state.documentKeydownListener);
        this.state.promiseReject("State discarded");
        this.state = undefined;
    }
}

class Snackbar extends AnimateInOutElm {
    protected animationOutTime = 150;

    constructor(content: any) {
        super("snackbar");

        this.elm.append(content);
    }
}
