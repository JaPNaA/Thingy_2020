import { NoteTypeData, CardTypeData } from "./dataTypes.js";
import { Component, Elm } from "./libs/elements.js";
import { Card, Deck } from "./logic.js";
import { promptUser } from "./utils.js";

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

    constructor(private deck: Deck) {
        super("deckPresenter");

        this.cardPresenter = new CardPresenter(this.deck);
        this.deckTimeline = new DeckTimeline(this.deck);
        this.deckTimeline.update();

        this.append(
            new Elm().class("cardPresenterContainer").append(this.cardPresenter),
            new Elm().class("timeLine").append(this.deckTimeline),
            new Elm().class("createNote").on("click", () => this.openCreateNoteDialog())
        );

        this.presentingLoop();
    }

    private async presentingLoop() {
        while (true) {
            const selectedCard = this.deck.selectCard();
            if (selectedCard) {
                const result = await this.cardPresenter.presentCard(selectedCard);
                this.deck.applyResultToCard(selectedCard, result);
            } else {
                break;
            }

            this.deckTimeline.update();
        }
    }

    private async openCreateNoteDialog() {
        const type = parseInt(await promptUser("Type:"));
        const f1 = await promptUser("Field 1:");
        const f2 = await promptUser("Field 2:");
        console.log("Todo: add:", [type, [f1, f2], []]);
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
        cardElm: HTMLDivElement;
        front?: CardFaceDisplay;
        back?: CardFaceDisplay;
    };

    private noteTypes?: NoteTypeData[];

    constructor(deck: Deck) {
        super("cardPresenter");
        this.noteTypes = deck.getNoteTypes();
        this.inputGetter.appendTo(this);
    }

    public async presentCard(card: Card): Promise<number> {
        if (this.currentState) {
            this.discardState();
        }

        if (!this.noteTypes) { throw new Error("Note types not set"); }

        const cardElm = document.createElement("div");
        cardElm.classList.add("card");
        this.elm.appendChild(cardElm);


        const noteTypeID = card.parentNote[0]; // .type
        const noteType: NoteTypeData =
            this.noteTypes[noteTypeID];
        const cardType: CardTypeData = noteType.cardTypes[card.cardTypeID];

        const noteFieldNames = noteType.fieldNames;
        const cardFields = card.parentNote[1]; // .fields

        this.currentState = { card, cardElm };

        this.currentState.front = this.createFaceDisplay(
            cardType.frontTemplate,
            noteFieldNames, cardFields
        ).appendTo(cardElm);
        await this.inputGetter.options(["Show back"]);

        this.currentState.back = this.createFaceDisplay(
            cardType.backTemplate,
            noteFieldNames, cardFields
        ).appendTo(cardElm);

        const rating = await this.inputGetter.options(["Forgot", "Remembered"]);

        this.discardState();

        return rating;
    }

    private discardState() {
        if (!this.currentState) { return; }
        this.elm.removeChild(this.currentState.cardElm);
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
        promiseReject: () => void,
        elm: HTMLDivElement
    };

    constructor() {
        super("quickUserInputGetter");
    }

    public options(items: string[], defaultIndex?: number): Promise<number> {
        this.discardState();

        const optionsContainer = document.createElement("div");

        let promiseRes: (result: number) => void,
            promiseRej!: () => void;
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

        this.state = {
            promiseReject: promiseRej,
            elm: optionsContainer
        };

        return promise;
    }

    private discardState() {
        if (!this.state) { return; }
        this.elm.removeChild(this.state.elm);
        this.state.promiseReject();
        this.state = undefined;
    }
}
