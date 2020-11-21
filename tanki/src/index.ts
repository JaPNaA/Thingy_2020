class Deck {
    public elm = document.createElement("div");

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
    }

    public showCard() {
        const card = this.selectCard();
        const noteTypeID = card.parentNote[0];
        const noteType: NoteTypeData =
            this.data.noteTypes[noteTypeID];
        const cardType: CardTypeData = noteType.cardTypes[card.cardTypeID];

        const front = new CardFaceDisplay(
            this.cardContentReplacePlaceholders(
                cardType.frontContent,
                noteType.fieldNames,
                card.parentNote[1]
            )
        );
        const back = new CardFaceDisplay(
            this.cardContentReplacePlaceholders(
                cardType.backContent,
                noteType.fieldNames,
                card.parentNote[1]
            )
        );

        this.elm.appendChild(front.elm);
        this.elm.appendChild(back.elm);
    }

    private cardContentReplacePlaceholders(
        content: string, fieldNames: string[], fields: string[]
    ): string {
        const regexMatches = /{{(.+?)}}/g;
        let outString = "";
        let lastIndex = 0;

        for (let match; match = regexMatches.exec(content);) {
            outString += content.slice(lastIndex, match.index);
            const replaceFieldName = match[1];
            outString += fields[fieldNames.indexOf(replaceFieldName)] || "<<undefined>>";
            lastIndex = match.index + match[0].length;
        }

        outString += content.slice(lastIndex);

        return outString;
    }

    private generateCardArrays() {
        for (const note of this.data.notes) {
            for (let i = 0; i < note[2].length; i++) {
                const card = note[2][i];

                if (card === 0 || card === undefined) {
                    this.newCards.push(
                        new Card(this.newCardSettings, i, note)
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

        // sort latest due first
        this.seenCardsSorted.sort((a, b) => a.data[3] - b.data[3]);
    }

    private selectCard(): Card {
        return this.seenCardsSorted[0];
    }
}

function decodeToDeck(str: string): Deck {
    const obj: DeckData = JSON.parse(str);
    const deck = new Deck(obj);
    return deck;
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
    frontContent: string;
    backContent: string;
}

interface NoteData {
    /** Type of note */
    0: number;
    /** Fields */
    1: string[];
    /**
     * Card data
     * @type {Array}
     */
    2: (CardData | undefined | 0)[];
}

interface CardData {
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
    new = 0, seen = 1, graduated = 2
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

    constructor(content: string) {
        this.elm = document.createElement("div");
        this.elm.innerHTML = content;
    }
}

async function main() {
    const deck = await fetch("../deckData.json")
        .then(e => e.text())
        .then(e => decodeToDeck(e));

    document.body.appendChild(deck.elm);
    deck.showCard();

    console.log(deck);
}

main();
