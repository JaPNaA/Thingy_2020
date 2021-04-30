/* eslint-disable */

import { TrackableObject } from "./common.js";
import { ServerConnection } from "./server.js";
import { MainInterface } from "./ui.js";

/** @type {ServerConnection} */
let server = null;

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
// window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

new MainInterface().elm.appendTo(document.body);
