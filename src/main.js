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

  for (const value of [["muted", false], ["area", true], ["alwaysOnTop", false], ["autoSwitchWave", true], ["minimumTriggeredStation", 2]].filter(v => !Object.keys(settings).includes(v[0])))
    win.webContents.executeJavaScript(`localStorage.setItem("${value[0]}","${value[1]}")`);

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
        },
        { type: "separator" },
        {
          label   : "震波顯示器",
          type    : "submenu",
          submenu : [
            {
              label   : "自動切換",
              type    : "checkbox",
              checked : settings.autoSwitchWave == "true",
              click   : (item) => {
                win.webContents.executeJavaScript(`localStorage.setItem("autoSwitchWave",${item.checked})`);
              }
            },
            {
              label   : "最小觸發測站",
              type    : "submenu",
              submenu : [
                {
                  label   : "1",
                  type    : "radio",
                  checked : settings.minimumTriggeredStation == "1",
                  click   : () => {
                    win.webContents.executeJavaScript("localStorage.setItem(\"minimumTriggeredStation\",1)");
                  }
                },
                {
                  label    : "2 （預設）",
                  sublabel : "",
                  type     : "radio",
                  checked  : settings.minimumTriggeredStation == "2",
                  click    : () => {
                    win.webContents.executeJavaScript("localStorage.setItem(\"minimumTriggeredStation\",2)");
                  }
                },
                {
                  label   : "3",
                  type    : "radio",
                  checked : settings.minimumTriggeredStation == "3",
                  click   : () => {
                    win.webContents.executeJavaScript("localStorage.setItem(\"minimumTriggeredStation\",3)");
                  }
                },
                {
                  label   : "4",
                  type    : "radio",
                  checked : settings.minimumTriggeredStation == "4",
                  click   : () => {
                    win.webContents.executeJavaScript("localStorage.setItem(\"minimumTriggeredStation\",4)");
                  }
                },
                {
                  label   : "5",
                  type    : "radio",
                  checked : settings.minimumTriggeredStation == "5",
                  click   : () => {
                    win.webContents.executeJavaScript("localStorage.setItem(\"minimumTriggeredStation\",5)");
                  }
                },
                {
                  label   : "6",
                  type    : "radio",
                  checked : settings.minimumTriggeredStation == "6",
                  click   : () => {
                    win.webContents.executeJavaScript("localStorage.setItem(\"minimumTriggeredStation\",6)");
                  }
                },
                {
                  label   : "7",
                  type    : "radio",
                  checked : settings.minimumTriggeredStation == "7",
                  click   : () => {
                    win.webContents.executeJavaScript("localStorage.setItem(\"minimumTriggeredStation\",7)");
                  }
                }
              ]
            },
          ]
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