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
            videoId: "QH2-TGUlwu4",
            playerVars: { rel: 0 },
            events: {
                onReady: () => {
                    this.playerReady = true;
                    this._updatePlayerState(this.playerState.getCurrObj());
                },
                onStateChange: event => {
                    const playerState = this.player.getPlayerState();

                    if (this.lastPlayerState === playerState) {
                        this.server.sendVideoPositionChange(this.player.getCurrentTime());
                    } else if (playerState === YT.PlayerState.PLAYING) {
                        this.server.sendVideoStart(this.player.getCurrentTime());
                    } else {
                        this.server.sendVideoPause(this.player.getCurrentTime());
                    }
                }
            }
        });;

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
    _updatePlayerState(dirt) {
        if (dirt.position) {
            this.player.seekTo(dirt.position);
        }

        if (dirt.playing === true) {
            if (this.player.getPlayerState() !== YT.PlayerState.PLAYING) {
                this.player.playVideo();
            }
        } else if (dirt.playing === false) {
            if (this.player.getPlayerState() === YT.PlayerState.PLAYING) {
                this.player.pauseVideo();
            }
        }

        if (dirt.playbackRate) {
            this.player.setPlaybackRate(dirt.playbackRate);
        }

        if (dirt.videoId) {
            this.player.loadVideoById(dirt.videoId);
        }
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

// @ts-ignore
window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
