import { ActivatedCard, Card, TankiDatabase } from "./database.js";
import { CardFlag, CardState, DeckData } from "./dataTypes.js";
import { binaryBoundarySearch, getCurrMinuteFloored, Immutable } from "./utils.js";

export class Deck {
    public loaded: Promise<void>;

    public database: TankiDatabase;

    private inactiveCardCache: Immutable<Card>[] = [];
    private activeCardCache: Immutable<ActivatedCard>[] = [];
    private newCardCache: Immutable<Card>[] = [];

    constructor(data: DeckData) {
        this.database = new TankiDatabase(data);

        this.updateCache();
        this.loaded = Promise.resolve();

        this.addDatabaseHandlers();
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

    public getActiveCardsSortedCache(): Immutable<ActivatedCard[]> {
        return this.activeCardCache;
    }

    /** update data based on results */
    public applyResultToCard(card: Immutable<Card>, result: number) {
        if (card.state === CardState.new) {
            const schedulingSettings = this.database.getCardSchedulingSettings(card);
            const newCardIndex = this.newCardCache.indexOf(card);
            if (newCardIndex < 0) { throw new Error("Rated new card that wasn't in new cards array"); }
            const poppedCard = this.newCardCache.splice(newCardIndex, 1)[0];

            let updatedCard = poppedCard;

            if (result === 1 && schedulingSettings.skipCardIfIsNewButAnsweredCorrectly) {
                const mutCard = poppedCard.clone();
                mutCard.state = CardState.inactive;
                mutCard.addFlag(CardFlag.graduated);
                this.database.writeEdit(mutCard);
            } else {
                const activatedCard = this.database.activateCard(poppedCard);
                updatedCard = activatedCard;

                const mutActivatedCard = activatedCard.clone();
                mutActivatedCard.addFlag(CardFlag.learn);
                this.database.writeEdit(mutActivatedCard);

                this.updateCardScheduleWithResult(activatedCard, result);
            }

            this.sortCardIntoCache(updatedCard);
        } else if (card instanceof ActivatedCard) {
            this.updateCardScheduleWithResult(card, result);
        } else {
            throw new Error();
        }

        this.sortSeenAndReviewCards();
    }

    private updateCardScheduleWithResult(card: Immutable<ActivatedCard>, result: number) {
        const mutCard = card.clone();
        const schedulingSettings = this.database.getCardSchedulingSettings(card);

        if (card.hasFlag(CardFlag.learn)) {
            if (!mutCard.learningInterval) { mutCard.learningInterval = 0; }

            if (result === 0) {
                mutCard.learningInterval = schedulingSettings.learningStepsMinutes[0];
                mutCard.dueMinutes = getCurrMinuteFloored() + mutCard.learningInterval;
            } else if (result === 1) {
                const nextStepIndex = binaryBoundarySearch(
                    schedulingSettings.learningStepsMinutes,
                    step => step > mutCard.learningInterval!
                );

                // finished all learning steps check
                if (nextStepIndex >= schedulingSettings.learningStepsMinutes.length) {
                    mutCard.removeFlag(CardFlag.learn);
                    mutCard.dueMinutes = getCurrMinuteFloored() + mutCard.interval;
                } else {
                    mutCard.learningInterval = schedulingSettings.learningStepsMinutes[nextStepIndex];
                    mutCard.dueMinutes = getCurrMinuteFloored() + mutCard.learningInterval;
                }
            }
        } else {
            if (result === 1) {
                mutCard.interval *= schedulingSettings.baseIntervalMultiplier;
            } else {
                mutCard.interval /= schedulingSettings.baseIntervalMultiplier;
            }
            mutCard.dueMinutes = getCurrMinuteFloored() + mutCard.interval;
        }

        this.database.writeEdit(mutCard);
    }

    public getMinutesToNextCard(index: number = 0): number | undefined {
        const nowMinute = getCurrMinuteFloored();
        const firstCard = this.activeCardCache[index];
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

    private updateCache() {
        console.log("update cache triggered");
        this.inactiveCardCache.length = 0;
        this.newCardCache.length = 0;
        this.activeCardCache.length = 0;

        for (const card of this.database.getCards()) {
            this.sortCardIntoCache(card);
        }

        this.sortSeenAndReviewCards();
    }

    private addDatabaseHandlers() {
        this.database.onAddNote.addHandler(note => {
            for (const card of note.cardUids) {
                this.sortCardIntoCache(this.database.getCardByUid(card));
            }
        });

        this.database.onEdit.addHandler(({ before, current }) => {
            if (!(before instanceof Card && current instanceof Card)) { return; }
            const beforeArray = this.getArrayForCard(before);
            const afterArray = this.getArrayForCard(current);

            if (beforeArray !== afterArray) {
                const beforeArrayIndex = beforeArray.indexOf(current);
                if (beforeArrayIndex < 0) {
                    console.warn("Tried to move card in cache, but wasn't found in expected array. Full refresh of cache");
                    this.updateCache();
                } else {
                    beforeArray.splice(beforeArrayIndex, 1);
                    afterArray.push(current);
                }
            }
        });

        this.database.onRemoveNote.addHandler(() => this.updateCache());
        this.database.onUndo.addHandler(() => this.updateCache());
    }

    private sortCardIntoCache(card: Immutable<Card>) {
        const array = this.getArrayForCard(card);
        array.push(card);
    }

    private getArrayForCard(card: Immutable<Card>) {
        if (card.state === CardState.inactive || card.hasFlag(CardFlag.suspended)) {
            return this.inactiveCardCache;
        } else if (card.state === CardState.active && card instanceof ActivatedCard) {
            return this.activeCardCache;
        } else if (card.state === CardState.new) {
            return this.newCardCache;
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
