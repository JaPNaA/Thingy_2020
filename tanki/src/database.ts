import { CardData, CardDataActivated, CardDataBasic, CardFlag, CardSchedulingSettingsData, CardState, dataTypeVersion, DeckData, isCardActivated, isEmptyValue, isNoteTypeDataIntegrated, NoteData, NoteTypeData, NoteTypeDataExternal, NoteTypeDataIntegrated, Optional } from "./dataTypes.js";
import { arrayRemoveTrailingUndefinedOrNull, Immutable } from "./utils.js";

abstract class DatabaseObject {
    public _uid: number = -1;
    abstract overwriteWith(target: Immutable<this>): void;
    abstract clone(): DatabaseObject;
}

export class TankiDatabase {
    public logs: UndoLog;

    private cards: Card[] = [];
    private notes: Note[] = [];
    private noteTypes: NoteType[];

    /**
     * Array that maps uid -> object
     * 
     * Operations that shift objects (splice, unshift, shift, etc.) should
     * not be used on this array!
     */
    private objects: DatabaseObject[] = [];

    constructor(private readonly deckData: Readonly<DeckData>) {
        if (deckData.version !== dataTypeVersion) {
            alert("Saved version of deckData doesn't match the app's version. Backwards compatibility doesn't come with this app.");
            throw new Error("Versions don't match");
        }

        this.logs = new UndoLog();
        this.logs.freeze = true;

        this.noteTypes = this.initNoteTypes();
        this.initCards();

        this.logs.freeze = false;
    }

    public getCards(): Immutable<Card[]> {
        return this.cards;
    }

    public getNotes(): Immutable<Note[]> {
        return this.notes;
    }

    public getNoteTypes(): Immutable<NoteType[]> {
        return this.noteTypes;
    }

    public getNoteByUid(uid: number): Immutable<Note> {
        const o = this.objects[uid];
        if (!(o instanceof Note)) { throw new Error("Object mismatch"); }
        return o;
    }

    public getCardByUid(uid: number): Immutable<Card> {
        const o = this.objects[uid];
        if (!(o instanceof Card)) { throw new Error("Object mismatch"); }
        return o;
    }

    public getNoteTypeByName(name: string): Immutable<NoteType> | undefined {
        for (const noteType of this.noteTypes) {
            if (noteType.name === name) {
                return noteType;
            }
        }
    }

    public getCardSchedulingSettings(card: Immutable<Card>): CardSchedulingSettingsData {
        return this.deckData.schedulingSettings;
    }

    public writeEdit(copying: Immutable<DatabaseObject>) {
        if (copying._uid < 0) { throw new Error("Trying to write to unregisted object"); }
        const existing = this.objects[copying._uid];

        this.logs.logEdit({
            target: existing,
            original: existing.clone()
        });
        existing.overwriteWith(copying);
    }

    public activateCard(card: Immutable<Card>): Immutable<ActivatedCard> {
        if (card instanceof ActivatedCard) { return card; }
        this.logs.startGroup();

        const schedulingSettings = this.getCardSchedulingSettings(card);

        const originalCard = this.getCardByUid(card._uid) as Card;
        const cardIndex = this.cards.indexOf(originalCard);
        const activeCard = new ActivatedCard(
            [CardState.active, [], 0, schedulingSettings.initialInterval],
            card.cardTypeID, card.parentNote
        );
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

        const newNote = card.parentNote.clone();
        newNote.cardUids[card.cardTypeID] = activeCard._uid;
        this.writeEdit(newNote);

        this.logs.endGroup();

        return activeCard;
    }

    public addNote(note: Note): void {
        this.logs.startGroup();
        this.initNote(note);
        this.logs.endGroup();
    }

    public removeNote(note: Note | Immutable<Note>): void {
        this.logs.startGroup();

        const originalNote = this.getNoteByUid(note._uid);
        const index = this.notes.indexOf(originalNote as Note);
        this.notes.splice(index, 1);

        this.logs.logRemove({
            index: index,
            location: this.notes,
            target: originalNote
        });

        for (const cardUid of originalNote.cardUids) {
            const card = this.getCardByUid(cardUid);
            const index = this.cards.indexOf(card as Card);
            this.cards.splice(index, 1);

            this.logs.logRemove({
                index: index,
                location: this.cards,
                target: card
            });
        }

        this.logs.endGroup();
    }

    public addNoteType(noteType: NoteType): void {
        this.noteTypes.push(noteType);
    }

    // todo: process changed cards
    public toJSON(): string {
        const start = performance.now();
        const noteTypeIndexMap = new Map<NoteType, number>();
        for (let i = 0; i < this.noteTypes.length; i++) {
            noteTypeIndexMap.set(this.noteTypes[i], i);
        }

        const deckData: DeckData = {
            version: dataTypeVersion,
            schedulingSettings: this.deckData.schedulingSettings,
            noteTypes: this.noteTypes.map(noteType => noteType.serialize()),
            notes: this.notes.map(note => note.serialize(noteTypeIndexMap, this))
        };
        console.log(performance.now() - start, " milliseconds to serialize");

        return JSON.stringify(deckData);
    }

    private initNoteTypes(): NoteType[] {
        const noteTypes = [];

        for (const noteTypeData of this.deckData.noteTypes) {
            noteTypes.push(new NoteType(noteTypeData));
        }

        return noteTypes;
    }

    private initCards(): void {
        for (const noteData of this.deckData.notes) {
            const note = Note.fromData(this, noteData);
            this.initNote(note);
        }
    }

    private initNote(note: Note): void {
        this.logs.logAdd({
            index: this.notes.push(note) - 1,
            location: this.notes,
            target: note,
        });

        this.registerObject(note);

        const cards = note._initCards();
        for (const card of cards) {
            this.logs.logAdd({
                index: this.cards.push(card) - 1,
                location: this.cards,
                target: card,
            });

            note.cardUids.push(this.registerObject(card)!);
        }
    }

    private registerObject(obj: DatabaseObject): number | undefined {
        if (obj._uid >= 0) { return; }
        return obj._uid = this.objects.push(obj) - 1;
    }
}

interface EditLog {
    target: DatabaseObject,
    original: DatabaseObject
}

interface AddLog {
    target: DatabaseObject;
    location: any[];
    index: number;
}

interface RemoveLog extends AddLog { }

interface LogGroup {
    adds: AddLog[];
    edits: EditLog[];
    removes: RemoveLog[];
}


class UndoLog {
    public freeze: boolean = false;

    private currentLogGroup: LogGroup = this.createLogGroup();
    private logGroupHistory: LogGroup[] = [];
    private groupDepth: number = 0;

    public logEdit(edit: EditLog) {
        if (this.freeze) { return; }
        this.currentLogGroup.edits.push(edit);
    }

    public logAdd(add: AddLog) {
        if (this.freeze) { return; }
        this.currentLogGroup.adds.push(add);
    }

    public logRemove(remove: RemoveLog) {
        if (this.freeze) { return; }
        this.currentLogGroup.removes.push(remove);
    }

    public startGroup() {
        this.groupDepth++;
    }

    public endGroup() {
        this.groupDepth--;
        if (this.groupDepth > 0) { return; }
        if (this.groupDepth < 0) { throw new Error("No more groups to end"); }

        this.flushLogGroupToHistory();
    }

    public undo() {
        this.flushLogGroupToHistory();

        const logGroup = this.logGroupHistory.pop();
        if (!logGroup) { return; }
        const { adds, edits, removes } = logGroup;

        for (let i = adds.length - 1; i >= 0; i--) {
            const add = adds[i];
            if (add.location[add.index] !== add.target) { throw new Error("Tried to undo add, but encountered unexpected object at location"); }
            add.location.splice(add.index, 1);
        }

        for (let i = edits.length - 1; i >= 0; i--) {
            const edit = edits[i];
            edit.target.overwriteWith(edit.original);
        }

        for (let i = removes.length - 1; i >= 0; i--) {
            const remove = removes[i];
            remove.location.splice(remove.index, 0, remove.target);
        }
    }

    private flushLogGroupToHistory() {
        if (this.currentLogGroup.adds.length <= 0 &&
            this.currentLogGroup.edits.length <= 0 &&
            this.currentLogGroup.removes.length <= 0) {
            return;
        }

        this.logGroupHistory.push(this.currentLogGroup);
        this.currentLogGroup = this.createLogGroup();
    }

    private createLogGroup(): LogGroup {
        return { adds: [], edits: [], removes: [] };
    }
}

export class Note extends DatabaseObject {
    public cardUids: number[];
    private cardDatas?: Optional<CardData>[];

    constructor(
        public type: Immutable<NoteType>,
        public fields: string[],
        public tags: string[]
    ) {
        super();
        this.cardUids = [];
    }

    public static fromData(database: TankiDatabase, noteData: Immutable<NoteData>): Note {
        const note = new Note(
            this.getNoteType(database, noteData[0]),
            noteData[1],
            noteData[3] || [],
        );

        note.cardDatas = noteData[2];

        return note;
    }

    public static create(type: Immutable<NoteType>, fields: string[], tags?: string[]) {
        const note = Note.createWithoutCards(type, fields, tags);
        return note;
    }

    public clone(): Note {
        const note = Note.createWithoutCards(
            this.type,
            this.fields.slice(),
            this.tags.slice()
        );
        note.cardUids = this.cardUids.slice();
        note._uid = this._uid;
        return note;
    }

    public overwriteWith(target: Immutable<Note>) {
        this.type = target.type;
        this.fields = target.fields.slice();
        this.tags = target.tags.slice();
        this.cardUids = target.cardUids.slice();
    }

    public serialize(noteTypeIndexMap: Map<Immutable<NoteType>, number>, db: TankiDatabase): NoteData {
        const cards = arrayRemoveTrailingUndefinedOrNull(
            this.cardUids.map(uid => db.getCardByUid(uid).serialize())
        );
        const noteTypeIndex = noteTypeIndexMap.get(this.type);
        if (noteTypeIndex === undefined) { throw new Error("Tried to serialize Note who's type wasn't registered."); }

        return arrayRemoveTrailingUndefinedOrNull([
            noteTypeIndex,
            this.fields,
            cards.length > 0 ? cards : undefined,
            this.tags.length > 0 ? this.tags : undefined
        ]);
    }

    private static createWithoutCards(type: Immutable<NoteType>, fields: string[], tags?: string[]) {
        return new Note(
            type, fields,
            tags || [],
        );
    }

    private static getNoteType(database: TankiDatabase, id: number): Immutable<NoteType> {
        return database.getNoteTypes()[id];
    }

    public _initCards(): Card[] {
        const cards = [];

        const numCardTypes = this.type.numCardTypes;

        for (let i = 0; i < numCardTypes; i++) {
            const card = isEmptyValue(this.cardDatas) ? undefined : this.cardDatas[i];

            if (!isEmptyValue(card) && isCardActivated(card)) {
                cards.push(new ActivatedCard(card, i, this));
            } else {
                cards.push(new Card(card, i, this));
            }
        }

        return cards;
    }
}

export class NoteType {
    private static externalNoteTypesCache: Map<string, NoteTypeDataIntegrated> = new Map();

    public name: string;
    public numCardTypes: number;

    constructor(private noteTypeData: NoteTypeData) {
        this.name = noteTypeData.name;
        this.numCardTypes = isNoteTypeDataIntegrated(noteTypeData) ?
            noteTypeData.cardTypes.length : noteTypeData.numCardTypes;
    }

    public serialize(): NoteTypeData {
        return this.noteTypeData;
    }

    public async getIntegratedNoteType(): Promise<Immutable<NoteTypeDataIntegrated>> {
        return NoteType.getIntegratedNoteType(this);
    }

    public static async getIntegratedNoteType(_noteType: Immutable<NoteType>): Promise<Immutable<NoteTypeDataIntegrated>> {
        // Fix typescript getting confused
        const noteType = _noteType as NoteType;

        if (isNoteTypeDataIntegrated(noteType.noteTypeData)) {
            return noteType.noteTypeData;
        }

        const src = noteType.noteTypeData.src;
        const alreadyLoaded = NoteType.externalNoteTypesCache.get(src);
        if (alreadyLoaded) {
            return alreadyLoaded;
        }

        const fetchResult = await fetch("../" + src).then(e => e.json());
        NoteType.externalNoteTypesCache.set(src, fetchResult);
        return fetchResult;
    }
}

export class Card extends DatabaseObject {
    public state: CardState;
    public cardTypeID: number;
    public parentNote: Immutable<Note>;
    public flags: CardFlag[];

    constructor(
        _data: Optional<CardDataBasic>,
        cardTypeId: number,
        parentNote: Immutable<Note>
    ) {
        super();
        let data = _data ?? [CardState.new, null];
        this.state = data[0];
        this.flags = data[1] || [];
        this.cardTypeID = cardTypeId;
        this.parentNote = parentNote;
    }

    public static fromData(_data: Optional<CardDataBasic>, cardTypeID: number, parentNote: Immutable<Note>) {
        return new Card(_data, cardTypeID, parentNote);
    }

    public overwriteWith(card: Immutable<Card>) {
        this.state = card.state;
        this.cardTypeID = card.cardTypeID;
        this.parentNote = card.parentNote;
        this.flags = card.flags.slice();
    }

    public hasFlag(flag: CardFlag): boolean {
        return this.flags.includes(flag);
    }

    public addFlag(flag: CardFlag): void {
        if (this.hasFlag(flag)) { return; }
        this.flags.push(flag);
    }

    public removeFlag(flag: CardFlag): void {
        const index = this.flags.indexOf(flag);
        if (index < 0) { throw new Error("Tried to remove flag that doesn't exist"); }
        this.flags.splice(index, 1);
    }

    public serialize(): CardDataBasic | undefined {
        if (this.state === CardState.new && this.flags.length === 0) { return; }
        return [this.state, this.flags];
    }

    public clone(): Card {
        const card = new Card([this.state, this.flags.slice()], this.cardTypeID, this.parentNote);
        card._uid = this._uid;
        return card;
    }
}

export class ActivatedCard extends Card {
    public dueMinutes: number;
    public interval: number;
    public timesWrongHistory: number[];
    public learningInterval: Optional<number>;

    constructor(
        data: CardDataActivated,
        cardTypeID: number,
        parentNote: Immutable<Note>
    ) {
        super(data, cardTypeID, parentNote);
        this.dueMinutes = data[2];
        this.interval = data[3];
        this.timesWrongHistory = data[4] || [];
        this.learningInterval = data[5];
    }

    public overwriteWith(card: Immutable<ActivatedCard>) {
        super.overwriteWith(card);
        this.dueMinutes = card.dueMinutes;
        this.interval = card.interval;
        this.timesWrongHistory = card.timesWrongHistory.slice();
        this.learningInterval = card.learningInterval;
    }

    public serialize(): CardDataActivated {
        if (this.state === CardState.new) { throw new Error("Tried serializing ActiveCard with state new"); }
        return [
            this.state,
            this.flags,
            Math.round(this.dueMinutes),
            Math.round(this.interval),
            this.timesWrongHistory,
            this.learningInterval
        ];
    }

    public clone(): ActivatedCard {
        if (this.state === CardState.new) { throw new Error("Tried cloning ActiveCard with state new"); }
        const card = new ActivatedCard(
            [this.state, this.flags.slice(), this.dueMinutes, this.interval, this.timesWrongHistory, this.learningInterval],
            this.cardTypeID, this.parentNote
        );
        card._uid = this._uid;
        return card;
    }
}
