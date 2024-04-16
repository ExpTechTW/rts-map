export interface ipcMethods {
  minimizeWindow: () => void,
  closeWindow: () => void,
}

declare global {
  interface Window {
    ipcRenderer: ipcMethods;
  }
}