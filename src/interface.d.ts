export interface ipcMethods {
  minimizeWindow: () => void,
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