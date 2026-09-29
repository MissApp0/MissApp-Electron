const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("missappDesktop", {
  checkMain: () => ipcRenderer.invoke("main:check"),
  updateMain: () => ipcRenderer.invoke("main:update"),
  openMain: () => ipcRenderer.invoke("main:open"),
  onProgress(callback) {
    if (typeof callback !== "function") return () => {};
    const listener = (_event, progress) => callback(progress);
    ipcRenderer.on("main:progress", listener);
    return () => ipcRenderer.removeListener("main:progress", listener);
  }
});