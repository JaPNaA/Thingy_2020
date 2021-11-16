import { EventHandlers } from "./common.js";
import { Component, Elm, InputElm } from "./elements.js";
import { YouTubeIFrame } from "./youtubeIframeAPI.js";

export const triggers = {
    /** @type {EventHandlers<string>} */
    selectRoom: new EventHandlers()
};

export class MainInterface extends Component {
    constructor() {
        super("mainInterface");

        this.roomSelectElm = new RoomsSelect();

        this.elm.append(this.roomSelectElm);

        triggers.selectRoom.addHandler(() => {
            this.roomSelectElm.elm.remove();
            this.elm.append(new RoomPlayer());
        });
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

class RoomPlayer extends Component {
    constructor() {
        super("roomPlayer");
        this.elm.append(
            "Video ID: ",
            this.videoIDElm = new InputElm().on("change", () => {
                this.iframe.setVideoId(this.videoIDElm.getValue())
            }),
            this.iframe = new YouTubeIFrame()
        );
    }
}
