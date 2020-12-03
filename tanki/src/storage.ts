import { DeckData } from "./dataTypes";
import { Deck } from "./logic";

const deckDataPath = "./deckData.json";

const fs = require("fs");

export function writeOut(deck: Deck) {
    const exportStr = deck.data.toJSON();
    fs.writeFileSync(deckDataPath, exportStr);
}

export function readIn(): DeckData {
    const deckData = JSON.parse(fs.readFileSync(deckDataPath).toString());
    return deckData;
}
