var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { Component, Elm } from "../libs/elements.js";
import { getCurrMinuteFloored, minutesToHumanString } from "../utils.js";
var DeckTimeline = /** @class */ (function (_super) {
    __extends(DeckTimeline, _super);
    function DeckTimeline(deck) {
        var _this = _super.call(this, "deckTimeline") || this;
        _this.deck = deck;
        _this.nextCardInMinutesElm = new Elm("span");
        _this.next25CardsInMinutesElm = new Elm("span");
        _this.newCardsElm = new Elm().class("number");
        _this.dueCardsElm = new Elm().class("number");
        _this.graduatedCardsElm = new Elm().class("number");
        _this.timelineGraph = new TimelineGraph(_this.deck);
        _this.append(new Elm().append("Next review card in ", _this.nextCardInMinutesElm), new Elm().append("Next 25 review cards in ", _this.next25CardsInMinutesElm), _this.timelineGraph, new Elm().class("cardCounts").append(new Elm().class("new").append("New: ", _this.newCardsElm), new Elm().class("due").append("Due: ", _this.dueCardsElm), new Elm().class("graduated").append("Inactive: ", _this.graduatedCardsElm)));
        _this.nextCardInMinutesElm.append("~");
        _this.setMinutelyUpdateIntervals();
        return _this;
    }
    DeckTimeline.prototype.update = function () {
        var counts = this.deck.getCardCount();
        var minutesToNextCard = this.deck.getMinutesToNextCard();
        var minutesToNext25Cards = this.deck.getMinutesToNextCard(24);
        this.nextCardInMinutesElm.replaceContents(minutesToNextCard === undefined ? "~" : minutesToHumanString(minutesToNextCard));
        this.next25CardsInMinutesElm.replaceContents(minutesToNext25Cards === undefined ? "~" : minutesToHumanString(minutesToNext25Cards));
        this.newCardsElm.replaceContents(counts.new);
        this.dueCardsElm.replaceContents(this.deck.getDueCardsCount());
        this.graduatedCardsElm.replaceContents(counts.inactive);
        this.timelineGraph.update();
    };
    DeckTimeline.prototype.setMinutelyUpdateIntervals = function () {
        var _this = this;
        var timeToNextMinute = (Math.floor(Date.now() / 60e3) + 1) * 60e3 - Date.now();
        setTimeout(function () {
            _this.update();
            _this.setMinutelyUpdateIntervals();
        }, timeToNextMinute);
    };
    return DeckTimeline;
}(Component));
export { DeckTimeline };
var TimelineGraph = /** @class */ (function (_super) {
    __extends(TimelineGraph, _super);
    function TimelineGraph(deck) {
        var _this = _super.call(this, "timelineGraph") || this;
        _this.deck = deck;
        _this.canvas = new Elm("canvas").class("timelineCanvas");
        _this.context = _this.canvas.getHTMLElement().getContext("2d");
        _this.bucketSizes = [
            1,
            60,
            60 * 24
        ];
        _this.graphBucketBarWidth = [
            4, 8, 12
        ];
        _this.numberOfBucketsOfLastType = 22;
        _this.offsetX = 0;
        _this.dragScale = 0;
        _this.isDragging = false;
        _this.append(_this.canvas);
        _this.canvas.on("mousedown", function (e) {
            _this.isDragging = true;
            _this.dragScale = Math.pow(2, (e.clientX / 100));
        });
        addEventListener("mouseup", function () { return _this.isDragging = false; });
        addEventListener("mousemove", function (e) {
            if (!_this.isDragging) {
                return;
            }
            _this.offsetX -= e.movementX * _this.dragScale;
            _this.update();
        });
        _this.canvas.on("dblclick", function (e) {
            e.preventDefault();
            _this.offsetX = 0;
            _this.update();
        });
        return _this;
    }
    TimelineGraph.prototype.update = function () {
        var _a;
        if (!this.context) {
            return;
        }
        var firstCardMinutes = (_a = this.deck.getMinutesToNextCard()) !== null && _a !== void 0 ? _a : 0;
        var minuteZero = getCurrMinuteFloored() + (firstCardMinutes > 0 ? 0 : firstCardMinutes);
        this.context.canvas.width = 720;
        this.context.canvas.height = 256;
        this.context.clearRect(0, 0, 100, 100);
        this.context.fillStyle = "#000000aa";
        var activeCards = this.deck.getActiveCardsSortedCache();
        var buckets = this.createBucketsArray();
        var offset = -minuteZero - this.offsetX;
        for (var _i = 0, activeCards_1 = activeCards; _i < activeCards_1.length; _i++) {
            var card = activeCards_1[_i];
            var relMinutes = card.dueMinutes + offset;
            if (relMinutes < 0) {
                continue;
            }
            for (var bucketI = 0; bucketI < this.bucketSizes.length; bucketI++) {
                if (relMinutes >= this.bucketSizes[bucketI + 1]) {
                    continue;
                }
                var index = Math.floor(card.dueMinutes / this.bucketSizes[bucketI]) +
                    Math.floor(offset / this.bucketSizes[bucketI]);
                buckets[bucketI][Math.min(index, buckets[bucketI].length - 1)]++;
                break;
            }
        }
        var x = 0;
        for (var i = 0; i < this.bucketSizes.length; i++) {
            var bucketBarWidth = this.graphBucketBarWidth[i];
            var bucket = buckets[i];
            for (var _b = 0, bucket_1 = bucket; _b < bucket_1.length; _b++) {
                var bar = bucket_1[_b];
                this.context.fillRect(x, 256, bucketBarWidth, -bar);
                x += bucketBarWidth;
            }
            this.context.fillStyle = "#aaaaaa";
            this.context.fillRect(x, 0, 8, 256);
            x += 8;
            this.context.fillStyle = "#000000aa";
        }
        // this.context.fillStyle = "#ff0000";
        // this.context.fillRect(Date.now() / 60e3 + offset, 0, 2, 128);
    };
    TimelineGraph.prototype.createBucketsArray = function () {
        var arr = [];
        for (var i = 0; i < this.bucketSizes.length; i++) {
            var bucketArr = [];
            var numBuckets = void 0;
            if (this.bucketSizes[i + 1]) {
                numBuckets = this.bucketSizes[i + 1] / this.bucketSizes[i];
            }
            else {
                numBuckets = this.numberOfBucketsOfLastType;
            }
            for (var j = 0; j < numBuckets; j++) {
                bucketArr.push(0);
            }
            arr.push(bucketArr);
        }
        return arr;
    };
    return TimelineGraph;
}(Component));
