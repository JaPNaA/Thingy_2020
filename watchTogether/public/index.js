/* eslint-disable */

import { ServerConnection } from "./server.js";
import { MainInterface, networkTrigger, userTriggers } from "./ui.js";

/** @type {ServerConnection} */
let server;

userTriggers.selectRoom.addHandler(roomCode => {
    if (server) { server.disconnect(); }

    const newServer = new ServerConnection(roomCode);
    server = newServer;

    newServer.onPermissionChange.addHandler(perm =>
        networkTrigger.permissionUpdate.dispatch(perm));
});

new MainInterface().elm.appendTo(document.body);

export function getServer() {
    if (!server) { throw new Error("No server"); }
    return server;
}
