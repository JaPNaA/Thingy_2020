import { CardDataActive, CardDataBasic, CardFlag, CardSchedulingSettingsData, CardState, dataTypeVersion, DeckData, isCardActive, isEmptyValue, isNoteTypeDataIntegrated, NoteData, NoteTypeData, NoteTypeDataIntegrated, Optional } from "./dataTypes.js";
import { binaryBoundarySearch, getCurrMinuteFloored } from "./utils.js";

export class Deck {
    public data: DeckDataInteract;
    public loaded: Promise<void>;

    private inactiveCards: Card[] = [];
    private activeCards: ActiveCard[] = [];
    private newCards: Card[] = [];

    constructor(data: DeckData) {
        this.data = new DeckDataInteract(data);
        this.loaded = this.updateCardArrays();
    }

    public selectCard(): Card | undefined {
        const nowMinute = getCurrMinuteFloored();

        if (this.activeCards.length && this.activeCards[0].dueMinutes <= nowMinute) {
            return this.activeCards[0];
        } else if (this.newCards.length > 0) {
            return this.newCards[Math.floor(Math.random() * this.newCards.length)];
        }
    }

    /** update data based on results */
    public applyResultToCard(card: Card, result: number) {
        if (card.state === CardState.new) {
            const schedulingSettings = this.data.getCardSchedulingSettings(card);
            const newCardIndex = this.newCards.indexOf(card);
            if (newCardIndex < 0) { throw new Error("Rated new card that wasn't in new cards array"); }
            const poppedCard = this.newCards.splice(newCardIndex, 1)[0];

            let updatedCard;

            if (result === 1 && schedulingSettings.skipCardIfIsNewButAnsweredCorrectly) {
                poppedCard.state = CardState.inactive;
                poppedCard.addFlag(CardFlag.graduated);
                updatedCard = card;
            } else {
                updatedCard = new ActiveCard([
                    /** State */
                    CardState.active,
                    /** Flags */
                    [CardFlag.learn],
                    /** Due date in minutes ( [Date#getTime() / 60_000] )*/
                    0,
                    /** Interval in minutes */
                    schedulingSettings.initialInterval
                ], poppedCard.cardTypeID, poppedCard.parentNote);
                this.updateCardScheduleWithResult(updatedCard, result);
            }

            updatedCard._attachCardSchedulingDataToParentNote();

            this.sortCardIntoArray(updatedCard);
        } else if (card instanceof ActiveCard) {
            this.updateCardScheduleWithResult(card, result);
        } else {
            throw new Error();
        }

        this.sortSeenAndReviewCards();
    }

    private updateCardScheduleWithResult(card: ActiveCard, result: number) {
        const schedulingSettings = this.data.getCardSchedulingSettings(card);

        if (card.hasFlag(CardFlag.learn)) {
            if (!card.learningInterval) { card.learningInterval = 0; }

            if (result === 0) {
                card.learningInterval = schedulingSettings.learningStepsMinutes[0];
                card.dueMinutes = getCurrMinuteFloored() + card.learningInterval;
            } else if (result === 1) {
                const nextStepIndex = binaryBoundarySearch(
                    schedulingSettings.learningStepsMinutes,
                    step => step > card.learningInterval!
                );

                console.log(nextStepIndex);

                // finished all learning steps check
                if (nextStepIndex >= schedulingSettings.learningStepsMinutes.length) {
                    card.removeFlag(CardFlag.learn)
                    this.updateCardScheduleWithResult(card, result);
                } else {
                    card.learningInterval = schedulingSettings.learningStepsMinutes[nextStepIndex];
                    card.dueMinutes = getCurrMinuteFloored() + card.learningInterval;
                }
            }
        } else {
            if (result === 1) {
                card.interval *= schedulingSettings.baseIntervalMultiplier;
                card.dueMinutes = getCurrMinuteFloored() + card.interval;
            } else {
                card.dueMinutes = getCurrMinuteFloored() + card.interval;
            }
        }
    }

    public addNoteAndUpdate(data: NoteData) {
        this.data.addNote(data);
        this.updateCardArrays();
    }

    public getMinutesToNextCard(): number | undefined {
        const nowMinute = getCurrMinuteFloored();
        const firstCard = this.activeCards[0];
        if (!firstCard) { return; }
        return firstCard.dueMinutes - nowMinute;
    }

    public getCardCount() {
        return {
            new: this.newCards.length,
            seen: this.activeCards.length,
            graduated: this.inactiveCards.length
        };
    }

    /**
     * Finds the number of cards that are due by binary-searching for
     * the boundary where a card due that's due becomes not due.
     */
    public getDueCardsCount(): number {
        if (this.activeCards.length <= 0) {
            return 0;
        }

        const currMinute = getCurrMinuteFloored();

        return binaryBoundarySearch(
            this.activeCards,
            card => card.dueMinutes > currMinute
        );
    }

    // todo: make private again and listen for when cards are added
    public async updateCardArrays() {
        this.inactiveCards.length = 0;
        this.newCards.length = 0;
        this.activeCards.length = 0;

        for (const note of this.data.getNotes()) {
            // todo: lazy-load external cards
            const noteType = await this.data.getIntegratedNoteType(this.data.noteGetNoteType(note).name);
            const noteType_NumCardType = noteType.cardTypes.length;

            for (let i = 0; i < noteType_NumCardType; i++) {
                const card = isEmptyValue(note[2]) ? undefined : note[2][i];

                if (!isEmptyValue(card) && isCardActive(card)) {
                    this.sortCardIntoArray(new ActiveCard(card, i, note));
                } else {
                    this.sortCardIntoArray(new Card(card, i, note));
                }
            }
        }

        this.sortSeenAndReviewCards();
    }

    private sortCardIntoArray(card: Card) {
        if (card.state === CardState.inactive) {
            this.inactiveCards.push(card);
        } else if (card.state === CardState.active && card instanceof ActiveCard) {
            this.activeCards.push(card);
        } else if (card.state === CardState.new) {
            this.newCards.push(card);
        } else {
            console.error("Unexpected card state", card, this.data);
            throw new Error("Unexpected card state");
        }
    }

    /** sort latest due first */
    private sortSeenAndReviewCards() {
        this.activeCards.sort((a, b) => a.dueMinutes - b.dueMinutes);
    }
}

class DeckDataInteract {
    private externalNoteTypesCache: Map<string, NoteTypeDataIntegrated> = new Map();

    constructor(private deckData: DeckData) {
        if (deckData.version !== dataTypeVersion) {
            alert("Saved version of deckData doesn't match the app's version. Backwards compatibility doesn't come with this app.");
            throw new Error("Versions don't match");
        }
    }

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
    protected data: CardDataBasic;

    constructor(
        data: Optional<CardDataBasic>,
        public cardTypeID: number,
        public parentNote: NoteData,
    ) {
        this.data = data ?? [CardState.new, null];
    }

    public get state(): CardState { return this.data[0]; }
    public set state(state: CardState) { this.data[0] = state; }
    public get noteType(): number { return this.parentNote[0]; }

    public hasFlag(flag: CardFlag): boolean {
        if (this.data[1]) {
            return this.data[1].includes(flag);
        } else {
            return false;
        }
    }
    public addFlag(flag: CardFlag): void {
        if (this.data[1]) {
            if (this.hasFlag(flag)) { return; }
            this.data[1].push(flag);
        } else {
            this.data[1] = [flag];
        }
    }
    public removeFlag(flag: CardFlag): void {
        if (!this.data[1]) { return; }
        const index = this.data[1].indexOf(flag);
        if (index < 0) { throw new Error("Tried to remove flag that doesn't exist"); }
        this.data[1].splice(index, 1);
    }

    public _attachCardSchedulingDataToParentNote() {
        // this.parentNote[2] is cardData of parent note

        // optional field, so add if not existing
        if (isEmptyValue(this.parentNote[2])) {
            this.parentNote[2] = [];
        }

        this.parentNote[2][this.cardTypeID] = this.data;
    }
}

class ActiveCard extends Card {
    protected data!: CardDataActive;

    constructor(
        data: CardDataActive,
        cardTypeID: number,
        parentNote: NoteData
    ) {
        super(data, cardTypeID, parentNote);
    }

    public get dueMinutes(): number { return this.data[2]; }
    public set dueMinutes(minutes: number) { this.data[2] = Math.round(minutes); }
    public get interval(): number { return this.data[3]; }
    public set interval(minutes: number) { this.data[3] = minutes; }
    public get timesWrongHistory(): number[] | undefined {
        if (isEmptyValue(this.data[4])) { return; }
        return this.data[4];
    }
    public addIncorrectCountToRollingHistory(incorrectCount: number) {
        if (isEmptyValue(this.data[4])) {
            this.data[4] = [];
        }
        this.data[4].push(incorrectCount);
        if (this.data[4].length > 5) {
            this.data[4].shift();
        }
    }

    public get learningInterval(): Optional<number> {
        return this.data[5];
    }
    public set learningInterval(interval: Optional<number>) {
        this.data[5] = interval;
    }
}
