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
        /** @type {ClearAllButton} */
        this.clearButton = null;

        this._setup();
    }

    _setup() {
        this.append(
            this.clearButton = new ClearAllButton() // @ts-ignore
                .withSelf(/** @param {ClearAllButton} self */ self => {
                    self.setClickHandler(() => this.historyElm.clear());
                    self.hide();
                }),
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
            this.historyElm.append(
                new LookupResult(a)
                    .withSelf(e => // @ts-ignore
                        new LookupResultRemoveButton(e)
                            .appendTo(e)
                    )
            );
            this.clearButton.show();
            this._createLookup();
        });
    }
}

class ClearAllButton extends Component {
    constructor() {
        super("clearAllButton");
        /** @type {function} */
        this.clickHandler = null;

        this.append(
            new Elm("button").class("button", "shadow").append("Clear All")
                .on("click", () => {
                    if (this.clickHandler) {
                        this.clickHandler();
                    }
                    this.hide();
                })
        );
    }

    /**
     * @param {function} handler 
     */
    setClickHandler(handler) {
        this.clickHandler = handler;
    }

    hide() {
        this.class("hidden");
    }

    show() {
        this.removeClass("hidden");
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
            .attribute("placeholder", "Search...")
            .on("change", () => this._inputChangeHandler());
    }

    _inputChangeHandler() {
        /** @type {HTMLInputElement} */
        // @ts-ignore
        const input = this.input.elm;
        this._removeLastLookup();
        this._makeLookup(input.value);
    }

    _removeLastLookup() {
        if (this.lastLookupResults) {
            this.lastLookupResults.remove();
        }
    }

    async _makeLookup(inputValue) {
        if (!inputValue) { return; }
        // const encodedInputValue = encodeURIComponent(inputValue);
        // const url = "https://jisho.org/api/v1/search/words?keyword=" + encodedInputValue;

        // /** @type {JishoApiData} */
        // const result = await fetch(url).then(e => e.json());
        // if (result.meta.status !== 200) { throw new Error("Unexpected status " + result.meta.status); }

        const result = { "meta": { "status": 200 }, "data": [{ "slug": "亜", "is_common": false, "tags": [], "jlpt": [], "japanese": [{ "word": "亜", "reading": "あ" }], "senses": [{ "english_definitions": ["sub-"], "parts_of_speech": ["Prefix"], "links": [], "tags": [], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["-ous (indicating a low oxidation state)", "-ite"], "parts_of_speech": [], "links": [], "tags": ["Chemistry term"], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["Asia"], "parts_of_speech": ["Noun"], "links": [], "tags": ["Abbreviation"], "restrictions": [], "see_also": ["亜細亜 アジア"], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["Argentina"], "parts_of_speech": [], "links": [], "tags": ["Abbreviation"], "restrictions": [], "see_also": ["亜爾然丁 アルゼンチン"], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["Arabia"], "parts_of_speech": [], "links": [], "tags": ["Abbreviation"], "restrictions": [], "see_also": ["亜剌比亜 アラビア"], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["America", "American person"], "parts_of_speech": [], "links": [], "tags": ["Abbreviation", "Obsolete term"], "restrictions": [], "see_also": ["亜米利加 アメリカ", "米 べい"], "antonyms": [], "source": [], "info": ["used in Meiji era, now replaced by 米"] }], "attribution": { "jmdict": true, "jmnedict": false, "dbpedia": false } }, { "slug": "彼", "is_common": true, "tags": [], "jlpt": ["jlpt-n5"], "japanese": [{ "word": "彼", "reading": "あれ" }, { "word": "彼", "reading": "あ" }], "senses": [{ "english_definitions": ["that (indicating something distant from both speaker and listener (in space, time or psychologically), or something understood without naming it directly)"], "parts_of_speech": ["Pronoun"], "links": [], "tags": ["Usually written using kana alone"], "restrictions": [], "see_also": ["何れ", "此れ", "其れ"], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["that person"], "parts_of_speech": [], "links": [], "tags": [], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": ["used to refer to one's equals or inferiors"] }, { "english_definitions": ["over there"], "parts_of_speech": [], "links": [], "tags": ["Archaism"], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["down there (i.e. one's genitals)"], "parts_of_speech": ["Noun"], "links": [], "tags": ["Colloquialism"], "restrictions": ["あれ"], "see_also": [], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["period", "menses"], "parts_of_speech": [], "links": [], "tags": ["Colloquialism"], "restrictions": ["あれ"], "see_also": [], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["hey", "huh?", "eh?"], "parts_of_speech": [], "links": [], "tags": ["Usually written using kana alone"], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": ["expression of surprise, suspicion, etc."] }], "attribution": { "jmdict": true, "jmnedict": false, "dbpedia": false } }, { "slug": "阿", "is_common": false, "tags": [], "jlpt": [], "japanese": [{ "word": "阿", "reading": "あ" }], "senses": [{ "english_definitions": ["first Sanskrit alphabet letter"], "parts_of_speech": ["Noun"], "links": [], "tags": [], "restrictions": [], "see_also": ["阿字 あじ"], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["Africa"], "parts_of_speech": [], "links": [], "tags": ["Abbreviation"], "restrictions": [], "see_also": ["阿弗利加 アフリカ"], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["Awa (old province of Japan)"], "parts_of_speech": [], "links": [], "tags": ["Abbreviation"], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["prefixed to names to show intimacy"], "parts_of_speech": ["Prefix"], "links": [], "tags": ["Familiar language", "Archaism"], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": [] }], "attribution": { "jmdict": true, "jmnedict": false, "dbpedia": false } }, { "slug": "あっ", "is_common": true, "tags": [], "jlpt": ["jlpt-n4"], "japanese": [{ "reading": "あっ" }, { "reading": "アッ" }, { "reading": "アっ" }, { "reading": "あ" }, { "reading": "ア" }], "senses": [{ "english_definitions": ["ah", "oh"], "parts_of_speech": [], "links": [], "tags": [], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": ["expression of surprise, recollection, etc."] }, { "english_definitions": ["hey!"], "parts_of_speech": [], "links": [], "tags": [], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": ["used to get someone's attention"] }, { "english_definitions": ["A (kana)"], "parts_of_speech": ["Wikipedia definition"], "links": [{ "text": "Read “A (kana)” on English Wikipedia", "url": "http://en.wikipedia.org/wiki/A_(kana)?oldid=488921470" }, { "text": "Read “あ” on Japanese Wikipedia", "url": "http://ja.wikipedia.org/wiki/あ?oldid=42599823" }], "tags": [], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": [], "sentences": [] }], "attribution": { "jmdict": true, "jmnedict": false, "dbpedia": "http://dbpedia.org/resource/A_(kana)" } }, { "slug": "赤", "is_common": true, "tags": ["wanikani4"], "jlpt": ["jlpt-n5"], "japanese": [{ "word": "赤", "reading": "あか" }, { "word": "紅", "reading": "あか" }, { "word": "朱", "reading": "あか" }, { "word": "緋", "reading": "あか" }], "senses": [{ "english_definitions": ["red", "crimson", "scarlet"], "parts_of_speech": ["Noun"], "links": [], "tags": [], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["red-containing colour (e.g. brown, pink, orange)"], "parts_of_speech": [], "links": [], "tags": [], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["Red (i.e. communist)"], "parts_of_speech": [], "links": [], "tags": ["Colloquialism"], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": ["often written as アカ"] }, { "english_definitions": ["red light (traffic)"], "parts_of_speech": [], "links": [], "tags": ["Abbreviation"], "restrictions": [], "see_also": ["赤信号"], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["red ink (i.e. in finance or proof-reading)", "(in) the red"], "parts_of_speech": [], "links": [], "tags": ["Abbreviation"], "restrictions": [], "see_also": ["赤字", "赤字"], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["complete", "total", "perfect", "obvious"], "parts_of_speech": ["No-adjective"], "links": [], "tags": [], "restrictions": [], "see_also": ["赤の他人"], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["copper"], "parts_of_speech": ["Noun"], "links": [], "tags": ["Abbreviation"], "restrictions": ["赤"], "see_also": ["銅 あかがね"], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["red poetry ribbon card (in hanafuda)"], "parts_of_speech": [], "links": [], "tags": ["Abbreviation"], "restrictions": [], "see_also": ["あかたん"], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["Aka"], "parts_of_speech": ["Place"], "links": [], "tags": [], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["Red"], "parts_of_speech": ["Wikipedia definition"], "links": [{ "text": "Read “Red” on English Wikipedia", "url": "http://en.wikipedia.org/wiki/Red?oldid=495022741" }, { "text": "Read “赤” on Japanese Wikipedia", "url": "http://ja.wikipedia.org/wiki/赤?oldid=42762386" }], "tags": [], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": [], "sentences": [] }], "attribution": { "jmdict": true, "jmnedict": true, "dbpedia": "http://dbpedia.org/resource/Red" } }, { "slug": "雨", "is_common": true, "tags": ["wanikani5"], "jlpt": ["jlpt-n5"], "japanese": [{ "word": "雨", "reading": "あめ" }], "senses": [{ "english_definitions": ["rain"], "parts_of_speech": ["Noun", "No-adjective"], "links": [], "tags": [], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["Rain"], "parts_of_speech": ["Wikipedia definition"], "links": [{ "text": "Read “Rain” on English Wikipedia", "url": "http://en.wikipedia.org/wiki/Rain?oldid=493013115" }, { "text": "Read “雨” on Japanese Wikipedia", "url": "http://ja.wikipedia.org/wiki/雨?oldid=42665243" }], "tags": [], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": [], "sentences": [] }], "attribution": { "jmdict": true, "jmnedict": false, "dbpedia": "http://dbpedia.org/resource/Rain" } }, { "slug": "上げる", "is_common": true, "tags": ["wanikani1", "wanikani23", "wanikani42"], "jlpt": ["jlpt-n4", "jlpt-n2", "jlpt-n5"], "japanese": [{ "word": "上げる", "reading": "あげる" }, { "word": "挙げる", "reading": "あげる" }, { "word": "揚げる", "reading": "あげる" }], "senses": [{ "english_definitions": ["to raise", "to elevate"], "parts_of_speech": ["Ichidan verb", "Transitive verb"], "links": [], "tags": [], "restrictions": [], "see_also": ["手を挙げる"], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["to do up (one's hair)"], "parts_of_speech": [], "links": [], "tags": [], "restrictions": [], "see_also": ["髪を上げる"], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["to fly (a kite, etc.)", "to launch (fireworks, etc.)", "to surface (a submarine, etc.)"], "parts_of_speech": [], "links": [], "tags": [], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["to land (a boat)"], "parts_of_speech": [], "links": [], "tags": [], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["to deep-fry"], "parts_of_speech": [], "links": [], "tags": [], "restrictions": ["揚げる"], "see_also": [], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["to show someone (into a room)"], "parts_of_speech": [], "links": [], "tags": [], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["to give"], "parts_of_speech": [], "links": [], "tags": ["Polite (teineigo)", "Usually written using kana alone"], "restrictions": ["上げる"], "see_also": [], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["to send someone (away)"], "parts_of_speech": [], "links": [], "tags": [], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["to enrol (one's child in school)", "to enroll"], "parts_of_speech": [], "links": [], "tags": [], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["to increase (price, quality, status, etc.)", "to develop (talent, skill)", "to improve"], "parts_of_speech": [], "links": [], "tags": [], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["to make (a loud sound)", "to raise (one's voice)"], "parts_of_speech": [], "links": [], "tags": [], "restrictions": [], "see_also": ["声を上げる"], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["to earn (something desirable)"], "parts_of_speech": [], "links": [], "tags": [], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["to praise"], "parts_of_speech": [], "links": [], "tags": [], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["to give (an example, etc.)", "to cite"], "parts_of_speech": [], "links": [], "tags": [], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": ["usu. 挙げる"] }, { "english_definitions": ["to summon up (all of one's energy, etc.)"], "parts_of_speech": [], "links": [], "tags": [], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": ["usu. 挙げる"] }, { "english_definitions": ["to arrest"], "parts_of_speech": [], "links": [], "tags": [], "restrictions": ["挙げる"], "see_also": [], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["to nominate"], "parts_of_speech": [], "links": [], "tags": [], "restrictions": ["挙げる"], "see_also": [], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["to summon (for geishas, etc.)"], "parts_of_speech": [], "links": [], "tags": ["Usually written using kana alone"], "restrictions": ["揚げる"], "see_also": [], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["to offer up (incense, a prayer, etc.) to the gods (or Buddha, etc.)"], "parts_of_speech": [], "links": [], "tags": [], "restrictions": ["上げる"], "see_also": [], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["to bear (a child)"], "parts_of_speech": [], "links": [], "tags": [], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["to conduct (a ceremony, esp. a wedding)"], "parts_of_speech": [], "links": [], "tags": [], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": ["usu. 挙げる"] }, { "english_definitions": ["(of the tide) to come in"], "parts_of_speech": ["Ichidan verb", "intransitive verb"], "links": [], "tags": [], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["to vomit"], "parts_of_speech": ["Ichidan verb", "intransitive verb", "Transitive verb"], "links": [], "tags": [], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["to do for (the sake of someone else)"], "parts_of_speech": ["Auxiliary verb", "Ichidan verb"], "links": [], "tags": ["Usually written using kana alone", "Polite (teineigo)"], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": ["after the -te form of a verb"] }, { "english_definitions": ["to complete ..."], "parts_of_speech": [], "links": [], "tags": [], "restrictions": [], "see_also": ["作り上げる"], "antonyms": [], "source": [], "info": ["after the -masu stem of a verb"] }, { "english_definitions": ["to humbly do ..."], "parts_of_speech": [], "links": [], "tags": ["Humble (kenjougo)"], "restrictions": [], "see_also": ["申し上げる"], "antonyms": [], "source": [], "info": ["after the -masu stem of a humble verb to increase the level of humility"] }, { "english_definitions": ["Deep frying"], "parts_of_speech": ["Wikipedia definition"], "links": [{ "text": "Read “Deep frying” on English Wikipedia", "url": "http://en.wikipedia.org/wiki/Deep_frying?oldid=489981393" }, { "text": "Read “揚げる” on Japanese Wikipedia", "url": "http://ja.wikipedia.org/wiki/揚げる?oldid=42769777" }], "tags": [], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": [], "sentences": [] }], "attribution": { "jmdict": true, "jmnedict": false, "dbpedia": "http://dbpedia.org/resource/Deep_frying" } }, { "slug": "足", "is_common": true, "tags": ["wanikani4", "wanikani45"], "jlpt": ["jlpt-n5"], "japanese": [{ "word": "足", "reading": "あし" }, { "word": "脚", "reading": "あし" }, { "word": "肢", "reading": "あし" }], "senses": [{ "english_definitions": ["foot", "paw", "arm (of an octopus, squid, etc.)"], "parts_of_speech": ["Noun"], "links": [], "tags": [], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": ["esp. 足"] }, { "english_definitions": ["leg"], "parts_of_speech": [], "links": [], "tags": [], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": ["esp. 脚,肢"] }, { "english_definitions": ["gait"], "parts_of_speech": [], "links": [], "tags": [], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["pace"], "parts_of_speech": [], "links": [], "tags": [], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["bottom structural component (i.e. radical) of a kanji"], "parts_of_speech": [], "links": [], "tags": [], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": ["usu. 脚"] }, { "english_definitions": ["means of transportation"], "parts_of_speech": [], "links": [], "tags": [], "restrictions": ["足"], "see_also": [], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["money", "coin"], "parts_of_speech": [], "links": [], "tags": ["Archaism"], "restrictions": [], "see_also": ["お足"], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["Foot"], "parts_of_speech": ["Wikipedia definition"], "links": [{ "text": "Read “Foot” on English Wikipedia", "url": "http://en.wikipedia.org/wiki/Foot?oldid=493525811" }, { "text": "Read “足” on Japanese Wikipedia", "url": "http://ja.wikipedia.org/wiki/足?oldid=42590963" }], "tags": [], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": [], "sentences": [] }], "attribution": { "jmdict": true, "jmnedict": false, "dbpedia": "http://dbpedia.org/resource/Foot" } }, { "slug": "朝", "is_common": true, "tags": ["wanikani8"], "jlpt": ["jlpt-n5"], "japanese": [{ "word": "朝", "reading": "あさ" }, { "word": "朝", "reading": "あした" }, { "word": "晨", "reading": "あした" }], "senses": [{ "english_definitions": ["morning"], "parts_of_speech": ["Noun", "Temporal noun"], "links": [], "tags": [], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["breakfast"], "parts_of_speech": ["Noun"], "links": [], "tags": [], "restrictions": ["あさ"], "see_also": [], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["next morning"], "parts_of_speech": [], "links": [], "tags": ["Archaism"], "restrictions": ["朝", "あした"], "see_also": [], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["Morning"], "parts_of_speech": ["Wikipedia definition"], "links": [{ "text": "Read “Morning” on English Wikipedia", "url": "http://en.wikipedia.org/wiki/Morning?oldid=490829429" }, { "text": "Read “朝” on Japanese Wikipedia", "url": "http://ja.wikipedia.org/wiki/朝?oldid=42375382" }], "tags": [], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": [], "sentences": [] }], "attribution": { "jmdict": true, "jmnedict": false, "dbpedia": "http://dbpedia.org/resource/Morning" } }, { "slug": "青", "is_common": true, "tags": [], "jlpt": ["jlpt-n5"], "japanese": [{ "word": "青", "reading": "あお" }, { "word": "蒼", "reading": "あお" }, { "word": "碧", "reading": "あお" }], "senses": [{ "english_definitions": ["blue", "azure"], "parts_of_speech": ["Noun", "No-adjective"], "links": [], "tags": [], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["green"], "parts_of_speech": [], "links": [], "tags": [], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": ["mostly in compound words and in ref. to fruits, plants and traffic lights"] }, { "english_definitions": ["green light (traffic)"], "parts_of_speech": ["Noun"], "links": [], "tags": ["Abbreviation"], "restrictions": [], "see_also": ["青信号"], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["black (horse coat color)"], "parts_of_speech": [], "links": [], "tags": [], "restrictions": [], "see_also": ["青毛"], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["blue poetry ribbon card (in hanafuda)"], "parts_of_speech": [], "links": [], "tags": ["Abbreviation"], "restrictions": [], "see_also": ["あおたん"], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["immature", "unripe", "young"], "parts_of_speech": ["Prefix"], "links": [], "tags": [], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": [] }, { "english_definitions": ["Blue"], "parts_of_speech": ["Wikipedia definition"], "links": [{ "text": "Read “Blue” on English Wikipedia", "url": "http://en.wikipedia.org/wiki/Blue?oldid=492253295" }, { "text": "Read “青” on Japanese Wikipedia", "url": "http://ja.wikipedia.org/wiki/青?oldid=42589924" }], "tags": [], "restrictions": [], "see_also": [], "antonyms": [], "source": [], "info": [], "sentences": [] }], "attribution": { "jmdict": true, "jmnedict": false, "dbpedia": "http://dbpedia.org/resource/Blue" } }] };
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

        this.attribute("tabindex", "0").append(
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

class LookupResultRemoveButton extends Component {
    /**
     * @param {LookupResult} lookupResult lookupResult to add button to
     */
    constructor(lookupResult) {
        super("lookupResultRemoveButton");
        this.lookupResult = lookupResult;
        this._setup();
    }

    _setup() {
        this.append(
            new Elm().class("hitbox").attribute("tabindex", "0")
                .on("click", () => this._onClick())
                .append(
                    new Elm().class("imgContainer", "shadow").append(
                        new Elm().class("deleteButtonImg")
                    )
                )
        );
    }

    _onClick() {
        this.lookupResult.remove();
    }
}


const main = new Main();
main.appendTo(document.body);
console.log(main);

history.scrollRestoration = "manual";

if (/\sElectron\//.test(navigator.userAgent) && window.require) {
    addEventListener("keydown", e => {
        if (e.keyCode === 82 && e.ctrlKey) {
            location.reload();
        } else if (e.keyCode === 73 && e.ctrlKey && e.shiftKey) {
            require("electron").remote.getCurrentWindow().webContents.openDevTools();
        }
    });
}

