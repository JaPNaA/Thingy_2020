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
import { Component, Elm, InputElm } from "../../libs/elements.js";
import { boundBetween, EventHandler } from "../../utils.js";
import { EditNoteDialog } from "./EditNoteDialog.js";
import { ModalDialog } from "./ModalDialog.js";
var ManageNotesDialog = /** @class */ (function (_super) {
    __extends(ManageNotesDialog, _super);
    function ManageNotesDialog(deck) {
        var _this = _super.call(this, "manageNotesDialog") || this;
        var searchBox;
        _this.foregroundElm.append(new Elm("h1").append("Manage notes"), new Elm().append("Search: ", searchBox = new InputElm().on("change", function () {
            var search = searchBox.getValue();
            if (!search) {
                _this.notesList.setDataList(deck.database.getNotes());
                return;
            }
            var results = deck.database.getNotes().filter(function (note) {
                for (var _i = 0, _a = note.fields; _i < _a.length; _i++) {
                    var field = _a[_i];
                    if (field.includes(search)) {
                        return true;
                    }
                }
                return false;
            });
            _this.notesList.setDataList(results);
        })), _this.notesList = new NotesRecyclingList(deck.database.getNotes(), deck));
        _this.notesList.onClick.addHandler(function (selectedCard) {
            console.log(selectedCard);
            var editNoteDialog = new EditNoteDialog(deck);
            editNoteDialog.setEditingNote(selectedCard);
            editNoteDialog.appendTo(_this.elm);
            editNoteDialog.onSubmit.addHandler(function (editReturnCard) {
                var selectedCardEdit = selectedCard.clone();
                selectedCardEdit.fields = editReturnCard.fields;
                deck.database.writeEdit(selectedCardEdit);
                editNoteDialog.remove();
            });
            editNoteDialog.onDeleteButtonClick.addHandler(function () {
                deck.database.removeNote(selectedCard);
                _this.notesList.update();
                editNoteDialog.remove();
            });
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
        _this.elm.append(_this.listElmsContainer);
        _this.elm.append(_this.bottomBufferElm);
        _this.elm.on("scroll", function () { return _this.scrollHandler(); });
        return _this;
    }
    RecyclingList.prototype.setDataList = function (dataList) {
        this.dataList = dataList;
        this.elm.getHTMLElement().scrollTop = 0;
        this.update();
    };
    RecyclingList.prototype.update = function () {
        var maxStartIndex = this.dataList.length - this.elmsList.length;
        var bufferStartIndex = boundBetween(0, Math.floor(this.elm.getHTMLElement().scrollTop / this.listElmHeight - this.elmsList.length / 2), maxStartIndex);
        this.bufferedPixelsTop = bufferStartIndex * this.listElmHeight;
        this.listElmsContainer.attribute("style", "margin-top: ".concat(this.bufferedPixelsTop, "px"));
        for (var i = 0; i < this.elmsList.length; i++) {
            var content = this.dataList[bufferStartIndex + i];
            if (content) {
                this.elmsList[i].setContent(content, this.getContentForListItem(content));
            }
        }
        this.bufferedPixelsBottom = (bufferStartIndex + this.elmsList.length) * this.listElmHeight;
        this.bottomBufferElm.attribute("style", "height: ".concat(this.dataList.length * this.listElmHeight - this.bufferedPixelsBottom, "px"));
    };
    RecyclingList.prototype.scrollHandler = function () {
        if (this.bufferedElementsCoversViewbox()) {
            return;
        }
        this.update();
    };
    RecyclingList.prototype.bufferedElementsCoversViewbox = function () {
        var htmlElm = this.elm.getHTMLElement();
        return this.bufferedPixelsTop < htmlElm.scrollTop &&
            htmlElm.scrollTop + htmlElm.clientHeight < this.bufferedPixelsBottom;
    };
    return RecyclingList;
}(Component));
var RecyclingListItem = /** @class */ (function (_super) {
    __extends(RecyclingListItem, _super);
    function RecyclingListItem(elmHeight) {
        var _this = _super.call(this, "recyclingListItem") || this;
        _this.onClick = new EventHandler();
        _this.elm.attribute("style", "height: " + elmHeight + "px");
        _this.elm.append("Owo");
        _this.elm.on("click", function () {
            if (!_this.itemData) {
                return;
            }
            _this.onClick.dispatch(_this.itemData);
        });
        return _this;
    }
    RecyclingListItem.prototype.setContent = function (item, elm) {
        this.elm.replaceContents(elm);
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
        var labelRaw = note.fields[0];
        var labelEllipsized = labelRaw.length <= 23 ? labelRaw : labelRaw.slice(0, 20) + "...";
        return new Elm().append(new Elm().class("label").append(labelEllipsized), new Elm().class("cards").withSelf(function (cards) {
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
