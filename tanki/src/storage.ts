import { DeckData } from "./dataTypes";
import { Deck } from "./logic";

const localStoragePrefix = "tanki-";
const deckDataPath = "./deckData.json";

const fs = window.require?.("fs");

const anchorElement = document.createElement("a");

function resolveLinkAsFile(href: string) {
    anchorElement.href = "file:///" + href;
    return anchorElement.href;
}

export function writeOut(deck: Deck) {
    const exportStr = deck.data.toJSON();

    if (fs) {
        fs.writeFileSync(deckDataPath, exportStr);
    } else {
        localStorage[localStoragePrefix + resolveLinkAsFile(deckDataPath)]
            = exportStr;
    }
}

export function readIn(): DeckData {
    let readStr;

    if (fs) {
        readStr = fs.readFileSync(deckDataPath).toString();
    } else {
        readStr = localStorage[localStoragePrefix + resolveLinkAsFile(deckDataPath)];
    }

    return JSON.parse(readStr);
}
