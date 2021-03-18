import { Component, Elm } from "../libs/elements.js";
import { Deck } from "../logic.js";
import { getCurrMinuteFloored, minutesToHumanString } from "../utils.js";

export class DeckTimeline extends Component {
    private nextCardInMinutesElm = new Elm("span");
    private next25CardsInMinutesElm = new Elm("span");
    private newCardsElm = new Elm().class("number");
    private dueCardsElm = new Elm().class("number");
    private graduatedCardsElm = new Elm().class("number");
    private timelineGraph = new TimelineGraph(this.deck);

    constructor(private deck: Deck) {
        super("deckTimeline");

        this.append(
            new Elm().append("Next review card in ", this.nextCardInMinutesElm),
            new Elm().append("Next 25 review cards in ", this.next25CardsInMinutesElm),
            this.timelineGraph,
            new Elm().class("cardCounts").append(
                new Elm().class("new").append(
                    "New: ", this.newCardsElm
                ),
                new Elm().class("due").append(
                    "Due: ", this.dueCardsElm
                ),
                new Elm().class("graduated").append(
                    "Inactive: ", this.graduatedCardsElm
                )
            )
        );

        this.nextCardInMinutesElm.append("~");

        this.setMinutelyUpdateIntervals();
    }

    public update() {
        const counts = this.deck.getCardCount();
        const minutesToNextCard = this.deck.getMinutesToNextCard();
        const minutesToNext25Cards = this.deck.getMinutesToNextCard(24);

        this.nextCardInMinutesElm.replaceContents(
            minutesToNextCard === undefined ? "~" : minutesToHumanString(minutesToNextCard)
        );
        this.next25CardsInMinutesElm.replaceContents(
            minutesToNext25Cards === undefined ? "~" : minutesToHumanString(minutesToNext25Cards)
        );
        this.newCardsElm.replaceContents(counts.new);
        this.dueCardsElm.replaceContents(this.deck.getDueCardsCount());
        this.graduatedCardsElm.replaceContents(counts.inactive);

        this.timelineGraph.update();
    }

    private setMinutelyUpdateIntervals() {
        const timeToNextMinute = (Math.floor(Date.now() / 60e3) + 1) * 60e3 - Date.now();

        setTimeout(() => {
            this.update();
            this.setMinutelyUpdateIntervals();
        }, timeToNextMinute);
    }
}

class TimelineGraph extends Component {
    private canvas = new Elm("canvas").class("timelineCanvas");
    private context = this.canvas.getHTMLElement().getContext("2d")!;

    private bucketSizes = [
        1,
        60,
        60 * 24
    ];
    private graphBucketBarWidth = [
        4, 8, 12
    ];
    private numberOfBucketsOfLastType = 22;

    private offsetX = 0;
    private dragScale = 0;
    private isDragging = false;

    constructor(private deck: Deck) {
        super("timelineGraph");

        this.append(this.canvas);

        this.canvas.on("mousedown", e => {
            this.isDragging = true;
            this.dragScale = 2 ** (e.clientX / 100);
        });
        addEventListener("mouseup", () => this.isDragging = false);
        addEventListener("mousemove", e => {
            if (!this.isDragging) { return; }
            this.offsetX -= e.movementX * this.dragScale;
            this.update();
        });
        this.canvas.on("dblclick", e => {
            e.preventDefault();
            this.offsetX = 0;
            this.update();
        });
    }

    public update() {
        if (!this.context) { return; }

        const firstCardMinutes = this.deck.getMinutesToNextCard() ?? 0;
        const minuteZero = getCurrMinuteFloored() + (
            firstCardMinutes > 0 ? 0 : firstCardMinutes
        );

        this.context.canvas.width = 720;
        this.context.canvas.height = 256;
        this.context.clearRect(0, 0, 100, 100);
        this.context.fillStyle = "#000000aa";

        const activeCards = this.deck.getActiveCardsSortedCache();
        const buckets = this.createBucketsArray();

        const offset = - minuteZero - this.offsetX;

        for (const card of activeCards) {
            const relMinutes = card.dueMinutes + offset;
            if (relMinutes < 0) { continue; }

            for (let bucketI = 0; bucketI < this.bucketSizes.length; bucketI++) {
                if (relMinutes >= this.bucketSizes[bucketI + 1]) { continue; }
                const index =
                    Math.floor(card.dueMinutes / this.bucketSizes[bucketI]) +
                    Math.floor(offset / this.bucketSizes[bucketI]);
                buckets[bucketI][Math.min(index, buckets[bucketI].length - 1)]++;
                break;
            }
        }

        let x = 0;
        for (let i = 0; i < this.bucketSizes.length; i++) {
            const bucketBarWidth = this.graphBucketBarWidth[i];
            const bucket = buckets[i];

            for (const bar of bucket) {
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
    }

    private createBucketsArray(): number[][] {
        const arr: number[][] = [];

        for (let i = 0; i < this.bucketSizes.length; i++) {
            const bucketArr: number[] = [];

            let numBuckets: number;
            if (this.bucketSizes[i + 1]) {
                numBuckets = this.bucketSizes[i + 1] / this.bucketSizes[i];
            } else {
                numBuckets = this.numberOfBucketsOfLastType;
            }

            for (let j = 0; j < numBuckets; j++) {
                bucketArr.push(0);
            }

            arr.push(bucketArr);
        }

        return arr;
    }
}
