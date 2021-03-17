import { Component, Elm } from "../libs/elements.js";
import { Deck } from "../logic.js";
import { getCurrMinuteFloored, minutesToHumanString } from "../utils.js";

export class DeckTimeline extends Component {
    private nextCardInMinutesElm = new Elm("span");
    private newCardsElm = new Elm().class("number");
    private dueCardsElm = new Elm().class("number");
    private graduatedCardsElm = new Elm().class("number");
    private timelineGraph = new TimelineGraph(this.deck);

    constructor(private deck: Deck) {
        super("deckTimeline");

        this.append(
            new Elm().append("Next review card in ", this.nextCardInMinutesElm),
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

        this.nextCardInMinutesElm.replaceContents(
            minutesToNextCard === undefined ? "~" : minutesToHumanString(minutesToNextCard)
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

    private offsetX = 0;

    constructor(private deck: Deck) {
        super("timelineGraph");

        this.append(this.canvas);

        //* for debug use
        addEventListener("mousemove", e => {
            this.offsetX = e.clientX * 100;
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
        // this.context.fillRect(0, 0, 100, 100);

        const activeCards = this.deck.getActiveCardsSortedCache();
        const fourMinuteBuckets = new Array(12 * 60 / 4).fill(0);
        const twelveHourBuckets = new Array(128).fill(0);

        const offset = - minuteZero - this.offsetX;
        const fourMinuteBucketIndexOffset = Math.floor(offset / 4);
        const twelveHourBucketIndexOffset = Math.floor(offset / (60 * 12));

        for (const card of activeCards) {
            if (card.dueMinutes + offset < 0) { continue; }

            const fourMinuteBucketIndex = Math.floor(card.dueMinutes / 4) + fourMinuteBucketIndexOffset;
            const twelveHourBucketIndex = Math.floor(card.dueMinutes / (60 * 12)) + twelveHourBucketIndexOffset;

            if (fourMinuteBucketIndex < fourMinuteBuckets.length) {
                fourMinuteBuckets[fourMinuteBucketIndex]++;
            }
            if (twelveHourBucketIndex < twelveHourBuckets.length) {
                twelveHourBuckets[twelveHourBucketIndex]++;
            } else {
                twelveHourBuckets[twelveHourBuckets.length - 1]++;
            }
        }

        for (let i = 0; i < fourMinuteBuckets.length; i++) {
            this.context.fillRect(i * 4, 0, 4, fourMinuteBuckets[i]);
        }

        for (let i = 0; i < twelveHourBuckets.length; i++) {
            this.context.fillRect(i * 4, 128, 4, twelveHourBuckets[i] * 0.5);
        }
    }
}
