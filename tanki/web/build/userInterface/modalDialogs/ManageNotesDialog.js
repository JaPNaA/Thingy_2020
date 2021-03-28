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
import { boundBetween, EventHandler } from "../../utils.js";
import { ModalDialog } from "./ModalDialog.js";
var ManageNotesDialog = /** @class */ (function (_super) {
    __extends(ManageNotesDialog, _super);
    function ManageNotesDialog(deck) {
        var _this = _super.call(this, "manageNotesDialog") || this;
        _this.foregroundElm.append(new Elm("h1").append("Manage notes"), _this.notesList = new NotesRecyclingList(deck.database.getNotes(), deck));
        _this.notesList.onClick.addHandler(function (data) {
            console.log(data);
            if (confirm("Delete note?\n(Delete note is WIP)")) {
                deck.database.removeNote(data);
                _this.notesList.update();
            }
        });
        return _this;
    }
    return ManageNotesDialog;
}(ModalDialog));
export { ManageNotesDialog };
var RecyclingList = /** @class */ (function (_super) {
    __extends(RecyclingList, _super);
    function RecyclingList(dataList, listElmHeight) {
        var _this = _super.call(this, "recyclingList") || this;
        _this.dataList = dataList;
        _this.listElmHeight = listElmHeight;
        _this.onClick = new EventHandler();
        _this.elmsList = [];
        _this.listElmsContainer = new Elm().class("elmsContainer");
        _this.bottomBufferElm = new Elm();
        _this.bufferedPixelsTop = 0;
        _this.bufferedPixelsBottom = 0;
        for (var i = 0; i < 15; i++) {
            var recyclingListItem = new RecyclingListItem(listElmHeight);
            recyclingListItem.onClick.addHandler(function (data) { return _this.onClick.dispatch(data); });
            _this.elmsList.push(recyclingListItem);
            _this.listElmsContainer.append(recyclingListItem);
        }
        _this.append(_this.listElmsContainer);
        _this.append(_this.bottomBufferElm);
        _this.on("scroll", function () { return _this.scrollHandler(); });
        return _this;
    }
    RecyclingList.prototype.update = function () {
        var maxStartIndex = this.dataList.length - this.elmsList.length;
        var bufferStartIndex = boundBetween(0, Math.floor(this.elm.scrollTop / this.listElmHeight - this.elmsList.length / 2), maxStartIndex);
        this.bufferedPixelsTop = bufferStartIndex * this.listElmHeight;
        this.listElmsContainer.attribute("style", "margin-top: " + this.bufferedPixelsTop + "px");
        for (var i = 0; i < this.elmsList.length; i++) {
            var content = this.dataList[bufferStartIndex + i];
            this.elmsList[i].setContent(content, this.getContentForListItem(content));
        }
        this.bufferedPixelsBottom = (bufferStartIndex + this.elmsList.length) * this.listElmHeight;
        this.bottomBufferElm.attribute("style", "height: " + (this.dataList.length * this.listElmHeight - this.bufferedPixelsBottom) + "px");
    };
    RecyclingList.prototype.scrollHandler = function () {
        if (this.bufferedElementsCoversViewbox()) {
            return;
        }
        this.update();
    };
    RecyclingList.prototype.bufferedElementsCoversViewbox = function () {
        return this.bufferedPixelsTop < this.elm.scrollTop &&
            this.elm.scrollTop + this.elm.clientHeight < this.bufferedPixelsBottom;
    };
    return RecyclingList;
}(Component));
var RecyclingListItem = /** @class */ (function (_super) {
    __extends(RecyclingListItem, _super);
    function RecyclingListItem(elmHeight) {
        var _this = _super.call(this, "recyclingListItem") || this;
        _this.onClick = new EventHandler();
        _this.attribute("style", "height: " + elmHeight + "px");
        _this.append("Owo");
        _this.on("click", function () {
            if (!_this.itemData) {
                return;
            }
            _this.onClick.dispatch(_this.itemData);
        });
        return _this;
    }
    RecyclingListItem.prototype.setContent = function (item, elm) {
        this.replaceContents(elm);
        this.itemData = item;
    };
    return RecyclingListItem;
}(Component));
var NotesRecyclingList = /** @class */ (function (_super) {
    __extends(NotesRecyclingList, _super);
    function NotesRecyclingList(items, deck) {
        var _this = _super.call(this, items, 64) || this;
        _this.deck = deck;
        _this.update();
        return _this;
    }
    NotesRecyclingList.prototype.getContentForListItem = function (note) {
        var _this = this;
        var label = note.fields[0].slice(0, 20) + "...";
        return new Elm().append(new Elm().class("label").append(label), new Elm().class("cards").withSelf(function (cards) {
            for (var _i = 0, _a = note.cardUids; _i < _a.length; _i++) {
                var cardUid = _a[_i];
                var card = _this.deck.database.getCardByUid(cardUid);
                var cardState = CardState[card.state];
                cards.append(new Elm().class("card", cardState).append(cardState));
            }
        }));
    };
    return NotesRecyclingList;
}(RecyclingList));
