var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
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
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
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
import { ActivatedCard } from "../database.js";
import { Component, Elm } from "../libs/elements.js";
import { writeOut } from "../storage.js";
import { DeckTimeline } from "./DeckTimeline.js";
import { EventHandler, wait } from "../utils.js";
import { ManageNotesDialog } from "./modalDialogs/ManageNotesDialog.js";
import { EditNoteDialog } from "./modalDialogs/EditNoteDialog.js";
import { ImportNotesDialog } from "./modalDialogs/ImportNotesDialog.js";
import AnimateInOutElm from "./AnimateInOutElm.js";
import { CardFlag, CardState } from "../dataTypes.js";
import jishoWithHistory from "../jishoWithHistory.js";
import { CardRenderer } from "./CardRenderer.js";
import { EditNoteTypeDialog } from "./modalDialogs/EditNoteTypeDialog.js";
import { ExportNotesDialog } from "./modalDialogs/ExportNotesDialog.js";
import { ClearDataDialog } from "./modalDialogs/ClearDataDialog.js";
var TankiInterface = /** @class */ (function (_super) {
    __extends(TankiInterface, _super);
    function TankiInterface(deck) {
        var _this = _super.call(this, "tankiInterface") || this;
        _this.deckPresenter = new DeckPresenter(_this, deck);
        _this.elm.append(_this.deckPresenter);
        _this.elm.append(new Elm("button").class("writeOut")
            .append("Write Out")
            .on("click", function () {
            writeOut(deck);
        }));
        //* temporary
        addEventListener("keydown", function (e) {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }
            if (e.code === "KeyZ") {
                deck.database.undo();
            }
        });
        deck.database.onUndo.addHandler(function () {
            return _this.showSnackbar("Undid", 1500);
        });
        _this.deckPresenter.onExit.addHandler(function () { return writeOut(deck); });
        return _this;
    }
    TankiInterface.prototype.showSnackbar = function (content, time) {
        return __awaiter(this, void 0, void 0, function () {
            var snackbar;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        snackbar = new Snackbar(content);
                        this.elm.append(snackbar);
                        return [4 /*yield*/, wait(time)];
                    case 1:
                        _a.sent();
                        snackbar.remove();
                        return [2 /*return*/];
                }
            });
        });
    };
    return TankiInterface;
}(Component));
export { TankiInterface };
var DeckPresenter = /** @class */ (function (_super) {
    __extends(DeckPresenter, _super);
    function DeckPresenter(parent, deck) {
        var _this = _super.call(this, "deckPresenter") || this;
        _this.parent = parent;
        _this.deck = deck;
        _this.onExit = new EventHandler();
        _this.presenting = false;
        _this.cardPresenter = new CardPresenter();
        _this.deckTimeline = new DeckTimeline(_this.parent, _this.deck);
        _this.elm.append(_this.cardPresenterContainer = new Elm().class("cardPresenterContainer")
            .append(_this.cardPresenter), new Elm().class("timeline").append(_this.deckTimeline), new Elm().append(new Elm("button").class("exitButton")
            .append("Exit")
            .on("click", function () { return _this.exitCardPresenter(); }), new Elm("button").class("enterButton")
            .append("Enter")
            .on("click", function () { return _this.enterCardPresenter(); })), new Elm().append(new Elm("button").class("createNote")
            .append("Create Note")
            .on("click", function () { return _this.openCreateNoteDialog(); }), new Elm("button").class("manageNotes")
            .append("Manage Notes")
            .on("click", function () { return _this.openDialog(ManageNotesDialog); }), new Elm("button").class("editNoteType")
            .append("Edit Note Templates")
            .on("click", function () { return _this.openDialog(EditNoteTypeDialog); }), new Elm("button").class("graduateNotes")
            .append("Graduate Notes")
            .on("click", function () {
            //* this button is temporary
            // todo: automatically gradate cards
            _this.deck.database.startUndoLogGroup();
            var cards = _this.deck.database.getCards();
            for (var _i = 0, cards_1 = cards; _i < cards_1.length; _i++) {
                var card = cards_1[_i];
                if (card instanceof ActivatedCard &&
                    card.state === CardState.active &&
                    card.interval > 21 * 24 * 60) {
                    var cardEdit = card.clone();
                    cardEdit.state = CardState.inactive;
                    cardEdit.addFlag(CardFlag.graduated);
                    _this.deck.database.writeEdit(cardEdit);
                }
            }
            _this.deck.database.endUndoLogGroup();
        })), new Elm().append(new Elm("button").class("importNotes")
            .append("Import Notes")
            .on("click", function () { return _this.openImportNotesDialog(); }), new Elm("button").class("exportNotes")
            .append("Export Notes")
            .on("click", function () { return _this.openExportNotesDialog(); }), new Elm("button").class("clearData")
            .append("Clear Data")
            .on("click", function () { return _this.openClearDataDialog(); })), new Elm().append(new Elm("button").class("JishoWithHistory")
            .append("Jisho With History")
            .on("click", function () {
            jishoWithHistory.openWindow();
        })), new Elm("button").class("undo")
            .append("Undo")
            .on("click", function () { return deck.database.undo(); }));
        _this.escKeyExitHandler = _this.escKeyExitHandler.bind(_this);
        jishoWithHistory.getData.addHandler(function (data) {
            _this.openImportNotesDialogWithJishoApiData(data);
        });
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
                        this.deck.database.startUndoLogGroup();
                        this.deck.applyResultToCard(selectedCard, result);
                        this.deck.database.endUndoLogGroup();
                        return [3 /*break*/, 7];
                    case 6: return [3 /*break*/, 8];
                    case 7: return [3 /*break*/, 1];
                    case 8:
                        this.exitCardPresenter();
                        this.onExit.dispatch();
                        this.presenting = false;
                        return [2 /*return*/];
                }
            });
        });
    };
    DeckPresenter.prototype.addEscKeyExitHandler = function () {
        addEventListener("keydown", this.escKeyExitHandler);
    };
    DeckPresenter.prototype.removeEscKeyExitHandler = function () {
        removeEventListener("keydown", this.escKeyExitHandler);
    };
    DeckPresenter.prototype.escKeyExitHandler = function (event) {
        if (event.key === "Escape") {
            this.exitCardPresenter();
        }
    };
    DeckPresenter.prototype.openCreateNoteDialog = function () {
        return __awaiter(this, void 0, void 0, function () {
            var createNoteDialog;
            var _this = this;
            return __generator(this, function (_a) {
                this.exitCardPresenter();
                createNoteDialog = new EditNoteDialog(this.deck).appendTo(this.elm).setPositionFixed();
                createNoteDialog.setCreatingNote();
                createNoteDialog.onSubmit.addHandler(function (note) {
                    _this.deck.database.startUndoLogGroup();
                    _this.deck.database.addNote(note);
                    _this.deck.database.endUndoLogGroup();
                });
                return [2 /*return*/];
            });
        });
    };
    DeckPresenter.prototype.openImportNotesDialogWithJishoApiData = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var dialog;
            return __generator(this, function (_a) {
                dialog = this.openImportNotesDialog();
                dialog.setJishoAPIData(data);
                return [2 /*return*/];
            });
        });
    };
    DeckPresenter.prototype.openImportNotesDialog = function () {
        var importNotesDialog = this.openDialog(ImportNotesDialog);
        importNotesDialog.onImported.addHandler(function () {
            importNotesDialog.remove();
        });
        return importNotesDialog;
    };
    DeckPresenter.prototype.openExportNotesDialog = function () {
        return this.openDialog(ExportNotesDialog);
    };
    DeckPresenter.prototype.openClearDataDialog = function () {
        var clearDataDialog = this.openDialog(ClearDataDialog);
        clearDataDialog.onDataClear.addHandler(function () {
            clearDataDialog.remove();
        });
        return clearDataDialog;
    };
    DeckPresenter.prototype.openDialog = function (dialog) {
        this.exitCardPresenter();
        return new dialog(this.deck).appendTo(this.elm).setPositionFixed();
    };
    DeckPresenter.prototype.exitCardPresenter = function () {
        this.cardPresenter.discardState();
        this.removeEscKeyExitHandler();
        this.cardPresenterContainer.class("hidden");
    };
    DeckPresenter.prototype.enterCardPresenter = function () {
        this.cardPresenterContainer.removeClass("hidden");
        this.presentingLoop();
        this.addEscKeyExitHandler();
    };
    return DeckPresenter;
}(Component));
var CardPresenter = /** @class */ (function (_super) {
    __extends(CardPresenter, _super);
    function CardPresenter() {
        var _this = _super.call(this, "cardPresenter") || this;
        _this.inputGetter = new QuickUserInputGetter();
        _this.cardRenderer = new CardRenderer();
        _this.elm.append(_this.cardRenderer, _this.inputGetter);
        return _this;
    }
    CardPresenter.prototype.presentCard = function (card) {
        return __awaiter(this, void 0, void 0, function () {
            var rating;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.currentState) {
                            this.discardState();
                        }
                        this.currentState = { card: card };
                        this.cardRenderer.renderFront(card);
                        return [4 /*yield*/, this.inputGetter.options(["Show back"])];
                    case 1:
                        _a.sent();
                        this.cardRenderer.renderBack(card);
                        return [4 /*yield*/, this.inputGetter.options(["Forgot", "Remembered"], 1)];
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
        this.inputGetter.discardState();
        this.currentState = undefined;
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
        this.elm.append(optionsContainer);
        var keydownHandler = function (e) {
            if (e.repeat) {
                return;
            }
            var numberKey = parseInt(e.key) - 1;
            var wasValidInput = true;
            if (!isNaN(numberKey) && numberKey < items.length && numberKey >= 0) {
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
        this.elm.getHTMLElement().removeChild(this.state.elm);
        document.removeEventListener("keydown", this.state.documentKeydownListener);
        this.state.promiseReject("State discarded");
        this.state = undefined;
    };
    return QuickUserInputGetter;
}(Component));
var Snackbar = /** @class */ (function (_super) {
    __extends(Snackbar, _super);
    function Snackbar(content) {
        var _this = _super.call(this, "snackbar") || this;
        _this.animationOutTime = 150;
        _this.elm.append(content);
        return _this;
    }
    return Snackbar;
}(AnimateInOutElm));
