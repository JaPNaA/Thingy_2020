import { Elm, Component } from "../../libs/elements.js";
import { Deck } from "../../logic.js";
import { ModalDialog } from "./ModalDialog.js";

export class ExportNotesDialog extends ModalDialog {
    private destinationListElm: Elm;

    constructor(private deck: Deck) {
        super("exportNotesDialog");
        this.foregroundElm.append(
            new Elm("h3").append("Export Notes"),
            this.destinationListElm = new Elm().class("sourcesList").append(
                new Elm("button").append("Tanki format (with all due dates)")
                    .on("click", () => this.exportTankiFormat()),
                new Elm("button").append("CSV (with no due dates)")
                    .on("click", () => this.exportCSV())
            )
        )
        console.log(deck);
    }

    private exportTankiFormat() {
        this.destinationListElm.remove();

        const textarea = new CopyTextarea();
        textarea.setValue(this.deck.database.toJSON());
        this.foregroundElm.append(
            new Elm().append("Note that importing Tanki format has not been implemented yet"),
            textarea
        );
    }

    private exportCSV() {
        this.destinationListElm.remove();

        const textarea = new CopyTextarea();
        const noteTypes = this.deck.database.getNoteTypes();
        const noteTypeSelect = new Elm("select").append(
            ...noteTypes.map(type => new Elm("option").append(type.name))
        );
        noteTypeSelect.getHTMLElement().value = "";

        noteTypeSelect.on("change", async () => {
            const noteTypeName = noteTypeSelect.getHTMLElement().value;
            const noteType = this.deck.database.getNoteTypeByName(noteTypeName);
            if (!noteType) {
                throw new Error("Selected note type not in database");
            }

            const csvData: string[][] = [
                (await noteType.getIntegratedNoteType()).fieldNames.slice()
            ];

            for (const note of this.deck.database.getNotes()) {
                if (note.type == noteType) {
                    csvData.push(note.fields.slice());
                }
            }

            textarea.setValue(encodeCSV(csvData));
        });

        this.foregroundElm.append(
            new Elm("label").append(
                new Elm().append("Select note type"),
                noteTypeSelect
            ),
            new Elm().append(textarea)
        );
    }
}

class CopyTextarea extends Component {
    private textarea = new Elm("textarea").attribute("readonly", "readonly");
    private htmlElm = this.textarea.getHTMLElement();

    constructor() {
        super("clickAndSelectTextarea");

        this.elm.append(this.textarea);

        this.textarea.on("focus", () => {
            this.textarea.getHTMLElement().select();
        });
    }

    public getValue() {
        return this.htmlElm.value;
    }

    public setValue(value: string) {
        this.htmlElm.value = value;
    }
}

function encodeCSV(data: string[][]): string {
    return data.map(row => row.map(data => _encodeCSVData(data)).join(',')).join("\n");
}

function _encodeCSVData(text: string): string {
    // quotes escape , \n
    // if quotes in quotes, double quote
    if (text.includes("\n") || text.includes(",") || text.includes("\"")) {
        return '"' + text.replace(/"/g, "\"\"") + '"';
    } else {
        return text;
    }
}
