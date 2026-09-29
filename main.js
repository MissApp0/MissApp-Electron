const { app, BrowserWindow, dialog, shell, session } = require("electron");
const path = require("path");
const { autoUpdater } = require("electron-updater");

const MISSAPP_URL = "https://missapp0.github.io";
let mainWindow = null;
let updateCheckStarted = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 620,
    backgroundColor: "#071014",
    show: false,
    autoHideMenuBar: true,
    title: "MissApp",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true
    }
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith(MISSAPP_URL)) {
      event.preventDefault();
      if (/^https?:/i.test(url)) shell.openExternal(url);
    }
  });

  mainWindow.loadURL(MISSAPP_URL);
}

function configureSecurity() {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const headers = { ...details.responseHeaders };
    delete headers["Content-Security-Policy"];
    callback({ responseHeaders: headers });
  });
}

function setupUpdater() {
  if (updateCheckStarted || !app.isPackaged) return;
  updateCheckStarted = true;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowDowngrade = false;

  autoUpdater.on("checking-for-update", () => {
    mainWindow?.webContents.send("missapp:update-status", {
      state: "checking"
    });
  });

  autoUpdater.on("update-available", (info) => {
    mainWindow?.webContents.send("missapp:update-status", {
      state: "available",
      version: info.version
    });
  });

  autoUpdater.on("download-progress", (progress) => {
    mainWindow?.webContents.send("missapp:update-status", {
      state: "downloading",
      percent: Math.round(progress.percent)
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    mainWindow?.webContents.send("missapp:update-status", {
      state: "ready",
      version: info.version
    });

    dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "MissApp update ready",
      message: `MissApp ${info.version} is ready to install.`,
      detail: "Restart MissApp to finish updating.",
      buttons: ["Restart and update", "Later"],
      defaultId: 0
    }).then(({ response }) => {
      if (response === 0) autoUpdater.quitAndInstall(false, true);
    });
  });

  autoUpdater.on("error", (error) => {
    mainWindow?.webContents.send("missapp:update-status", {
      state: "error",
      message: error?.message || "Update failed"
    });
  });

  autoUpdater.checkForUpdates().catch(() => {});
}

app.whenReady().then(() => {
  configureSecurity();
  createWindow();

  setTimeout(setupUpdater, 4000);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
