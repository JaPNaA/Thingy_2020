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
    const tankiInterface = new TankiInterface(deck);
    tankiInterface.appendTo(document.body);

    // nice for debugging
    const g: any = global;
    g.deck = deck;
    g.tankiInterface = tankiInterface;
}

main();
