import { CardData, CardState, DeckData, NoteData, NoteTypeData } from "./dataTypes.js";
import { getMinuteFloored, arrayCopy } from "./utils.js";

export class Deck {
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

    public applyResultToCard(card: Card, result: number) {
        // update data based on results
        if (result === 1) {
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

            card.data[0] = CardState.seen;
            //       .state

            const newCardIndex = this.newCards.indexOf(card);
            if (newCardIndex < 0) { throw new Error("Rated new card that wasn't in new cards array"); }

            this.seenCardsSorted.push(this.newCards.splice(newCardIndex, 1)[0]);
        }

        this.sortSeenCards();
    }

    public addNote(data: NoteData) {
        this.data.notes.push(data);
        this.generateCardArrays();
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

    public getNoteTypes(): NoteTypeData[] {
        return this.data.noteTypes;
    }

    public exportToString(): string {
        return JSON.stringify(this.data);
    }

    /** sort latest due first */
    private sortSeenCards() {
        this.seenCardsSorted.sort((a, b) => a.data[3] - b.data[3]);
    }

    public getMinutesToNextCard(): number {
        const nowMinute = getMinuteFloored();
        return this.seenCardsSorted[0].data[3] - nowMinute;
    }

    public getCardCount() {
        return {
            new: this.newCards.length,
            seen: this.seenCardsSorted.length,
            graduated: this.graduatedCards.length
        };
    }

    public selectCard(): Card | undefined {
        const nowMinute = getMinuteFloored();

        if (this.seenCardsSorted.length && this.seenCardsSorted[0].data[3] <= nowMinute) {
            return this.seenCardsSorted[0];
        } else if (this.newCards.length > 0) {
            return this.newCards[0];
        }
    }
}

export class Card {
    constructor(
        public data: CardData,
        public cardTypeID: number,
        public parentNote: NoteData
    ) { }
}
