import { ActivatedCard, Card, TankiDatabase } from "./database.js";
import { CardFlag, CardState } from "./dataTypes.js";
import { binaryBoundarySearch, getCurrMinuteFloored } from "./utils.js";
var Deck = /** @class */ (function () {
    function Deck(data) {
        this.inactiveCardCache = [];
        this.activeCardCache = [];
        this.newCardCache = [];
        this.database = new TankiDatabase(data);
        this.updateCache();
        this.loaded = Promise.resolve();
        this.addDatabaseHandlers();
    }
    Deck.prototype.selectCard = function () {
        var nowMinute = getCurrMinuteFloored();
        if (this.activeCardCache.length && this.activeCardCache[0].dueMinutes <= nowMinute) {
            return this.activeCardCache[0];
        }
        else if (this.newCardCache.length > 0) {
            var poolSize = Math.min(this.newCardCache.length, 6);
            var poolIndex = Math.floor(Math.random() * poolSize);
            var index = this.newCardCache.length - 1 - poolIndex; // newest first
            return this.newCardCache[index];
        }
    };
    Deck.prototype.getActiveCardsSortedCache = function () {
        return this.activeCardCache;
    };
    /** update data based on results */
    Deck.prototype.applyResultToCard = function (card, result) {
        if (card.state === CardState.new) {
            var schedulingSettings = this.database.getCardSchedulingSettings(card);
            var newCardIndex = this.newCardCache.indexOf(card);
            if (newCardIndex < 0) {
                throw new Error("Rated new card that wasn't in new cards array");
            }
            var poppedCard = this.newCardCache.splice(newCardIndex, 1)[0];
            var updatedCard = poppedCard;
            if (result === 1 && schedulingSettings.skipCardIfIsNewButAnsweredCorrectly) {
                var mutCard = poppedCard.clone();
                mutCard.state = CardState.inactive;
                mutCard.addFlag(CardFlag.graduated);
                this.database.writeEdit(mutCard);
            }
            else {
                var activatedCard = this.database.activateCard(poppedCard);
                updatedCard = activatedCard;
                var mutActivatedCard = activatedCard.clone();
                mutActivatedCard.addFlag(CardFlag.learn);
                this.database.writeEdit(mutActivatedCard);
                this.updateCardScheduleWithResult(activatedCard, result);
            }
            this.sortCardIntoCache(updatedCard);
        }
        else if (card instanceof ActivatedCard) {
            this.updateCardScheduleWithResult(card, result);
        }
        else {
            throw new Error();
        }
        this.sortSeenAndReviewCards();
    };
    Deck.prototype.updateCardScheduleWithResult = function (card, result) {
        var mutCard = card.clone();
        var schedulingSettings = this.database.getCardSchedulingSettings(card);
        if (card.hasFlag(CardFlag.learn)) {
            if (!mutCard.learningInterval) {
                mutCard.learningInterval = 0;
            }
            if (result === 0) {
                mutCard.learningInterval = schedulingSettings.learningStepsMinutes[0];
                mutCard.dueMinutes = getCurrMinuteFloored() + mutCard.learningInterval;
            }
            else if (result === 1) {
                var nextStepIndex = binaryBoundarySearch(schedulingSettings.learningStepsMinutes, function (step) { return step > mutCard.learningInterval; });
                // finished all learning steps check
                if (nextStepIndex >= schedulingSettings.learningStepsMinutes.length) {
                    mutCard.removeFlag(CardFlag.learn);
                    mutCard.dueMinutes = getCurrMinuteFloored() + mutCard.interval;
                }
                else {
                    mutCard.learningInterval = schedulingSettings.learningStepsMinutes[nextStepIndex];
                    mutCard.dueMinutes = getCurrMinuteFloored() + mutCard.learningInterval;
                }
            }
        }
        else {
            if (result === 1) {
                mutCard.interval *= schedulingSettings.baseIntervalMultiplier;
            }
            else {
                mutCard.interval /= schedulingSettings.baseIntervalMultiplier;
            }
            mutCard.dueMinutes = getCurrMinuteFloored() + mutCard.interval;
        }
        this.database.writeEdit(mutCard);
    };
    Deck.prototype.getMinutesToNextCard = function (index) {
        if (index === void 0) { index = 0; }
        var nowMinute = getCurrMinuteFloored();
        var firstCard = this.activeCardCache[index];
        if (!firstCard) {
            return;
        }
        return firstCard.dueMinutes - nowMinute;
    };
    Deck.prototype.getCardCount = function () {
        return {
            new: this.newCardCache.length,
            active: this.activeCardCache.length,
            inactive: this.inactiveCardCache.length
        };
    };
    /**
     * Finds the number of cards that are due by binary-searching for
     * the boundary where a card due that's due becomes not due.
     */
    Deck.prototype.getDueCardsCount = function () {
        if (this.activeCardCache.length <= 0) {
            return 0;
        }
        var currMinute = getCurrMinuteFloored();
        return binaryBoundarySearch(this.activeCardCache, function (card) { return card.dueMinutes > currMinute; });
    };
    Deck.prototype.updateCache = function () {
        console.log("update cache triggered");
        this.inactiveCardCache.length = 0;
        this.newCardCache.length = 0;
        this.activeCardCache.length = 0;
        for (var _i = 0, _a = this.database.getCards(); _i < _a.length; _i++) {
            var card = _a[_i];
            this.sortCardIntoCache(card);
        }
        this.sortSeenAndReviewCards();
    };
    Deck.prototype.addDatabaseHandlers = function () {
        var _this = this;
        this.database.onAddNote.addHandler(function (note) {
            for (var _i = 0, _a = note.cardUids; _i < _a.length; _i++) {
                var card = _a[_i];
                _this.sortCardIntoCache(_this.database.getCardByUid(card));
            }
        });
        this.database.onEdit.addHandler(function (_a) {
            var before = _a.before, current = _a.current;
            if (!(before instanceof Card && current instanceof Card)) {
                return;
            }
            var beforeArray = _this.getArrayForCard(before);
            var afterArray = _this.getArrayForCard(current);
            if (beforeArray !== afterArray) {
                var beforeArrayIndex = beforeArray.indexOf(current);
                if (beforeArrayIndex < 0) {
                    console.warn("Tried to move card in cache, but wasn't found in expected array. Full refresh of cache");
                    _this.updateCache();
                }
                else {
                    beforeArray.splice(beforeArrayIndex, 1);
                    afterArray.push(current);
                }
            }
        });
        this.database.onRemoveNote.addHandler(function () { return _this.updateCache(); });
        this.database.onUndo.addHandler(function () { return _this.updateCache(); });
    };
    Deck.prototype.sortCardIntoCache = function (card) {
        var array = this.getArrayForCard(card);
        array.push(card);
    };
    Deck.prototype.getArrayForCard = function (card) {
        if (card.state === CardState.inactive || card.hasFlag(CardFlag.suspended)) {
            return this.inactiveCardCache;
        }
        else if (card.state === CardState.active && card instanceof ActivatedCard) {
            return this.activeCardCache;
        }
        else if (card.state === CardState.new) {
            return this.newCardCache;
        }
        else {
            console.error("Unexpected card state", card, this.database);
            throw new Error("Unexpected card state");
        }
    };
    /** sort latest due first */
    Deck.prototype.sortSeenAndReviewCards = function () {
        this.activeCardCache.sort(function (a, b) { return a.dueMinutes - b.dueMinutes; });
    };
    return Deck;
}());
export { Deck };
