import { ActiveCard, Card, Note, TankiDatabase } from "./database.js";
import { CardFlag, CardState, DeckData } from "./dataTypes.js";
import { binaryBoundarySearch, getCurrMinuteFloored, Immutable } from "./utils.js";

export class Deck {
    public loaded: Promise<void>;

    public database: TankiDatabase;

    private inactiveCardCache: Immutable<Card>[] = [];
    private activeCardCache: Immutable<ActiveCard>[] = [];
    private newCardCache: Immutable<Card>[] = [];

    constructor(data: DeckData) {
        this.database = new TankiDatabase(data);
        this.loaded = this.updateCache();
    }

    public selectCard(): Immutable<Card> | undefined {
        const nowMinute = getCurrMinuteFloored();

        if (this.activeCardCache.length && this.activeCardCache[0].dueMinutes <= nowMinute) {
            return this.activeCardCache[0];
        } else if (this.newCardCache.length > 0) {
            const poolSize = Math.min(this.newCardCache.length, 6);
            const poolIndex = Math.floor(Math.random() * poolSize);
            const index = this.newCardCache.length - 1 - poolIndex; // newest first

            return this.newCardCache[index];
        }
    }

    public getActiveCards(): Immutable<ActiveCard[]> {
        return this.activeCardCache;
    }

    /** update data based on results */
    public applyResultToCard(card: Immutable<Card>, result: number) {
        if (card.state === CardState.new) {
            const schedulingSettings = this.database.getCardSchedulingSettings(card);
            const newCardIndex = this.newCardCache.indexOf(card);
            if (newCardIndex < 0) { throw new Error("Rated new card that wasn't in new cards array"); }
            const poppedCard = this.newCardCache.splice(newCardIndex, 1)[0];

            let updatedCard;

            if (result === 1 && schedulingSettings.skipCardIfIsNewButAnsweredCorrectly) {
                updatedCard = poppedCard.clone();
                updatedCard.state = CardState.inactive;
                updatedCard.addFlag(CardFlag.graduated);
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

            this.sortCardIntoCache(updatedCard);
        } else if (card instanceof ActiveCard) {
            this.updateCardScheduleWithResult(card, result);
        } else {
            throw new Error();
        }

        this.sortSeenAndReviewCards();
    }

    private updateCardScheduleWithResult(card_: Immutable<ActiveCard>, result: number) {
        const card = card_.clone();
        const schedulingSettings = this.database.getCardSchedulingSettings(card);

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

    public addNoteAndUpdate(data: Note) {
        this.database.addNote(data);
        this.updateCache();
    }

    public getMinutesToNextCard(): number | undefined {
        const nowMinute = getCurrMinuteFloored();
        const firstCard = this.activeCardCache[0];
        if (!firstCard) { return; }
        return firstCard.dueMinutes - nowMinute;
    }

    public getCardCount() {
        return {
            new: this.newCardCache.length,
            active: this.activeCardCache.length,
            inactive: this.inactiveCardCache.length
        };
    }

    /**
     * Finds the number of cards that are due by binary-searching for
     * the boundary where a card due that's due becomes not due.
     */
    public getDueCardsCount(): number {
        if (this.activeCardCache.length <= 0) {
            return 0;
        }

        const currMinute = getCurrMinuteFloored();

        return binaryBoundarySearch(
            this.activeCardCache,
            card => card.dueMinutes > currMinute
        );
    }

    // todo: make private again and listen for when cards are added
    public async updateCache() {
        this.inactiveCardCache.length = 0;
        this.newCardCache.length = 0;
        this.activeCardCache.length = 0;

        for (const card of this.database.getCards()) {
            this.sortCardIntoCache(card);
        }

        this.sortSeenAndReviewCards();
    }

    private sortCardIntoCache(card: Immutable<Card>) {
        if (card.state === CardState.inactive || card.hasFlag(CardFlag.suspended)) {
            this.inactiveCardCache.push(card);
        } else if (card.state === CardState.active && card instanceof ActiveCard) {
            this.activeCardCache.push(card);
        } else if (card.state === CardState.new) {
            this.newCardCache.push(card);
        } else {
            console.error("Unexpected card state", card, this.database);
            throw new Error("Unexpected card state");
        }
    }

    /** sort latest due first */
    private sortSeenAndReviewCards() {
        this.activeCardCache.sort((a, b) => a.dueMinutes - b.dueMinutes);
    }
}
