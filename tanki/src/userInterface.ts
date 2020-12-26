import { CardFlag, CardState, NoteData, NoteTypeDataExternal } from "./dataTypes.js";
import { Component, Elm } from "./libs/elements.js";
import { Card, Deck } from "./logic.js";
import { writeOut } from "./storage.js";
import { EventHandler, getCurrMinuteFloored, minutesToHumanString, PromiseRejectFunc, PromiseResolveFunc, setImmediatePolyfill, wait } from "./utils.js";

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
                .on("click", () => this.openManageNotesDialog())
        );

        this.enterCardPresenter();
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

                this.deck.applyResultToCard(selectedCard, result);
            } else {
                break;
            }

            this.deckTimeline.update();
        }

        this.exitCardPresenter();
        this.onExit.dispatch();
        this.presenting = false;
    }

    private async openCreateNoteDialog() {
        this.exitCardPresenter();

        const createNoteDialog = new CreateNoteDialog(this.deck).appendTo(this.elm).setPositionFixed();
        const data = await new Promise<NoteData>(function (res) {
            createNoteDialog.onNoteCreated.addHandler(function (data) {
                res(data);
            })
        });
        this.deck.addNoteAndUpdate(data);

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
        this.cardPresenterContainer.class("hidden");
    }

    private enterCardPresenter() {
        this.cardPresenterContainer.removeClass("hidden");
        this.presentingLoop();
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
    public onNoteCreated = new EventHandler<NoteData>();

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
        const noteTypes = this.deck.data.getNoteTypes();

        for (let i = 0; i < noteTypes.length; i++) {
            const noteType = noteTypes[i];
            this.typeSelectElm.append(
                new Elm("option").append(noteType.name).attribute("value", i.toString())
            );
        }
    }

    private async updateInputsElm() {
        const noteTypes = this.deck.data.getNoteTypes();

        this.noteTypeIndex = parseInt(this.typeSelectElm.getHTMLElement().value);
        this.inputElms = [];
        this.inputsContainer.clear();

        const noteType = noteTypes[this.noteTypeIndex];

        for (const fieldName of
            (await this.deck.data.getIntegratedNoteType(noteType.name)).fieldNames
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
        this.onNoteCreated.dispatch([
            this.noteTypeIndex,
            this.inputElms.map(e => e.getHTMLElement().value)
        ]);

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
        src: "resources/jishoAPIDataImportedNoteType.json"
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
                    if (this.deck.data.indexOfNote(
                        ImportNotesDialog.jishoAPIDataImportedNoteType.name
                    ) < 0) {
                        this.deck.data.addNoteType(ImportNotesDialog.jishoAPIDataImportedNoteType)
                    }

                    const index = this.deck.data.indexOfNote(
                        ImportNotesDialog.jishoAPIDataImportedNoteType.name
                    );

                    for (const item of parsed) {
                        this.deck.data.addNote([
                            index, [JSON.stringify(item)],
                            checkboxes.map(checkbox =>
                                checkbox.input.getHTMLElement().checked ?
                                    undefined : [CardState.new, [CardFlag.suspended]]
                            )
                        ]);
                    }

                    this.deck.updateCardArrays()
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

        for (const item of deck.data.getNotes()) {
            const label = item[1][0].slice(0, 20);
            new Elm()
                .append(
                    new Elm().class("label").append(label),
                    new Elm().class("cards").withSelf(cards => {
                        if (item[2]) {
                            for (const card of item[2]) {
                                cards.append(
                                    new Elm().class("card").append(
                                        card ? CardState[card[0]] : "(new)"
                                    )
                                )
                            }
                        } else {
                            cards.append("(all new)");
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
            this.timelineCanvasElm,
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

        //* temporary quality-of-life
        setInterval(() => this.update(), 30e3);
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

    private drawTimeline() {
        if (!this.timelineX) { return; }

        const notes = this.deck.data.getNotes();
        const firstCardMinutes = this.deck.getMinutesToNextCard() ?? 0;
        const minuteZero = getCurrMinuteFloored() + (
            firstCardMinutes > 0 ? 0 : firstCardMinutes
        );

        this.timelineX.canvas.width = innerWidth;
        this.timelineX.canvas.height = 36;
        this.timelineX.clearRect(0, 0, 100, 100);
        this.timelineX.fillStyle = "#00000040";
        // this.timelineX.fillRect(0, 0, 100, 100);

        for (const note of notes) {
            //* temp
            if (note[2]) {
                const cards = note[2];
                for (const card of cards) {
                    if (!card || card[0] !== CardState.active) { continue; }
                    const relativeDue = card[2] - minuteZero;
                    this.timelineX.fillRect(relativeDue, 0, 4, 16);
                    this.timelineX.fillRect(relativeDue / 60, 20, 1, 16);
                }
            }
        }
    }
}

class CardPresenter extends Component {
    public rating?: number;

    private inputGetter = new QuickUserInputGetter();
    private currentState?: {
        card: Card;
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

    public async presentCard(card: Card): Promise<number> {
        if (this.currentState) {
            this.discardState();
        }

        const noteTypes = this.deck.data.getNoteTypes();

        const noteType = await this.deck.data.getIntegratedNoteType(
            noteTypes[card.noteType].name);
        const cardType = noteType.cardTypes[card.cardTypeID];

        const noteFieldNames = noteType.fieldNames;
        const cardFields = card.parentNote[1]; // .fields

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
        contentTemplate: string, fieldNames: string[], fields: string[],
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
