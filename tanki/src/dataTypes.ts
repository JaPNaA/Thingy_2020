export interface DeckData {
    version: string;
    noteTypes: NoteTypeData[];
    notes: NoteData[];
    schedulingSettings: CardSchedulingSettingsData;
}

export interface NoteTypeDataExternal {
    name: string;
    src: string;
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
}

interface CardDataStandard extends Array<any> {
    /** State */
    0: CardState;
    /** Interval in minutes */
    1: number;
    /** Difficulty factor */
    2: number;
    /** Due date in minutes ( [Date#getTime() / 60_000] )*/
    3: number;
    /** Times wrong history (0 for correct) */
    4: Optional<number[]>; //* not used in code yet
}

interface CardDataLearning extends CardDataStandard {
    /** State */
    0: CardState.learn;
    /** Current learning interval */
    5: number; //* not used in code yet
}

export function isCardLearning(card: CardData): card is CardDataLearning {
    return card[0] === CardState.learn;
}

export type CardData = CardDataStandard | CardDataLearning;

export interface CardSchedulingSettingsData {
    skipCardIfIsNewButAnsweredCorrectly: boolean;
    learningStepsMinutes: number[];
    initialInterval: number;
    baseIntervalMultiplier: number;
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

type Optional<T> = T | 0 | undefined | null;

/**
 * Tests if value is 0, undefined or null
 */
export function isEmptyValue<T>(x: T | undefined | null | 0): x is undefined | null | 0 {
    return x === undefined || x === null || x === 0;
}
