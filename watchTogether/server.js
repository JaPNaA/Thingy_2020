import { createServer } from "http";
import { server as WSServer } from "websocket";
import { EventHandlers, TrackableObject } from "./public/common.js";
import path from "path";
import fs from "fs";

const PORT = 8080;
const IGNORE_CACHE = true;

/** @type {Map<string, Room>} */
const rooms = new Map();
const publicDirectory = path.join(process.cwd(), "public/");

const mimeByExt = {
    "html": "text/html",
    "js": "application/javascript",
    "css": "text/css"
};

const cache = new Map();

const server = createServer(function (req, res) {
    const filepath = path.join(publicDirectory, path.resolve("/", req.url));

    const cachedFile = cache.get(filepath);
    if (cachedFile && !IGNORE_CACHE) {
        res.writeHead(200, headerOfFilepath(filepath));
        res.end(cachedFile);
        return;
    }


    console.log("read", filepath);

    fs.readFile(filepath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end("404 Not found");
            return;
        }
        cache.set(filepath, data);
        res.writeHead(200, headerOfFilepath(filepath));
        res.end(data);
    });
}).listen(PORT);

/** @param {string} filepath */
function headerOfFilepath(filepath) {
    return {
        "Content-Type": mimeByExt[filepath.slice(filepath.lastIndexOf(".") + 1)] || "text/plain"
    };
}

const wsServer = new WSServer({
    httpServer: server
});

wsServer.addListener("request", function (req) {
    const connection = req.accept();
    connection.addListener("message", roomCodeMessageHandler);

    /** @param {import("websocket").Message} message */
    function roomCodeMessageHandler(message) {
        if (message.type !== "utf8") { return; }
        const room = rooms.get(message.utf8Data);
        if (!room) {
            console.log("closed connection: no room", message.utf8Data);
            connection.close();
            return;
        }

        room.addMember(connection);
        connection.removeListener("message", roomCodeMessageHandler);
    }
});

class Room {
    constructor() {
        /** @type {RoomMember[]} */
        this.members = [];

        /** @type {TrackableObject} */
        this.state = new TrackableObject({
            ended: true,
            playing: false,
            playbackRate: 1,
            position: 0,
            timestamp: Date.now(),
            videoId: ""
        });
    }

    /** @param {import("websocket").connection} connection */
    addMember(connection) {
        console.log("add member");
        const member = new RoomMember(connection);

        member.onDisconnect.addHandler(() => {
            this.removeMember(member);
        });

        member.onStateChange.addHandler(state => this._updateStateWithUpdateData(state, member));

        const index = this.members.push(member);

        if (index === 1) { // first member in room
            member.giveControllerPermission();
            member.giveRoomAdminPermission();
        }
    }

    /** @param {RoomMember} member */
    removeMember(member) {
        console.log("remove member");
        const index = this.members.indexOf(member);
        if (index < 0) { throw new Error("Cannot remove nonexistent member"); }
        this.members.splice(index, 1);
    }

    /**
     * @param {Partial<VideoStateData>} update
     * @param {RoomMember} sendingMember
     */
    _updateStateWithUpdateData(update, sendingMember) {
        if (update.timestamp === undefined || typeof update.timestamp !== "number") {
            console.warn("Received message without or with invalid timestamp");
            return;
        }

        this.state.writeOverIfPossible(update);
        this._broadcastStateUpdateExceptTo(sendingMember);
    }

    /** @param {RoomMember} exceptionMember */
    _broadcastStateUpdateExceptTo(exceptionMember) {
        const dirt = this.state.extractDirtInObject();
        const commandStr = "stateUpdate:" + JSON.stringify(dirt);

        for (const member of this.members) {
            console.log("m");
            if (member === exceptionMember) { continue; }
            member.send(commandStr);
        }
    }
}

class RoomMember {
    /** @param {import("websocket").connection} connection */
    constructor(connection) {
        this._connection = connection;
        /** Does member have access to controlling the video */
        this._isController = false;
        /** Does member have access to controlling who the controller is? */
        this._isRoomAdmin = false;

        this.onDisconnect = new EventHandlers();
        /** @type {EventHandlers<Partial<VideoStateData>>} */
        this.onStateChange = new EventHandlers();

        this._addConnectionEventHandlers();
    }

    giveRoomAdminPermission() {
        this._isRoomAdmin = true;
    }

    giveControllerPermission() {
        this._isController = true;
        this.send("permissionChange:1");
    }

    /** @param {string} data */
    send(data) {
        this._connection.send(data);
    }

    _addConnectionEventHandlers() {
        this._connection.addListener("message", event => {
            if (event.type !== "utf8") { return; }
            const firstColonIndex = event.utf8Data.indexOf(":");
            let command = event.utf8Data.slice(0, firstColonIndex);
            let data = event.utf8Data.slice(firstColonIndex + 1);

            this._commandHandler(command, data);
        });

        this._connection.addListener("close", event => {
            this.onDisconnect.dispatch();
        });
    }

    /**
     * @param {string} command 
     * @param {string} data 
     */
    _commandHandler(command, data) {
        /** @type { (data: string) => void } */
        const fn = {
            stateUpdate: this._stateUpdateCommand
        }[command];
        if (!fn) { console.warn("Received invalid command", command); }
        fn.call(this, data);
    }

    /**
     * @param {string} dataStr 
     */
    _stateUpdateCommand(dataStr) {
        if (!this._isController) { return; }

        let data;

        try {
            data = JSON.parse(dataStr);
        } catch (err) {
            console.warn("Failed to parse '" + dataStr + "'");
        }

        console.log(data);

        this.onStateChange.dispatch(data);
    }
}

rooms.set("test", new Room());
