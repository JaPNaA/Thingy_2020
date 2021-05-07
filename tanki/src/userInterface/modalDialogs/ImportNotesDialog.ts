import { NoteType, Note } from "../../database.js";
import { NoteTypeDataExternal, CardFlag } from "../../dataTypes.js";
import { Elm, Component, InputElm } from "../../libs/elements.js";
import { Deck } from "../../logic.js";
import { EventHandler } from "../../utils.js";
import { ModalDialog } from "./ModalDialog.js";

export class ImportNotesDialog extends ModalDialog {
    public onImported = new EventHandler();

    private sourcesListElm: Elm;
    /** Flag to prevent double-importing */
    private imported = false;
    private existingData?: string;

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

    public setJishoAPIData(data: string) {
        this.existingData = data;
        this.importFromJishoAPIData();
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

        if (this.existingData) {
            textarea.setValue(this.existingData);
        }

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

                    this.deck.database.logs.startGroup();
                    for (const item of parsed) {
                        const note = Note.create(cardType, [JSON.stringify(item)]);
                        this.deck.database.addNote(note);

                        for (let i = 0; i < checkboxes.length; i++) {
                            const checkbox = checkboxes[i];
                            if (!checkbox.input.getValue()) {
                                const card = this.deck.database.getCardByUid(note.cardUids[i]).clone();
                                card.addFlag(CardFlag.suspended);
                                this.deck.database.writeEdit(card);
                            }
                        }
                    }
                    this.deck.database.logs.endGroup();

                    this.deck.updateCache()
                        .then(() => this.onImported.dispatch());
                })
        )
    }

    private createCheckedCheckbox(labelText: string): { input: InputElm, container: Elm } {
        let input: InputElm;
        let container = new Elm().append(
            new Elm("label").append(
                input = new InputElm().setType("checkbox").setValue(true),
                labelText
            )
        );
        return { input, container };
    }
}

class DragAndDropTextarea extends Component {
    private textarea = new Elm("textarea");
    private htmlElm = this.textarea.getHTMLElement();

    constructor() {
        super("dragAndDropTextarea");

        this.elm.append(this.textarea);

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

    public setValue(value: string) {
        this.htmlElm.value = value;
    }
}
