const { BrowserWindow, app, session, ipcMain, Menu } = require("electron");
const http = require("http");
const os = require("os");

function createWindow() {
    const window = new BrowserWindow({
        width: 612,
        height: 706,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true
        },
        titleBarStyle: "hidden"
    });

    ipcMain.on("openDevTools", () => window.webContents.openDevTools());
    ipcMain.on("openContextMenu", () => Menu.getApplicationMenu().popup());

    ipcMain.on("get:httpServerAllowed", e => {
        e.sender.send("get:httpServerAllowed", true);
        console.log("check http server allowed");
    });

    /** @type {http.Server} */
    let server;

    ipcMain.on("server:serve", (e, data) => {
        if (server) { server.close(); }

        server = http.createServer((req, res) => {
            if (req.url === "/export") {
                res.writeHead(200, {
                    "content-type": "application/json; charset=utf-8"
                });
                res.end(data);
            } else {
                res.writeHead(404);
                res.end();
            }
        }).listen(18403);

        e.sender.send("server:log", "Serving on port 18403.");

        const accessibleAddresses = [];
        const networkInterfaces = os.networkInterfaces();

        for (const networkName in networkInterfaces) {
            for (const address of networkInterfaces[networkName]) {
                if (!address.internal && address.family === "IPv4") {
                    accessibleAddresses.push(address.address);
                }
            }
        }

        e.sender.send("server:log", "Accessible through " + accessibleAddresses.join(", or "));
    });

    ipcMain.on("server:stop", e => {
        if (server) {
            server.close();
            server = undefined;
        }
    });

    window.removeMenu();
    window.loadFile("web/index.html");
}

function cleanUp() {
    session.defaultSession.clearStorageData();
    session.defaultSession.clearCache();
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
    cleanUp();
    app.quit();
});
