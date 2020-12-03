import { CardData, CardSchedulingSettingsData, CardState, DeckData, isCardLearning, isNoteTypeDataIntegrated, NoteData, NoteTypeData, NoteTypeDataExternal, NoteTypeDataIntegrated } from "./dataTypes.js";
import { binaryBoundarySearch, getCurrMinuteFloored } from "./utils.js";

export class Deck {
    public data: DeckDataInteract;
    public loaded: Promise<void>;

    private graduatedCards: Card[] = [];
    private seenAndLearningCardsSorted: ScheduledCard[] = [];
    private newCards: Card[] = [];

    constructor(data: DeckData) {
        this.data = new DeckDataInteract(data);
        this.loaded = this.updateCardArrays();
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
            this.updateCardScheduleWithResult(scheduledNewCard, result);

            this.sortCardIntoArray(scheduledNewCard);
        } else if (card instanceof ScheduledCard) {
            this.updateCardScheduleWithResult(card, result);
        } else {
            throw new Error();
        }

        this.sortSeenAndReviewCards();
    }

    private updateCardScheduleWithResult(card: ScheduledCard, result: number) {
        const schedulingSettings = this.data.getCardSchedulingSettings(card);

        if (card.state === CardState.seen || card.state === CardState.graduated) {
            if (result === 1) {
                card.interval *= schedulingSettings.baseIntervalMultiplier * card.difficultyFactor;
                card.dueMinutes = getCurrMinuteFloored() + card.interval;
            } else {
                card.dueMinutes = getCurrMinuteFloored() + card.interval;
            }
        } else if (card.state === CardState.learn) {
            if (result === 0) {
                card.learningInterval = schedulingSettings.learningStepsMinutes[0];
                card.dueMinutes = getCurrMinuteFloored() + card.learningInterval;
            } else if (result === 1) {
                const nextStepIndex = binaryBoundarySearch(
                    schedulingSettings.learningStepsMinutes,
                    step => step > card.learningInterval
                );

                console.log(nextStepIndex);

                // finished all learning steps check
                if (nextStepIndex >= schedulingSettings.learningStepsMinutes.length) {
                    card.state = CardState.seen;
                    this.updateCardScheduleWithResult(card, result);
                } else {
                    card.learningInterval = schedulingSettings.learningStepsMinutes[nextStepIndex];
                    card.dueMinutes = getCurrMinuteFloored() + card.learningInterval;
                }
            }
        } else {
            throw new Error("lol not supported yet");
        }
    }

    public addNoteAndUpdate(data: NoteData) {
        this.data.addNote(data);
        this.updateCardArrays();
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

        return binaryBoundarySearch(
            this.seenAndLearningCardsSorted,
            card => card.dueMinutes > currMinute
        );
    }

    // todo: make private again and listen for when cards are added
    public async updateCardArrays() {
        this.graduatedCards.length = 0;
        this.newCards.length = 0;
        this.seenAndLearningCardsSorted.length = 0;

        for (const note of this.data.getNotes()) {
            // todo: lazy-load external cards
            const noteType = await this.data.getIntegratedNoteType(this.data.noteGetNoteType(note).name);
            const noteType_NumCardType = noteType.cardTypes.length;

            for (let i = 0; i < noteType_NumCardType; i++) {
                const card = typeof note[2] === "object" ? note[2][i] : undefined;

                if (card === 0 || card === undefined || card[0] === CardState.new) {
                    this.newCards.push(new Card(i, note))
                } else {
                    this.sortCardIntoArray(new ScheduledCard(card, i, note));
                }
            }
        }

        this.sortSeenAndReviewCards();
    }

    private sortCardIntoArray(card: ScheduledCard) {
        if (card.state === CardState.graduated) {
            this.graduatedCards.push(card);
        } else if (card.state === CardState.seen || card.state === CardState.learn) {
            this.seenAndLearningCardsSorted.push(card);
        } else if (card.state === CardState.new) {
            this.newCards.push(card);
        } else {
            console.error("Unexpected card", card, this.data);
            throw new Error("Unexpected card");
        }
    }

    /** sort latest due first */
    private sortSeenAndReviewCards() {
        this.seenAndLearningCardsSorted.sort((a, b) => a.dueMinutes - b.dueMinutes);
    }
}

class DeckDataInteract {
    private externalNoteTypesCache: Map<string, NoteTypeDataIntegrated> = new Map();

    constructor(private deckData: DeckData) { }

    public toJSON() {
        return JSON.stringify(this.deckData);
    }

    public getNoteTypes(): Readonly<NoteTypeData[]> {
        return this.deckData.noteTypes;
    }

    public indexOfNote(noteName: string): number {
        for (let i = 0; i < this.deckData.noteTypes.length; i++) {
            const type = this.deckData.noteTypes[i];
            if (type.name === noteName) { return i; }
        }

        return -1;
    }

    public async getIntegratedNoteType(noteName: string): Promise<Readonly<NoteTypeDataIntegrated>> {
        let src: string | undefined;

        for (const type of this.deckData.noteTypes) {
            if (type.name !== noteName) { continue; }

            if (isNoteTypeDataIntegrated(type)) {
                return type;
            } else {
                src = type.src;
                break;
            }
        }

        if (!src) { throw new Error("Invalid note name"); }

        const alreadyLoaded = this.externalNoteTypesCache.get(src);
        if (alreadyLoaded) {
            return alreadyLoaded;
        }

        const fetchResult = await fetch("../" + src).then(e => e.json());
        this.externalNoteTypesCache.set(src, fetchResult);
        return fetchResult;
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

    public addNoteType(noteType: NoteTypeData): void {
        this.deckData.noteTypes.push(noteType);
    }

    public addNote(note: NoteData): void {
        this.deckData.notes.push(note);
    }
}

export class Card {
    constructor(
        public cardTypeID: number,
        public parentNote: NoteData
    ) { }

    public get state(): CardState { return CardState.new; }
    public get noteType(): number { return this.parentNote[0]; }
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
    public set state(state: CardState) { this.data[0] = state; }
    public get interval(): number { return this.data[1]; }
    public set interval(minutes: number) { this.data[1] = minutes; }
    public get difficultyFactor(): number { return this.data[2]; }
    public set difficultyFactor(factor: number) { this.data[2] = factor; }
    public get dueMinutes(): number { return this.data[3]; }
    public set dueMinutes(minutes: number) { this.data[3] = Math.round(minutes); }
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
    public set learningInterval(interval: number) {
        if (!isCardLearning(this.data)) {
            throw new Error("Tried to setting learning interval for card not in learning");
        }
        this.data[5] = interval;
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
