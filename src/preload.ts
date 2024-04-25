/* eslint-disable @typescript-eslint/no-explicit-any */

import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";
import { version } from "../package.json";

contextBridge.exposeInMainWorld('ipcRenderer', {
  onMaximize(callback: (event: IpcRendererEvent) => void): void {
    ipcRenderer.on("win:maximize", callback);
  },
  onUnmaximize(callback: (event: IpcRendererEvent) => void): void {
    ipcRenderer.on("win:unmaximize", callback);
  },
  minimizeWindow(): void {
    ipcRenderer.send("win:minimize");
  },
  maximizeWindow(): void {
    ipcRenderer.send("win:maximize");
  },
  unmaximizeWindow(): void {
    ipcRenderer.send("win:unmaximize");
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

contextBridge.exposeInMainWorld('app', {
  get version(): string {
    return version;
  }
});