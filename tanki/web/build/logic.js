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
import { CardState, isCardLearning } from "./dataTypes.js";
import { binaryBoundarySearch, getCurrMinuteFloored } from "./utils.js";
var Deck = /** @class */ (function () {
    function Deck(data) {
        this.graduatedCards = [];
        this.seenAndLearningCardsSorted = [];
        this.newCards = [];
        this.data = new DeckDataInteract(data);
        this.generateCardArrays();
    }
    Deck.prototype.selectCard = function () {
        var nowMinute = getCurrMinuteFloored();
        if (this.seenAndLearningCardsSorted.length && this.seenAndLearningCardsSorted[0].dueMinutes <= nowMinute) {
            return this.seenAndLearningCardsSorted[0];
        }
        else if (this.newCards.length > 0) {
            return this.newCards[0];
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
            this.seenAndLearningCardsSorted.push(scheduledNewCard);
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
        if (card.state === CardState.seen) {
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
    Deck.prototype.addNote = function (data) {
        this.data._addNote(data);
        this.generateCardArrays();
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
    Deck.prototype.generateCardArrays = function () {
        this.graduatedCards.length = 0;
        this.newCards.length = 0;
        this.seenAndLearningCardsSorted.length = 0;
        for (var _i = 0, _a = this.data.getNotes(); _i < _a.length; _i++) {
            var note = _a[_i];
            var noteType = this.data.noteGetNoteType(note);
            var noteType_NumCardType = noteType.cardTypes.length;
            for (var i = 0; i < noteType_NumCardType; i++) {
                var card = typeof note[2] === "object" ? note[2][i] : undefined;
                if (card === 0 || card === undefined || card[0] === CardState.new) {
                    this.newCards.push(new Card(i, note));
                }
                else if (card[0] === CardState.graduated) {
                    this.graduatedCards.push(new ScheduledCard(card, i, note));
                }
                else if (card[0] === CardState.seen || card[0] === CardState.learn) {
                    this.seenAndLearningCardsSorted.push(new ScheduledCard(card, i, note));
                }
                else {
                    console.error("Unexpected card", card, note, this.data);
                    throw new Error("Unexpected card");
                }
            }
        }
        this.sortSeenAndReviewCards();
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
    }
    DeckDataInteract.prototype.toJSON = function () {
        return JSON.stringify(this.deckData);
    };
    DeckDataInteract.prototype.getNoteTypes = function () {
        return this.deckData.noteTypes;
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
    DeckDataInteract.prototype._addNote = function (note) {
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
