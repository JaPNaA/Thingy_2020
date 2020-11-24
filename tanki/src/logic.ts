import { CardData, CardState, DeckData, NoteData, NoteTypeData } from "./dataTypes.js";
import { getCurrMinuteFloored, arrayCopy } from "./utils.js";

export class Deck {
    private graduatedCards: Card[] = [];
    private seenAndLearningCardsSorted: Card[] = [];
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

    public selectCard(): Card | undefined {
        const nowMinute = getCurrMinuteFloored();

        if (this.seenAndLearningCardsSorted.length && this.seenAndLearningCardsSorted[0].data[3] <= nowMinute) {
            return this.seenAndLearningCardsSorted[0];
        } else if (this.newCards.length > 0) {
            return this.newCards[0];
        }
    }

    public applyResultToCard(card: Card, result: number) {
        // update data based on results
        if (result === 1) {
            card.data[1] *= 2 * card.data[2];
            //       .interval           .difficultyFactor

            card.data[3] = getCurrMinuteFloored() + card.data[1];
            //       .dueDate                         .interval
        } else {
            card.data[3] = getCurrMinuteFloored() + card.data[1];
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

            this.seenAndLearningCardsSorted.push(this.newCards.splice(newCardIndex, 1)[0]);
        }

        this.sortSeenCards();
    }

    public addNote(data: NoteData) {
        this.data.notes.push(data);
        this.generateCardArrays();
    }

    public getNoteTypes(): NoteTypeData[] {
        return this.data.noteTypes;
    }

    public getMinutesToNextCard(): number {
        const nowMinute = getCurrMinuteFloored();
        return this.seenAndLearningCardsSorted[0].data[3] - nowMinute;
    }

    public getCardCount() {
        return {
            new: this.newCards.length,
            seen: this.seenAndLearningCardsSorted.length,
            graduated: this.graduatedCards.length
        };
    }

    /**
     * Finds the number of cards that are due by binary-searching for
     * the boundary where a card due that's due becomes not due.
     */
    public getDueCardsCount(): number {
        const currMinute = getCurrMinuteFloored();

        // algorithm: binary search for boundary
        let bottom = 0;
        let top = this.seenAndLearningCardsSorted.length;

        // while(true) loop with protection
        for (
            let i = 0, max = Math.log2(this.seenAndLearningCardsSorted.length) + 2;
            i < max; i++
        ) {
            const middle = Math.floor((bottom + top) / 2);
            if (middle === bottom) {
                if (this.seenAndLearningCardsSorted[middle].data[3] > currMinute) {
                    return top - 1;
                } else {
                    return top;
                }
            }

            if (this.seenAndLearningCardsSorted[middle].data[3] > currMinute) {
                top = middle;
            } else {
                bottom = middle;
            }
        }

        throw new Error("Looped too many times. Is array sorted?");
    }

    public exportToString(): string {
        return JSON.stringify(this.data);
    }

    private generateCardArrays() {
        this.graduatedCards.length = 0;
        this.newCards.length = 0;
        this.seenAndLearningCardsSorted.length = 0;

        for (const note of this.data.notes) {
            const noteID = note[0];
            const noteType = this.data.noteTypes[noteID];
            const noteType_NumCardType = noteType.cardTypes.length;

            for (let i = 0; i < noteType_NumCardType; i++) {
                const card = note[2][i];

                if (card === 0 || card === undefined || card[0] === CardState.new) {
                    this.newCards.push(
                        new Card(arrayCopy(this.newCardSettings), i, note)
                    )
                } else if (card[0] === CardState.graduated) {
                    this.graduatedCards.push(
                        new Card(card, i, note)
                    );
                } else if (card[0] === CardState.seen || card[0] === CardState.learn) {
                    this.seenAndLearningCardsSorted.push(
                        new Card(card, i, note)
                    );
                } else {
                    console.error("Unexpected card", card, note, this.data);
                    throw new Error("Unexpected card");
                }
            }
        }

        this.sortSeenCards();
    }

    /** sort latest due first */
    private sortSeenCards() {
        this.seenAndLearningCardsSorted.sort((a, b) => a.data[3] - b.data[3]);
    }
}

export class Card {
    constructor(
        public data: CardData,
        public cardTypeID: number,
        public parentNote: NoteData
    ) { }
}
