export var dataTypeVersion = "0.3";
export function isNoteTypeDataIntegrated(x) {
    // @ts-ignore
    return !x.src;
}
export function isCardActivated(card) {
    return card[0] !== CardState.new;
}
export var CardState;
(function (CardState) {
    CardState[CardState["inactive"] = 0] = "inactive";
    CardState[CardState["active"] = 1] = "active";
    CardState[CardState["new"] = 2] = "new";
})(CardState || (CardState = {}));
export var CardFlag;
(function (CardFlag) {
    /** Just after showing or after 'forgetting' a card */
    CardFlag[CardFlag["learn"] = 1] = "learn";
    /** No longer in short-term reviews */
    CardFlag[CardFlag["graduated"] = 2] = "graduated";
    /** New, but can't be shown */
    CardFlag[CardFlag["suspended"] = 3] = "suspended";
})(CardFlag || (CardFlag = {}));
/**
 * Tests if value is 0, undefined or null
 */
export function isEmptyValue(x) {
    return x === undefined || x === null;
}
