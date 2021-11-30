import { EventHandlers, TrackableObject } from "./common.js";
import { Component, Elm } from "./elements.js";
import { getServer } from "./index.js";
import { ServerConnection } from "./server.js";

let isReady = false;
const readyHandlers = new EventHandlers();

export class YouTubeIFrame extends Component {
    /** @type {ServerConnection} */
    constructor() {
        super("YouTubeIFrame");
        // appendTo document.body as workaround for YouTube's API
        this.playerElm = new Elm().attribute("id", "player").appendTo(document.body);
        this.server = getServer();

        if (!isReady) { throw new Error("YouTube API not ready"); }

        this.lastPlayerState = null;
        this.lastPlayerPosition = 0;
        this.firstSyncDone = false;

        /** @type {TrackableObject<VideoStateData>} */ // @ts-ignore
        this.playerState = new TrackableObject({
            timestamp: 0,
            videoId: "",
            playing: false,
            ended: false,
            position: 0,
            playbackRate: 1
        });

        this.playerReady = false;
        this.player = new YT.Player("player", {
            height: "360",
            width: "640",
            videoId: "",
            playerVars: { rel: 0 },
            events: {
                onReady: () => {
                    this.playerReady = true;
                    this._updatePlayerState(this.playerState.getCurrObj());
                },
                onStateChange: event => {
                    if (!this.firstSyncDone) { return; }
                    const playerState = this.player.getPlayerState();
                    this.lastPlayerPosition = this.player.getCurrentTime();

                    if (this.lastPlayerState === playerState) {
                        this.server.sendVideoPositionChange(this.player.getCurrentTime());
                    } else if (playerState === YT.PlayerState.PLAYING) {
                        this.server.sendVideoStart(this.player.getCurrentTime());
                    } else {
                        this.server.sendVideoPause(this.player.getCurrentTime());
                    }

                    this.lastPlayerState = playerState;
                }
            }
        });

        // No events are fired from API even if the player position changes, so
        // we check for position changes ourselves.
        this.intervalUpdateId = setInterval(() => {
            if (!this.playerReady) { return; }
            if (this.lastPlayerState === YT.PlayerState.PLAYING) { return; }
            const playerPos = this.player.getCurrentTime();
            if (this.lastPlayerPosition != playerPos) {
                this.server.sendVideoPositionChange(playerPos);
            }
            this.lastPlayerPosition = playerPos;
        }, 100);

        this.server.onPositionChange.addHandler(data => {
            this.playerState.writeOverIfPossible(data);

            if (!this.playerReady) { return; }
            const dirt = this.playerState.extractDirtInObject();

            this._updatePlayerState(dirt);
            this.playerState.clean();
        });

        this.elm.append(this.playerElm);
    }

    /** @param {string} videoId */
    setVideoId(videoId) {
        this.player.loadVideoById(videoId);
        this.server.sendVideoId(videoId);
    }

    /** @param {Partial<VideoStateData>} dirt */
    async _updatePlayerState(dirt) {
        if (dirt.videoId) {
            this.player.loadVideoById(dirt.videoId);
            await wait(300);
        }

        if (dirt.position) {
            this.player.seekTo(dirt.position);
        }

        if (dirt.playing === true) {
            this.player.playVideo();
        } else if (dirt.playing === false) {
            this.player.pauseVideo();
        }

        if (dirt.playbackRate) {
            this.player.setPlaybackRate(dirt.playbackRate);
        }

        this.firstSyncDone = true;
    }
}

/** @param {() => void} handler */
function onYoutubeIframeAPIReady(handler) {
    if (isReady) {
        handler();
    } else {
        readyHandlers.addHandler(handler);
    }
}

function onYouTubeIframeAPIReady() {
    isReady = true;
    readyHandlers.dispatch();
}

/** @param {number} ms */
function wait(ms) {
    return new Promise(res => setTimeout(() => res(), ms));
}

// @ts-ignore
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
