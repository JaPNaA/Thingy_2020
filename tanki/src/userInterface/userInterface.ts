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
                deck.database.logs.undo();
                deck.updateCache();
                this.deckPresenter.update();
                this.showSnackbar("Undid", 1500);
            }
        });

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
        deck.loaded.then(() => this.deckTimeline.update());

        this.elm.append(
            this.cardPresenterContainer = new Elm().class("cardPresenterContainer")
                .append(this.cardPresenter),
            new Elm().class("timeline").append(this.deckTimeline),
            new Elm("button").class("exitButton")
                .append("Exit")
                .on("click", () => this.exitCardPresenter()),
            new Elm("button").class("enterButton")
                .append("Enter")
                .on("click", () => this.enterCardPresenter()),
            new Elm("button").class("createNote")
                .append("Create Note")
                .on("click", () => this.openCreateNoteDialog()),
            new Elm("button").class("importNotes")
                .append("Import Notes")
                .on("click", () => this.openImportNotesDialog()),
            new Elm("button").class("manageNotes")
                .append("Manage Notes")
                .on("click", () => this.openManageNotesDialog()),
            new Elm("button").class("JishoWithHistory")
                .append("Jisho With History")
                .on("click", () => {
                    jishoWithHistory.openWindow();
                }),
            new Elm("button").class("graduateNotes")
                .append("Graduate Notes")
                .on("click", () => {
                    //* this button is temporary
                    // todo: automatically gradate cards

                    this.deck.database.logs.startGroup();
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
                    this.deck.updateCache();
                    this.deckTimeline.update();
                    this.deck.database.logs.endGroup();
                })
        );

        this.escKeyExitHandler = this.escKeyExitHandler.bind(this);

        jishoWithHistory.getData.addHandler(data => {
            this.openImportNotesDialogWithJishoApiData(data);
        });

        this.enterCardPresenter();
    }

    public update() {
        this.deckTimeline.update();
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

                this.deck.database.logs.startGroup();
                this.deck.applyResultToCard(selectedCard, result);
                this.deck.database.logs.endGroup();
            } else {
                break;
            }

            this.deckTimeline.update();
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
        const note = await new Promise<Note>(res => {
            createNoteDialog.onSubmit.addHandler(note => {
                res(note);
            });
        });

        this.deck.database.logs.startGroup();
        this.deck.addNoteAndUpdate(note);
        this.deck.database.logs.endGroup();

        this.deckTimeline.update();
        createNoteDialog.remove();
    }

    private async openImportNotesDialogWithJishoApiData(data: string) {
        const dialog = this.openImportNotesDialog();
        dialog.setJishoAPIData(data);
    }

    private openImportNotesDialog() {
        this.exitCardPresenter();

        const importNotesDialog = new ImportNotesDialog(this.deck).appendTo(this.elm).setPositionFixed();
        importNotesDialog.onImported.addHandler(() => {
            this.deckTimeline.update();
            importNotesDialog.remove();
        });

        return importNotesDialog;
    }

    private openManageNotesDialog() {
        this.exitCardPresenter();

        new ManageNotesDialog(this.deck).appendTo(this.elm).setPositionFixed();
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

        const noteType = await card.parentNote.type.getIntegratedNoteType();
        const cardType = noteType.cardTypes[card.cardTypeID];

        const noteFieldNames = noteType.fieldNames;
        const cardFields = card.parentNote.fields;

        this.currentState = { card };

        this.cardRenderer.render(
            cardType.frontTemplate,
            noteFieldNames, cardFields,
            noteType.style,
            [noteType.script, cardType.frontScript]
        );
        await this.inputGetter.options(["Show back"]);

        this.cardRenderer.render(
            cardType.backTemplate.replace("{{frontTemplate}}", cardType.frontTemplate),
            noteFieldNames, cardFields,
            noteType.style,
            [noteType.script, cardType.backScript]
        );

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
