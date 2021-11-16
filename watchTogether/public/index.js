/* eslint-disable */

import { ServerConnection } from "./server.js";
import { MainInterface, triggers } from "./ui.js";

/** @type {ServerConnection} */
let server;

triggers.selectRoom.addHandler(roomCode => {
    if (server) { server.disconnect(); }

    const newServer = new ServerConnection(roomCode);
    server = newServer;
});

triggers.changeVideoID.addHandler(videoId => {
    server.sendVideoId(videoId);
});

new MainInterface().elm.appendTo(document.body);

export function getServer() {
    if (!server) { throw new Error("No server"); }
    return server;
}
