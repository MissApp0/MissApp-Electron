const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("missappDesktop", {
  isElectron: true,
  platform: process.platform,
  version: process.env.npm_package_version || "1.0.0",
  onUpdateStatus(callback) {
    if (typeof callback !== "function") return () => {};
    const listener = (_event, status) => callback(status);
    ipcRenderer.on("missapp:update-status", listener);
    return () => ipcRenderer.removeListener("missapp:update-status", listener);
  }
});
