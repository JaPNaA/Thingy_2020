const { BrowserWindow, app, session, Menu, ipcMain } = require("electron");

function createWindow() {
    const window = new BrowserWindow({
        width: 800,
        height: 500,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true
        },
        icon: "./tankiIcon.png"
        // titleBarStyle: "hidden"
    });

    ipcMain.on("openContextMenu", function () {
        Menu.getApplicationMenu().popup();
    });

    ipcMain.on("hideMenu", function (event) {
        const window = BrowserWindow.fromWebContents(event.sender);
        window.removeMenu();
    });

    // window.removeMenu();
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
