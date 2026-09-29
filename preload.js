const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("missappCloner", {
  listRepositories: () => ipcRenderer.invoke("repos:list"),
  cloneRepository: repo => ipcRenderer.invoke("repo:clone", repo),
  openFolder: folder => ipcRenderer.invoke("repo:open-folder", folder),
  onCloneProgress(callback) {
    if (typeof callback !== "function") return () => {};
    const listener = (_event, progress) => callback(progress);
    ipcRenderer.on("clone:progress", listener);
    return () => ipcRenderer.removeListener("clone:progress", listener);
  }
});
