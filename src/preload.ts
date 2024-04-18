// See the Electron documentation for details on how to use preload scripts:

import { contextBridge, ipcRenderer } from "electron";

// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
contextBridge.exposeInMainWorld('ipcRenderer', {
  minimizeWindow(): void {
    ipcRenderer.send("win:minimize");
  },
  closeWindow(): void {
    ipcRenderer.send("win:close");
  },
  enableBackgroundThrottle(): void {
    ipcRenderer.send("win:enable_background_throttle");
  },
  disableBackgroundThrottle(): void {
    ipcRenderer.send("win:disable_background_throttle");
  },
});