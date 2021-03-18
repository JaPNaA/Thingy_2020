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
import { Note, NoteType } from "../../database.js";
import { Elm } from "../../libs/elements.js";
import { EventHandler } from "../../utils.js";
import { ModalDialog } from "./ModalDialog.js";
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
        var noteTypes = this.deck.database.getNoteTypes();
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
                        noteTypes = this.deck.database.getNoteTypes();
                        this.noteTypeIndex = parseInt(this.typeSelectElm.getHTMLElement().value);
                        this.inputElms = [];
                        this.inputsContainer.clear();
                        noteType = noteTypes[this.noteTypeIndex];
                        _i = 0;
                        return [4 /*yield*/, NoteType.getIntegratedNoteType(noteType)];
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
        this.onNoteCreated.dispatch(Note.create(this.deck.database.getNoteTypes()[this.noteTypeIndex], this.inputElms.map(function (e) { return e.getHTMLElement().value; })));
        for (var _i = 0, _a = this.inputElms; _i < _a.length; _i++) {
            var inputElm = _a[_i];
            inputElm.getHTMLElement().value = "";
        }
        this.inputElms[0].getHTMLElement().focus();
    };
    return CreateNoteDialog;
}(ModalDialog));
export { CreateNoteDialog };
