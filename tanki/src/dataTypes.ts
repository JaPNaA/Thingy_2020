export interface DeckData {
    noteTypes: NoteTypeData[];
    notes: NoteData[];
}

export interface NoteTypeData {
    name: string;
    fieldNames: string[];
    cardTypes: CardTypeData[];
}

export interface CardTypeData {
    name: string;
    frontTemplate: string;
    backTemplate: string;
}

export interface NoteData extends Array<any> {
    /** Type of note */
    0: number;
    /** Fields */
    1: string[];
    /** Card data */
    2?: (CardData | undefined | 0)[] | undefined | 0;
}

export interface CardData extends Array<any> {
    /** State */
    0: CardState;
    /** Interval in minutes */
    1: number;
    /** Difficulty factor */
    2: number;
    /** Due date in minutes ( [Date#getTime() / 60_000] )*/
    3: number;
}

export enum CardState {
    /** Not yet shown */
    new = 0,
    /** Just after showing or after 'forgetting' a card */
    learn = 1,
    /** Passing 'learn' */
    seen = 2,
    /** No longer in short-term reviews */
    graduated = 3
}