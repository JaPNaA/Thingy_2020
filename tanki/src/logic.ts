import { CardData, CardState, DeckData, isCardLearning, NoteData, NoteTypeData } from "./dataTypes.js";
import { getCurrMinuteFloored, arrayCopy } from "./utils.js";

export class Deck {
    public data: DeckDataInteract;

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
        0,
        /** Times wrong history */
        []
    ];

    constructor(data: DeckData) {
        this.data = new DeckDataInteract(data);
        this.generateCardArrays();
    }

    public selectCard(): Card | undefined {
        const nowMinute = getCurrMinuteFloored();

        if (this.seenAndLearningCardsSorted.length && this.seenAndLearningCardsSorted[0].dueMinutes <= nowMinute) {
            return this.seenAndLearningCardsSorted[0];
        } else if (this.newCards.length > 0) {
            return this.newCards[0];
        }
    }

    public applyResultToCard(card: Card, result: number) {
        // update data based on results
        if (result === 1) {
            card.interval *= 2 * card.difficultyFactor;
            card.dueMinutes = getCurrMinuteFloored() + card.interval;
        } else {
            card.dueMinutes = getCurrMinuteFloored() + card.interval;
        }

        if (card.state === CardState.new) {
            card._addCardDataToDataObject();

            card.state = CardState.seen;

            const newCardIndex = this.newCards.indexOf(card);
            if (newCardIndex < 0) { throw new Error("Rated new card that wasn't in new cards array"); }

            this.seenAndLearningCardsSorted.push(this.newCards.splice(newCardIndex, 1)[0]);
        }

        this.sortSeenAndReviewCards();
    }

    public addNote(data: NoteData) {
        this.data._addNote(data);
        this.generateCardArrays();
    }

    public getMinutesToNextCard(): number | undefined {
        const nowMinute = getCurrMinuteFloored();
        const firstCard = this.seenAndLearningCardsSorted[0];
        if (!firstCard) { return; }
        return firstCard.dueMinutes - nowMinute;
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
        if (this.seenAndLearningCardsSorted.length <= 0) {
            return 0;
        }

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
                if (this.seenAndLearningCardsSorted[middle].dueMinutes > currMinute) {
                    return top - 1;
                } else {
                    return top;
                }
            }

            if (this.seenAndLearningCardsSorted[middle].dueMinutes > currMinute) {
                top = middle;
            } else {
                bottom = middle;
            }
        }

        throw new Error("Looped too many times. Is array sorted?");
    }

    private generateCardArrays() {
        this.graduatedCards.length = 0;
        this.newCards.length = 0;
        this.seenAndLearningCardsSorted.length = 0;

        for (const note of this.data.getNotes()) {
            const noteType = this.data.noteGetNoteType(note);
            const noteType_NumCardType = noteType.cardTypes.length;

            for (let i = 0; i < noteType_NumCardType; i++) {
                const card = typeof note[2] === "object" ? note[2][i] : undefined;

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

        this.sortSeenAndReviewCards();
    }

    /** sort latest due first */
    private sortSeenAndReviewCards() {
        this.seenAndLearningCardsSorted.sort((a, b) => a.dueMinutes - b.dueMinutes);
    }
}

class DeckDataInteract {
    constructor(private deckData: DeckData) { }

    public toJSON() {
        return JSON.stringify(this.deckData);
    }

    public getNoteTypes(): Readonly<NoteTypeData[]> {
        return this.deckData.noteTypes;
    }

    public getNotes(): Readonly<NoteData[]> {
        return this.deckData.notes;
    }

    public noteGetNoteType(note: NoteData): Readonly<NoteTypeData> {
        const noteTypeIndex = note[0];
        return this.deckData.noteTypes[noteTypeIndex];
    }

    public _addNote(note: NoteData): void {
        this.deckData.notes.push(note);
    }
}

export class Card {
    constructor(
        private data: CardData,
        public cardTypeID: number,
        public parentNote: NoteData
    ) { }

    public get state(): CardState { return this.data[0]; }
    public set state(state: CardState) { this.state = state; }
    public get interval(): number { return this.data[1]; }
    public set interval(minutes: number) { this.data[1] = minutes; }
    public get difficultyFactor(): number { return this.data[2]; }
    public set difficultyFactor(factor: number) { this.data[2] = factor; }
    public get dueMinutes(): number { return this.data[3]; }
    public set dueMinutes(minutes: number) { this.data[3] = minutes; }
    public get timesWrongHistory(): number[] | undefined {
        if (this.data[4] === 0) { return; }
        return this.data[4];
    }
    public addIncorrectCountToRollingHistory(incorrectCount: number) {
        if (this.data[4] === 0 || this.data[4] === undefined) {
            this.data[4] = [];
        }
        this.data[4].push(incorrectCount);
        if (this.data[4].length > 5) {
            this.data[4].shift();
        }
    }

    public get learningInterval(): number {
        if (!isCardLearning(this.data)) {
            throw new Error("Tried to get learning interval for card not in learning");
        }
        return this.data[5];
    }

    public _addCardDataToDataObject() {
        // this.parentNote[2] is cardData of parent note

        // optional field, so add if not existing
        if (typeof this.parentNote[2] !== "object") {
            this.parentNote[2] = [];
        }

        this.parentNote[2][this.cardTypeID] = this.data;
    }
}
