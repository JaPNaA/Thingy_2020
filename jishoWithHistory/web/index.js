import { Elm, Component } from "./elements.js";
import { result as exampleResult } from "./exampleResult.js";

//* Nice for debugging

addEventListener("keydown", e => e.key === "r" && e.ctrlKey && location.reload());


/**
 * @typedef {Object} JishoApiData
 * @property {JishoData[]} data
 * @property { { status: number } } meta
 * 
 * @typedef {Object} JishoData
 * @property {string} slug
 * @property {boolean} [is_common]
 * @property {string[]} jlpt
 * @property {string[]} tags
 * @property {Sense[]} senses
 * @property {Japanese[]} japanese
 * 
 * @typedef {Object} Sense
 * @property {string[]} english_definitions
 * @property {string[]} antonyms
 * @property {string[]} info
 * @property { {text: string, url: string}[] } links
 * @property {string[]} parts_of_speech
 * @property {string[]} restrictions
 * @property {string[]} see_also
 * @property {string[]} source
 * @property {string[]} tags
 * 
 * @typedef {Object} Japanese
 * @property {string} [word]
 * @property {string} reading
 */

class Main extends Component {
    constructor() {
        super("main");
        new Lookup().appendTo(this);
    }
}

class Lookup extends Component {
    constructor() {
        super("lookup");

        this.input = this._createInput();
        this.elm.appendChild(this.input);

        this.inputValue = "";
    }

    _createInput() {
        const input = document.createElement("input");
        input.classList.add("input");
        input.addEventListener("change", () => this._inputChangeHandler(input));
        //* debug
        input.value = "おは";
        setTimeout(() => {
            input.dispatchEvent(new Event("change"));
        }, 100);
        return input;
    }

    /** @param {HTMLInputElement} input */
    _inputChangeHandler(input) {
        this.inputValue = input.value;
        input.disabled = true;
        input.classList.add("hidden");
        this._makeLookup();
    }

    async _makeLookup() {
        // const encodedInputValue = encodeURIComponent(this.inputValue);
        // const url = "https://jisho.org/api/v1/search/words?keyword=" + encodedInputValue;
        // const corsProxy = "http://localhost:8081/";

        // /** @type {JishoApiData} */
        // const result = await fetch(corsProxy + url).then(e => e.json());
        // if (result.meta.status !== 200) { throw new Error("Unexpected status " + result.meta.status); }

        //* debug
        const result = exampleResult;

        const lookups = new Elm().class("lookups").appendTo(this);

        for (const item of result.data) {
            new LookupResult(item).appendTo(lookups);
        }

        console.log(result);
    }
}

class LookupResult extends Component {
    /**
     * @param {JishoData} data 
     */
    constructor(data) {
        super("lookupResult");
        this.data = data;

        this._setup();
    }

    _setup() {
        let title = "";
        let reading = "";

        const firstJapanese = this.data.japanese[0];
        if (firstJapanese.word) {
            title = firstJapanese.word;
            reading = firstJapanese.reading;
        } else {
            title = firstJapanese.reading;
        }

        this.append(
            new Elm().class("top").append(
                new Elm().class("word").append(
                    new Elm().class("reading").append(reading),
                    new Elm().class("title").append(title),
                ),

                new Elm().class("tags").withSelf(self => this._addTagsTo(self))
            ),
            new Elm("ol").class("senses").append(
                new Elm().withSelf(self => this._addDefinitionsTo(self))
            )
        );

        if (this.data.is_common) {
            this.class("common");
        }
    }

    /**
     * @param {Elm} elm 
     */
    _addTagsTo(elm) {
        for (const tags of [this.data.tags, this.data.jlpt]) {
            for (const tag of tags) {
                this._createTagElm(tag).appendTo(elm);
            }
        }

        if (this.data.is_common) {
            this._createTagElm("common word").class("common").appendTo(elm);
        }
    }

    /**
     * @param {Elm} elm 
     */
    _addDefinitionsTo(elm) {
        for (const sense of this.data.senses) {
            elm.append(
                new Elm("li").class("sense").append(
                    sense.english_definitions.join("; ")
                )
            );
        }
    }

    /**
     * @param {string} text 
     */
    _createTagElm(text) {
        return new Elm().class("tag").append(text);
    }
}


const main = new Main();
main.appendTo(document.body);
console.log(main);
