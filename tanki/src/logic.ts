import { CardData, CardSchedulingSettingsData, CardState, DeckData, isCardLearning, NoteData, NoteTypeData } from "./dataTypes.js";
import { getCurrMinuteFloored } from "./utils.js";

export class Deck {
    public data: DeckDataInteract;

    private graduatedCards: ScheduledCard[] = [];
    private seenAndLearningCardsSorted: ScheduledCard[] = [];
    private newCards: Card[] = [];

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

    /** update data based on results */
    public applyResultToCard(card: Card, result: number) {
        if (card.state === CardState.new) {
            const schedulingSettings = this.data.getCardSchedulingSettings(card);
            const newCardIndex = this.newCards.indexOf(card);
            if (newCardIndex < 0) { throw new Error("Rated new card that wasn't in new cards array"); }
            const newCard = this.newCards.splice(newCardIndex, 1)[0];

            let state = CardState.learn;
            if (result === 1 && schedulingSettings.skipCardIfIsNewButAnsweredCorrectly) {
                state = CardState.graduated;
            }

            const scheduledNewCard = new ScheduledCard([
                /** State */
                state,
                /** Interval in minutes */
                schedulingSettings.initialInterval,
                /** Difficulty factor */
                1,
                /** Due date in minutes ( [Date#getTime() / 60_000] )*/
                0,
                /** Times wrong history */
                []
            ], newCard.cardTypeID, newCard.parentNote);
            scheduledNewCard._attachCardSchedulingDataToParentNote();
            this.updateCardIntervalWithResult(scheduledNewCard, result);

            this.seenAndLearningCardsSorted.push(scheduledNewCard);
        } else if (card instanceof ScheduledCard) {
            this.updateCardIntervalWithResult(card, result);
        } else {
            throw new Error();
        }

        this.sortSeenAndReviewCards();
    }

    private updateCardIntervalWithResult(card: ScheduledCard, result: number) {
        const schedulingSettings = this.data.getCardSchedulingSettings(card);

        if (card.state === CardState.seen) {
            if (result === 1) {
                card.interval *= schedulingSettings.baseIntervalMultiplier * card.difficultyFactor;
                card.dueMinutes = getCurrMinuteFloored() + card.interval;
            } else {
                card.dueMinutes = getCurrMinuteFloored() + card.interval;
            }
        } else {
            throw new Error("lol not supported yet");
        }
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
                        new Card(i, note)
                    )
                } else if (card[0] === CardState.graduated) {
                    this.graduatedCards.push(
                        new ScheduledCard(card, i, note)
                    );
                } else if (card[0] === CardState.seen || card[0] === CardState.learn) {
                    this.seenAndLearningCardsSorted.push(
                        new ScheduledCard(card, i, note)
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

    public getCardSchedulingSettings(card: Card): CardSchedulingSettingsData {
        return this.deckData.schedulingSettings;
    }

    public _addNote(note: NoteData): void {
        this.deckData.notes.push(note);
    }
}

export class Card {
    constructor(
        public cardTypeID: number,
        public parentNote: NoteData
    ) { }

    public get state(): CardState { return CardState.new; }
}

class ScheduledCard extends Card {
    constructor(
        private data: CardData,
        cardTypeID: number,
        parentNote: NoteData
    ) {
        super(cardTypeID, parentNote);
    }

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

    public _attachCardSchedulingDataToParentNote() {
        // this.parentNote[2] is cardData of parent note

        // optional field, so add if not existing
        if (typeof this.parentNote[2] !== "object") {
            this.parentNote[2] = [];
        }

        this.parentNote[2][this.cardTypeID] = this.data;
    }
}
