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
import { CardState, dataTypeVersion, isCardActivated, isEmptyValue, isNoteTypeDataIntegrated } from "./dataTypes.js";
import { clearData } from "./storage.js";
import { arrayRemoveTrailingUndefinedOrNull, EventHandler } from "./utils.js";
var DatabaseObject = /** @class */ (function () {
    function DatabaseObject() {
        this._uid = -1;
    }
    return DatabaseObject;
}());
var TankiDatabase = /** @class */ (function () {
    function TankiDatabase(deckData) {
        var _this = this;
        this.deckData = deckData;
        this.onAddNote = new EventHandler();
        this.onRemoveNote = new EventHandler();
        this.onEdit = new EventHandler();
        this.onUndo = new EventHandler();
        this.onAnyChange = new EventHandler();
        this.cards = [];
        this.notes = [];
        /**
         * Array that maps uid -> object
         *
         * Operations that shift objects (splice, unshift, shift, etc.) should
         * not be used on this array!
         */
        this.objects = [];
        if (deckData.version !== dataTypeVersion) {
            alert("Saved version of deckData doesn't match the app's version. Backwards compatibility doesn't come with this app.");
            if (confirm("Clear deck data?")) {
                clearData();
                location.reload();
            }
            throw new Error("Versions don't match");
        }
        this.logs = new DatabaseChangeLog();
        this.logs.freeze = true;
        this.noteTypes = this.initNoteTypes();
        this.initCards();
        this.logs.freeze = false;
        this.onAddNote.addHandler(function (e) { return _this.onAnyChange.dispatch(e); });
        this.onRemoveNote.addHandler(function (e) { return _this.onAnyChange.dispatch(e); });
        this.onEdit.addHandler(function (e) { return _this.onAnyChange.dispatch(e); });
        this.onUndo.addHandler(function (e) { return _this.onAnyChange.dispatch(e); });
    }
    TankiDatabase.prototype.getCards = function () {
        return this.cards;
    };
    TankiDatabase.prototype.getNotes = function () {
        return this.notes;
    };
    TankiDatabase.prototype.getNoteTypes = function () {
        return this.noteTypes;
    };
    TankiDatabase.prototype.getNoteByUid = function (uid) {
        var o = this.objects[uid];
        if (!(o instanceof Note)) {
            throw new Error("Object mismatch");
        }
        return o;
    };
    TankiDatabase.prototype.getCardByUid = function (uid) {
        var o = this.objects[uid];
        if (!(o instanceof Card)) {
            throw new Error("Object mismatch");
        }
        return o;
    };
    TankiDatabase.prototype.getNoteTypeByName = function (name) {
        for (var _i = 0, _a = this.noteTypes; _i < _a.length; _i++) {
            var noteType = _a[_i];
            if (noteType.name === name) {
                return noteType;
            }
        }
    };
    TankiDatabase.prototype.getCardSchedulingSettings = function (card) {
        return this.deckData.schedulingSettings;
    };
    TankiDatabase.prototype.writeEdit = function (copying) {
        if (copying._uid < 0) {
            throw new Error("Trying to write to unregisted object");
        }
        var existing = this.objects[copying._uid];
        var original = existing.clone();
        this.logs.logEdit({
            target: existing,
            original: original
        });
        existing.overwriteWith(copying);
        this.onEdit.dispatch({
            before: original,
            current: existing
        });
    };
    TankiDatabase.prototype.activateCard = function (card) {
        if (card instanceof ActivatedCard) {
            return card;
        }
        this.logs.startGroup();
        var schedulingSettings = this.getCardSchedulingSettings(card);
        var originalCard = this.getCardByUid(card._uid);
        var cardIndex = this.cards.indexOf(originalCard);
        var activeCard = new ActivatedCard([CardState.active, [], 0, schedulingSettings.initialInterval], card.cardTypeID, card.parentNote);
        this.registerObject(activeCard);
        this.cards[cardIndex] = activeCard;
        this.logs.logRemove({
            index: cardIndex,
            location: this.cards,
            target: originalCard
        });
        this.logs.logAdd({
            index: cardIndex,
            location: this.cards,
            target: activeCard
        });
        var newNote = card.parentNote.clone();
        newNote.cardUids[card.cardTypeID] = activeCard._uid;
        this.writeEdit(newNote);
        this.logs.endGroup();
        return activeCard;
    };
    TankiDatabase.prototype.addNote = function (note) {
        this.logs.startGroup();
        this.initNote(note);
        this.onAddNote.dispatch(note);
        this.logs.endGroup();
    };
    TankiDatabase.prototype.removeNote = function (note) {
        this.logs.startGroup();
        var originalNote = this.getNoteByUid(note._uid);
        var index = this.notes.indexOf(originalNote);
        this.notes.splice(index, 1);
        this.logs.logRemove({
            index: index,
            location: this.notes,
            target: originalNote
        });
        for (var _i = 0, _a = originalNote.cardUids; _i < _a.length; _i++) {
            var cardUid = _a[_i];
            var card = this.getCardByUid(cardUid);
            var index_1 = this.cards.indexOf(card);
            this.cards.splice(index_1, 1);
            this.logs.logRemove({
                index: index_1,
                location: this.cards,
                target: card
            });
        }
        this.onRemoveNote.dispatch(note);
        this.logs.endGroup();
    };
    TankiDatabase.prototype.addNoteType = function (noteType) {
        this.noteTypes.push(noteType);
    };
    TankiDatabase.prototype.undo = function () {
        var log = this.logs.undo();
        if (log) {
            this.onUndo.dispatch(log);
        }
    };
    TankiDatabase.prototype.startUndoLogGroup = function () {
        this.logs.startGroup();
    };
    TankiDatabase.prototype.endUndoLogGroup = function () {
        this.logs.endGroup();
    };
    // todo: process changed cards
    TankiDatabase.prototype.toJSON = function () {
        var _this = this;
        var start = performance.now();
        var noteTypeIndexMap = new Map();
        for (var i = 0; i < this.noteTypes.length; i++) {
            noteTypeIndexMap.set(this.noteTypes[i], i);
        }
        var deckData = {
            version: dataTypeVersion,
            schedulingSettings: this.deckData.schedulingSettings,
            noteTypes: this.noteTypes.map(function (noteType) { return noteType.serialize(); }),
            notes: this.notes.map(function (note) { return note.serialize(noteTypeIndexMap, _this); })
        };
        console.log(performance.now() - start, " milliseconds to serialize");
        return JSON.stringify(deckData);
    };
    TankiDatabase.prototype.initNoteTypes = function () {
        var noteTypes = [];
        for (var _i = 0, _a = this.deckData.noteTypes; _i < _a.length; _i++) {
            var noteTypeData = _a[_i];
            var noteType = new NoteType(noteTypeData);
            noteTypes.push(noteType);
            this.registerObject(noteType);
        }
        return noteTypes;
    };
    TankiDatabase.prototype.initCards = function () {
        for (var _i = 0, _a = this.deckData.notes; _i < _a.length; _i++) {
            var noteData = _a[_i];
            var note = Note.fromData(this, noteData);
            this.initNote(note);
        }
    };
    TankiDatabase.prototype.initNote = function (note) {
        this.logs.logAdd({
            index: this.notes.push(note) - 1,
            location: this.notes,
            target: note,
        });
        this.registerObject(note);
        var cards = note._initCards();
        for (var _i = 0, cards_1 = cards; _i < cards_1.length; _i++) {
            var card = cards_1[_i];
            this.logs.logAdd({
                index: this.cards.push(card) - 1,
                location: this.cards,
                target: card,
            });
            note.cardUids.push(this.registerObject(card));
        }
    };
    TankiDatabase.prototype.registerObject = function (obj) {
        if (obj._uid >= 0) {
            return;
        }
        return obj._uid = this.objects.push(obj) - 1;
    };
    return TankiDatabase;
}());
export { TankiDatabase };
var DatabaseChangeLog = /** @class */ (function () {
    function DatabaseChangeLog() {
        this.freeze = false;
        this.currentLogGroup = this.createLogGroup();
        this.logGroupHistory = [];
        this.groupDepth = 0;
    }
    DatabaseChangeLog.prototype.logEdit = function (edit) {
        if (this.freeze) {
            return;
        }
        this.currentLogGroup.edits.push(edit);
    };
    DatabaseChangeLog.prototype.logAdd = function (add) {
        if (this.freeze) {
            return;
        }
        this.currentLogGroup.adds.push(add);
    };
    DatabaseChangeLog.prototype.logRemove = function (remove) {
        if (this.freeze) {
            return;
        }
        this.currentLogGroup.removes.push(remove);
    };
    DatabaseChangeLog.prototype.startGroup = function () {
        this.groupDepth++;
    };
    DatabaseChangeLog.prototype.endGroup = function () {
        this.groupDepth--;
        if (this.groupDepth > 0) {
            return;
        }
        if (this.groupDepth < 0) {
            throw new Error("No more groups to end");
        }
        this.flushLogGroupToHistory();
    };
    DatabaseChangeLog.prototype.undo = function () {
        this.flushLogGroupToHistory();
        var logGroup = this.logGroupHistory.pop();
        if (!logGroup) {
            return;
        }
        var adds = logGroup.adds, edits = logGroup.edits, removes = logGroup.removes;
        for (var i = adds.length - 1; i >= 0; i--) {
            var add = adds[i];
            if (add.location[add.index] !== add.target) {
                throw new Error("Tried to undo add, but encountered unexpected object at location");
            }
            add.location.splice(add.index, 1);
        }
        for (var i = edits.length - 1; i >= 0; i--) {
            var edit = edits[i];
            edit.target.overwriteWith(edit.original);
        }
        for (var i = removes.length - 1; i >= 0; i--) {
            var remove = removes[i];
            remove.location.splice(remove.index, 0, remove.target);
        }
        return logGroup;
    };
    DatabaseChangeLog.prototype.flushLogGroupToHistory = function () {
        if (this.currentLogGroup.adds.length <= 0 &&
            this.currentLogGroup.edits.length <= 0 &&
            this.currentLogGroup.removes.length <= 0) {
            return;
        }
        this.logGroupHistory.push(this.currentLogGroup);
        this.currentLogGroup = this.createLogGroup();
    };
    DatabaseChangeLog.prototype.createLogGroup = function () {
        return { adds: [], edits: [], removes: [] };
    };
    return DatabaseChangeLog;
}());
var Note = /** @class */ (function (_super) {
    __extends(Note, _super);
    function Note(type, fields, tags) {
        var _this = _super.call(this) || this;
        _this.type = type;
        _this.fields = fields;
        _this.tags = tags;
        _this.cardUids = [];
        return _this;
    }
    Note.fromData = function (database, noteData) {
        var note = new Note(this.getNoteType(database, noteData[0]), noteData[1], noteData[3] || []);
        note.cardDatas = noteData[2];
        return note;
    };
    Note.create = function (type, fields, tags) {
        var note = Note.createWithoutCards(type, fields, tags);
        return note;
    };
    Note.prototype.clone = function () {
        var note = Note.createWithoutCards(this.type, this.fields.slice(), this.tags.slice());
        note.cardUids = this.cardUids.slice();
        note._uid = this._uid;
        return note;
    };
    Note.prototype.overwriteWith = function (target) {
        this.type = target.type;
        this.fields = target.fields.slice();
        this.tags = target.tags.slice();
        this.cardUids = target.cardUids.slice();
    };
    Note.prototype.serialize = function (noteTypeIndexMap, db) {
        var cards = arrayRemoveTrailingUndefinedOrNull(this.cardUids.map(function (uid) { return db.getCardByUid(uid).serialize(); }));
        var noteTypeIndex = noteTypeIndexMap.get(this.type);
        if (noteTypeIndex === undefined) {
            throw new Error("Tried to serialize Note who's type wasn't registered.");
        }
        return arrayRemoveTrailingUndefinedOrNull([
            noteTypeIndex,
            this.fields,
            cards.length > 0 ? cards : undefined,
            this.tags.length > 0 ? this.tags : undefined
        ]);
    };
    Note.createWithoutCards = function (type, fields, tags) {
        return new Note(type, fields, tags || []);
    };
    Note.getNoteType = function (database, id) {
        return database.getNoteTypes()[id];
    };
    Note.prototype._initCards = function () {
        var cards = [];
        var numCardTypes = this.type.numCardTypes;
        for (var i = 0; i < numCardTypes; i++) {
            var card = isEmptyValue(this.cardDatas) ? undefined : this.cardDatas[i];
            if (!isEmptyValue(card) && isCardActivated(card)) {
                cards.push(new ActivatedCard(card, i, this));
            }
            else {
                cards.push(new Card(card, i, this));
            }
        }
        return cards;
    };
    return Note;
}(DatabaseObject));
export { Note };
var NoteType = /** @class */ (function (_super) {
    __extends(NoteType, _super);
    function NoteType(noteTypeData) {
        var _this = _super.call(this) || this;
        _this.noteTypeData = noteTypeData;
        _this.name = noteTypeData.name;
        _this.numCardTypes = (_this.isIntegrated = isNoteTypeDataIntegrated(noteTypeData)) ?
            noteTypeData.cardTypes.length : noteTypeData.numCardTypes;
        return _this;
    }
    NoteType.prototype.serialize = function () {
        return this.noteTypeData;
    };
    NoteType.prototype.clone = function () {
        var clone = new NoteType(JSON.parse(JSON.stringify(this.noteTypeData)));
        clone._uid = this._uid;
        return clone;
    };
    NoteType.prototype.overwriteWith = function (noteType) {
        this.noteTypeData = JSON.parse(JSON.stringify(noteType.noteTypeData));
    };
    NoteType.prototype.getIntegratedNoteType = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, NoteType.getIntegratedNoteType(this)];
            });
        });
    };
    NoteType.getIntegratedNoteType = function (_noteType) {
        return __awaiter(this, void 0, void 0, function () {
            var noteType, src, alreadyLoaded, fetchResult;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        noteType = _noteType;
                        if (isNoteTypeDataIntegrated(noteType.noteTypeData)) {
                            return [2 /*return*/, noteType.noteTypeData];
                        }
                        src = noteType.noteTypeData.src;
                        alreadyLoaded = NoteType.externalNoteTypesCache.get(src);
                        if (alreadyLoaded) {
                            return [2 /*return*/, alreadyLoaded];
                        }
                        return [4 /*yield*/, fetch("../" + src).then(function (e) { return e.json(); })];
                    case 1:
                        fetchResult = _a.sent();
                        NoteType.externalNoteTypesCache.set(src, fetchResult);
                        return [2 /*return*/, fetchResult];
                }
            });
        });
    };
    NoteType.externalNoteTypesCache = new Map();
    return NoteType;
}(DatabaseObject));
export { NoteType };
var Card = /** @class */ (function (_super) {
    __extends(Card, _super);
    function Card(_data, cardTypeId, parentNote) {
        var _this = _super.call(this) || this;
        var data = _data !== null && _data !== void 0 ? _data : [CardState.new, null];
        _this.state = data[0];
        _this.flags = data[1] || [];
        _this.cardTypeID = cardTypeId;
        _this.parentNote = parentNote;
        return _this;
    }
    Card.fromData = function (_data, cardTypeID, parentNote) {
        return new Card(_data, cardTypeID, parentNote);
    };
    Card.prototype.overwriteWith = function (card) {
        this.state = card.state;
        this.cardTypeID = card.cardTypeID;
        this.parentNote = card.parentNote;
        this.flags = card.flags.slice();
    };
    Card.prototype.hasFlag = function (flag) {
        return this.flags.includes(flag);
    };
    Card.prototype.addFlag = function (flag) {
        if (this.hasFlag(flag)) {
            return;
        }
        this.flags.push(flag);
    };
    Card.prototype.removeFlag = function (flag) {
        var index = this.flags.indexOf(flag);
        if (index < 0) {
            throw new Error("Tried to remove flag that doesn't exist");
        }
        this.flags.splice(index, 1);
    };
    Card.prototype.serialize = function () {
        if (this.state === CardState.new && this.flags.length === 0) {
            return;
        }
        return [this.state, this.flags];
    };
    Card.prototype.clone = function () {
        var card = new Card([this.state, this.flags.slice()], this.cardTypeID, this.parentNote);
        card._uid = this._uid;
        return card;
    };
    return Card;
}(DatabaseObject));
export { Card };
var ActivatedCard = /** @class */ (function (_super) {
    __extends(ActivatedCard, _super);
    function ActivatedCard(data, cardTypeID, parentNote) {
        var _this = _super.call(this, data, cardTypeID, parentNote) || this;
        _this.dueMinutes = data[2];
        _this.interval = data[3];
        _this.timesWrongHistory = data[4] || [];
        _this.learningInterval = data[5];
        return _this;
    }
    ActivatedCard.prototype.overwriteWith = function (card) {
        _super.prototype.overwriteWith.call(this, card);
        this.dueMinutes = card.dueMinutes;
        this.interval = card.interval;
        this.timesWrongHistory = card.timesWrongHistory.slice();
        this.learningInterval = card.learningInterval;
    };
    ActivatedCard.prototype.serialize = function () {
        if (this.state === CardState.new) {
            throw new Error("Tried serializing ActiveCard with state new");
        }
        return [
            this.state,
            this.flags,
            Math.round(this.dueMinutes),
            Math.round(this.interval),
            this.timesWrongHistory,
            this.learningInterval
        ];
    };
    ActivatedCard.prototype.clone = function () {
        if (this.state === CardState.new) {
            throw new Error("Tried cloning ActiveCard with state new");
        }
        var card = new ActivatedCard([this.state, this.flags.slice(), this.dueMinutes, this.interval, this.timesWrongHistory, this.learningInterval], this.cardTypeID, this.parentNote);
        card._uid = this._uid;
        return card;
    };
    return ActivatedCard;
}(Card));
export { ActivatedCard };
