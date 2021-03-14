import { Card, Note, NoteType } from "./database.js";
import { CardFlag, CardState, NoteData, NoteTypeDataExternal } from "./dataTypes.js";
import { Component, Elm } from "./libs/elements.js";
import { Deck } from "./logic.js";
import { writeOut } from "./storage.js";
import { EventHandler, getCurrMinuteFloored, Immutable, minutesToHumanString, PromiseRejectFunc, PromiseResolveFunc, setImmediatePolyfill, wait } from "./utils.js";

export class TankiInterface extends Component {
    private deckPresenter: DeckPresenter;

    constructor(deck: Deck) {
        super("tankiInterface");
        this.deckPresenter = new DeckPresenter(deck);
        this.deckPresenter.appendTo(this);
        this.append(
            new Elm("button").class("writeOut")
                .append("Write Out")
                .on("click", () => {
                    writeOut(deck);
                })
        );

        //* for testing
        addEventListener("keydown", e => {
            if (e.code === "KeyZ") {
                deck.database.undoLog.undo();
                deck.updateCache();
                this.deckPresenter.update();
            }
        });

        this.deckPresenter.onExit.addHandler(() => writeOut(deck));
    }
}

class DeckPresenter extends Component {
    public onExit = new EventHandler();

    private cardPresenter: CardPresenter;
    private deckTimeline: DeckTimeline;

    private cardPresenterContainer: Elm;

    private presenting: boolean = false;

    constructor(private deck: Deck) {
        super("deckPresenter");

        this.cardPresenter = new CardPresenter(this.deck);
        this.deckTimeline = new DeckTimeline(this.deck);
        deck.loaded.then(() => this.deckTimeline.update());

        this.append(
            this.cardPresenterContainer = new Elm().class("cardPresenterContainer")
                .append(this.cardPresenter),
            new Elm().class("timeline").append(this.deckTimeline),
            new Elm("button").class("exitButton")
                .append("Exit")
                .on("click", () => this.exitCardPresenter()),
            new Elm("button").class("enterButton")
                .append("Enter")
                .on("click", () => this.enterCardPresenter()),
            new Elm("button").class("createNote")
                .append("Create Note")
                .on("click", () => this.openCreateNoteDialog()),
            new Elm("button").class("importNotes")
                .append("Import Notes")
                .on("click", () => this.openImportNotesDialog()),
            new Elm("button").class("manageNotes")
                .append("Manage Notes")
                .on("click", () => this.openManageNotesDialog()),
            new Elm("button").class("JishoWithHistory")
                .append("Jisho With History")
                .on("click", () => {
                    window.open(
                        "jishoWithHistory/index.html", "",
                        "width=612,height=706"
                    );
                })
            // new Elm("button").class("graduateNotes")
            //     .append("Graduate Notes")
            //     .on("click", () => {
            //         const notes = this.deck.data.getNotes();
            //         for (const note of notes) {
            //             const cards = note[2];
            //             if (!cards) { continue; }
            //             for (const card of cards) {
            //                 if (card && isCardActive(card)) {
            //                     if (card[3] > 7 * 24 * 60) {
            //                         card[0] = CardState.inactive;
            //                     }
            //                 }
            //             }
            //         }
            //         this.deckTimeline.update();
            //     })
        );

        this.escKeyExitHandler = this.escKeyExitHandler.bind(this);

        this.enterCardPresenter();
    }

    public update() {
        this.deckTimeline.update();
    }

    private async presentingLoop() {
        if (this.presenting) { return; }
        this.presenting = true;

        while (true) {
            const selectedCard = this.deck.selectCard();
            if (selectedCard) {
                let result;
                try {
                    result = await this.cardPresenter.presentCard(selectedCard);
                } catch (interrupt) {
                    console.log(interrupt);
                    break;
                }

                this.deck.database.undoLog.startGroup();
                this.deck.applyResultToCard(selectedCard, result);
                this.deck.database.undoLog.endGroup();
            } else {
                break;
            }

            this.deckTimeline.update();
        }

        this.exitCardPresenter();
        this.onExit.dispatch();
        this.presenting = false;
    }

    private addEscKeyExitHandler() {
        addEventListener("keydown", this.escKeyExitHandler);
    }

    private removeEscKeyExitHandler() {
        removeEventListener("keydown", this.escKeyExitHandler);
    }

    private escKeyExitHandler(event: KeyboardEvent) {
        if (event.key === "Escape") {
            this.exitCardPresenter();
        }
    }

    private async openCreateNoteDialog() {
        this.exitCardPresenter();

        const createNoteDialog = new CreateNoteDialog(this.deck).appendTo(this.elm).setPositionFixed();
        const note = await new Promise<Note>(res => {
            createNoteDialog.onNoteCreated.addHandler(note => {
                res(note);
            });
        });

        this.deck.database.undoLog.startGroup();
        this.deck.addNoteAndUpdate(note);
        this.deck.database.undoLog.endGroup();

        this.deckTimeline.update();
        createNoteDialog.remove();
    }

    private async openImportNotesDialog() {
        this.exitCardPresenter();

        const importNotesDialog = new ImportNotesDialog(this.deck).appendTo(this.elm).setPositionFixed();
        importNotesDialog.onImported.addHandler(() => {
            this.deckTimeline.update();
            importNotesDialog.remove();
        });
    }

    private openManageNotesDialog() {
        this.exitCardPresenter();

        new ManageNotesDialog(this.deck).appendTo(this.elm).setPositionFixed();
    }

    private exitCardPresenter() {
        this.cardPresenter.discardState();
        this.removeEscKeyExitHandler();
        this.cardPresenterContainer.class("hidden");
    }

    private enterCardPresenter() {
        this.cardPresenterContainer.removeClass("hidden");
        this.presentingLoop();
        this.addEscKeyExitHandler();
    }
}

abstract class ModalDialog extends Component {
    protected foregroundElm: Elm;

    constructor(name: string) {
        super(name);
        this.class("modalDialog");

        this.append(
            new Elm().class("modalBackground")
                .on("click", () => this.remove()),
            this.foregroundElm = new Elm().class("modalForeground").appendTo(this.elm)
        );

        this.show();
    }

    public setPositionFixed() {
        this.class("positionFixed");
        return this;
    }

    public async remove() {
        await this.hide();
        super.remove();
    }

    protected async show() {
        await wait(1);
        this.class("showing");
    }

    protected async hide() {
        this.removeClass("showing");
        await wait(500);
    }
}

class CreateNoteDialog extends ModalDialog {
    public onNoteCreated = new EventHandler<Note>();

    private inputsContainer: Elm;
    private typeSelectElm: Elm<"select">;

    private noteTypeIndex?: number;
    private inputElms?: Elm<"input">[];

    constructor(private deck: Deck) {
        super("createNoteDialog");

        this.foregroundElm.append(
            new Elm("h2").append("Create Note"),
            this.typeSelectElm = new Elm("select").class("typeSelect")
                .on("change", () => this.updateInputsElm()),
            this.inputsContainer = new Elm().class("inputs"),
            new Elm("button").append("Add")
                .on("click", () => this.submit())
        );

        this.loadNoteTypes();
        this.updateInputsElm();
    }

    private loadNoteTypes() {
        const noteTypes = this.deck.database.getNoteTypes();

        for (let i = 0; i < noteTypes.length; i++) {
            const noteType = noteTypes[i];
            this.typeSelectElm.append(
                new Elm("option").append(noteType.name).attribute("value", i.toString())
            );
        }
    }

    private async updateInputsElm() {
        const noteTypes = this.deck.database.getNoteTypes();

        this.noteTypeIndex = parseInt(this.typeSelectElm.getHTMLElement().value);
        this.inputElms = [];
        this.inputsContainer.clear();

        const noteType = noteTypes[this.noteTypeIndex];

        for (const fieldName of
            (await NoteType.getIntegratedNoteType(noteType)).fieldNames
        ) {
            const inputElm = new Elm("input").class("cardFieldInput");

            this.inputElms.push(inputElm);
            this.inputsContainer.append(
                new Elm("label").class("cardFieldLabel").append(fieldName, inputElm)
            );
        }
    }

    private submit() {
        if (this.noteTypeIndex === undefined || !this.inputElms) { return; }
        this.onNoteCreated.dispatch(Note.create(
            this.deck.database.getNoteTypes()[this.noteTypeIndex],
            this.inputElms.map(e => e.getHTMLElement().value))
        );

        for (const inputElm of this.inputElms) {
            inputElm.getHTMLElement().value = "";
        }
        this.inputElms[0].getHTMLElement().focus();
    }
}

class ImportNotesDialog extends ModalDialog {
    public onImported = new EventHandler();

    private sourcesListElm: Elm;
    /** Flag to prevent double-importing */
    private imported = false;

    private static jishoAPIDataImportedNoteType: NoteTypeDataExternal = {
        name: "jishoAPIDataImportedNoteType",
        src: "resources/jishoAPIDataImportedNoteType.json",
        numCardTypes: 3
    };

    constructor(private deck: Deck) {
        super("importNotesDialog");
        this.foregroundElm.append(
            new Elm("h3").append("Import Notes"),
            this.sourcesListElm = new Elm().class("sourcesList").append(
                new Elm("button").append("jishoAPIData (jishoWithHistory)")
                    .on("click", () => this.importFromJishoAPIData())
            )
        )
        console.log(deck);
    }

    private importFromJishoAPIData() {
        this.sourcesListElm.remove();
        this.imported = false;

        const textarea = new DragAndDropTextarea();
        const checkboxes = [
            this.createCheckedCheckbox("Word -> Meaning"),
            this.createCheckedCheckbox("Word -> Kana"),
            this.createCheckedCheckbox("Kana + Meaning -> Word")
        ];

        this.foregroundElm.append(
            textarea,
            new Elm().class("options").append(
                ...checkboxes.map(checkbox => checkbox.container)
            ),
            new Elm("button").append("Import")
                .on("click", () => {
                    if (this.imported) { return; }
                    this.imported = true;

                    const value = textarea.getValue();
                    const parsed = JSON.parse(value);
                    if (!this.deck.database.getNoteTypeByName(
                        ImportNotesDialog.jishoAPIDataImportedNoteType.name
                    )) {
                        this.deck.database.addNoteType(
                            new NoteType(ImportNotesDialog.jishoAPIDataImportedNoteType))
                    }

                    const cardType = this.deck.database.getNoteTypeByName(
                        ImportNotesDialog.jishoAPIDataImportedNoteType.name
                    )!;

                    this.deck.database.undoLog.startGroup();
                    for (const item of parsed) {
                        const note = Note.create(cardType, [JSON.stringify(item)]);
                        this.deck.database.addNote(note);

                        for (let i = 0; i < checkboxes.length; i++) {
                            const checkbox = checkboxes[i];
                            if (!checkbox.input.getHTMLElement().checked) {
                                const card = this.deck.database.getCardByUid(note.cardUids[i]).clone();
                                card.addFlag(CardFlag.suspended);
                                this.deck.database.writeEdit(card);
                            }
                        }
                    }
                    this.deck.database.undoLog.endGroup();

                    this.deck.updateCache()
                        .then(() => this.onImported.dispatch());
                })
        )
    }

    private createCheckedCheckbox(labelText: string): { input: Elm<"input">, container: Elm } {
        let input: Elm<"input">;
        let container = new Elm().append(
            new Elm("label").append(
                input = new Elm("input").attribute("type", "checkbox")
                    .withSelf(e => e.getHTMLElement().checked = true),
                labelText
            )
        );
        return { input, container };
    }
}

class ManageNotesDialog extends ModalDialog {
    private notesList: Elm;

    constructor(deck: Deck) {
        super("manageNotesDialog");

        this.foregroundElm.append(
            new Elm("h1").append("Manage notes"),
            this.notesList = new Elm().class("notesList")
        );

        for (const item of deck.database.getNotes()) {
            const label = item.fields[0].slice(0, 20);
            new Elm()
                .append(
                    new Elm().class("label").append(label),
                    new Elm().class("cards").withSelf(cards => {
                        for (const cardUid of item.cardUids) {
                            const card = deck.database.getCardByUid(cardUid);
                            cards.append(
                                new Elm().class("card").append(CardState[card.state])
                            )
                        }
                    })
                )
                .appendTo(this.notesList);
        }
    }
}

class DragAndDropTextarea extends Component {
    private textarea = new Elm("textarea");
    private htmlElm = this.textarea.getHTMLElement();

    constructor() {
        super("dragAndDropTextarea");

        this.append(this.textarea);

        this.textarea.on("dragover", e => {
            e.preventDefault();
        });
        this.textarea.on("drop", async e => {
            if (!e.dataTransfer) { return; }
            e.preventDefault();
            const textData = e.dataTransfer.getData("text");
            if (textData) {
                this.htmlElm.value = textData;
                return;
            }

            if (e.dataTransfer.files.length > 0) {
                const file = e.dataTransfer.files.item(0);
                if (file) {
                    this.htmlElm.value = await file.text();
                }
            }
        });
    }

    public getValue() {
        return this.htmlElm.value;
    }
}

class DeckTimeline extends Component {
    private nextCardInMinutesElm = new Elm("span");
    private newCardsElm = new Elm().class("number");
    private dueCardsElm = new Elm().class("number");
    private graduatedCardsElm = new Elm().class("number");
    private timelineCanvasElm = new Elm("canvas").class("timelineCanvas");
    /** Canvas context for timeline canvas element */
    private timelineX = this.timelineCanvasElm.getHTMLElement().getContext("2d")!;

    constructor(private deck: Deck) {
        super("deckTimeline");

        this.append(
            new Elm().append("Next review card in ", this.nextCardInMinutesElm),
            new Elm().class("timelineCanvasContainer")
                .append(this.timelineCanvasElm),
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

        this.drawTimeline();
    }

    private setMinutelyUpdateIntervals() {
        const timeToNextMinute = (Math.floor(Date.now() / 60e3) + 1) * 60e3 - Date.now();

        setTimeout(() => {
            this.update();
            this.setMinutelyUpdateIntervals();
        }, timeToNextMinute);
    }

    private drawTimeline() {
        if (!this.timelineX) { return; }

        const firstCardMinutes = this.deck.getMinutesToNextCard() ?? 0;
        const minuteZero = getCurrMinuteFloored() + (
            firstCardMinutes > 0 ? 0 : firstCardMinutes
        );

        this.timelineX.canvas.width = 720;
        this.timelineX.canvas.height = 256;
        this.timelineX.clearRect(0, 0, 100, 100);
        this.timelineX.fillStyle = "#000000aa";
        // this.timelineX.fillRect(0, 0, 100, 100);

        const activeCards = this.deck.getActiveCards();
        const fourMinuteBuckets = new Array(12 * 60 / 4).fill(0);
        const twelveHourBuckets = new Array(128).fill(0);

        for (const card of activeCards) {
            const relativeDue = card.dueMinutes - minuteZero;
            const fourMinuteBucketIndex = Math.floor(relativeDue / 4);
            const twelveHourBucketIndex = Math.floor(relativeDue / (60 * 12));

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
            this.timelineX.fillRect(i * 4, 0, 4, fourMinuteBuckets[i]);
        }

        for (let i = 0; i < twelveHourBuckets.length; i++) {
            this.timelineX.fillRect(i * 4, 128, 4, twelveHourBuckets[i] * 0.5);
        }
    }
}

class CardPresenter extends Component {
    public rating?: number;

    private inputGetter = new QuickUserInputGetter();
    private currentState?: {
        card: Immutable<Card>;
    };

    private cardIFrame = new Elm("iframe").class("card");
    private cardIFrameDocument?: Document;

    constructor(private deck: Deck) {
        super("cardPresenter");
        this.append(this.cardIFrame, this.inputGetter);

        this.cardIFrame.on("load", () => {
            const iframeWindow = this.cardIFrame.getHTMLElement().contentWindow;
            if (!iframeWindow) { throw new Error("iframe loaded but no window"); }
            this.cardIFrameDocument = iframeWindow.document;
            this.setPropogateKeyEvents(iframeWindow);
        });
    }

    public async presentCard(card: Immutable<Card>): Promise<number> {
        if (this.currentState) {
            this.discardState();
        }

        const noteType = await card.parentNote.type.getIntegratedNoteType();
        const cardType = noteType.cardTypes[card.cardTypeID];

        const noteFieldNames = noteType.fieldNames;
        const cardFields = card.parentNote.fields;

        this.currentState = { card };

        this.createCardInIFrame(
            cardType.frontTemplate,
            noteFieldNames, cardFields,
            noteType.style,
            [noteType.script, cardType.frontScript]
        );
        await this.inputGetter.options(["Show back"]);

        this.createCardInIFrame(
            cardType.backTemplate.replace("{{frontTemplate}}", cardType.frontTemplate),
            noteFieldNames, cardFields,
            noteType.style,
            [noteType.script, cardType.backScript]
        );

        const rating = await this.inputGetter.options(["Forgot", "Remembered"], 1);
        console.log(rating);

        this.discardState();

        return rating;
    }

    public discardState() {
        if (!this.currentState) { return; }
        this.inputGetter.discardState();
        this.currentState = undefined;
    }

    private createCardInIFrame(
        contentTemplate: string, fieldNames: Immutable<string[]>, fields: Immutable<string[]>,
        styles: string | undefined, scripts: (string | undefined)[]
    ): void {
        const regexMatches = /{{(.+?)}}/g;
        let outString = "";
        let lastIndex = 0;

        for (let match; match = regexMatches.exec(contentTemplate);) {
            outString += contentTemplate.slice(lastIndex, match.index);
            const replaceFieldName = match[1];
            outString += fields[fieldNames.indexOf(replaceFieldName)] || "&lt;&lt;undefined&gt;&gt;";
            lastIndex = match.index + match[0].length;
        }

        outString += contentTemplate.slice(lastIndex);

        if (!this.cardIFrameDocument) { throw new Error("Tried to create card in unopened iframe"); }

        this.cardIFrameDocument.body.innerHTML = outString;
        if (styles) {
            this.cardIFrameDocument.body.appendChild(
                new Elm("style").append(styles).getHTMLElement()
            );
        }

        try {
            //* dangerous!
            new Function("require", ...fieldNames, scripts.join("\n"))
                .call(this.cardIFrameDocument, undefined, ...fields);
        } catch (err) {
            console.warn("Error while running script for card", err);
        }

    }

    private setPropogateKeyEvents(iframeWindow: Window) {
        iframeWindow.addEventListener("keydown", e => {
            setImmediatePolyfill(
                () => this.cardIFrame.getHTMLElement().dispatchEvent(e)
            );
        });
    }
}


/**
 * Can recieve inputs quickly from user
 */
class QuickUserInputGetter extends Component {
    private state?: {
        promiseReject: PromiseRejectFunc,
        documentKeydownListener: (e: KeyboardEvent) => void,
        elm: HTMLDivElement
    };

    constructor() {
        super("quickUserInputGetter");
    }

    public options(items: string[], defaultIndex?: number): Promise<number> {
        this.discardState();

        const optionsContainer = document.createElement("div");

        let promiseRes: PromiseResolveFunc<number>,
            promiseRej!: PromiseRejectFunc;
        const promise: Promise<number> = new Promise((res, rej) => {
            promiseRej = rej;
            promiseRes = res;
        });

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const button = document.createElement("button");
            button.innerText = item;
            button.addEventListener("click", () => {
                promiseRes(i);
                this.discardState();
            });
            optionsContainer.appendChild(button);
        }

        this.elm.appendChild(optionsContainer);

        const keydownHandler = (e: KeyboardEvent) => {
            if (e.repeat) { return; }

            const numberKey = parseInt(e.key) - 1;
            let wasValidInput = true;
            if (!isNaN(numberKey) && numberKey < items.length && numberKey >= 0) {
                promiseRes(numberKey);
            } else if (e.key === " " || e.key === "Enter") {
                promiseRes(defaultIndex ?? 0);
            } else {
                wasValidInput = false;
            }

            if (wasValidInput) {
                e.preventDefault();
                this.discardState();
            }
        };

        document.addEventListener("keydown", keydownHandler);

        this.state = {
            promiseReject: promiseRej,
            elm: optionsContainer,
            documentKeydownListener: keydownHandler
        };

        return promise;
    }

    public discardState() {
        if (!this.state) { return; }
        this.elm.removeChild(this.state.elm);
        document.removeEventListener("keydown", this.state.documentKeydownListener);
        this.state.promiseReject("State discarded");
        this.state = undefined;
    }
}
