import { CardState } from "./dataTypes.js";
import { getCurrMinuteFloored, arrayCopy } from "./utils.js";
var Deck = /** @class */ (function () {
    function Deck(data) {
        this.data = data;
        this.graduatedCards = [];
        this.seenAndLearningCardsSorted = [];
        this.newCards = [];
        this.newCardSettings = [
            /** State */
            CardState.new,
            /** Interval in minutes */
            1,
            /** Difficulty factor */
            1,
            /** Due date in minutes ( [Date#getTime() / 60_000] )*/
            0
        ];
        this.generateCardArrays();
    }
    Deck.prototype.selectCard = function () {
        var nowMinute = getCurrMinuteFloored();
        if (this.seenAndLearningCardsSorted.length && this.seenAndLearningCardsSorted[0].data[3] <= nowMinute) {
            return this.seenAndLearningCardsSorted[0];
        }
        else if (this.newCards.length > 0) {
            return this.newCards[0];
        }
    };
    Deck.prototype.applyResultToCard = function (card, result) {
        // update data based on results
        if (result === 1) {
            card.data[1] *= 2 * card.data[2];
            //       .interval           .difficultyFactor
            card.data[3] = getCurrMinuteFloored() + card.data[1];
            //       .dueDate                         .interval
        }
        else {
            card.data[3] = getCurrMinuteFloored() + card.data[1];
            //       .dueDate                         .interval
        }
        if (card.data[0] === CardState.new) {
            // copy into actual data object
            if (typeof card.parentNote[2] !== "object") {
                card.parentNote[2] = [];
            }
            card.parentNote[2][card.cardTypeID] = card.data;
            //             .cardData
            card.data[0] = CardState.seen;
            //       .state
            var newCardIndex = this.newCards.indexOf(card);
            if (newCardIndex < 0) {
                throw new Error("Rated new card that wasn't in new cards array");
            }
            this.seenAndLearningCardsSorted.push(this.newCards.splice(newCardIndex, 1)[0]);
        }
        this.sortSeenCards();
    };
    Deck.prototype.addNote = function (data) {
        this.data.notes.push(data);
        this.generateCardArrays();
    };
    Deck.prototype.getNoteTypes = function () {
        return this.data.noteTypes;
    };
    Deck.prototype.getMinutesToNextCard = function () {
        var nowMinute = getCurrMinuteFloored();
        var firstCard = this.seenAndLearningCardsSorted[0];
        if (!firstCard) {
            return;
        }
        return firstCard.data[3] - nowMinute;
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
        // algorithm: binary search for boundary
        var bottom = 0;
        var top = this.seenAndLearningCardsSorted.length;
        // while(true) loop with protection
        for (var i = 0, max = Math.log2(this.seenAndLearningCardsSorted.length) + 2; i < max; i++) {
            var middle = Math.floor((bottom + top) / 2);
            if (middle === bottom) {
                if (this.seenAndLearningCardsSorted[middle].data[3] > currMinute) {
                    return top - 1;
                }
                else {
                    return top;
                }
            }
            if (this.seenAndLearningCardsSorted[middle].data[3] > currMinute) {
                top = middle;
            }
            else {
                bottom = middle;
            }
        }
        throw new Error("Looped too many times. Is array sorted?");
    };
    Deck.prototype.exportToString = function () {
        return JSON.stringify(this.data);
    };
    Deck.prototype.generateCardArrays = function () {
        this.graduatedCards.length = 0;
        this.newCards.length = 0;
        this.seenAndLearningCardsSorted.length = 0;
        for (var _i = 0, _a = this.data.notes; _i < _a.length; _i++) {
            var note = _a[_i];
            var noteID = note[0];
            var noteType = this.data.noteTypes[noteID];
            var noteType_NumCardType = noteType.cardTypes.length;
            for (var i = 0; i < noteType_NumCardType; i++) {
                var card = typeof note[2] === "object" ? note[2][i] : undefined;
                if (card === 0 || card === undefined || card[0] === CardState.new) {
                    this.newCards.push(new Card(arrayCopy(this.newCardSettings), i, note));
                }
                else if (card[0] === CardState.graduated) {
                    this.graduatedCards.push(new Card(card, i, note));
                }
                else if (card[0] === CardState.seen || card[0] === CardState.learn) {
                    this.seenAndLearningCardsSorted.push(new Card(card, i, note));
                }
                else {
                    console.error("Unexpected card", card, note, this.data);
                    throw new Error("Unexpected card");
                }
            }
        }
        this.sortSeenCards();
    };
    /** sort latest due first */
    Deck.prototype.sortSeenCards = function () {
        this.seenAndLearningCardsSorted.sort(function (a, b) { return a.data[3] - b.data[3]; });
    };
    return Deck;
}());
export { Deck };
var Card = /** @class */ (function () {
    function Card(data, cardTypeID, parentNote) {
        this.data = data;
        this.cardTypeID = cardTypeID;
        this.parentNote = parentNote;
    }
    return Card;
}());
export { Card };
