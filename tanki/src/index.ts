import { Deck } from "./logic.js";
import { readIn } from "./storage.js";
import { TankiInterface } from "./userInterface.js";


async function main() {
    let deckData = readIn();

    if (!deckData) {
        deckData = await fetch("../resources/initialDeckData.json").then(e => e.json());
    }

    if (!deckData) { throw new Error("Could not load deckData"); }

    const deck = new Deck(deckData);

    console.log(deck);

    const tankiInterface = new TankiInterface(deck);
    tankiInterface.appendTo(document.body);
}

main();
