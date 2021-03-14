var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { ActiveCard, TankiDatabase } from "./database.js";
import { CardFlag, CardState } from "./dataTypes.js";
import { binaryBoundarySearch, getCurrMinuteFloored } from "./utils.js";
var Deck = /** @class */ (function () {
    function Deck(data) {
        this.inactiveCardCache = [];
        this.activeCardCache = [];
        this.newCardCache = [];
        this.database = new TankiDatabase(data);
        this.loaded = this.updateCache();
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
    Deck.prototype.getActiveCards = function () {
        return this.activeCardCache;
    };
    /** update data based on results */
    Deck.prototype.applyResultToCard = function (card, result) {
        console.log("apply result to", card);
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
        else if (card instanceof ActiveCard) {
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
                console.log(nextStepIndex);
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
    Deck.prototype.addNoteAndUpdate = function (data) {
        this.database.addNote(data);
        this.updateCache();
    };
    Deck.prototype.getMinutesToNextCard = function () {
        var nowMinute = getCurrMinuteFloored();
        var firstCard = this.activeCardCache[0];
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
    // todo: make private again and listen for when cards are added
    Deck.prototype.updateCache = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, card;
            return __generator(this, function (_b) {
                this.inactiveCardCache.length = 0;
                this.newCardCache.length = 0;
                this.activeCardCache.length = 0;
                for (_i = 0, _a = this.database.getCards(); _i < _a.length; _i++) {
                    card = _a[_i];
                    this.sortCardIntoCache(card);
                }
                this.sortSeenAndReviewCards();
                return [2 /*return*/];
            });
        });
    };
    Deck.prototype.sortCardIntoCache = function (card) {
        if (card.state === CardState.inactive || card.hasFlag(CardFlag.suspended)) {
            this.inactiveCardCache.push(card);
        }
        else if (card.state === CardState.active && card instanceof ActiveCard) {
            this.activeCardCache.push(card);
        }
        else if (card.state === CardState.new) {
            this.newCardCache.push(card);
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
