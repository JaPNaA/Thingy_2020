/* eslint-disable */

import { EventHandlers, TrackableObject } from "./common.js";

class Server {
    constructor() {
        this.socket = new WebSocket("ws://localhost:3000");

        this.socket.addEventListener("open", () => {
            // send room code
            this.socket.send("test");
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

const server = new Server();

function onYouTubeIframeAPIReady() {
    let lastPlayerState = null;
    /** @type {TrackableObject<VideoStateData>} */ // @ts-ignore
    const playerState = new TrackableObject({
        timestamp: 0,
        videoId: "",
        playing: false,
        ended: false,
        position: 0,
        playbackRate: 1
    });

    const player = new YT.Player("player", {
        height: "360",
        width: "640",
        videoId: "4wufensBsds",
        origin: location.protocol + "//www.youtube-nocookie.com",
        events: {
            onReady: () => player.playVideo(),
            onStateChange: event => {
                server.sendVideoPositionChange(player.getCurrentTime());

                // if (event.data === YT.PlayerState.PLAYING && !done) {
                //     setTimeout(() => player.stopVideo(), 6000);
                //     done = true;
                // }
            }
        }
    });

    server.onPositionChange.addHandler(data => {
        if (data.position) {
            player.seekTo(data.position);
        }
    });

    console.log(player);
}

// @ts-ignore
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
