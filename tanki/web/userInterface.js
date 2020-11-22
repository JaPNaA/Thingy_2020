var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var CardPresenter = /** @class */ (function () {
    function CardPresenter() {
        this.inputGetter = new QuickUserInputGetter();
        this.elm = document.createElement("div");
        this.elm.classList.add("cardPresenter");
        this.elm.appendChild(this.inputGetter.elm);
    }
    CardPresenter.prototype.setNoteTypes = function (noteTypeData) {
        this.noteTypes = noteTypeData;
    };
    CardPresenter.prototype.presentCard = function (card) {
        return __awaiter(this, void 0, void 0, function () {
            var cardElm, noteTypeID, noteType, cardType, noteFieldNames, cardFields, front, back, rating;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.currentState) {
                            this.discardState();
                        }
                        if (!this.noteTypes) {
                            throw new Error("Note types not set");
                        }
                        cardElm = document.createElement("div");
                        cardElm.classList.add("card");
                        this.elm.appendChild(cardElm);
                        noteTypeID = card.parentNote[0];
                        noteType = this.noteTypes[noteTypeID];
                        cardType = noteType.cardTypes[card.cardTypeID];
                        noteFieldNames = noteType.fieldNames;
                        cardFields = card.parentNote[1];
                        this.currentState = { card: card, cardElm: cardElm };
                        front = this.createFaceDisplay(cardType.frontTemplate, noteFieldNames, cardFields);
                        this.currentState.front = front;
                        cardElm.appendChild(front.elm);
                        return [4 /*yield*/, this.inputGetter.options(["Show back"])];
                    case 1:
                        _a.sent();
                        back = this.createFaceDisplay(cardType.backTemplate, noteFieldNames, cardFields);
                        this.currentState.back = back;
                        cardElm.appendChild(back.elm);
                        return [4 /*yield*/, this.inputGetter.options(["Forgot", "Remembered"])];
                    case 2:
                        rating = _a.sent();
                        this.discardState();
                        return [2 /*return*/, rating];
                }
            });
        });
    };
    CardPresenter.prototype.discardState = function () {
        if (!this.currentState) {
            return;
        }
        this.elm.removeChild(this.currentState.cardElm);
        this.currentState = undefined;
    };
    CardPresenter.prototype.createFaceDisplay = function (contentTemplate, fieldNames, fields) {
        var regexMatches = /{{(.+?)}}/g;
        var outString = "";
        var lastIndex = 0;
        for (var match = void 0; match = regexMatches.exec(contentTemplate);) {
            outString += contentTemplate.slice(lastIndex, match.index);
            var replaceFieldName = match[1];
            outString += fields[fieldNames.indexOf(replaceFieldName)] || "<<undefined>>";
            lastIndex = match.index + match[0].length;
        }
        outString += contentTemplate.slice(lastIndex);
        return new CardFaceDisplay(outString);
    };
    return CardPresenter;
}());
export { CardPresenter };
var CardFaceDisplay = /** @class */ (function () {
    function CardFaceDisplay(content) {
        this.elm = document.createElement("div");
        this.elm.innerHTML = content;
    }
    return CardFaceDisplay;
}());
export { CardFaceDisplay };
/**
 * Can recieve inputs quickly from user
 */
var QuickUserInputGetter = /** @class */ (function () {
    function QuickUserInputGetter() {
        this.elm = document.createElement("div");
        this.elm.classList.add("userInputGetter");
    }
    QuickUserInputGetter.prototype.options = function (items, defaultIndex) {
        var _this = this;
        this.discardState();
        var optionsContainer = document.createElement("div");
        var promiseRes, promiseRej;
        var promise = new Promise(function (res, rej) {
            promiseRej = rej;
            promiseRes = res;
        });
        var _loop_1 = function (i) {
            var item = items[i];
            var button = document.createElement("button");
            button.innerText = item;
            button.addEventListener("click", function () {
                promiseRes(i);
                _this.discardState();
            });
            optionsContainer.appendChild(button);
        };
        for (var i = 0; i < items.length; i++) {
            _loop_1(i);
        }
        this.elm.appendChild(optionsContainer);
        this.state = {
            promiseReject: promiseRej,
            elm: optionsContainer
        };
        return promise;
    };
    QuickUserInputGetter.prototype.discardState = function () {
        if (!this.state) {
            return;
        }
        this.elm.removeChild(this.state.elm);
        this.state.promiseReject();
        this.state = undefined;
    };
    return QuickUserInputGetter;
}());
export { QuickUserInputGetter };
