import { app, BrowserWindow, Menu } from 'electron';
import * as path from 'path';
import { startServer } from './server';

let mainWindow: BrowserWindow | null = null;
const SERVER_PORT = 19321;

function createWindow() {
  Menu.setApplicationMenu(null);

  mainWindow = new BrowserWindow({
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

app.whenReady().then(async () => {
  await startServer(SERVER_PORT);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
