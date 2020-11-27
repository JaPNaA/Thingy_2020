export interface DeckData {
    version: string;
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
    4: number[] | undefined | 0;
}

interface CardDataLearning extends CardDataStandard {
    /** State */
    0: CardState.learn;
    /** Current learning interval */
    5: number;
}

export function isCardLearning(card: CardData): card is CardDataLearning {
    return card[0] === CardState.learn;
}

export type CardData = CardDataStandard | CardDataLearning;

export interface CardSchedulingSettingsData {
    skipCardIfIsNewButAnsweredCorrectly: boolean;
    learningStepsMinutes: number[];
    initialInterval: number;
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