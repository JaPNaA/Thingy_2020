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
import { NoteType, Note } from "../../database.js";
import { CardFlag } from "../../dataTypes.js";
import { Elm, Component } from "../../libs/elements.js";
import { EventHandler } from "../../utils.js";
import { ModalDialog } from "./ModalDialog.js";
var ImportNotesDialog = /** @class */ (function (_super) {
    __extends(ImportNotesDialog, _super);
    function ImportNotesDialog(deck) {
        var _this = _super.call(this, "importNotesDialog") || this;
        _this.deck = deck;
        _this.onImported = new EventHandler();
        /** Flag to prevent double-importing */
        _this.imported = false;
        _this.foregroundElm.append(new Elm("h3").append("Import Notes"), _this.sourcesListElm = new Elm().class("sourcesList").append(new Elm("button").append("jishoAPIData (jishoWithHistory)")
            .on("click", function () { return _this.importFromJishoAPIData(); })));
        console.log(deck);
        return _this;
    }
    ImportNotesDialog.prototype.importFromJishoAPIData = function () {
        var _a;
        var _this = this;
        this.sourcesListElm.remove();
        this.imported = false;
        var textarea = new DragAndDropTextarea();
        var checkboxes = [
            this.createCheckedCheckbox("Word -> Meaning"),
            this.createCheckedCheckbox("Word -> Kana"),
            this.createCheckedCheckbox("Kana + Meaning -> Word")
        ];
        this.foregroundElm.append(textarea, (_a = new Elm().class("options")).append.apply(_a, checkboxes.map(function (checkbox) { return checkbox.container; })), new Elm("button").append("Import")
            .on("click", function () {
            if (_this.imported) {
                return;
            }
            _this.imported = true;
            var value = textarea.getValue();
            var parsed = JSON.parse(value);
            if (!_this.deck.database.getNoteTypeByName(ImportNotesDialog.jishoAPIDataImportedNoteType.name)) {
                _this.deck.database.addNoteType(new NoteType(ImportNotesDialog.jishoAPIDataImportedNoteType));
            }
            var cardType = _this.deck.database.getNoteTypeByName(ImportNotesDialog.jishoAPIDataImportedNoteType.name);
            _this.deck.database.undoLog.startGroup();
            for (var _i = 0, parsed_1 = parsed; _i < parsed_1.length; _i++) {
                var item = parsed_1[_i];
                var note = Note.create(cardType, [JSON.stringify(item)]);
                _this.deck.database.addNote(note);
                for (var i = 0; i < checkboxes.length; i++) {
                    var checkbox = checkboxes[i];
                    if (!checkbox.input.getHTMLElement().checked) {
                        var card = _this.deck.database.getCardByUid(note.cardUids[i]).clone();
                        card.addFlag(CardFlag.suspended);
                        _this.deck.database.writeEdit(card);
                    }
                }
            }
            _this.deck.database.undoLog.endGroup();
            _this.deck.updateCache()
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
        src: "resources/jishoAPIDataImportedNoteType.json",
        numCardTypes: 3
    };
    return ImportNotesDialog;
}(ModalDialog));
export { ImportNotesDialog };
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
