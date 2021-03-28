export const dataTypeVersion = "0.3";

export interface DeckData {
    version: string;
    noteTypes: NoteTypeData[];
    notes: NoteData[];
    schedulingSettings: CardSchedulingSettingsData;
}

export interface NoteTypeDataExternal {
    name: string;
    src: string;
    numCardTypes: number;
}

export interface NoteTypeDataIntegrated {
    name: string;
    fieldNames: string[];
    cardTypes: CardTypeData[];
    schedulingSettings?: Partial<CardSchedulingSettingsData>; //* not used in code yet
    /** JavaScript that runs on all children cards */
    script?: string;
    /** CSS Styles that apply to all children cards */
    style?: string;
}

export function isNoteTypeDataIntegrated(x: NoteTypeData): x is NoteTypeDataIntegrated {
    // @ts-ignore
    return !x.src;
}

export type NoteTypeData = NoteTypeDataExternal | NoteTypeDataIntegrated;

export interface CardTypeData {
    name: string;
    /**
     * HTML string with {{placeholders}} in braces to be replaced with field
     * names on the front of the card
    */
    frontTemplate: string;
    /** JavaScript that runs on the front of the card */
    frontScript?: string;
    /**
     * HTML string with {{placeholders}} in braces to be replaced with field
     * names on the back of the card
    */
    backTemplate: string;
    /** JavaScript that runs on the back of the card */
    backScript?: string;
    schedulingSettings?: Partial<CardSchedulingSettingsData>; //* not used in code yet
}

export interface NoteData extends Array<any> {
    /** Type of note */
    0: number;
    /** Fields */
    1: string[];
    /** Card data */
    2?: Optional<(Optional<CardData>)[]>;
    /** Tags */
    3?: Optional<string[]>;
}

export interface CardDataBasic extends Array<any> {
    /** State */
    0: CardState,
    /** Flags */
    1: Optional<CardFlag[]>
}

export interface CardDataActivated extends CardDataBasic {
    0: CardState.active | CardState.inactive;
    /** Due date in minutes ( [Date#getTime() / 60_000] )*/
    2: number;
    /** Interval in minutes */
    3: number;
    /** Times wrong history (0 for correct) */
    4?: Optional<number[]>; //* not used in code yet
    /** Current learning interval */
    5?: Optional<number>;
}

export function isCardActivated(card: CardData): card is CardDataActivated {
    return card[0] !== CardState.new;
}

export type CardData = CardDataBasic | CardDataActivated;

export interface CardSchedulingSettingsData {
    skipCardIfIsNewButAnsweredCorrectly: boolean;
    learningStepsMinutes: number[];
    initialInterval: number;
    baseIntervalMultiplier: number;
}

export enum CardState {
    inactive = 0,
    active = 1,
    new = 2
}

export enum CardFlag {
    /** Just after showing or after 'forgetting' a card */
    learn = 1,
    /** No longer in short-term reviews */
    graduated = 2,
    /** New, but can't be shown */
    suspended = 3
}

export type Optional<T> = T | undefined | null;

/**
 * Tests if value is 0, undefined or null
 */
export function isEmptyValue<T>(x: T | undefined | null): x is undefined | null {
    return x === undefined || x === null;
}
