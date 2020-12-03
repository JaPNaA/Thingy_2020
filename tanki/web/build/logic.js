var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
import { CardState, isCardLearning, isNoteTypeDataIntegrated } from "./dataTypes.js";
import { binaryBoundarySearch, getCurrMinuteFloored } from "./utils.js";
var Deck = /** @class */ (function () {
    function Deck(data) {
        this.graduatedCards = [];
        this.seenAndLearningCardsSorted = [];
        this.newCards = [];
        this.data = new DeckDataInteract(data);
        this.loaded = this.updateCardArrays();
    }
    Deck.prototype.selectCard = function () {
        var nowMinute = getCurrMinuteFloored();
        if (this.seenAndLearningCardsSorted.length && this.seenAndLearningCardsSorted[0].dueMinutes <= nowMinute) {
            return this.seenAndLearningCardsSorted[0];
        }
        else if (this.newCards.length > 0) {
            return this.newCards[Math.floor(Math.random() * this.newCards.length)];
        }
    };
    /** update data based on results */
    Deck.prototype.applyResultToCard = function (card, result) {
        if (card.state === CardState.new) {
            var schedulingSettings = this.data.getCardSchedulingSettings(card);
            var newCardIndex = this.newCards.indexOf(card);
            if (newCardIndex < 0) {
                throw new Error("Rated new card that wasn't in new cards array");
            }
            var newCard = this.newCards.splice(newCardIndex, 1)[0];
            var state = CardState.learn;
            if (result === 1 && schedulingSettings.skipCardIfIsNewButAnsweredCorrectly) {
                state = CardState.graduated;
            }
            var scheduledNewCard = new ScheduledCard([
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
        }
        else if (card instanceof ScheduledCard) {
            this.updateCardScheduleWithResult(card, result);
        }
        else {
            throw new Error();
        }
        this.sortSeenAndReviewCards();
    };
    Deck.prototype.updateCardScheduleWithResult = function (card, result) {
        var schedulingSettings = this.data.getCardSchedulingSettings(card);
        if (card.state === CardState.seen || card.state === CardState.graduated) {
            if (result === 1) {
                card.interval *= schedulingSettings.baseIntervalMultiplier * card.difficultyFactor;
                card.dueMinutes = getCurrMinuteFloored() + card.interval;
            }
            else {
                card.dueMinutes = getCurrMinuteFloored() + card.interval;
            }
        }
        else if (card.state === CardState.learn) {
            if (result === 0) {
                card.learningInterval = schedulingSettings.learningStepsMinutes[0];
                card.dueMinutes = getCurrMinuteFloored() + card.learningInterval;
            }
            else if (result === 1) {
                var nextStepIndex = binaryBoundarySearch(schedulingSettings.learningStepsMinutes, function (step) { return step > card.learningInterval; });
                console.log(nextStepIndex);
                // finished all learning steps check
                if (nextStepIndex >= schedulingSettings.learningStepsMinutes.length) {
                    card.state = CardState.seen;
                    this.updateCardScheduleWithResult(card, result);
                }
                else {
                    card.learningInterval = schedulingSettings.learningStepsMinutes[nextStepIndex];
                    card.dueMinutes = getCurrMinuteFloored() + card.learningInterval;
                }
            }
        }
        else {
            throw new Error("lol not supported yet");
        }
    };
    Deck.prototype.addNoteAndUpdate = function (data) {
        this.data.addNote(data);
        this.updateCardArrays();
    };
    Deck.prototype.getMinutesToNextCard = function () {
        var nowMinute = getCurrMinuteFloored();
        var firstCard = this.seenAndLearningCardsSorted[0];
        if (!firstCard) {
            return;
        }
        return firstCard.dueMinutes - nowMinute;
    };
    Deck.prototype.getCardCount = function () {
        return {
            new: this.newCards.length,
            seen: this.seenAndLearningCardsSorted.length,
            graduated: this.graduatedCards.length
        };
    };
    /**
     * Finds the number of cards that are due by binary-searching for
     * the boundary where a card due that's due becomes not due.
     */
    Deck.prototype.getDueCardsCount = function () {
        if (this.seenAndLearningCardsSorted.length <= 0) {
            return 0;
        }
        var currMinute = getCurrMinuteFloored();
        return binaryBoundarySearch(this.seenAndLearningCardsSorted, function (card) { return card.dueMinutes > currMinute; });
    };
    // todo: make private again and listen for when cards are added
    Deck.prototype.updateCardArrays = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, note, noteType, noteType_NumCardType, i, card;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.graduatedCards.length = 0;
                        this.newCards.length = 0;
                        this.seenAndLearningCardsSorted.length = 0;
                        _i = 0, _a = this.data.getNotes();
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        note = _a[_i];
                        return [4 /*yield*/, this.data.getIntegratedNoteType(this.data.noteGetNoteType(note).name)];
                    case 2:
                        noteType = _b.sent();
                        noteType_NumCardType = noteType.cardTypes.length;
                        for (i = 0; i < noteType_NumCardType; i++) {
                            card = typeof note[2] === "object" ? note[2][i] : undefined;
                            if (card === 0 || card === undefined || card[0] === CardState.new) {
                                this.newCards.push(new Card(i, note));
                            }
                            else {
                                this.sortCardIntoArray(new ScheduledCard(card, i, note));
                            }
                        }
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        this.sortSeenAndReviewCards();
                        return [2 /*return*/];
                }
            });
        });
    };
    Deck.prototype.sortCardIntoArray = function (card) {
        if (card.state === CardState.graduated) {
            this.graduatedCards.push(card);
        }
        else if (card.state === CardState.seen || card.state === CardState.learn) {
            this.seenAndLearningCardsSorted.push(card);
        }
        else if (card.state === CardState.new) {
            this.newCards.push(card);
        }
        else {
            console.error("Unexpected card", card, this.data);
            throw new Error("Unexpected card");
        }
    };
    /** sort latest due first */
    Deck.prototype.sortSeenAndReviewCards = function () {
        this.seenAndLearningCardsSorted.sort(function (a, b) { return a.dueMinutes - b.dueMinutes; });
    };
    return Deck;
}());
export { Deck };
var DeckDataInteract = /** @class */ (function () {
    function DeckDataInteract(deckData) {
        this.deckData = deckData;
        this.externalNoteTypesCache = new Map();
    }
    DeckDataInteract.prototype.toJSON = function () {
        return JSON.stringify(this.deckData);
    };
    DeckDataInteract.prototype.getNoteTypes = function () {
        return this.deckData.noteTypes;
    };
    DeckDataInteract.prototype.indexOfNote = function (noteName) {
        for (var i = 0; i < this.deckData.noteTypes.length; i++) {
            var type = this.deckData.noteTypes[i];
            if (type.name === noteName) {
                return i;
            }
        }
        return -1;
    };
    DeckDataInteract.prototype.getIntegratedNoteType = function (noteName) {
        return __awaiter(this, void 0, void 0, function () {
            var src, _i, _a, type, alreadyLoaded, fetchResult;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        for (_i = 0, _a = this.deckData.noteTypes; _i < _a.length; _i++) {
                            type = _a[_i];
                            if (type.name !== noteName) {
                                continue;
                            }
                            if (isNoteTypeDataIntegrated(type)) {
                                return [2 /*return*/, type];
                            }
                            else {
                                src = type.src;
                                break;
                            }
                        }
                        if (!src) {
                            throw new Error("Invalid note name");
                        }
                        alreadyLoaded = this.externalNoteTypesCache.get(src);
                        if (alreadyLoaded) {
                            return [2 /*return*/, alreadyLoaded];
                        }
                        return [4 /*yield*/, fetch("../" + src).then(function (e) { return e.json(); })];
                    case 1:
                        fetchResult = _b.sent();
                        this.externalNoteTypesCache.set(src, fetchResult);
                        return [2 /*return*/, fetchResult];
                }
            });
        });
    };
    DeckDataInteract.prototype.getNotes = function () {
        return this.deckData.notes;
    };
    DeckDataInteract.prototype.noteGetNoteType = function (note) {
        var noteTypeIndex = note[0];
        return this.deckData.noteTypes[noteTypeIndex];
    };
    DeckDataInteract.prototype.getCardSchedulingSettings = function (card) {
        return this.deckData.schedulingSettings;
    };
    DeckDataInteract.prototype.addNoteType = function (noteType) {
        this.deckData.noteTypes.push(noteType);
    };
    DeckDataInteract.prototype.addNote = function (note) {
        this.deckData.notes.push(note);
    };
    return DeckDataInteract;
}());
var Card = /** @class */ (function () {
    function Card(cardTypeID, parentNote) {
        this.cardTypeID = cardTypeID;
        this.parentNote = parentNote;
    }
    Object.defineProperty(Card.prototype, "state", {
        get: function () { return CardState.new; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Card.prototype, "noteType", {
        get: function () { return this.parentNote[0]; },
        enumerable: false,
        configurable: true
    });
    return Card;
}());
export { Card };
var ScheduledCard = /** @class */ (function (_super) {
    __extends(ScheduledCard, _super);
    function ScheduledCard(data, cardTypeID, parentNote) {
        var _this = _super.call(this, cardTypeID, parentNote) || this;
        _this.data = data;
        return _this;
    }
    Object.defineProperty(ScheduledCard.prototype, "state", {
        get: function () { return this.data[0]; },
        set: function (state) { this.data[0] = state; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ScheduledCard.prototype, "interval", {
        get: function () { return this.data[1]; },
        set: function (minutes) { this.data[1] = minutes; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ScheduledCard.prototype, "difficultyFactor", {
        get: function () { return this.data[2]; },
        set: function (factor) { this.data[2] = factor; },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ScheduledCard.prototype, "dueMinutes", {
        get: function () { return this.data[3]; },
        set: function (minutes) { this.data[3] = Math.round(minutes); },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ScheduledCard.prototype, "timesWrongHistory", {
        get: function () {
            if (this.data[4] === 0) {
                return;
            }
            return this.data[4];
        },
        enumerable: false,
        configurable: true
    });
    ScheduledCard.prototype.addIncorrectCountToRollingHistory = function (incorrectCount) {
        if (this.data[4] === 0 || this.data[4] === undefined) {
            this.data[4] = [];
        }
        this.data[4].push(incorrectCount);
        if (this.data[4].length > 5) {
            this.data[4].shift();
        }
    };
    Object.defineProperty(ScheduledCard.prototype, "learningInterval", {
        get: function () {
            if (!isCardLearning(this.data)) {
                throw new Error("Tried to get learning interval for card not in learning");
            }
            return this.data[5];
        },
        set: function (interval) {
            if (!isCardLearning(this.data)) {
                throw new Error("Tried to setting learning interval for card not in learning");
            }
            this.data[5] = interval;
        },
        enumerable: false,
        configurable: true
    });
    ScheduledCard.prototype._attachCardSchedulingDataToParentNote = function () {
        // this.parentNote[2] is cardData of parent note
        // optional field, so add if not existing
        if (typeof this.parentNote[2] !== "object") {
            this.parentNote[2] = [];
        }
        this.parentNote[2][this.cardTypeID] = this.data;
    };
    return ScheduledCard;
}(Card));
