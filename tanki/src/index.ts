class Deck {
    public elm: HTMLDivElement;

    private cardPresenter = new CardPresenter();

    private graduatedCards: Card[] = [];
    private seenCardsSorted: Card[] = [];
    private newCards: Card[] = [];

    private newCardSettings: CardData = [
        /** State */
        CardState.new,
        /** Interval in minutes */
        1,
        /** Difficulty factor */
        1,
        /** Due date in minutes ( [Date#getTime() / 60_000] )*/
        0
    ];

    constructor(private data: DeckData) {
        this.generateCardArrays();
        this.elm = document.createElement("div");
        this.elm.classList.add("deck");
        this.elm.appendChild(this.cardPresenter.elm);
    }

    public showCard() {
        const card = this.selectCard();
        if (!card) { return; }

        this.cardPresenter.showCard(card, this.data)
            .then(e => {
                if (e === 1) {
                    card.data[1] *= 2 * card.data[2];
                    //       .interval           .difficultyFactor

                    card.data[3] = getMinuteFloored() + card.data[1];
                    //       .dueDate                         .interval
                } else {
                    card.data[3] = getMinuteFloored() + card.data[1];
                    //       .dueDate                         .interval
                }
                if (card.data[0] === CardState.new) {
                    // copy into actual data object
                    card.parentNote[2][card.cardTypeID] = card.data;
                    //             .cardData
                }
                this.sortSeenCards();
            });
    }

    public addNote(data: NoteData) {
        this.data.notes.unshift(data);
        this.generateCardArrays();
        this.showCard();
    }


    private generateCardArrays() {
        this.graduatedCards.length = 0;
        this.newCards.length = 0;
        this.seenCardsSorted.length = 0;

        for (const note of this.data.notes) {
            const noteID = note[0];
            const noteType = this.data.noteTypes[noteID];
            const noteType_NumCardType = noteType.cardTypes.length;
            for (let i = 0; i < noteType_NumCardType; i++) {
                const card = note[2][i];

                if (card === 0 || card === undefined) {
                    this.newCards.push(
                        new Card(arrayCopy(this.newCardSettings), i, note)
                    )
                } else if (card[0] === CardState.graduated) {
                    this.graduatedCards.push(
                        new Card(card, i, note)
                    );
                } else {
                    this.seenCardsSorted.push(
                        new Card(card, i, note)
                    );
                }
            }
        }

        this.sortSeenCards();
    }

    public exportToString(): string {
        return JSON.stringify(this.data);
    }

    /** sort latest due first */
    private sortSeenCards() {
        this.seenCardsSorted.sort((a, b) => a.data[3] - b.data[3]);
    }

    private selectCard(): Card | undefined {
        const nowMinute = getMinuteFloored();

        console.log("Next card in", this.seenCardsSorted[0].data[3] - nowMinute, "minutes");

        if (this.seenCardsSorted.length && this.seenCardsSorted[0].data[3] <= nowMinute) {
            return this.seenCardsSorted[0];
        } else {
            return this.newCards[0];
        }
    }
}

function getMinuteFloored(): number {
    return Math.floor(Date.now() / 60e3);
}

function arrayCopy<T extends Array<any>>(arr: T): T {
    // @ts-ignore
    return arr.slice(0);
}

function decodeToDeck(str: string): Deck {
    const obj: DeckData = JSON.parse(str);
    const deck = new Deck(obj);
    return deck;
}

class CardPresenter {
    public elm: HTMLElement;

    public rating?: number;

    private currentState?: {
        card: Card;
        cardElm: HTMLDivElement;
        front?: CardFaceDisplay;
        back?: CardFaceDisplay;
    };

    constructor() {
        this.elm = document.createElement("div");
        this.elm.classList.add("cardPresenter");
    }

    public async showCard(card: Card, deckData: DeckData): Promise<number> {
        if (this.currentState) {
            this.discardState();
        }

        const cardElm = document.createElement("div");
        cardElm.classList.add("card");
        this.elm.appendChild(cardElm);


        const noteTypeID = card.parentNote[0]; // .type
        const noteType: NoteTypeData =
            deckData.noteTypes[noteTypeID];
        const cardType: CardTypeData = noteType.cardTypes[card.cardTypeID];

        const noteFieldNames = noteType.fieldNames;
        const cardFields = card.parentNote[1]; // .fields

        this.currentState = { card, cardElm };

        const front = this.createFaceDisplay(
            cardType.frontTemplate,
            noteFieldNames, cardFields
        );
        this.currentState.front = front;
        cardElm.appendChild(front.elm);
        front.startListening();
        await front.ratingPromise;

        const back = this.createFaceDisplay(
            cardType.backTemplate,
            noteFieldNames, cardFields
        );
        this.currentState.back = back;
        cardElm.appendChild(back.elm);
        back.startListening();

        const rating = await back.ratingPromise;

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


interface DeckData {
    noteTypes: NoteTypeData[];
    notes: NoteData[];
}

interface NoteTypeData {
    name: string;
    fieldNames: string[];
    cardTypes: CardTypeData[];
}

interface CardTypeData {
    name: string;
    frontTemplate: string;
    backTemplate: string;
}

interface NoteData extends Array<any> {
    /** Type of note */
    0: number;
    /** Fields */
    1: string[];
    /** Card data */
    2: (CardData | undefined | 0)[];
}

interface CardData extends Array<any> {
    /** State */
    0: CardState;
    /** Interval in minutes */
    1: number;
    /** Difficulty factor */
    2: number;
    /** Due date in minutes ( [Date#getTime() / 60_000] )*/
    3: number;
}

enum CardState {
    /** Not yet shown */
    new = 0,
    /** Just after showing or after 'forgetting' a card */
    learn = 1,
    /** Passing 'learn' */
    seen = 2,
    /** No longer in short-term reviews */
    graduated = 3
}

class Card {
    constructor(
        public data: CardData,
        public cardTypeID: number,
        public parentNote: NoteData
    ) { }
}

class CardFaceDisplay {
    public elm: HTMLDivElement;

    private promiseAccept!: (rating: number) => void;
    private promiseReject!: () => void;
    public ratingPromise: Promise<number> = new Promise((acc, rej) => {
        this.promiseAccept = acc;
        this.promiseReject = rej;
    });

    constructor(content: string) {
        this.elm = document.createElement("div");
        this.elm.innerHTML = content;

        this.rateYesHandler = this.rateYesHandler.bind(this);
        this.rateNoHandler = this.rateNoHandler.bind(this);
    }

    public startListening() {
        document.getElementById("rateYes")?.addEventListener("click", this.rateYesHandler);
        document.getElementById("rateNo")?.addEventListener("click", this.rateNoHandler);
    }

    public stopListening() {
        document.getElementById("rateYes")?.removeEventListener("click", this.rateYesHandler);
        document.getElementById("rateNo")?.removeEventListener("click", this.rateNoHandler);
        this.promiseReject();
    }

    private rateYesHandler() {
        this.promiseAccept(1);
        this.stopListening();
    }

    private rateNoHandler() {
        this.promiseAccept(0);
        this.stopListening();
    }
}

function promptUser(message: string): Promise<string> {
    const promptContainer = document.createElement("elm");
    promptContainer.classList.add("prompt");

    const messageElm = document.createElement("div");
    messageElm.innerHTML = message;
    promptContainer.appendChild(messageElm);

    const input = document.createElement("input");
    const promise: Promise<string> = new Promise(res =>
        input.addEventListener("change", function () {
            res(input.value);
            document.body.removeChild(promptContainer);
        })
    );
    promptContainer.append(input);
    document.body.appendChild(promptContainer);

    return promise;
}

const fs = require("fs");

async function main() {
    const deckDataPath = "./deckData.json";
    const deck = decodeToDeck(fs.readFileSync(deckDataPath).toString());

    document.body.appendChild(deck.elm);
    deck.showCard();

    document.getElementById("createNote")?.addEventListener("click", async function () {
        const type = parseInt(await promptUser("Type:"));
        const f1 = await promptUser("Field 1:");
        const f2 = await promptUser("Field 2:");
        deck.addNote([type, [f1, f2], []]);
    });

    document.getElementById("writeOut")?.addEventListener("click", function () {
        const exportStr = deck.exportToString();
        fs.writeFileSync(deckDataPath, exportStr);
    });

    console.log(deck);
}

main();
