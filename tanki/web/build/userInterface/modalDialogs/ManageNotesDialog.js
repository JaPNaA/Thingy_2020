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
import { CardState } from "../../dataTypes.js";
import { Component, Elm } from "../../libs/elements.js";
import { ModalDialog } from "./ModalDialog.js";
var ManageNotesDialog = /** @class */ (function (_super) {
    __extends(ManageNotesDialog, _super);
    function ManageNotesDialog(deck) {
        var _this = _super.call(this, "manageNotesDialog") || this;
        _this.foregroundElm.append(new Elm("h1").append("Manage notes"), _this.notesList = new Elm().class("notesList"));
        var _loop_1 = function (item) {
            var label = item.fields[0].slice(0, 20);
            new Elm()
                .append(new Elm().class("label").append(label), new Elm().class("cards").withSelf(function (cards) {
                for (var _i = 0, _a = item.cardUids; _i < _a.length; _i++) {
                    var cardUid = _a[_i];
                    var card = deck.database.getCardByUid(cardUid);
                    cards.append(new Elm().class("card").append(CardState[card.state]));
                }
            }))
                .appendTo(this_1.notesList);
        };
        var this_1 = this;
        for (var _i = 0, _a = deck.database.getNotes(); _i < _a.length; _i++) {
            var item = _a[_i];
            _loop_1(item);
        }
        return _this;
    }
    return ManageNotesDialog;
}(ModalDialog));
export { ManageNotesDialog };
var RecyclingList = /** @class */ (function (_super) {
    __extends(RecyclingList, _super);
    function RecyclingList() {
        return _super.call(this, "recyclingList") || this;
    }
    return RecyclingList;
}(Component));
