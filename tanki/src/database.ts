import { CardData, CardDataActive, CardDataBasic, CardFlag, CardSchedulingSettingsData, CardState, dataTypeVersion, DeckData, isCardActive, isEmptyValue, isNoteTypeDataIntegrated, NoteData, NoteTypeData, NoteTypeDataExternal, NoteTypeDataIntegrated, Optional } from "./dataTypes.js";
import { arrayRemoveTrailingUndefinedOrNull, Immutable } from "./utils.js";

abstract class DatabaseObject {
    public _uid: number = -1;
    abstract overwriteWith(target: Immutable<this>): void;
    abstract clone(): DatabaseObject;
}

export class TankiDatabase {
    private cards: Card[] = [];
    private notes: Note[] = [];
    private noteTypes: NoteType[];

    private objects: DatabaseObject[] = [];

    private writeHistory: {
        target: DatabaseObject,
        original: DatabaseObject
    }[] = [];

    constructor(private readonly deckData: Readonly<DeckData>) {
        if (deckData.version !== dataTypeVersion) {
            alert("Saved version of deckData doesn't match the app's version. Backwards compatibility doesn't come with this app.");
            throw new Error("Versions don't match");
        }

        this.noteTypes = this.initNoteTypes();
        this.initCards();
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

    public getNoteByUid(uid: number): Note {
        const o = this.objects[uid];
        if (!(o instanceof Note)) { throw new Error("Object mismatch"); }
        return o;
    }

    public getCardByUid(uid: number): Card {
        const o = this.objects[uid];
        if (!(o instanceof Card)) { throw new Error("Object mismatch"); }
        return o;
    }

    public writeEdit(copying: Immutable<DatabaseObject>) {
        if (copying._uid < 0) { throw new Error("Trying to write to unregisted object"); }
        const existing = this.objects[copying._uid];

        console.log("Write", existing, copying);
        this.writeHistory.push({
            target: existing,
            original: existing.clone()
        });
        existing.overwriteWith(copying);
    }

    public activateCard(card: Immutable<Card>): Immutable<ActiveCard> {
        if (card instanceof ActiveCard) { return card; }
        const schedulingSettings = this.getCardSchedulingSettings(card);

        // todo: activeCard not added to this.cards; old card not removed
        const activeCard = new ActiveCard(
            [CardState.active, [], 0, schedulingSettings.initialInterval],
            card.cardTypeID, card.parentNote
        );
        this.registerObject(activeCard);

        const newNote = card.parentNote.clone();
        newNote.cardUids[card.cardTypeID] = activeCard._uid;
        this.writeEdit(newNote);

        return activeCard;
    }

    public undo() {
        const writeAction = this.writeHistory.pop();
        if (!writeAction) { return; }
        const { target, original } = writeAction;
        target.overwriteWith(original);
    }

    public addNote(note: Note): void {
        this.notes.push(note);
        this.initNote(note);
    }

    public getNoteTypeByName(name: string): NoteType | undefined {
        for (const noteType of this.noteTypes) {
            if (noteType.name === name) {
                return noteType;
            }
        }
    }

    public addNoteType(noteType: NoteType): void {
        this.noteTypes.push(noteType);
    }

    public getCardSchedulingSettings(card: Immutable<Card>): CardSchedulingSettingsData {
        return this.deckData.schedulingSettings;
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
            this.notes.push(note);
        }
    }

    private initNote(note: Note): void {
        this.registerObject(note);

        const cards = note._initCards();
        for (const card of cards) {
            this.cards.push(card);
            note.cardUids.push(this.registerObject(card)!);
        }
    }

    private registerObject(obj: DatabaseObject): number | undefined {
        if (obj._uid >= 0) { return; }
        return obj._uid = this.objects.push(obj) - 1;
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

            if (!isEmptyValue(card) && isCardActive(card)) {
                cards.push(new ActiveCard(card, i, this));
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

export class ActiveCard extends Card {
    public dueMinutes: number;
    public interval: number;
    public timesWrongHistory: number[];
    public learningInterval: Optional<number>;

    constructor(
        data: CardDataActive,
        cardTypeID: number,
        parentNote: Immutable<Note>
    ) {
        super(data, cardTypeID, parentNote);
        this.dueMinutes = data[2];
        this.interval = data[3];
        this.timesWrongHistory = data[4] || [];
        this.learningInterval = data[5];
    }

    public overwriteWith(card: Immutable<ActiveCard>) {
        super.overwriteWith(card);
        this.dueMinutes = card.dueMinutes;
        this.interval = card.interval;
        this.timesWrongHistory = card.timesWrongHistory.slice();
        this.learningInterval = card.learningInterval;
    }

    public serialize(): CardDataActive {
        if (this.state !== CardState.active) { throw new Error("Tried serializing ActiveCard that wasn't active"); }
        return [
            this.state,
            this.flags,
            Math.round(this.dueMinutes),
            Math.round(this.interval),
            this.timesWrongHistory,
            this.learningInterval
        ];
    }

    public clone(): ActiveCard {
        if (this.state !== CardState.active) { throw new Error("Tried cloning ActiveCard that wasn't active"); }
        const card = new ActiveCard(
            [this.state, this.flags.slice(), this.dueMinutes, this.interval, this.timesWrongHistory, this.learningInterval],
            this.cardTypeID, this.parentNote
        );
        card._uid = this._uid;
        return card;
    }
}
