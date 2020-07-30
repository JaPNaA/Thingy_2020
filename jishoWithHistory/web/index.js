import { Elm, Component } from "./elements.js";

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

        /** @type {Elm} */
        this.historyElm = null;

        this._setup();
    }

    _setup() {
        this.append(
            this.historyElm = new Elm().class("history"),
            new Elm().class("lookupContainer")
        );

        this._createLookup();
    }

    _createLookup() {
        const lookup = new Lookup().appendTo(this);
        lookup.focus();

        lookup.setReturnHandler(a => {
            console.log(a);
            lookup.remove();
            this.historyElm.append(new LookupResult(a));
            this._createLookup();
        });
    }
}

class Lookup extends Component {
    /**
     * @typedef {(ret: JishoData) => any} LookupReturnHandler
     */

    constructor() {
        super("lookup");

        this.input = this._createInput();

        /** @type {LookupReturnHandler} */
        this.returnHandler = null;
        /** @type {Elm} */
        this.lastLookupResults = null;

        this.append(this.input);
    }

    /**
     * @param {LookupReturnHandler} handler 
     */
    setReturnHandler(handler) {
        this.returnHandler = handler;
    }

    focus() {
        this.input.elm.focus();
        scrollTo(0, document.body.scrollHeight);
        scrollBy(0, -1); // prevent browser scrolling back
    }

    _createInput() {
        return new Elm("input")
            .class("input", "shadow")
            .attribute("autofocus")
            .on("change", () => this._inputChangeHandler());
    }

    _inputChangeHandler() {
        /** @type {HTMLInputElement} */
        // @ts-ignore
        const input = this.input.elm;
        this.inputValue = input.value;
        this._removeLastLookup();
        this._makeLookup();
    }

    _removeLastLookup() {
        if (this.lastLookupResults) {
            this.lastLookupResults.remove();
        }
    }

    async _makeLookup() {
        const encodedInputValue = encodeURIComponent(this.inputValue);
        const url = "https://jisho.org/api/v1/search/words?keyword=" + encodedInputValue;

        /** @type {JishoApiData} */
        const result = await fetch(url).then(e => e.json());
        if (result.meta.status !== 200) { throw new Error("Unexpected status " + result.meta.status); }

        const lookupResults = new Elm().class("lookupResults").appendTo(this);

        for (const item of result.data) {
            new LookupResult(item)
                .appendTo(lookupResults)
                .setClickHandler(() => this._resultSelectedHandler(item));
        }

        this.lastLookupResults = lookupResults;

        console.log(result);
    }

    /**
     * @param {JishoData} item
     */
    _resultSelectedHandler(item) {
        this.returnHandler(item);
    }
}

class LookupResult extends Component {
    /**
     * @param {JishoData} data 
     */
    constructor(data) {
        super("lookupResult");

        this.data = data;

        /** @type {function} */
        this.clickHandler = null;

        this._setup();
    }

    /**
     * @param {function} handler 
     */
    setClickHandler(handler) {
        this.clickHandler = handler;
        this.class("clickable", "shadow");
        this.attribute("tabindex", "0");
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

        this.elm.addEventListener("keydown", e => this._clickByKeyboardHandler(e));
        this.on("click", () => this._onSelected());

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

    /**
     * @param {KeyboardEvent} e 
     */
    _clickByKeyboardHandler(e) {
        if (e.keyCode === 13 || e.keyCode === 32) { // enter or space
            this._onSelected();
        }
    }

    _onSelected() {
        if (this.clickHandler) {
            this.clickHandler();
        }
    }
}


const main = new Main();
main.appendTo(document.body);
console.log(main);

history.scrollRestoration = "manual";
