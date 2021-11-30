import { EventHandlers } from "./common.js";
import { Component, Elm, InputElm } from "./elements.js";
import { YouTubeIFrame } from "./youtubeIframeAPI.js";

export const userTriggers = {
    /** @type {EventHandlers<string>} */
    selectRoom: new EventHandlers()
};

export const networkTrigger = {
    /** @type {EventHandlers<boolean>} */
    permissionUpdate: new EventHandlers()
};

let hasControllerPermissions = false;

networkTrigger.permissionUpdate.addHandler(permission => {
    hasControllerPermissions = permission;
});

export class MainInterface extends Component {
    constructor() {
        super("mainInterface");

        this.roomSelectElm = new RoomsSelect();

        this.elm.append(this.roomSelectElm);

        userTriggers.selectRoom.addHandler(() => {
            this.roomSelectElm.elm.remove();
            this.elm.append(new RoomView());
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
            userTriggers.selectRoom.dispatch(this.roomCodeInput.getValue());
        });
    }
}

class RoomView extends Component {
    constructor() {
        super("roomPlayer");
        this.elm.append(
            "Video ID: ",
            this.videoIDElm = new InputElm().on("change", () => {
                this.iframe.setVideoId(this.videoIDElm.getValue())
            }),
            this.iframe = new YouTubeIFrame()
        );

        networkTrigger.permissionUpdate.addHandler(() => this._onPermissionsUpdate());
        this._onPermissionsUpdate();
    }

    _onPermissionsUpdate() {
        console.log(hasControllerPermissions);
        if (hasControllerPermissions) {
            this.videoIDElm.removeAttribute("disabled");
        } else {
            this.videoIDElm.attribute("disabled");
        }
    }
}
