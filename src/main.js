const { app, BrowserWindow, Tray, Menu, nativeTheme } = require("electron");
const { dirname } = require("path");
const path = require("path");

let tray;

/**
 * @type {BrowserWindow}
 */
let win;

const createWindow = () => {
  win = new BrowserWindow({
    width           : 800,
    height          : 560,
    resizable       : false,
    autoHideMenuBar : true,
    frame           : false,
    icon            : path.resolve(__dirname, "app.ico"),
    webPreferences  : {
      contextIsolation : false,
      nodeIntegration  : true
    },
  });

  win.loadFile(path.resolve(__dirname, "views", "index.html"));
};

app.whenReady().then(async () => {
  createWindow();

  let settings = await win.webContents.executeJavaScript("({...localStorage})");

  for (const key of ["muted", "area", "alwaysOnTop"].filter(v => !Object.keys(settings).includes(v)))
    win.webContents.executeJavaScript(`localStorage.setItem("${key}",${key == "area"})`);

  settings = await win.webContents.executeJavaScript("({...localStorage})");

  win.setAlwaysOnTop(settings.alwaysOnTop == "true");

  tray = new Tray(path.resolve(__dirname, "app.ico"));
  tray.on("click", () => win.isVisible() ? win.hide() : win.show());
  const contextMenu = Menu.buildFromTemplate([
    {
      label   : "rts-map v0.0.6",
      type    : "normal",
      icon    : path.resolve(__dirname, `./resources/images/${nativeTheme.shouldUseDarkColors ? "" : "dark/"}wave.png`),
      enabled : false
    },
    {
      label   : "設定",
      type    : "submenu",
      icon    : path.resolve(__dirname, `./resources/images/${nativeTheme.shouldUseDarkColors ? "" : "dark/"}settingsTemplate.png`),
      submenu : [
        {
          label   : "靜音",
          type    : "checkbox",
          checked : settings.muted == "true",
          click   : (item) => {
            win.webContents.executeJavaScript(`localStorage.setItem("muted",${item.checked})`);
          }
        },
        {
          label   : "檢知框框",
          type    : "checkbox",
          checked : settings.area == "true",
          click   : (item) => {
            win.webContents.executeJavaScript(`localStorage.setItem("area",${item.checked})`);
          }
        },
        {
          label   : "最上層顯示",
          type    : "checkbox",
          checked : settings.alwaysOnTop == "true",
          click   : (item) => {
            win.webContents.executeJavaScript(`localStorage.setItem("alwaysOnTop",${item.checked})`);
            win.setAlwaysOnTop(item.checked);
          }
        }
      ]
    },
    { type: "separator" },
    { label: "重新整理", type: "normal", role: "reload", icon: path.resolve(__dirname, `./resources/images/${nativeTheme.shouldUseDarkColors ? "" : "dark/"}reloadTemplate.png`), click: () => win.reload() },
    { label: "隱藏視窗", type: "normal", role: "hide", icon: path.resolve(__dirname, `./resources/images/${nativeTheme.shouldUseDarkColors ? "" : "dark/"}hideTemplate.png`), click: () => win.hide() },
    { label: "離開", type: "normal", icon: path.resolve(__dirname, `./resources/images/${nativeTheme.shouldUseDarkColors ? "" : "dark/"}closeTemplate.png`), role: "quit" }
  ]);
  tray.setContextMenu(contextMenu);
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});