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
import { Elm } from "../../libs/elements.js";
import { EventHandler } from "../../utils.js";
import { ModalDialog } from "./ModalDialog.js";
var ClearDataDialog = /** @class */ (function (_super) {
    __extends(ClearDataDialog, _super);
    function ClearDataDialog(deck) {
        var _this = _super.call(this, "clearDataDialog") || this;
        _this.deck = deck;
        _this.onDataClear = new EventHandler();
        _this.foregroundElm.append(new Elm("h3").append("Clear data"), _this.clearOptionsElm = new Elm().class("sourcesList").append(new Elm("button").append("Clear notes")
            .on("click", function () { return _this.clearNotes(); }), new Elm("button").append("Reset notes")
            .on("click", function () { return _this.resetNotes(); })));
        return _this;
    }
    ClearDataDialog.prototype.clearNotes = function () {
        var _this = this;
        this.clearOptionsElm.remove();
        this.foregroundElm.append(new Elm().append("Delete all your notes and progress? You will still have your note types and settings."), new Elm("button").append("Clear everything").on("click", function () {
            var notes = _this.deck.database.getNotes();
            _this.deck.database.startUndoLogGroup();
            for (var i = notes.length - 1; i >= 0; i--) {
                _this.deck.database.removeNote(notes[i]);
            }
            _this.deck.database.endUndoLogGroup();
            _this.onDataClear.dispatch();
        }));
    };
    ClearDataDialog.prototype.resetNotes = function () {
        var _this = this;
        this.clearOptionsElm.remove();
        this.foregroundElm.append(new Elm().append("Delete all your progress? Your notes will all become 'new'."), new Elm("button").append("Reset notes").on("click", function () {
            var notes = _this.deck.database.getNotes();
            _this.deck.database.startUndoLogGroup();
            for (var _i = 0, notes_1 = notes; _i < notes_1.length; _i++) {
                var note = notes_1[_i];
                for (var _a = 0, _b = note.cardUids; _a < _b.length; _a++) {
                    var cardUid = _b[_a];
                    _this.deck.database.deactivateCard(_this.deck.database.getCardByUid(cardUid));
                }
            }
            _this.deck.database.endUndoLogGroup();
            _this.onDataClear.dispatch();
        }));
    };
    return ClearDataDialog;
}(ModalDialog));
export { ClearDataDialog };
