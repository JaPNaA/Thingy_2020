export function isNoteTypeDataIntegrated(x) {
    // @ts-ignore
    return !x.src;
}
export function isCardLearning(card) {
    return card[0] === CardState.learn;
}
export var CardState;
(function (CardState) {
    /** Not yet shown */
    CardState[CardState["new"] = 0] = "new";
    /** Just after showing or after 'forgetting' a card */
    CardState[CardState["learn"] = 1] = "learn";
    /** Passing 'learn' */
    CardState[CardState["seen"] = 2] = "seen";
    /** No longer in short-term reviews */
    CardState[CardState["graduated"] = 3] = "graduated";
})(CardState || (CardState = {}));
/**
 * Tests if value is 0, undefined or null
 */
export function isEmptyValue(x) {
    return x === undefined || x === null || x === 0;
}
