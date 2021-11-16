import { EventHandlers } from "./common.js";

export class ServerConnection {
    /** @param {String} roomCode */
    constructor(roomCode) {
        this.socket = new WebSocket(location.origin.replace("http", "ws"));

        this.socket.addEventListener("open", () => {
            // send room code
            this.socket.send(roomCode);
            this.onConnect.dispatch();
        });

        this.socket.addEventListener("message", e => {
            /** @type {string} */
            const dataStr = e.data.toString();
            const colonIndex = dataStr.indexOf(":");
            const command = dataStr.slice(0, colonIndex);
            const data = dataStr.slice(colonIndex + 1);
            this._commandHandler(command, data);
        });

        this.socket.addEventListener("close", e => {
            this.onClose.dispatch();
        });

        this.socket.addEventListener("error", e => {
            this.onError.dispatch(new Error("Failed to connect"));
        });

        /** @type {EventHandlers<Partial<VideoStateData>>} */
        this.onPositionChange = new EventHandlers();
        this.onConnect = new EventHandlers();
        this.onClose = new EventHandlers();

        /** @type {EventHandlers<boolean>} */
        this.onPermissionChange = new EventHandlers();

        /** @type {EventHandlers<Error>} */
        this.onError = new EventHandlers();
    }

    disconnect() {
        this.socket.close();
    }

    /** @param {number} position */
    sendVideoPositionChange(position) {
        this._sendStateUpdate({
            timestamp: Date.now(),
            position: position
        });
    }

    /** @param {number} position */
    sendVideoStart(position) {
        this._sendStateUpdate({
            timestamp: Date.now(),
            position: position,
            playing: true
        });
    }

    /** @param {number} position */
    sendVideoPause(position) {
        this._sendStateUpdate({
            timestamp: Date.now(),
            position: position,
            playing: false
        });
    }

    /** @param {string} id */
    sendVideoId(id) {
        this._sendStateUpdate({
            timestamp: Date.now(),
            videoId: id
        });
    }

    /** @param {Partial<VideoStateData>} stateUpdate */
    _sendStateUpdate(stateUpdate) {
        this.socket.send("stateUpdate:" + JSON.stringify(stateUpdate));
    }

    /**
     * @param {string} command 
     * @param {string} data 
     */
    _commandHandler(command, data) {
        /** @type {(data: string) => void} */
        const fn = {
            stateUpdate: () => this.onPositionChange.dispatch(JSON.parse(data)),
            permissionChange: () => this.onPermissionChange.dispatch(Boolean(data))
        }[command];
        if (fn) {
            fn.call(this, data);
        } else {
            console.warn("Unknown command", command);
        }
    }
}
