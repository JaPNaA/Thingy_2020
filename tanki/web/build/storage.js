var _a;
var localStoragePrefix = "tanki-";
var deckDataPath = "./deckData.json";
var fs = (_a = window.require) === null || _a === void 0 ? void 0 : _a.call(window, "fs");
var anchorElement = document.createElement("a");
function resolveLinkAsFile(href) {
    anchorElement.href = "file:///" + href;
    return anchorElement.href;
}
export function writeOut(deck) {
    var exportStr = deck.data.toJSON();
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
        readStr = fs.readFileSync(deckDataPath).toString();
    }
    else {
        readStr = localStorage[localStoragePrefix + resolveLinkAsFile(deckDataPath)];
    }
    return JSON.parse(readStr);
}
