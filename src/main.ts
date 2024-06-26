import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';

if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    maximizable: false,
    backgroundMaterial: "acrylic",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  mainWindow.on("maximize", () => {
    mainWindow.webContents.send("win:maximize");
  });

  mainWindow.on("unmaximize", () => {
    mainWindow.webContents.send("win:unmaximize");
  });

  ipcMain.on("win:minimize", () => {
    mainWindow.minimize();
  });

  ipcMain.on("win:maximize", () => {
    mainWindow.maximize();
  });

  ipcMain.on("win:unmaximize", () => {
    mainWindow.unmaximize();
  });

  ipcMain.on("win:close", () => {
    mainWindow.close();
  });

  ipcMain.on("win:disable_background_throttle", () => {
    mainWindow.webContents.setBackgroundThrottling(false);
  });

  ipcMain.on("win:enable_background_throttle", () => {
    mainWindow.webContents.setBackgroundThrottling(true);
  });
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});