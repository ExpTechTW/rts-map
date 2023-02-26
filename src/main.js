const { app, Tray, Menu, nativeTheme, dialog } = require("electron");
const { MicaBrowserWindow, IS_WINDOWS_11 } = require("mica-electron");
require("@electron/remote/main").initialize();
const path = require("path");

let tray, win;

const createWindow = () => {
  win = new MicaBrowserWindow({
    width           : 800,
    height          : 585,
    resizable       : false,
    autoHideMenuBar : true,
    frame           : false,
    icon            : path.resolve(__dirname, "app.ico"),
    show            : false,
    webPreferences  : {
      contextIsolation     : false,
      nodeIntegration      : true,
      backgroundThrottling : false,
    },
  });

  require("@electron/remote/main").enable(win.webContents);

  win.setAutoTheme();

  if (IS_WINDOWS_11)
    win.setMicaEffect();
  else
    win.setAcrylic();

  win.loadFile(path.resolve(__dirname, "views", "index.html"));

  win.webContents.once("dom-ready", () => {
    win.show();
  });
};

if (!app.requestSingleInstanceLock()) process.exit(0);

app.whenReady().then(async () => {
  createWindow();

  let settings = await win.webContents.executeJavaScript("({...localStorage})");

  for (const value of [["muted", false], ["area", true], ["alwaysOnTop", false], ["autoSwitchWave", true], ["displayWaveCount", 6], ["minimumTriggeredStation", 2]].filter(v => !Object.keys(settings).includes(v[0])))
    win.webContents.executeJavaScript(`localStorage.setItem("${value[0]}","${value[1]}")`);

  if (settings.displayWaveCount == 0)
    win.webContents.executeJavaScript("localStorage.setItem(\"minimumTriggeredStation\",\"2\")");
  else if (+settings.displayWaveCount < +settings.minimumTriggeredStation)
    win.webContents.executeJavaScript(`localStorage.setItem("minimumTriggeredStation","${settings.displayWaveCount}")`);

  settings = await win.webContents.executeJavaScript("({...localStorage})");

  win.setAlwaysOnTop(settings.alwaysOnTop == "true");

  tray = new Tray(path.resolve(__dirname, "app.ico"));
  tray.on("click", () => win.isVisible() ? win.hide() : win.show());

  const relaunchOption = {};
  relaunchOption.args = process.argv.slice(1).concat(["--relaunch"]);
  relaunchOption.execPath = process.execPath;

  if (app.isPackaged && process.env.PORTABLE_EXECUTABLE_FILE != undefined)
    relaunchOption.execPath = process.env.PORTABLE_EXECUTABLE_FILE;

  const callback = async () => {
    await dialog.showMessageBox(win, { title: "需要重新啟動", type: "info", message: "程式將會重新啟動以套用這項設定。" });
    app.relaunch(relaunchOption);
    app.quit();
  };

  const contextMenu = Menu.buildFromTemplate([
    {
      label   : "rts-map v0.0.10",
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
              label   : "顯示測站數量",
              type    : "submenu",
              submenu : [
                {
                  label   : "0 （關閉）",
                  type    : "radio",
                  checked : settings.displayWaveCount == "0",
                  click   : () => {
                    win.webContents.executeJavaScript("localStorage.setItem(\"displayWaveCount\",0)").then(callback);
                  }
                },
                {
                  label   : "1",
                  type    : "radio",
                  checked : settings.displayWaveCount == "1",
                  click   : () => {
                    win.webContents.executeJavaScript("localStorage.setItem(\"displayWaveCount\",1)").then(callback);
                  }
                },
                {
                  label   : "2",
                  type    : "radio",
                  checked : settings.displayWaveCount == "2",
                  click   : () => {
                    win.webContents.executeJavaScript("localStorage.setItem(\"displayWaveCount\",2)").then(callback);
                  }
                },
                {
                  label   : "3",
                  type    : "radio",
                  checked : settings.displayWaveCount == "3",
                  click   : () => {
                    win.webContents.executeJavaScript("localStorage.setItem(\"displayWaveCount\",3)").then(callback);
                  }
                },
                {
                  label   : "4",
                  type    : "radio",
                  checked : settings.displayWaveCount == "4",
                  click   : () => {
                    win.webContents.executeJavaScript("localStorage.setItem(\"displayWaveCount\",4)").then(callback);
                  }
                },
                {
                  label    : "5",
                  sublabel : "",
                  type     : "radio",
                  checked  : settings.displayWaveCount == "5",
                  click    : () => {
                    win.webContents.executeJavaScript("localStorage.setItem(\"displayWaveCount\",5)").then(callback);
                  }
                },
                {
                  label   : "6 （預設）",
                  type    : "radio",
                  checked : settings.displayWaveCount == "6",
                  click   : () => {
                    win.webContents.executeJavaScript("localStorage.setItem(\"displayWaveCount\",6)").then(callback);
                  }
                },
                {
                  label   : "7",
                  type    : "radio",
                  checked : settings.displayWaveCount == "7",
                  click   : () => {
                    win.webContents.executeJavaScript("localStorage.setItem(\"displayWaveCount\",7)").then(callback);
                  }
                },
                {
                  label   : "8",
                  type    : "radio",
                  checked : settings.displayWaveCount == "8",
                  click   : () => {
                    win.webContents.executeJavaScript("localStorage.setItem(\"displayWaveCount\",8)").then(callback);
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
                  }
                },
                {
                  label   : "2 （預設）",
                  type    : "radio",
                  checked : settings.minimumTriggeredStation == "2",
                  enabled : +settings.displayWaveCount >= 2,
                  click   : () => {
                    win.webContents.executeJavaScript("localStorage.setItem(\"minimumTriggeredStation\",2)");
                  }
                },
                {
                  label   : "3",
                  type    : "radio",
                  checked : settings.minimumTriggeredStation == "3",
                  enabled : +settings.displayWaveCount >= 3,
                  click   : () => {
                    win.webContents.executeJavaScript("localStorage.setItem(\"minimumTriggeredStation\",3)");
                  }
                },
                {
                  label   : "4",
                  type    : "radio",
                  checked : settings.minimumTriggeredStation == "4",
                  enabled : +settings.displayWaveCount >= 4,
                  click   : () => {
                    win.webContents.executeJavaScript("localStorage.setItem(\"minimumTriggeredStation\",4)");
                  }
                },
                {
                  label   : "5",
                  type    : "radio",
                  checked : settings.minimumTriggeredStation == "5",
                  enabled : +settings.displayWaveCount >= 5,
                  click   : () => {
                    win.webContents.executeJavaScript("localStorage.setItem(\"minimumTriggeredStation\",5)");
                  }
                },
                {
                  label   : "6",
                  type    : "radio",
                  checked : settings.minimumTriggeredStation == "6",
                  enabled : +settings.displayWaveCount >= 6,
                  click   : () => {
                    win.webContents.executeJavaScript("localStorage.setItem(\"minimumTriggeredStation\",6)");
                  }
                },
                {
                  label   : "7",
                  type    : "radio",
                  checked : settings.minimumTriggeredStation == "7",
                  enabled : +settings.displayWaveCount >= 7,
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
    if (MicaBrowserWindow.getAllWindows().length === 0) createWindow();
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