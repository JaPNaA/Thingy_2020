import { EventHandlers } from "./common.js";

export class ServerConnection {
    /** @param {String} roomCode */
    constructor(roomCode) {
        this.socket = new WebSocket("ws://localhost:3000");

        this.socket.addEventListener("open", () => {
            // send room code
            this.socket.send(roomCode);
        });

        this.socket.addEventListener("message", e => {
            /** @type {string} */
            const dataStr = e.data.toString();
            const colonIndex = dataStr.indexOf(":");
            const command = dataStr.slice(0, colonIndex);
            const data = dataStr.slice(colonIndex + 1);
            this._commandHandler(command, data);
        });

        /** @type {EventHandlers<Partial<VideoStateData>>} */
        this.onPositionChange = new EventHandlers();
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
            stateUpdate: () => this.onPositionChange.dispatch(JSON.parse(data))
        }[command];
        if (fn) {
            fn.call(this, data);
        } else {
            console.warn("Unknown command", command);
        }
    }
}
