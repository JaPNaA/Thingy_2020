import { Deck } from "./logic.js";
import { TankiInterface } from "./userInterface.js";

const fs = require("fs");

async function main() {
    const deckDataPath = "./deckData.json";
    const deckData = JSON.parse(fs.readFileSync(deckDataPath).toString());
    const deck = new Deck(deckData);

    document.getElementById("writeOut")?.addEventListener("click", function () {
        const exportStr = deck.data.toJSON();
        fs.writeFileSync(deckDataPath, exportStr);
    });

    console.log(deck);

    const tankiInterface = new TankiInterface(deck);
    tankiInterface.appendTo(document.body);
}

main();
