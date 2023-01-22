const { app, BrowserWindow } = require("electron");
const path = require("path");

const createWindow = () => {
  const win = new BrowserWindow({
    width           : 420,
    height          : 560,
    resizable       : false,
    autoHideMenuBar : true,
    titleBarOverlay : true,
    titleBarStyle   : "default",
    frame           : false,
    webPreferences  : {
      contextIsolation : false,
      nodeIntegration  : true,
      devTools         : true
    },
  });

  win.webContents.openDevTools({ mode: "detach" });

  win.loadFile(path.resolve(__dirname, "views", "index.html"));
};

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});