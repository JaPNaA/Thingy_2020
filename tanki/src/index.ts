import { Deck } from "./logic.js";
import { readIn } from "./storage.js";
import { TankiInterface } from "./userInterface.js";


async function main() {
    const deckData = readIn();
    const deck = new Deck(deckData);

    console.log(deck);

    const tankiInterface = new TankiInterface(deck);
    tankiInterface.appendTo(document.body);
}

main();
