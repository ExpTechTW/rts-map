const { app, BrowserWindow, Tray, Menu, nativeTheme, dialog, ipcMain } = require("electron");
require("@electron/remote/main").initialize();
const path = require("path");

// #region Enums

/**
 * Theme Modess
 * @enum {string} AppThemeMode
 * @readonly
 */
const AppThemeMode = Object.freeze({
  Light  : "light",
  Dark   : "dark",
  System : "system"
});

/**
 * Chart Y-Axis Scaling
 * @enum {string} ChartScale
 * @readonly
 */
const ChartYScale = Object.freeze({
  Maximum : "0",
  Normal  : "2",
  Minimum : "20"
});

// #endregion

/**
 * @type {Tray}
 * */
let tray;

/**
 * @type {BrowserWindow}
 * */
let win;

const createWindow = () => {
  win = new BrowserWindow({
    width              : 800,
    height             : 560,
    resizable          : false,
    maximizable        : false,
    fullscreenable     : false,
    autoHideMenuBar    : true,
    icon               : path.resolve(__dirname, "app.ico"),
    show               : false,
    titleBarOverlay    : false,
    titleBarStyle      : "hidden",
    backgroundMaterial : "acrylic",
    webPreferences     : {
      contextIsolation     : false,
      nodeIntegration      : true,
      backgroundThrottling : false,
    },
  });

  require("@electron/remote/main").enable(win.webContents);

  win.loadFile(path.resolve(__dirname, "views", "index.html"));

  win.webContents.once("dom-ready", () => {
    win.show();
  });
};

const setTrayMenu = (settings) => {
  const relaunchOption = {};

  relaunchOption.args = process.argv.slice(1).concat(["--relaunch"]);
  relaunchOption.execPath = process.execPath;

  if (app.isPackaged && process.env.PORTABLE_EXECUTABLE_FILE != undefined)
    relaunchOption.execPath = process.env.PORTABLE_EXECUTABLE_FILE;

  const relaunch = async () => {
    await dialog.showMessageBox(win, { title: "需要重新啟動", type: "info", message: "程式將會重新啟動以套用這項設定。" });
    app.relaunch(relaunchOption);
    app.quit();
  };

  const contextMenu = Menu.buildFromTemplate([
    {
      label   : `rts-map v${app.getVersion()}`,
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
            settings.muted = `${item.checked}`;
          }
        },
        {
          label   : "檢知框框",
          type    : "checkbox",
          checked : settings.area == "true",
          click   : (item) => {
            win.webContents.executeJavaScript(`localStorage.setItem("area",${item.checked})`);
            settings.area = `${item.checked}`;
          }
        },
        {
          label   : "最上層顯示",
          type    : "checkbox",
          checked : settings.alwaysOnTop == "true",
          click   : (item) => {
            win.webContents.executeJavaScript(`localStorage.setItem("alwaysOnTop","${item.checked}")`);
            win.setAlwaysOnTop(item.checked);
            settings.alwaysOnTop = `${item.checked}`;
          }
        },
        {
          label   : "背景節流",
          type    : "checkbox",
          checked : settings.backgroundThrottling == "true",
          click   : (item) => {
            win.webContents.executeJavaScript(`localStorage.setItem("backgroundThrottling","${item.checked}")`);
            win.webContents.setBackgroundThrottling(item.checked);
            settings.backgroundThrottling = `${item.checked}`;
          }
        },
        {
          label   : "主題",
          type    : "submenu",
          submenu : [
            {
              label   : "淺色",
              type    : "radio",
              checked : settings.themeMode == AppThemeMode.Light,
              click() {
                win.webContents.executeJavaScript(`localStorage.setItem("themeMode","${AppThemeMode.Light}")`);
                nativeTheme.themeSource = AppThemeMode.Light;
                settings.themeMode = AppThemeMode.Light;
              }
            },
            {
              label   : "深色",
              type    : "radio",
              checked : settings.themeMode == AppThemeMode.Dark,
              click() {
                win.webContents.executeJavaScript(`localStorage.setItem("themeMode","${AppThemeMode.Dark}")`);
                nativeTheme.themeSource = AppThemeMode.Dark;
                settings.themeMode = AppThemeMode.Dark;
              }
            },
            {
              label   : "使用系統設定",
              type    : "radio",
              checked : settings.themeMode == AppThemeMode.System,
              click() {
                win.webContents.executeJavaScript(`localStorage.setItem("themeMode","${AppThemeMode.System}")`);
                nativeTheme.themeSource = AppThemeMode.System;
                settings.themeMode = AppThemeMode.System;
              }
            },
            { type: "separator" },
            {
              label   : "Win11 視窗效果",
              type    : "checkbox",
              checked : settings.fluentWindow == "true",
              click   : (item) => {
                win.webContents.executeJavaScript(`localStorage.setItem("fluentWindow","${item.checked}")`);
                win.webContents.send("CONFIG:fluentWindow", item.checked);
                settings.fluentWindow = `${item.checked}`;
                win.setBackgroundMaterial(item.checked ? "acrylic" : "none");
              }
            },
          ]
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
                settings.autoSwitchWave = `${item.checked}`;
              }
            },
            {
              label   : "縱軸縮放",
              type    : "submenu",
              submenu : [
                {
                  label   : "最大",
                  type    : "radio",
                  checked : settings.chartYScale == ChartYScale.Maximum,
                  click() {
                    win.webContents.executeJavaScript(`localStorage.setItem("chartYScale","${ChartYScale.Maximum}")`);
                    settings.chartScale = ChartYScale.Maximum;
                  }
                },
                {
                  label   : "一般",
                  type    : "radio",
                  checked : settings.chartYScale == ChartYScale.Normal,
                  click() {
                    win.webContents.executeJavaScript(`localStorage.setItem("chartYScale","${ChartYScale.Normal}")`);
                    settings.chartScale = ChartYScale.Normal;
                  }
                },
                {
                  label   : "最小",
                  type    : "radio",
                  checked : settings.chartYScale == ChartYScale.Minimum,
                  click() {
                    win.webContents.executeJavaScript(`localStorage.setItem("chartYScale","${ChartYScale.Minimum}")`);
                    settings.chartScale = ChartYScale.Minimum;
                  }
                }
              ]
            },
            {
              label   : "顯示測站數量",
              type    : "submenu",
              submenu : [
                {
                  label   : "0 （關閉）",
                  type    : "radio",
                  checked : settings.displayWaveCount == "0",
                  click   : () => {
                    win.webContents.executeJavaScript("localStorage.setItem(\"displayWaveCount\",0)").then(relaunch);
                    settings.displayWaveCount = "0";
                  }
                },
                {
                  label   : "1",
                  type    : "radio",
                  checked : settings.displayWaveCount == "1",
                  click   : () => {
                    win.webContents.executeJavaScript("localStorage.setItem(\"displayWaveCount\",1)").then(relaunch);
                    settings.displayWaveCount = "1";
                  }
                },
                {
                  label   : "2",
                  type    : "radio",
                  checked : settings.displayWaveCount == "2",
                  click   : () => {
                    win.webContents.executeJavaScript("localStorage.setItem(\"displayWaveCount\",2)").then(relaunch);
                    settings.displayWaveCount = "2";
                  }
                },
                {
                  label   : "3",
                  type    : "radio",
                  checked : settings.displayWaveCount == "3",
                  click   : () => {
                    win.webContents.executeJavaScript("localStorage.setItem(\"displayWaveCount\",3)").then(relaunch);
                    settings.displayWaveCount = "3";
                  }
                },
                {
                  label   : "4",
                  type    : "radio",
                  checked : settings.displayWaveCount == "4",
                  click   : () => {
                    win.webContents.executeJavaScript("localStorage.setItem(\"displayWaveCount\",4)").then(relaunch);
                    settings.displayWaveCount = "4";
                  }
                },
                {
                  label    : "5",
                  sublabel : "",
                  type     : "radio",
                  checked  : settings.displayWaveCount == "5",
                  click    : () => {
                    win.webContents.executeJavaScript("localStorage.setItem(\"displayWaveCount\",5)").then(relaunch);
                    settings.displayWaveCount = "5";
                  }
                },
                {
                  label   : "6 （預設）",
                  type    : "radio",
                  checked : settings.displayWaveCount == "6",
                  click   : () => {
                    win.webContents.executeJavaScript("localStorage.setItem(\"displayWaveCount\",6)").then(relaunch);
                    settings.displayWaveCount = "6";
                  }
                },
                {
                  label   : "7",
                  type    : "radio",
                  checked : settings.displayWaveCount == "7",
                  click   : () => {
                    win.webContents.executeJavaScript("localStorage.setItem(\"displayWaveCount\",7)").then(relaunch);
                    settings.displayWaveCount = "7";
                  }
                },
                {
                  label   : "8",
                  type    : "radio",
                  checked : settings.displayWaveCount == "8",
                  click   : () => {
                    win.webContents.executeJavaScript("localStorage.setItem(\"displayWaveCount\",8)").then(relaunch);
                    settings.displayWaveCount = "8";
                  }
                }
              ]
            },
            {
              label   : "最小觸發測站數",
              type    : "submenu",
              submenu : [
                {
                  label   : "1",
                  type    : "radio",
                  checked : settings.minimumTriggeredStation == "1",
                  enabled : +settings.displayWaveCount >= 1,
                  click   : () => {
                    win.webContents.executeJavaScript("localStorage.setItem(\"minimumTriggeredStation\",1)");
                    settings.minimumTriggeredStation = "1";
                  }
                },
                {
                  label   : "2 （預設）",
                  type    : "radio",
                  checked : settings.minimumTriggeredStation == "2",
                  enabled : +settings.displayWaveCount >= 2,
                  click   : () => {
                    win.webContents.executeJavaScript("localStorage.setItem(\"minimumTriggeredStation\",2)");
                    settings.minimumTriggeredStation = "2";
                  }
                },
                {
                  label   : "3",
                  type    : "radio",
                  checked : settings.minimumTriggeredStation == "3",
                  enabled : +settings.displayWaveCount >= 3,
                  click   : () => {
                    win.webContents.executeJavaScript("localStorage.setItem(\"minimumTriggeredStation\",3)");
                    settings.minimumTriggeredStation = "3";
                  }
                },
                {
                  label   : "4",
                  type    : "radio",
                  checked : settings.minimumTriggeredStation == "4",
                  enabled : +settings.displayWaveCount >= 4,
                  click   : () => {
                    win.webContents.executeJavaScript("localStorage.setItem(\"minimumTriggeredStation\",4)");
                    settings.minimumTriggeredStation = "4";
                  }
                },
                {
                  label   : "5",
                  type    : "radio",
                  checked : settings.minimumTriggeredStation == "5",
                  enabled : +settings.displayWaveCount >= 5,
                  click   : () => {
                    win.webContents.executeJavaScript("localStorage.setItem(\"minimumTriggeredStation\",5)");
                    settings.minimumTriggeredStation = "5";
                  }
                },
                {
                  label   : "6",
                  type    : "radio",
                  checked : settings.minimumTriggeredStation == "6",
                  enabled : +settings.displayWaveCount >= 6,
                  click   : () => {
                    win.webContents.executeJavaScript("localStorage.setItem(\"minimumTriggeredStation\",6)");
                    settings.minimumTriggeredStation = "6";
                  }
                },
                {
                  label   : "7",
                  type    : "radio",
                  checked : settings.minimumTriggeredStation == "7",
                  enabled : +settings.displayWaveCount >= 7,
                  click   : () => {
                    win.webContents.executeJavaScript("localStorage.setItem(\"minimumTriggeredStation\",7)");
                    settings.minimumTriggeredStation = "7";
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
};

if (!app.requestSingleInstanceLock()) process.exit(0);

app.whenReady().then(async () => {
  createWindow();

  let settings = await win.webContents.executeJavaScript("({...localStorage})");

  for (const value of [
    ["muted", false],
    ["area", true],
    ["alwaysOnTop", false],
    ["backgroundThrottling", true],
    ["themeMode", AppThemeMode.System],
    ["displayWaveCount", 6],
    ["chartYScale", ChartYScale.Minimum],
    ["autoSwitchWave", true],
    ["minimumTriggeredStation", 2],
    ["fluentWindow", true],
  ].filter(v => !Object.keys(settings).includes(v[0])))
    win.webContents.executeJavaScript(`localStorage.setItem("${value[0]}","${value[1]}")`);

  if (settings.displayWaveCount == 0)
    win.webContents.executeJavaScript("localStorage.setItem(\"minimumTriggeredStation\",\"2\")");
  else if (+settings.displayWaveCount < +settings.minimumTriggeredStation)
    win.webContents.executeJavaScript(`localStorage.setItem("minimumTriggeredStation","${settings.displayWaveCount}")`);

  settings = await win.webContents.executeJavaScript("({...localStorage})");

  nativeTheme.themeSource = settings.themeMode;
  win.webContents.setBackgroundThrottling(settings.backgroundThrottling == "true");
  win.setBackgroundMaterial(settings.fluentWindow == "true" ? "acrylic" : "none");
  win.setAlwaysOnTop(settings.alwaysOnTop == "true");

  tray = new Tray(path.resolve(__dirname, "app.ico"));
  tray.on("click", () => win.isVisible() ? win.hide() : win.show());

  setTrayMenu(settings);

  nativeTheme.on("updated", () => setTrayMenu(settings));

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("second-instance", () => {
  win.show();
  win.flashFrame(true);
});

app.on("before-quit", () => {
  tray.destroy();
  win.destroy();
  tray = null;
  win = null;
});

ipcMain.on("SET:aot", (e, state) => {
  win.setAlwaysOnTop(state);
});

ipcMain.on("SET:fw", (e, state) => {
  win.setBackgroundMaterial(state ? "acrylic" : "none");
  win.webContents.send("CONFIG:fluentWindow", state);
});

ipcMain.on("SET:bt", (e, state) => {
  win.webContents.setBackgroundThrottling(state);
});

ipcMain.on("UPDATE:tray", async () => {
  setTrayMenu(await win.webContents.executeJavaScript("({...localStorage})"));
});