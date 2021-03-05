import { CardData, CardDataActive, CardDataBasic, CardFlag, CardSchedulingSettingsData, CardState, dataTypeVersion, DeckData, isCardActive, isEmptyValue, isNoteTypeDataIntegrated, NoteData, NoteTypeData, NoteTypeDataIntegrated, Optional } from "./dataTypes.js";

export class TankiDatabase {
    public cards: Card[] = [];
    public notes: Note[] = [];
    public noteTypes: NoteType[];

    constructor(private readonly deckData: Readonly<DeckData>) {
        if (deckData.version !== dataTypeVersion) {
            alert("Saved version of deckData doesn't match the app's version. Backwards compatibility doesn't come with this app.");
            throw new Error("Versions don't match");
        }

        this.noteTypes = this.initNoteTypes();
        this.initCards();
    }

    private initNoteTypes(): NoteType[] {
        const noteTypes = [];

        for (const noteTypeData of this.deckData.noteTypes) {
            noteTypes.push(new NoteType(noteTypeData));
        }

        return noteTypes;
    }

    private initCards() {
        for (const note of this.deckData.notes) {
            const obj = Note.fromData(this, note);
            for (const card of obj.cards) {
                this.cards.push(card);
            }
            this.notes.push(obj);
        }
    }

    public addNote(note: Note) {
        this.notes.push(note);
        for (const card of note.cards) {
            this.cards.push(card);
        }
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

    public getCardSchedulingSettings(card: Card): CardSchedulingSettingsData {
        return this.deckData.schedulingSettings;
    }

    // todo: process changed cards
    public toJSON(): string {
        return JSON.stringify(this.deckData);
    }
}

export class Note {
    public cards: Card[];

    constructor(
        public type: NoteType,
        public fields: string[],
        public tags: string[]
    ) {
        this.cards = [];
    }

    public static fromData(database: TankiDatabase, noteData: NoteData): Note {
        const note = new Note(
            this.getNoteType(database, noteData[0]),
            noteData[1],
            noteData[3] || [],
        );

        note.cards = note.getCards(noteData[2] || []);

        return note;
    }

    public static create(type: NoteType, fields: string[], tags?: string[]) {
        const note = new Note(
            type, fields,
            tags || [],
        );

        note.cards = note.getCards([]);

        return note;
    }

    private static getNoteType(database: TankiDatabase, id: number): NoteType {
        return database.noteTypes[id];
    }

    private getCards(cardDatas: Optional<CardData>[]): Card[] {
        const cards = [];

        const numCardTypes = this.type.numCardTypes;

        for (let i = 0; i < numCardTypes; i++) {
            const card = isEmptyValue(cardDatas) ? undefined : cardDatas[i];

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

    public async getIntegratedNoteType(): Promise<Readonly<NoteTypeDataIntegrated>> {
        return NoteType.getIntegratedNoteType(this);
    }

    public static async getIntegratedNoteType(noteType: NoteType) {
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

export class Card {
    public state: CardState;
    private flags: CardFlag[];

    constructor(
        _data: Optional<CardDataBasic>,
        public cardTypeID: number,
        public parentNote: Note,
    ) {
        let data = _data ?? [CardState.new, null];
        this.state = data[0];
        this.flags = data[1] || [];
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
}

export class ActiveCard extends Card {
    public dueMinutes: number;
    public interval: number;
    public timesWrongHistory: number[];
    public learningInterval: Optional<number>;

    constructor(
        data: CardDataActive,
        cardTypeID: number,
        parentNote: Note
    ) {
        super(data, cardTypeID, parentNote);
        this.dueMinutes = data[2];
        this.interval = data[3];
        this.timesWrongHistory = data[4] || [];
        this.learningInterval = data[5];
    }
}
