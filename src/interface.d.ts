/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ipcMethods {
  onMaximize: (callback: (event: IpcRendererEvent) => void) => void,
  onUnmaximize: (callback: (event: IpcRendererEvent) => void) => void,
  minimizeWindow: () => void,
  maximizeWindow: () => void,
  unmaximizeWindow: () => void,
  closeWindow: () => void,
  enableBackgroundThrottle: () => void,
  disableBackgroundThrottle: () => void,
}

declare global {
  interface Window {
    ipcRenderer: ipcMethods;
    app: {
      version: string;
    };
  }
}