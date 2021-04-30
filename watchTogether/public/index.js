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
        videoId: "QH2-TGUlwu4",
        playerVars: { rel: 0 },
        events: {
            onReady: () => {
                playerState.setIfPossible("videoId", "QH2-TGUlwu4");
                updatePlayerState(playerState.getCurrObj());
            },
            onStateChange: event => {
                const playerState = player.getPlayerState();

                if (lastPlayerState === playerState) {
                    server.sendVideoPositionChange(player.getCurrentTime());
                } else if (playerState === YT.PlayerState.PLAYING) {
                    server.sendVideoStart(player.getCurrentTime());
                } else {
                    server.sendVideoPause(player.getCurrentTime());
                }
            }
        }
    });

    server.onPositionChange.addHandler(data => {
        playerState.writeOverIfPossible(data);

        const dirt = playerState.extractDirtInObject();

        updatePlayerState(dirt);
        playerState.clean();
    });

    /** @param {Partial<VideoStateData>} dirt */
    function updatePlayerState(dirt) {
        if (dirt.position) {
            player.seekTo(dirt.position);
        }

        if (dirt.playing === true) {
            if (player.getPlayerState() !== YT.PlayerState.PLAYING) {
                player.playVideo();
            }
        } else if (dirt.playing === false) {
            if (player.getPlayerState() === YT.PlayerState.PLAYING) {
                player.pauseVideo();
            }
        }

        if (dirt.playbackRate) {
            player.setPlaybackRate(dirt.playbackRate);
        }

        if (dirt.videoId) {
            player.loadVideoById(dirt.videoId);
        }
    }

    console.log(player);
}

// @ts-ignore
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
