import { CardState } from "./dataTypes.js";
import { getMinuteFloored, arrayCopy } from "./utils.js";
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
        var nowMinute = getMinuteFloored();
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
            card.data[3] = getMinuteFloored() + card.data[1];
            //       .dueDate                         .interval
        }
        else {
            card.data[3] = getMinuteFloored() + card.data[1];
            //       .dueDate                         .interval
        }
        if (card.data[0] === CardState.new) {
            // copy into actual data object
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
        var nowMinute = getMinuteFloored();
        return this.seenAndLearningCardsSorted[0].data[3] - nowMinute;
    };
    Deck.prototype.getCardCount = function () {
        return {
            new: this.newCards.length,
            seen: this.seenAndLearningCardsSorted.length,
            graduated: this.graduatedCards.length
        };
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
                var card = note[2][i];
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
