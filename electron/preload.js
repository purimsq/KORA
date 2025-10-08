const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  getAppVersion: () => ipcRenderer.invoke('app-version'),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  platform: process.platform
});
