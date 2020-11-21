"use strict";
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
var Deck = /** @class */ (function () {
    function Deck(data) {
        this.data = data;
        this.elm = document.createElement("div");
        this.graduatedCards = [];
        this.seenCardsSorted = [];
        this.newCards = [];
        this.newCardSettings = [
            /** State */
            CardState.new,
            /** Interval in minutes */
            1,
            /** Difficulty factor */
            1,
            /** Due date in minutes ( [Date#getTime() / 60_000] )*/
            0
        ];
        this.generateCardArrays();
    }
    Deck.prototype.showCard = function () {
        var card = this.selectCard();
        var noteTypeID = card.parentNote[0];
        var noteType = this.data.noteTypes[noteTypeID];
        var cardType = noteType.cardTypes[card.cardTypeID];
        var front = new CardFaceDisplay(this.cardContentReplacePlaceholders(cardType.frontContent, noteType.fieldNames, card.parentNote[1]));
        var back = new CardFaceDisplay(this.cardContentReplacePlaceholders(cardType.backContent, noteType.fieldNames, card.parentNote[1]));
        this.elm.appendChild(front.elm);
        this.elm.appendChild(back.elm);
    };
    Deck.prototype.addNote = function (data) {
        this.data.notes.unshift(data);
        this.generateCardArrays();
        this.showCard();
    };
    Deck.prototype.cardContentReplacePlaceholders = function (content, fieldNames, fields) {
        var regexMatches = /{{(.+?)}}/g;
        var outString = "";
        var lastIndex = 0;
        for (var match = void 0; match = regexMatches.exec(content);) {
            outString += content.slice(lastIndex, match.index);
            var replaceFieldName = match[1];
            outString += fields[fieldNames.indexOf(replaceFieldName)] || "<<undefined>>";
            lastIndex = match.index + match[0].length;
        }
        outString += content.slice(lastIndex);
        return outString;
    };
    Deck.prototype.generateCardArrays = function () {
        this.graduatedCards.length = 0;
        this.newCards.length = 0;
        this.seenCardsSorted.length = 0;
        for (var _i = 0, _a = this.data.notes; _i < _a.length; _i++) {
            var note = _a[_i];
            var noteID = note[0];
            var noteType = this.data.noteTypes[noteID];
            var noteType_NumCardType = noteType.cardTypes.length;
            for (var i = 0; i < noteType_NumCardType; i++) {
                var card = note[2][i];
                if (card === 0 || card === undefined) {
                    this.newCards.push(new Card(this.newCardSettings, i, note));
                }
                else if (card[0] === CardState.graduated) {
                    this.graduatedCards.push(new Card(card, i, note));
                }
                else {
                    this.seenCardsSorted.push(new Card(card, i, note));
                }
            }
        }
        // sort latest due first
        this.seenCardsSorted.sort(function (a, b) { return a.data[3] - b.data[3]; });
    };
    Deck.prototype.selectCard = function () {
        var nowMinute = Date.now() / 60e3;
        if (this.seenCardsSorted.length && this.seenCardsSorted[0].data[3] <= nowMinute) {
            return this.seenCardsSorted[0];
        }
        else {
            return this.newCards[0];
        }
    };
    return Deck;
}());
function decodeToDeck(str) {
    var obj = JSON.parse(str);
    var deck = new Deck(obj);
    return deck;
}
var CardState;
(function (CardState) {
    CardState[CardState["new"] = 0] = "new";
    CardState[CardState["seen"] = 1] = "seen";
    CardState[CardState["graduated"] = 2] = "graduated";
})(CardState || (CardState = {}));
var Card = /** @class */ (function () {
    function Card(data, cardTypeID, parentNote) {
        this.data = data;
        this.cardTypeID = cardTypeID;
        this.parentNote = parentNote;
    }
    return Card;
}());
var CardFaceDisplay = /** @class */ (function () {
    function CardFaceDisplay(content) {
        this.elm = document.createElement("div");
        this.elm.innerHTML = content;
    }
    return CardFaceDisplay;
}());
function promptUser(message) {
    var promptContainer = document.createElement("elm");
    promptContainer.classList.add("prompt");
    var messageElm = document.createElement("div");
    messageElm.innerHTML = message;
    promptContainer.appendChild(messageElm);
    var input = document.createElement("input");
    var promise = new Promise(function (res) {
        return input.addEventListener("change", function () {
            res(input.value);
            document.body.removeChild(promptContainer);
        });
    });
    promptContainer.append(input);
    document.body.appendChild(promptContainer);
    return promise;
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var deck;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetch("../deckData.json")
                        .then(function (e) { return e.text(); })
                        .then(function (e) { return decodeToDeck(e); })];
                case 1:
                    deck = _a.sent();
                    document.body.appendChild(deck.elm);
                    deck.showCard();
                    // document.getElementById("createNote")?.addEventListener("click", function() {
                    //     //
                    // });
                    document.getElementById("createNote").addEventListener("click", function () {
                        return __awaiter(this, void 0, void 0, function () {
                            var type, _a, f1, f2;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        _a = parseInt;
                                        return [4 /*yield*/, promptUser("Type:")];
                                    case 1:
                                        type = _a.apply(void 0, [_b.sent()]);
                                        return [4 /*yield*/, promptUser("Field 1:")];
                                    case 2:
                                        f1 = _b.sent();
                                        return [4 /*yield*/, promptUser("Field 2:")];
                                    case 3:
                                        f2 = _b.sent();
                                        deck.addNote([type, [f1, f2], []]);
                                        return [2 /*return*/];
                                }
                            });
                        });
                    });
                    console.log(deck);
                    return [2 /*return*/];
            }
        });
    });
}
main();
