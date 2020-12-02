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
    script?: string;
    style?: string;
}

export function isNoteTypeDataIntegrated(x: NoteTypeData): x is NoteTypeDataIntegrated {
    // @ts-ignore
    return !x.src;
}

export type NoteTypeData = NoteTypeDataExternal | NoteTypeDataIntegrated;

export interface CardTypeData {
    name: string;
    frontTemplate: string;
    frontScript?: string;
    backTemplate: string;
    backScript?: string;
    schedulingSettings?: Partial<CardSchedulingSettingsData>; //* not used in code yet
}

export interface NoteData extends Array<any> {
    /** Type of note */
    0: number;
    /** Fields */
    1: string[];
    /** Card data */
    2?: (CardData | undefined | 0)[] | undefined | 0;
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
    4: number[] | undefined | 0; //* not used in code yet
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