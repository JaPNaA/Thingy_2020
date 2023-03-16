import { Component, Elm } from "../libs/elements.js";
import { Deck } from "../logic.js";
import { getCurrMinuteFloored, minutesToHumanString, ReactElm, Watchable } from "../utils.js";
import { TankiInterface } from "./userInterface.js";

export class DeckTimeline extends Component {
    private notifyNext25Cards = new Watchable(false);

    private nextCardInMinutesElm = new Elm("span");
    private next25CardsInMinutesElm = new Elm("span");
    private newCardsElm = new Elm().class("number");
    private dueCardsElm = new Elm().class("number");
    private graduatedCardsElm = new Elm().class("number");
    private notificationIndicationElm = new ReactElm("div")
        .class("notificationIndication")
        .append("\ud83d\udd14")
        .attribute("title", "Will notifiy when next 25 cards are available")
        .addWatchable(this.notifyNext25Cards)
        .setUpdateHandler(self => this.notifyNext25Cards.get() ? self.class("show") : self.removeClass("show"));
    private timelineGraph = new TimelineGraph(this.deck);

    private rateLimitTimeoutID?: NodeJS.Timeout;

    constructor(private tankiInterface: TankiInterface, private deck: Deck) {
        super("deckTimeline");

        this.elm.append(
            new Elm().append("Next review card in ", this.nextCardInMinutesElm),
            new Elm().append("Next 25 review cards in ", this.next25CardsInMinutesElm, this.notificationIndicationElm)
                .class("clickable")
                .on("click", () => this.set25CardsDueNotification()),
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

        this.deck.database.onAnyChange.addHandler(
            () => this.rateLimitedUpdate()
        );
        this.deck.loaded.then(() => this.rateLimitedUpdate());

        this.setMinutelyUpdateIntervals();
    }

    private rateLimitedUpdate() {
        if (this.rateLimitTimeoutID) {
            clearTimeout(this.rateLimitTimeoutID);
        }

        this.rateLimitTimeoutID = setTimeout(() => this.update(), 10);
    }

    private update() {
        console.log("timeline update");
        const counts = this.deck.getCardCount();
        const minutesToNextCard = this.deck.getMinutesToNextCard();
        const minutesToNext25Cards = this.deck.getMinutesToNextCard(24);
        const numCardsDue = this.deck.getDueCardsCount();

        this.nextCardInMinutesElm.replaceContents(
            minutesToNextCard === undefined ? "~" : minutesToHumanString(minutesToNextCard)
        );
        this.next25CardsInMinutesElm.replaceContents(
            minutesToNext25Cards === undefined ? "~" : minutesToHumanString(minutesToNext25Cards)
        );
        this.newCardsElm.replaceContents(counts.new);
        this.dueCardsElm.replaceContents(numCardsDue);
        this.graduatedCardsElm.replaceContents(counts.inactive);

        if (this.notifyNext25Cards.get() && minutesToNext25Cards !== undefined && minutesToNext25Cards <= 0) {
            this.sendCardsDueNotification(numCardsDue);
            this.notifyNext25Cards.set(false);
        }

        this.timelineGraph.update();
    }

    public set25CardsDueNotification() {
        const enabled = this.notifyNext25Cards.get();
        if (enabled) {
            this.notifyNext25Cards.set(false);
            return;
        }
        if (!('Notification' in window)) { this.tankiInterface.showSnackbar("Your browser does not support notifications.", 3000); return; }
        if (Notification.permission === 'granted') {
            this.notifyNext25Cards.set(true);
            return;
        } else if (Notification.permission === 'denied') {
            this.tankiInterface.showSnackbar("Cannot send notifications (permission denied).", 3000);
            return;
        } else {
            const prevPerm = Notification.permission;
            this.tankiInterface.showSnackbar("Grant notification permissions to send a notification when 25 cards are due.", 6000);
            Notification.requestPermission().then(perm => {
                if (perm != prevPerm) { // infinite 'default' permission loop prevention
                    this.set25CardsDueNotification();
                }
            });
        }
    }

    private sendCardsDueNotification(numCards: number) {
        if (!window.Notification) { return; }
        new Notification(`Tanki - ${numCards} cards are due!`, {
            body: `There are ${numCards} waiting for you to review! Let's get them done!`
        });
    }

    private setMinutelyUpdateIntervals() {
        const timeToNextMinute = (Math.floor(Date.now() / 60e3) + 1) * 60e3 - Date.now();

        setTimeout(() => {
            this.rateLimitedUpdate();
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

        this.elm.append(this.canvas);

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
