import { NoteTypeData, CardTypeData } from "./dataTypes.js";
import { Card, Deck } from "./logic.js";

export class CardPresenter {
    public elm: HTMLElement;

    public rating?: number;

    private inputGetter = new QuickUserInputGetter();
    private currentState?: {
        card: Card;
        cardElm: HTMLDivElement;
        front?: CardFaceDisplay;
        back?: CardFaceDisplay;
    };

    private noteTypes?: NoteTypeData[];

    constructor() {
        this.elm = document.createElement("div");
        this.elm.classList.add("cardPresenter");
        this.elm.appendChild(this.inputGetter.elm);
    }

    public setNoteTypes(noteTypeData: NoteTypeData[]) {
        this.noteTypes = noteTypeData;
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

        const front = this.createFaceDisplay(
            cardType.frontTemplate,
            noteFieldNames, cardFields
        );
        this.currentState.front = front;
        cardElm.appendChild(front.elm);
        await this.inputGetter.options(["Show back"]);

        const back = this.createFaceDisplay(
            cardType.backTemplate,
            noteFieldNames, cardFields
        );
        this.currentState.back = back;
        cardElm.appendChild(back.elm);

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



export class CardFaceDisplay {
    public elm: HTMLDivElement;

    constructor(content: string) {
        this.elm = document.createElement("div");
        this.elm.innerHTML = content;
    }
}

/**
 * Can recieve inputs quickly from user
 */
export class QuickUserInputGetter {
    public elm: HTMLDivElement;

    private state?: {
        promiseReject: () => void,
        elm: HTMLDivElement
    };

    constructor() {
        this.elm = document.createElement("div");
        this.elm.classList.add("userInputGetter");
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
