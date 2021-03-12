const { BrowserWindow, app, session, ipcMain, Menu } = require("electron");

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
