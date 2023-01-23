const { app, BrowserWindow } = require("electron");
const path = require("path");

const createWindow = () => {
  const win = new BrowserWindow({
    width           : 400,
    height          : 560,
    resizable       : false,
    autoHideMenuBar : true,
    frame           : false,
    webPreferences  : {
      contextIsolation : false,
      nodeIntegration  : true
    },
  });

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