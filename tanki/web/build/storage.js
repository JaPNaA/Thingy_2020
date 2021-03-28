var _a;
var localStoragePrefix = "tanki-";
var deckDataPath = "./deckData.json";
var fs = (_a = window.require) === null || _a === void 0 ? void 0 : _a.call(window, "fs");
var anchorElement = document.createElement("a");
function resolveLinkAsFile(href) {
    anchorElement.href = "file:///" + href;
    return anchorElement.href;
}
export function clearData() {
    if (fs) {
        fs.writeFileSync(deckDataPath, "");
    }
    else {
        localStorage[localStoragePrefix + resolveLinkAsFile(deckDataPath)]
            = "";
    }
}
export function writeOut(deck) {
    var exportStr = deck.database.toJSON();
    if (fs) {
        fs.writeFileSync(deckDataPath, exportStr);
    }
    else {
        localStorage[localStoragePrefix + resolveLinkAsFile(deckDataPath)]
            = exportStr;
    }
}
export function readIn() {
    var readStr;
    if (fs) {
        try {
            readStr = fs.readFileSync(deckDataPath).toString();
        }
        catch (err) {
            console.warn(err);
        }
    }
    else {
        readStr = localStorage[localStoragePrefix + resolveLinkAsFile(deckDataPath)];
    }
    if (!readStr) {
        return;
    }
    return JSON.parse(readStr);
}
