const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  getAppVersion: () => ipcRenderer.invoke('app-version'),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  printToPDF: (title) => ipcRenderer.invoke('print-to-pdf', title),
  platform: process.platform
});
