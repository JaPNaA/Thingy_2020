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
import { Elm, Component } from "../../libs/elements.js";
import { ModalDialog } from "./ModalDialog.js";
var ExportNotesDialog = /** @class */ (function (_super) {
    __extends(ExportNotesDialog, _super);
    function ExportNotesDialog(deck) {
        var _this = _super.call(this, "exportNotesDialog") || this;
        _this.deck = deck;
        _this.foregroundElm.append(new Elm("h3").append("Export Notes"), _this.destinationListElm = new Elm().class("sourcesList").append(new Elm("button").append("Tanki format (with all due dates)")
            .on("click", function () { return _this.exportTankiFormat(); }), new Elm("button").append("CSV (with no due dates)")
            .on("click", function () { return _this.exportCSV(); })));
        console.log(deck);
        return _this;
    }
    ExportNotesDialog.prototype.exportTankiFormat = function () {
        this.destinationListElm.remove();
        var textarea = new CopyTextarea();
        textarea.setValue(this.deck.database.toJSON());
        this.foregroundElm.append(new Elm().append("Note that importing Tanki format has not been implemented yet"), textarea);
    };
    ExportNotesDialog.prototype.exportCSV = function () {
        var _a;
        var _this = this;
        this.destinationListElm.remove();
        var textarea = new CopyTextarea();
        var noteTypes = this.deck.database.getNoteTypes();
        var noteTypeSelect = (_a = new Elm("select")).append.apply(_a, noteTypes.map(function (type) { return new Elm("option").append(type.name); }));
        noteTypeSelect.getHTMLElement().value = "";
        noteTypeSelect.on("change", function () { return __awaiter(_this, void 0, void 0, function () {
            var noteTypeName, noteType, csvData, _i, _a, note;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        noteTypeName = noteTypeSelect.getHTMLElement().value;
                        noteType = this.deck.database.getNoteTypeByName(noteTypeName);
                        if (!noteType) {
                            throw new Error("Selected note type not in database");
                        }
                        return [4 /*yield*/, noteType.getIntegratedNoteType()];
                    case 1:
                        csvData = [
                            (_b.sent()).fieldNames.slice()
                        ];
                        for (_i = 0, _a = this.deck.database.getNotes(); _i < _a.length; _i++) {
                            note = _a[_i];
                            if (note.type == noteType) {
                                csvData.push(note.fields.slice());
                            }
                        }
                        textarea.setValue(encodeCSV(csvData));
                        return [2 /*return*/];
                }
            });
        }); });
        this.foregroundElm.append(new Elm("label").append(new Elm().append("Select note type"), noteTypeSelect), new Elm().append(textarea));
    };
    return ExportNotesDialog;
}(ModalDialog));
export { ExportNotesDialog };
var CopyTextarea = /** @class */ (function (_super) {
    __extends(CopyTextarea, _super);
    function CopyTextarea() {
        var _this = _super.call(this, "clickAndSelectTextarea") || this;
        _this.textarea = new Elm("textarea").attribute("readonly", "readonly");
        _this.htmlElm = _this.textarea.getHTMLElement();
        _this.elm.append(_this.textarea);
        _this.textarea.on("focus", function () {
            _this.textarea.getHTMLElement().select();
        });
        return _this;
    }
    CopyTextarea.prototype.getValue = function () {
        return this.htmlElm.value;
    };
    CopyTextarea.prototype.setValue = function (value) {
        this.htmlElm.value = value;
    };
    return CopyTextarea;
}(Component));
function encodeCSV(data) {
    return data.map(function (row) { return row.map(function (data) { return _encodeCSVData(data); }).join(','); }).join("\n");
}
function _encodeCSVData(text) {
    // quotes escape , \n
    // if quotes in quotes, double quote
    if (text.includes("\n") || text.includes(",") || text.includes("\"")) {
        return '"' + text.replace(/"/g, "\"\"") + '"';
    }
    else {
        return text;
    }
}
