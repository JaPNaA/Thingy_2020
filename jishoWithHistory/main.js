const electron = require("electron");
const { BrowserWindow, app } = require("electron");

function createWindow() {
    const window = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        },
        titleBarStyle: "hidden"
    });

    window.removeMenu();
    window.loadFile("web/index.html");
}

app.whenReady().then(createWindow);
