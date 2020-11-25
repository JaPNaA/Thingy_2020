var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
import { Component, Elm } from "./libs/elements.js";
import { EventHandler, wait } from "./utils.js";
var TankiInterface = /** @class */ (function (_super) {
    __extends(TankiInterface, _super);
    function TankiInterface(deck) {
        var _this = _super.call(this, "tankiInterface") || this;
        _this.deckPresenter = new DeckPresenter(deck);
        _this.deckPresenter.appendTo(_this);
        return _this;
    }
    return TankiInterface;
}(Component));
export { TankiInterface };
var DeckPresenter = /** @class */ (function (_super) {
    __extends(DeckPresenter, _super);
    function DeckPresenter(deck) {
        var _this = _super.call(this, "deckPresenter") || this;
        _this.deck = deck;
        _this.presenting = false;
        _this.cardPresenter = new CardPresenter(_this.deck);
        _this.deckTimeline = new DeckTimeline(_this.deck);
        _this.deckTimeline.update();
        _this.append(_this.cardPresenterContainer = new Elm().class("cardPresenterContainer")
            .append(_this.cardPresenter), new Elm().class("timeline").append(_this.deckTimeline), new Elm("button").class("exitButton")
            .append("Exit")
            .on("click", function () { return _this.exitCardPresenter(); }), new Elm("button").class("enterButton")
            .append("Enter")
            .on("click", function () { return _this.enterCardPresenter(); }), new Elm("button").class("createNote")
            .append("Create Note")
            .on("click", function () { return _this.openCreateNoteDialog(); }));
        _this.enterCardPresenter();
        return _this;
    }
    DeckPresenter.prototype.presentingLoop = function () {
        return __awaiter(this, void 0, void 0, function () {
            var selectedCard, result, interrupt_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.presenting) {
                            return [2 /*return*/];
                        }
                        this.presenting = true;
                        _a.label = 1;
                    case 1:
                        if (!true) return [3 /*break*/, 8];
                        selectedCard = this.deck.selectCard();
                        if (!selectedCard) return [3 /*break*/, 6];
                        result = void 0;
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.cardPresenter.presentCard(selectedCard)];
                    case 3:
                        result = _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        interrupt_1 = _a.sent();
                        console.log(interrupt_1);
                        return [3 /*break*/, 8];
                    case 5:
                        this.deck.applyResultToCard(selectedCard, result);
                        return [3 /*break*/, 7];
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        this.deckTimeline.update();
                        return [3 /*break*/, 1];
                    case 8:
                        this.presenting = false;
                        this.exitCardPresenter();
                        return [2 /*return*/];
                }
            });
        });
    };
    DeckPresenter.prototype.openCreateNoteDialog = function () {
        return __awaiter(this, void 0, void 0, function () {
            var createNoteDialog, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.exitCardPresenter();
                        createNoteDialog = new CreateNoteDialog(this.deck).appendTo(this.elm).setPositionFixed();
                        return [4 /*yield*/, new Promise(function (res) {
                                createNoteDialog.onNoteCreated.addHandler(function (data) {
                                    res(data);
                                });
                            })];
                    case 1:
                        data = _a.sent();
                        this.deck.addNote(data);
                        createNoteDialog.remove();
                        return [2 /*return*/];
                }
            });
        });
    };
    DeckPresenter.prototype.exitCardPresenter = function () {
        this.cardPresenter.discardState();
        this.cardPresenterContainer.class("hidden");
    };
    DeckPresenter.prototype.enterCardPresenter = function () {
        this.cardPresenterContainer.removeClass("hidden");
        this.presentingLoop();
    };
    return DeckPresenter;
}(Component));
var ModalDialog = /** @class */ (function (_super) {
    __extends(ModalDialog, _super);
    function ModalDialog(name) {
        var _this = _super.call(this, name) || this;
        _this.class("modalDialog");
        _this.append(new Elm().class("modalBackground")
            .on("click", function () { return _this.remove(); }), _this.foregroundElm = new Elm().class("modalForeground").appendTo(_this.elm));
        return _this;
    }
    ModalDialog.prototype.setPositionFixed = function () {
        this.class("positionFixed");
        return this;
    };
    ModalDialog.prototype.remove = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.hide()];
                    case 1:
                        _a.sent();
                        _super.prototype.remove.call(this);
                        return [2 /*return*/];
                }
            });
        });
    };
    ModalDialog.prototype.show = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, wait(1)];
                    case 1:
                        _a.sent();
                        this.class("showing");
                        return [2 /*return*/];
                }
            });
        });
    };
    ModalDialog.prototype.hide = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.removeClass("showing");
                        return [4 /*yield*/, wait(500)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return ModalDialog;
}(Component));
var CreateNoteDialog = /** @class */ (function (_super) {
    __extends(CreateNoteDialog, _super);
    function CreateNoteDialog(deck) {
        var _this = _super.call(this, "createNoteDialog") || this;
        _this.deck = deck;
        _this.onNoteCreated = new EventHandler();
        _this.foregroundElm.append(new Elm("h2").append("Create Note"), _this.typeSelectElm = new Elm("select").class("typeSelect")
            .on("change", function () { return _this.updateInputsElm(); }), _this.inputsContainer = new Elm().class("inputs"), new Elm("button").append("Add")
            .on("click", function () { return _this.submit(); }));
        _this.loadNoteTypes();
        _this.updateInputsElm();
        _this.show();
        return _this;
    }
    CreateNoteDialog.prototype.loadNoteTypes = function () {
        var noteTypes = this.deck.getNoteTypes();
        for (var i = 0; i < noteTypes.length; i++) {
            var noteType = noteTypes[i];
            this.typeSelectElm.append(new Elm("option").append(noteType.name).attribute("value", i.toString()));
        }
    };
    CreateNoteDialog.prototype.updateInputsElm = function () {
        var noteTypes = this.deck.getNoteTypes();
        this.noteTypeIndex = parseInt(this.typeSelectElm.getHTMLElement().value);
        this.inputElms = [];
        this.inputsContainer.clear();
        var noteType = noteTypes[this.noteTypeIndex];
        for (var _i = 0, _a = noteType.fieldNames; _i < _a.length; _i++) {
            var fieldName = _a[_i];
            var inputElm = new Elm("input").class("cardFieldInput");
            this.inputElms.push(inputElm);
            this.inputsContainer.append(new Elm("label").class("cardFieldLabel").append(fieldName, inputElm));
        }
    };
    CreateNoteDialog.prototype.submit = function () {
        if (this.noteTypeIndex === undefined || !this.inputElms) {
            return;
        }
        this.onNoteCreated.dispatch([
            this.noteTypeIndex,
            this.inputElms.map(function (e) { return e.getHTMLElement().value; })
        ]);
        for (var _i = 0, _a = this.inputElms; _i < _a.length; _i++) {
            var inputElm = _a[_i];
            inputElm.getHTMLElement().value = "";
        }
        this.inputElms[0].getHTMLElement().focus();
    };
    return CreateNoteDialog;
}(ModalDialog));
var DeckTimeline = /** @class */ (function (_super) {
    __extends(DeckTimeline, _super);
    function DeckTimeline(deck) {
        var _this = _super.call(this, "deckTimeline") || this;
        _this.deck = deck;
        _this.nextCardInMinutesElm = new Elm("span");
        _this.newCardsElm = new Elm().class("new");
        _this.dueCardsElm = new Elm().class("seen");
        _this.graduatedCardsElm = new Elm().class("graduated");
        _this.append(new Elm().append("Next review card in ", _this.nextCardInMinutesElm, " minutes"), new Elm().class("cardCounts").append(_this.newCardsElm, _this.dueCardsElm, _this.graduatedCardsElm));
        _this.nextCardInMinutesElm.append("~");
        //* temporary quality-of-life
        setInterval(function () { return _this.update(); }, 30e3);
        return _this;
    }
    DeckTimeline.prototype.update = function () {
        var counts = this.deck.getCardCount();
        this.nextCardInMinutesElm.replaceContents(this.deck.getMinutesToNextCard());
        this.newCardsElm.replaceContents(counts.new);
        this.dueCardsElm.replaceContents(this.deck.getDueCardsCount());
        this.graduatedCardsElm.replaceContents(counts.graduated);
    };
    return DeckTimeline;
}(Component));
var CardPresenter = /** @class */ (function (_super) {
    __extends(CardPresenter, _super);
    function CardPresenter(deck) {
        var _this = _super.call(this, "cardPresenter") || this;
        _this.inputGetter = new QuickUserInputGetter();
        _this.cardContainer = new Elm().class("cardContainer");
        _this.noteTypes = deck.getNoteTypes();
        _this.append(_this.cardContainer, _this.inputGetter);
        return _this;
    }
    CardPresenter.prototype.presentCard = function (card) {
        return __awaiter(this, void 0, void 0, function () {
            var cardElm, noteTypeID, noteType, cardType, noteFieldNames, cardFields, rating;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.currentState) {
                            this.discardState();
                        }
                        if (!this.noteTypes) {
                            throw new Error("Note types not set");
                        }
                        cardElm = new Elm().class("card").appendTo(this.cardContainer);
                        noteTypeID = card.parentNote[0];
                        noteType = this.noteTypes[noteTypeID];
                        cardType = noteType.cardTypes[card.cardTypeID];
                        noteFieldNames = noteType.fieldNames;
                        cardFields = card.parentNote[1];
                        this.currentState = { card: card };
                        this.createFaceDisplay(cardType.frontTemplate, noteFieldNames, cardFields).appendTo(cardElm);
                        return [4 /*yield*/, this.inputGetter.options(["Show back"])];
                    case 1:
                        _a.sent();
                        this.createFaceDisplay(cardType.backTemplate, noteFieldNames, cardFields).appendTo(cardElm);
                        return [4 /*yield*/, this.inputGetter.options(["Forgot", "Remembered"], 1)];
                    case 2:
                        rating = _a.sent();
                        console.log(rating);
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
        this.inputGetter.discardState();
        this.cardContainer.clear();
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
}(Component));
var CardFaceDisplay = /** @class */ (function (_super) {
    __extends(CardFaceDisplay, _super);
    function CardFaceDisplay(content) {
        var _this = _super.call(this, "cardFaceDisplay") || this;
        _this.elm.innerHTML = content;
        return _this;
    }
    return CardFaceDisplay;
}(Component));
/**
 * Can recieve inputs quickly from user
 */
var QuickUserInputGetter = /** @class */ (function (_super) {
    __extends(QuickUserInputGetter, _super);
    function QuickUserInputGetter() {
        return _super.call(this, "quickUserInputGetter") || this;
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
        var keydownHandler = function (e) {
            var numberKey = parseInt(e.key) - 1;
            var wasValidInput = true;
            if (!isNaN(numberKey) && numberKey < items.length) {
                promiseRes(numberKey);
            }
            else if (e.key === " " || e.key === "Enter") {
                promiseRes(defaultIndex !== null && defaultIndex !== void 0 ? defaultIndex : 0);
            }
            else {
                wasValidInput = false;
            }
            if (wasValidInput) {
                e.preventDefault();
                _this.discardState();
            }
        };
        document.addEventListener("keydown", keydownHandler);
        this.state = {
            promiseReject: promiseRej,
            elm: optionsContainer,
            documentKeydownListener: keydownHandler
        };
        return promise;
    };
    QuickUserInputGetter.prototype.discardState = function () {
        if (!this.state) {
            return;
        }
        this.elm.removeChild(this.state.elm);
        document.removeEventListener("keydown", this.state.documentKeydownListener);
        this.state.promiseReject("State discarded");
        this.state = undefined;
    };
    return QuickUserInputGetter;
}(Component));
