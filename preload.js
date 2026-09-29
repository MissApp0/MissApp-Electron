const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("missappDesktop", {
  checkMain: () => ipcRenderer.invoke("main:check"),
  updateMain: () => ipcRenderer.invoke("main:update"),
  openMain: () => ipcRenderer.invoke("main:open"),
  removeMain: () => ipcRenderer.invoke("main:remove"),
  uninstall: () => ipcRenderer.invoke("app:uninstall"),
  notify: payload => ipcRenderer.invoke("desktop:notify", payload),
  showIncomingCall: info => ipcRenderer.send("desktop:incoming-call", info),
  closeCallWindow: () => ipcRenderer.send("desktop:close-call-window"),
  onCallAction(callback) {
    if (typeof callback !== "function") return () => {};
    const listener = (_event, action) => callback(action);
    ipcRenderer.on("desktop:call-action", listener);
    return () => ipcRenderer.removeListener("desktop:call-action", listener);
  },
  callAction: action => ipcRenderer.send("desktop:call-action", action),\n  onCallActive(callback) { if (typeof callback !== "function") return () => {}; const listener = () => callback(); ipcRenderer.on("call:active", listener); return () => ipcRenderer.removeListener("call:active", listener); },\n  onCallInfo(callback) {
    if (typeof callback !== "function") return () => {};
    const listener = (_event, info) => callback(info);
    ipcRenderer.on("call:info", listener);
    return () => ipcRenderer.removeListener("call:info", listener);
  },
  onProgress(callback) {
    if (typeof callback !== "function") return () => {};
    const listener = (_event, progress) => callback(progress);
    ipcRenderer.on("main:progress", listener);
    return () => ipcRenderer.removeListener("main:progress", listener);
  }
});
