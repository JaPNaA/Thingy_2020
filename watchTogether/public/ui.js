import { EventHandlers } from "./common.js";
import { Component, InputElm } from "./elements.js";

export const triggers = {
    /** @type {EventHandlers<string>} */
    selectRoom: new EventHandlers()
};

export class MainInterface extends Component {
    constructor() {
        super("mainInterface");

        this.elm.append(new RoomsSelect());
    }
}

class RoomsSelect extends Component {
    constructor() {
        super("roomsSelect");

        this.elm.append(
            "Enter room code: ",
            this.roomCodeInput = new InputElm()
        );

        this.roomCodeInput.on("change", () => {
            triggers.selectRoom.dispatch(this.roomCodeInput.getValue());
        });
    }
}
