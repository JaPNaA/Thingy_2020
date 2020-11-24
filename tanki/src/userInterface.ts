import { NoteTypeData, CardTypeData, NoteData } from "./dataTypes.js";
import { Component, Elm } from "./libs/elements.js";
import { Card, Deck } from "./logic.js";
import { PromiseRejectFunc, PromiseResolveFunc, promptUser, wait } from "./utils.js";

export class TankiInterface extends Component {
    private deckPresenter: DeckPresenter;

    constructor(deck: Deck) {
        super("tankiInterface");
        this.deckPresenter = new DeckPresenter(deck);
        this.deckPresenter.appendTo(this);
    }
}

class DeckPresenter extends Component {
    private cardPresenter: CardPresenter;
    private deckTimeline: DeckTimeline;

    private cardPresenterContainer: Elm;

    private presenting: boolean = false;

    constructor(private deck: Deck) {
        super("deckPresenter");

        this.cardPresenter = new CardPresenter(this.deck);
        this.deckTimeline = new DeckTimeline(this.deck);
        this.deckTimeline.update();

        this.append(
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
        );

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

                this.deck.applyResultToCard(selectedCard, result);
            } else {
                break;
            }

            this.deckTimeline.update();
        }

        this.presenting = false;
        this.exitCardPresenter();
    }

    private async openCreateNoteDialog() {
        this.exitCardPresenter();

        const createNoteDialog = new CreateNoteDialog(this.deck).appendTo(this.elm).setPositionFixed();
        const noteData = await createNoteDialog.requestCreateNote();
        console.log(noteData);
        createNoteDialog.remove();
    }

    private exitCardPresenter() {
        this.cardPresenter.discardState();
        this.cardPresenterContainer.class("hidden");
    }

    private enterCardPresenter() {
        this.cardPresenterContainer.removeClass("hidden");
        this.presentingLoop();
    }
}

abstract class ModalDialog extends Component {
    protected foregroundElm: Elm;

    constructor(name: string) {
        super(name);
        this.class("modalDialog");

        this.append(
            new Elm().class("modalBackground")
                .on("click", () => this.remove()),
            this.foregroundElm = new Elm().class("modalForeground").appendTo(this.elm)
        );
    }

    public setPositionFixed() {
        this.class("positionFixed");
        return this;
    }

    public async remove() {
        await this.hide();
        super.remove();
    }

    protected async show(elm: Elm) {
        await wait(1);
        this.foregroundElm.append(elm);
        this.class("showing");
    }

    protected async hide() {
        this.removeClass("showing");
        await wait(500);
        this.foregroundElm.clear();
    }
}

class CreateNoteDialog extends ModalDialog {
    constructor(private deck: Deck) {
        super("createNoteDialog");
    }

    public async requestCreateNote(): Promise<NoteData> {
        await this.show(new Elm().append("Create note"));

        const type = parseInt(await promptUser("Type:", this.foregroundElm));
        const f1 = await promptUser("Field 1:", this.foregroundElm);
        const f2 = await promptUser("Field 2:", this.foregroundElm);
        return [type, [f1, f2], []];
    }
}

class DeckTimeline extends Component {
    private nextCardInMinutesElm = new Elm("span");
    private newCardsElm = new Elm().class("new");
    private dueCardsElm = new Elm().class("seen");
    private graduatedCardsElm = new Elm().class("graduated");

    constructor(private deck: Deck) {
        super("deckTimeline");

        this.append(
            new Elm().append("Next review card in ", this.nextCardInMinutesElm, " minutes"),
            new Elm().class("cardCounts").append(
                this.newCardsElm, this.dueCardsElm, this.graduatedCardsElm
            )
        );

        this.nextCardInMinutesElm.append("~");
    }

    public update() {
        const counts = this.deck.getCardCount();

        this.nextCardInMinutesElm.replaceContents(this.deck.getMinutesToNextCard());
        this.newCardsElm.replaceContents(counts.new);
        this.dueCardsElm.replaceContents(this.deck.getDueCardsCount());
        this.graduatedCardsElm.replaceContents(counts.graduated);
    }
}

class CardPresenter extends Component {
    public rating?: number;

    private inputGetter = new QuickUserInputGetter();
    private currentState?: {
        card: Card;
    };

    private noteTypes?: NoteTypeData[];

    private cardContainer = new Elm().class("cardContainer");

    constructor(deck: Deck) {
        super("cardPresenter");
        this.noteTypes = deck.getNoteTypes();
        this.append(this.cardContainer, this.inputGetter);
    }

    public async presentCard(card: Card): Promise<number> {
        if (this.currentState) {
            this.discardState();
        }

        if (!this.noteTypes) { throw new Error("Note types not set"); }

        const cardElm = new Elm().class("card").appendTo(this.cardContainer);


        const noteTypeID = card.parentNote[0]; // .type
        const noteType: NoteTypeData =
            this.noteTypes[noteTypeID];
        const cardType: CardTypeData = noteType.cardTypes[card.cardTypeID];

        const noteFieldNames = noteType.fieldNames;
        const cardFields = card.parentNote[1]; // .fields

        this.currentState = { card };

        this.createFaceDisplay(
            cardType.frontTemplate,
            noteFieldNames, cardFields
        ).appendTo(cardElm);
        await this.inputGetter.options(["Show back"]);

        this.createFaceDisplay(
            cardType.backTemplate,
            noteFieldNames, cardFields
        ).appendTo(cardElm);

        const rating = await this.inputGetter.options(["Forgot", "Remembered"], 1);
        console.log(rating);

        this.discardState();

        return rating;
    }

    public discardState() {
        if (!this.currentState) { return; }
        this.inputGetter.discardState();
        this.cardContainer.clear();
        this.currentState = undefined;
    }

    private createFaceDisplay(
        contentTemplate: string, fieldNames: string[], fields: string[]
    ): CardFaceDisplay {
        const regexMatches = /{{(.+?)}}/g;
        let outString = "";
        let lastIndex = 0;

        for (let match; match = regexMatches.exec(contentTemplate);) {
            outString += contentTemplate.slice(lastIndex, match.index);
            const replaceFieldName = match[1];
            outString += fields[fieldNames.indexOf(replaceFieldName)] || "<<undefined>>";
            lastIndex = match.index + match[0].length;
        }

        outString += contentTemplate.slice(lastIndex);

        return new CardFaceDisplay(outString);
    }
}



class CardFaceDisplay extends Component {
    constructor(content: string) {
        super("cardFaceDisplay");
        this.elm.innerHTML = content;
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

        this.elm.appendChild(optionsContainer);

        const keydownHandler = (e: KeyboardEvent) => {
            const numberKey = parseInt(e.key) - 1;
            let wasValidInput = true;
            if (!isNaN(numberKey) && numberKey < items.length) {
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
        this.elm.removeChild(this.state.elm);
        document.removeEventListener("keydown", this.state.documentKeydownListener);
        this.state.promiseReject("State discarded");
        this.state = undefined;
    }
}
