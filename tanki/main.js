const { BrowserWindow, app, session } = require("electron");

function createWindow() {
    const window = new BrowserWindow({
        width: 800,
        height: 500,
        webPreferences: {
            nodeIntegration: true,
            enableRemoteModule: true
        },
        // titleBarStyle: "hidden"
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
