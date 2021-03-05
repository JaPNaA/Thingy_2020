import { CardData, CardDataActive, CardDataBasic, CardFlag, CardState, DeckData, isCardActive, isEmptyValue, isNoteTypeDataIntegrated, NoteData, NoteTypeData, NoteTypeDataIntegrated, Optional } from "./dataTypes.js";

export class TankiDatabase {
    public cards: Card[] = [];
    public notes: Note[] = [];
    public noteTypes: NoteTypeData[];

    constructor(private readonly deckData: Readonly<DeckData>) {
        this.noteTypes = deckData.noteTypes;
        this.initCards();
    }

    private initCards() {
        for (const note of this.deckData.notes) {
            const obj = new Note(this, note);
            for (const card of obj.cards) {
                this.cards.push(card);
            }
            this.notes.push(obj);
        }
    }
}

export class Note {
    public type: NoteTypeData;
    public fields: string[];
    public cards: Card[];
    public tags: string[];

    private static externalNoteTypesCache: Map<string, NoteTypeDataIntegrated> = new Map();

    constructor(database: TankiDatabase, noteData: NoteData) {
        this.type = this.getNoteType(database, noteData[0]);
        this.fields = noteData[1];
        this.cards = this.getCards(noteData[2] || []);
        this.tags = noteData[3] || [];
    }

    private getCards(cardDatas: Optional<CardData>[]): Card[] {
        const cards = [];

        const numCardTypes = isNoteTypeDataIntegrated(this.type)
            ? this.type.cardTypes.length : this.type.numCardTypes;

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

    public async getIntegratedNoteType(): Promise<Readonly<NoteTypeDataIntegrated>> {
        if (isNoteTypeDataIntegrated(this.type)) {
            return this.type;
        }

        return Note.getIntegratedNoteType(this.type.src);
    }

    public static async getIntegratedNoteType(src: string) {
        const alreadyLoaded = Note.externalNoteTypesCache.get(src);
        if (alreadyLoaded) {
            return alreadyLoaded;
        }

        const fetchResult = await fetch("../" + src).then(e => e.json());
        Note.externalNoteTypesCache.set(src, fetchResult);
        return fetchResult;
    }

    private getNoteType(database: TankiDatabase, id: number): NoteTypeData {
        return database.noteTypes[id];
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
