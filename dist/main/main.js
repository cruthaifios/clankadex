"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const server_1 = require("./server");
let mainWindow = null;
const SERVER_PORT = 19321;
function createWindow() {
    electron_1.Menu.setApplicationMenu(null);
    mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        backgroundColor: '#1a1a2e',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        title: 'Clankadex',
    });
    mainWindow.loadURL(`http://localhost:${SERVER_PORT}`);
    mainWindow.on('closed', () => { mainWindow = null; });
}
electron_1.app.whenReady().then(async () => {
    await (0, server_1.startServer)(SERVER_PORT);
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
