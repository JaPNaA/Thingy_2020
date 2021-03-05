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
    const exportStr = deck.database.toJSON();

    if (fs) {
        fs.writeFileSync(deckDataPath, exportStr);
    } else {
        localStorage[localStoragePrefix + resolveLinkAsFile(deckDataPath)]
            = exportStr;
    }
}

export function readIn(): DeckData | undefined {
    let readStr;

    if (fs) {
        try {
            readStr = fs.readFileSync(deckDataPath).toString();
        } catch (err) {
            console.warn(err);
        }
    } else {
        readStr = localStorage[localStoragePrefix + resolveLinkAsFile(deckDataPath)];
    }

    if (!readStr) { return; }

    return JSON.parse(readStr);
}
