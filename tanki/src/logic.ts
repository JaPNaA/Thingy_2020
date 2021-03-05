import { ActiveCard, Card, TankiDatabase } from "./database.js";
import { CardFlag, CardSchedulingSettingsData, CardState, dataTypeVersion, DeckData, isCardActive, isEmptyValue, isNoteTypeDataIntegrated, NoteData, NoteTypeData, NoteTypeDataIntegrated } from "./dataTypes.js";
import { binaryBoundarySearch, getCurrMinuteFloored } from "./utils.js";

export class Deck {
    public data: DeckDataInteract;
    public loaded: Promise<void>;

    public database: TankiDatabase;

    private inactiveCards: Card[] = [];
    private activeCards: ActiveCard[] = [];
    private newCards: Card[] = [];

    constructor(data: DeckData) {
        this.database = new TankiDatabase(data);
        this.data = new DeckDataInteract(data);
        this.loaded = this.updateCardArrays();
    }

    public selectCard(): Card | undefined {
        const nowMinute = getCurrMinuteFloored();

        if (this.activeCards.length && this.activeCards[0].dueMinutes <= nowMinute) {
            return this.activeCards[0];
        } else if (this.newCards.length > 0) {
            const poolSize = Math.min(this.newCards.length, 6);
            const poolIndex = Math.floor(Math.random() * poolSize);
            const index = this.newCards.length - 1 - poolIndex; // newest first

            return this.newCards[index];
        }
    }

    public getActiveCards(): readonly ActiveCard[] {
        return this.activeCards;
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

            // updatedCard._attachCardSchedulingDataToParentNote();

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
                    card.dueMinutes = getCurrMinuteFloored() + card.interval;
                } else {
                    card.learningInterval = schedulingSettings.learningStepsMinutes[nextStepIndex];
                    card.dueMinutes = getCurrMinuteFloored() + card.learningInterval;
                }
            }
        } else {
            if (result === 1) {
                card.interval *= schedulingSettings.baseIntervalMultiplier;
            } else {
                card.interval /= schedulingSettings.baseIntervalMultiplier;
            }
            card.dueMinutes = getCurrMinuteFloored() + card.interval;
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
            active: this.activeCards.length,
            inactive: this.inactiveCards.length
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

        // await this.database.readyPromise;

        for (const card of this.database.cards) {
            this.sortCardIntoArray(card);
        }

        this.sortSeenAndReviewCards();
    }

    private sortCardIntoArray(card: Card) {
        if (card.state === CardState.inactive || card.hasFlag(CardFlag.suspended)) {
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

    public getNotes(): Readonly<NoteData[]> {
        return this.deckData.notes;
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


