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
        this.player = new Elm().attribute("id", "player").appendTo(document.body);

        onYoutubeIframeAPIReady(() => {
            createYoutubeIframe(getServer());
        });

        this.elm.append(this.player);
    }
}


/** @param {ServerConnection} server */
function createYoutubeIframe(server) {
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
