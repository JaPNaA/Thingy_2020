const { BrowserWindow, app, session, ipcMain, Menu, dialog } = require("electron");
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

    let shouldWarnBeforeClose = false;

    window.on("close", function (e) {
        if (!shouldWarnBeforeClose) { return; }

        const choice = dialog.showMessageBoxSync(this, {
            type: 'question',
            buttons: ['Yes', 'No'],
            title: 'Confirm',
            message: 'Are you sure you want to quit?'
        });

        if (choice === 1) {
            e.preventDefault();
        }
    });

    ipcMain.on("openDevTools", () => window.webContents.openDevTools());
    ipcMain.on("openContextMenu", () => Menu.getApplicationMenu().popup());
    ipcMain.on("set:shouldWarnBeforeClose", (e, data) => shouldWarnBeforeClose = data);

    ipcMain.on("get:httpServerAllowed", e => {
        e.sender.send("get:httpServerAllowed", true);
        console.log("check http server allowed");
    });

    ipcMain.on("get:networkInterfaces", e => {
        const accessibleAddresses = [];
        const networkInterfaces = os.networkInterfaces();

        for (const networkName in networkInterfaces) {
            for (const address of networkInterfaces[networkName]) {
                if (!address.internal && address.family === "IPv4") {
                    accessibleAddresses.push(address.address);
                }
            }
        }

        e.sender.send("get:networkInterfaces", accessibleAddresses);
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
