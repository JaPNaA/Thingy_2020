/* eslint-disable */

import { ServerConnection } from "./server.js";
import { MainInterface, triggers } from "./ui.js";
import { createYoutubeIframe, onYoutubeIframeAPIReady } from "./youtubeIframeAPI.js";

/** @type {ServerConnection} */
let prevServer;

triggers.selectRoom.addHandler(roomCode => {
    if (prevServer) { prevServer.disconnect(); }

    const server = new ServerConnection(roomCode);
    prevServer = server;

    onYoutubeIframeAPIReady(() => {
        createYoutubeIframe(server);
    });
});

new MainInterface().elm.appendTo(document.body);
