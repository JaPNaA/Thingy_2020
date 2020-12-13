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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
import { CardFlag, CardState } from "./dataTypes.js";
import { Component, Elm } from "./libs/elements.js";
import { writeOut } from "./storage.js";
import { EventHandler, minutesToHumanString, setImmediatePolyfill, wait } from "./utils.js";
var TankiInterface = /** @class */ (function (_super) {
    __extends(TankiInterface, _super);
    function TankiInterface(deck) {
        var _this = _super.call(this, "tankiInterface") || this;
        _this.deckPresenter = new DeckPresenter(deck);
        _this.deckPresenter.appendTo(_this);
        _this.append(new Elm("button").class("writeOut")
            .append("Write Out")
            .on("click", function () {
            writeOut(deck);
        }));
        _this.deckPresenter.onExit.addHandler(function () { return writeOut(deck); });
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
        _this.onExit = new EventHandler();
        _this.presenting = false;
        _this.cardPresenter = new CardPresenter(_this.deck);
        _this.deckTimeline = new DeckTimeline(_this.deck);
        deck.loaded.then(function () { return _this.deckTimeline.update(); });
        _this.append(_this.cardPresenterContainer = new Elm().class("cardPresenterContainer")
            .append(_this.cardPresenter), new Elm().class("timeline").append(_this.deckTimeline), new Elm("button").class("exitButton")
            .append("Exit")
            .on("click", function () { return _this.exitCardPresenter(); }), new Elm("button").class("enterButton")
            .append("Enter")
            .on("click", function () { return _this.enterCardPresenter(); }), new Elm("button").class("createNote")
            .append("Create Note")
            .on("click", function () { return _this.openCreateNoteDialog(); }), new Elm("button").class("importNotes")
            .append("Import Notes")
            .on("click", function () { return _this.openImportNotesDialog(); }), new Elm("button").class("manageNotes")
            .append("Manage Notes")
            .on("click", function () { return _this.openManageNotesDialog(); }));
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
                        this.exitCardPresenter();
                        this.onExit.dispatch();
                        this.presenting = false;
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
                        this.deck.addNoteAndUpdate(data);
                        createNoteDialog.remove();
                        return [2 /*return*/];
                }
            });
        });
    };
    DeckPresenter.prototype.openImportNotesDialog = function () {
        return __awaiter(this, void 0, void 0, function () {
            var importNotesDialog;
            var _this = this;
            return __generator(this, function (_a) {
                this.exitCardPresenter();
                importNotesDialog = new ImportNotesDialog(this.deck).appendTo(this.elm).setPositionFixed();
                importNotesDialog.onImported.addHandler(function () {
                    _this.deckTimeline.update();
                    importNotesDialog.remove();
                });
                return [2 /*return*/];
            });
        });
    };
    DeckPresenter.prototype.openManageNotesDialog = function () {
        this.exitCardPresenter();
        new ManageNotesDialog(this.deck).appendTo(this.elm).setPositionFixed();
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
        _this.show();
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
        return _this;
    }
    CreateNoteDialog.prototype.loadNoteTypes = function () {
        var noteTypes = this.deck.data.getNoteTypes();
        for (var i = 0; i < noteTypes.length; i++) {
            var noteType = noteTypes[i];
            this.typeSelectElm.append(new Elm("option").append(noteType.name).attribute("value", i.toString()));
        }
    };
    CreateNoteDialog.prototype.updateInputsElm = function () {
        return __awaiter(this, void 0, void 0, function () {
            var noteTypes, noteType, _i, _a, fieldName, inputElm;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        noteTypes = this.deck.data.getNoteTypes();
                        this.noteTypeIndex = parseInt(this.typeSelectElm.getHTMLElement().value);
                        this.inputElms = [];
                        this.inputsContainer.clear();
                        noteType = noteTypes[this.noteTypeIndex];
                        _i = 0;
                        return [4 /*yield*/, this.deck.data.getIntegratedNoteType(noteType.name)];
                    case 1:
                        _a = (_b.sent()).fieldNames;
                        _b.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        fieldName = _a[_i];
                        inputElm = new Elm("input").class("cardFieldInput");
                        this.inputElms.push(inputElm);
                        this.inputsContainer.append(new Elm("label").class("cardFieldLabel").append(fieldName, inputElm));
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 2];
                    case 4: return [2 /*return*/];
                }
            });
        });
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
var ImportNotesDialog = /** @class */ (function (_super) {
    __extends(ImportNotesDialog, _super);
    function ImportNotesDialog(deck) {
        var _this = _super.call(this, "importNotesDialog") || this;
        _this.deck = deck;
        _this.onImported = new EventHandler();
        _this.foregroundElm.append(new Elm("h3").append("Import Notes"), _this.sourcesListElm = new Elm().class("sourcesList").append(new Elm("button").append("jishoAPIData (jishoWithHistory)")
            .on("click", function () { return _this.importFromJishoAPIData(); })));
        console.log(deck);
        return _this;
    }
    ImportNotesDialog.prototype.importFromJishoAPIData = function () {
        var _a;
        var _this = this;
        this.sourcesListElm.remove();
        var textarea = new DragAndDropTextarea();
        var checkboxes = [
            this.createCheckedCheckbox("Word -> Meaning"),
            this.createCheckedCheckbox("Word -> Kana"),
            this.createCheckedCheckbox("Kana + Meaning -> Word")
        ];
        this.foregroundElm.append(textarea, (_a = new Elm().class("options")).append.apply(_a, checkboxes.map(function (checkbox) { return checkbox.container; })), new Elm("button").append("Import")
            .on("click", function () {
            var value = textarea.getValue();
            var parsed = JSON.parse(value);
            if (_this.deck.data.indexOfNote(ImportNotesDialog.jishoAPIDataImportedNoteType.name) < 0) {
                _this.deck.data.addNoteType(ImportNotesDialog.jishoAPIDataImportedNoteType);
            }
            var index = _this.deck.data.indexOfNote(ImportNotesDialog.jishoAPIDataImportedNoteType.name);
            for (var _i = 0, parsed_1 = parsed; _i < parsed_1.length; _i++) {
                var item = parsed_1[_i];
                _this.deck.data.addNote([
                    index, [JSON.stringify(item)],
                    checkboxes.map(function (checkbox) {
                        return checkbox.input.getHTMLElement().checked ?
                            undefined : [CardState.new, [CardFlag.suspended]];
                    })
                ]);
            }
            _this.deck.updateCardArrays()
                .then(function () { return _this.onImported.dispatch(); });
        }));
    };
    ImportNotesDialog.prototype.createCheckedCheckbox = function (labelText) {
        var input;
        var container = new Elm().append(new Elm("label").append(input = new Elm("input").attribute("type", "checkbox")
            .withSelf(function (e) { return e.getHTMLElement().checked = true; }), labelText));
        return { input: input, container: container };
    };
    ImportNotesDialog.jishoAPIDataImportedNoteType = {
        name: "jishoAPIDataImportedNoteType",
        src: "resources/jishoAPIDataImportedNoteType.json"
    };
    return ImportNotesDialog;
}(ModalDialog));
var ManageNotesDialog = /** @class */ (function (_super) {
    __extends(ManageNotesDialog, _super);
    function ManageNotesDialog(deck) {
        var _this = _super.call(this, "manageNotesDialog") || this;
        _this.foregroundElm.append(new Elm("h1").append("Manage notes"), _this.notesList = new Elm().class("notesList"));
        var _loop_1 = function (item) {
            var label = item[1][0].slice(0, 20);
            new Elm()
                .append(new Elm().class("label").append(label), new Elm().class("cards").withSelf(function (cards) {
                if (item[2]) {
                    for (var _i = 0, _a = item[2]; _i < _a.length; _i++) {
                        var card = _a[_i];
                        cards.append(new Elm().class("card").append(card ? CardState[card[0]] : "(new)"));
                    }
                }
                else {
                    cards.append("(all new)");
                }
            }))
                .appendTo(this_1.notesList);
        };
        var this_1 = this;
        for (var _i = 0, _a = deck.data.getNotes(); _i < _a.length; _i++) {
            var item = _a[_i];
            _loop_1(item);
        }
        return _this;
    }
    return ManageNotesDialog;
}(ModalDialog));
var DragAndDropTextarea = /** @class */ (function (_super) {
    __extends(DragAndDropTextarea, _super);
    function DragAndDropTextarea() {
        var _this = _super.call(this, "dragAndDropTextarea") || this;
        _this.textarea = new Elm("textarea");
        _this.htmlElm = _this.textarea.getHTMLElement();
        _this.append(_this.textarea);
        _this.textarea.on("dragover", function (e) {
            e.preventDefault();
        });
        _this.textarea.on("drop", function (e) { return __awaiter(_this, void 0, void 0, function () {
            var textData, file, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!e.dataTransfer) {
                            return [2 /*return*/];
                        }
                        e.preventDefault();
                        textData = e.dataTransfer.getData("text");
                        if (textData) {
                            this.htmlElm.value = textData;
                            return [2 /*return*/];
                        }
                        if (!(e.dataTransfer.files.length > 0)) return [3 /*break*/, 2];
                        file = e.dataTransfer.files.item(0);
                        if (!file) return [3 /*break*/, 2];
                        _a = this.htmlElm;
                        return [4 /*yield*/, file.text()];
                    case 1:
                        _a.value = _b.sent();
                        _b.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        }); });
        return _this;
    }
    DragAndDropTextarea.prototype.getValue = function () {
        return this.htmlElm.value;
    };
    return DragAndDropTextarea;
}(Component));
var DeckTimeline = /** @class */ (function (_super) {
    __extends(DeckTimeline, _super);
    function DeckTimeline(deck) {
        var _this = _super.call(this, "deckTimeline") || this;
        _this.deck = deck;
        _this.nextCardInMinutesElm = new Elm("span");
        _this.newCardsElm = new Elm().class("number");
        _this.dueCardsElm = new Elm().class("number");
        _this.graduatedCardsElm = new Elm().class("number");
        _this.append(new Elm().append("Next review card in ", _this.nextCardInMinutesElm), new Elm().class("cardCounts").append(new Elm().class("new").append("New: ", _this.newCardsElm), new Elm().class("due").append("Due: ", _this.dueCardsElm), new Elm().class("graduated").append("Inactive: ", _this.graduatedCardsElm)));
        _this.nextCardInMinutesElm.append("~");
        //* temporary quality-of-life
        setInterval(function () { return _this.update(); }, 30e3);
        return _this;
    }
    DeckTimeline.prototype.update = function () {
        var counts = this.deck.getCardCount();
        var minutesToNextCard = this.deck.getMinutesToNextCard();
        this.nextCardInMinutesElm.replaceContents(minutesToNextCard === undefined ? "~" : minutesToHumanString(minutesToNextCard));
        this.newCardsElm.replaceContents(counts.new);
        this.dueCardsElm.replaceContents(this.deck.getDueCardsCount());
        this.graduatedCardsElm.replaceContents(counts.inactive);
    };
    return DeckTimeline;
}(Component));
var CardPresenter = /** @class */ (function (_super) {
    __extends(CardPresenter, _super);
    function CardPresenter(deck) {
        var _this = _super.call(this, "cardPresenter") || this;
        _this.deck = deck;
        _this.inputGetter = new QuickUserInputGetter();
        _this.cardIFrame = new Elm("iframe").class("card");
        _this.append(_this.cardIFrame, _this.inputGetter);
        _this.cardIFrame.on("load", function () {
            var iframeWindow = _this.cardIFrame.getHTMLElement().contentWindow;
            if (!iframeWindow) {
                throw new Error("iframe loaded but no window");
            }
            _this.cardIFrameDocument = iframeWindow.document;
            _this.setPropogateKeyEvents(iframeWindow);
        });
        return _this;
    }
    CardPresenter.prototype.presentCard = function (card) {
        return __awaiter(this, void 0, void 0, function () {
            var noteTypes, noteType, cardType, noteFieldNames, cardFields, rating;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.currentState) {
                            this.discardState();
                        }
                        noteTypes = this.deck.data.getNoteTypes();
                        return [4 /*yield*/, this.deck.data.getIntegratedNoteType(noteTypes[card.noteType].name)];
                    case 1:
                        noteType = _a.sent();
                        cardType = noteType.cardTypes[card.cardTypeID];
                        noteFieldNames = noteType.fieldNames;
                        cardFields = card.parentNote[1];
                        this.currentState = { card: card };
                        this.createCardInIFrame(cardType.frontTemplate, noteFieldNames, cardFields, noteType.style, [noteType.script, cardType.frontScript]);
                        return [4 /*yield*/, this.inputGetter.options(["Show back"])];
                    case 2:
                        _a.sent();
                        this.createCardInIFrame(cardType.backTemplate.replace("{{frontTemplate}}", cardType.frontTemplate), noteFieldNames, cardFields, noteType.style, [noteType.script, cardType.backScript]);
                        return [4 /*yield*/, this.inputGetter.options(["Forgot", "Remembered"], 1)];
                    case 3:
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
        this.currentState = undefined;
    };
    CardPresenter.prototype.createCardInIFrame = function (contentTemplate, fieldNames, fields, styles, scripts) {
        var _a;
        var regexMatches = /{{(.+?)}}/g;
        var outString = "";
        var lastIndex = 0;
        for (var match = void 0; match = regexMatches.exec(contentTemplate);) {
            outString += contentTemplate.slice(lastIndex, match.index);
            var replaceFieldName = match[1];
            outString += fields[fieldNames.indexOf(replaceFieldName)] || "&lt;&lt;undefined&gt;&gt;";
            lastIndex = match.index + match[0].length;
        }
        outString += contentTemplate.slice(lastIndex);
        if (!this.cardIFrameDocument) {
            throw new Error("Tried to create card in unopened iframe");
        }
        this.cardIFrameDocument.body.innerHTML = outString;
        if (styles) {
            this.cardIFrameDocument.body.appendChild(new Elm("style").append(styles).getHTMLElement());
        }
        try {
            //* dangerous!
            (_a = new (Function.bind.apply(Function, __spreadArrays([void 0, "require"], fieldNames, [scripts.join("\n")])))())
                .call.apply(_a, __spreadArrays([this.cardIFrameDocument, undefined], fields));
        }
        catch (err) {
            console.warn("Error while running script for card", err);
        }
    };
    CardPresenter.prototype.setPropogateKeyEvents = function (iframeWindow) {
        var _this = this;
        iframeWindow.addEventListener("keydown", function (e) {
            setImmediatePolyfill(function () { return _this.cardIFrame.getHTMLElement().dispatchEvent(e); });
        });
    };
    return CardPresenter;
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
        var _loop_2 = function (i) {
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
            _loop_2(i);
        }
        this.elm.appendChild(optionsContainer);
        var keydownHandler = function (e) {
            if (e.repeat) {
                return;
            }
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
