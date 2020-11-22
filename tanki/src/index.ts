import { Deck } from "./logic.js";
import { CardPresenter } from "./userInterface.js";
import { promptUser, wait } from "./utils.js";

const fs = require("fs");

async function main() {
    const deckDataPath = "./deckData.json";
    const deckData = JSON.parse(fs.readFileSync(deckDataPath).toString());
    const deck = new Deck(deckData);

    document.body.appendChild(deck.elm);

    document.getElementById("createNote")?.addEventListener("click", async function () {
        const type = parseInt(await promptUser("Type:"));
        const f1 = await promptUser("Field 1:");
        const f2 = await promptUser("Field 2:");
        deck.addNote([type, [f1, f2], []]);
    });

    document.getElementById("writeOut")?.addEventListener("click", function () {
        const exportStr = deck.exportToString();
        fs.writeFileSync(deckDataPath, exportStr);
    });

    console.log(deck);

    const cardPresenter = new CardPresenter();
    cardPresenter.setNoteTypes(deck.getNoteTypes());
    document.body.appendChild(cardPresenter.elm);

    while (true) {
        const card = deck.selectCard();
        console.log(card);
        if (card) {
            const result = await cardPresenter.presentCard(card);
            deck.applyResultToCard(card, result);
        } else {
            await wait(1000);
        }

        // await deck.showCard();
        // if (deck.minutesToNextCard && deck.minutesToNextCard > 0) {
        //     console.log(deck.minutesToNextCard);
        //     await wait(deck.minutesToNextCard * 60e3);
        // }
    }
}

main();
