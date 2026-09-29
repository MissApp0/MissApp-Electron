const { app, BrowserWindow, ipcMain, shell, Notification } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

const MISSAPP_URL = "https://missapp0.github.io/";
const SESSION_PARTITION = "persist:missapp";

let mainWindow = null;
let callWindow = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1180,
    height: 820,
    minWidth: 850,
    minHeight: 600,
    title: "MissApp",
    backgroundColor: "#081216",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      partition: SESSION_PARTITION
    }
  });

  mainWindow = win;
  win.loadURL(MISSAPP_URL);

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://missapp0.github.io/")) return { action: "allow" };
    shell.openExternal(url);
    return { action: "deny" };
  });

  win.on("closed", () => {
    if (mainWindow === win) mainWindow = null;
  });
}

function createCallWindow(info = {}) {
  if (callWindow && !callWindow.isDestroyed()) {
    callWindow.show();
    callWindow.focus();
    callWindow.setAlwaysOnTop(true, "floating");
    return;
  }

  callWindow = new BrowserWindow({
    width: 360,
    height: 430,
    minWidth: 320,
    minHeight: 360,
    title: info.title || "MissApp Call",
    alwaysOnTop: true,
    backgroundColor: "#081216",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  callWindow.setAlwaysOnTop(true, "floating");
  callWindow.loadFile(path.join(__dirname, "call.html"));
  callWindow.webContents.once("did-finish-load", () => {
    callWindow.webContents.send("call:info", info);
  });
  callWindow.on("closed", () => {
    callWindow = null;
  });
}

ipcMain.handle("app:uninstall", async () => {
  if (process.platform !== "win32") {
    throw new Error("The Windows uninstaller is only available in the Windows installer build.");
  }

  const candidates = [
    path.join(path.dirname(process.execPath), "Uninstall MissApp GitHub Cloner.exe"),
    path.join(path.dirname(process.execPath), "Uninstall MissApp.exe")
  ];
  const uninstaller = candidates.find(p => require("fs").existsSync(p));

  if (!uninstaller) {
    throw new Error("This copy was not installed with the Windows installer. Use the installer build to uninstall the app.");
  }

  const child = spawn(uninstaller, [], {
    detached: true,
    stdio: "ignore",
    windowsHide: true
  });
  child.unref();
  return { ok: true, message: "Uninstaller started." };
});

ipcMain.on("desktop:incoming-call", (_event, info) => {
  createCallWindow(info);
});

ipcMain.on("desktop:close-call-window", () => {
  if (callWindow && !callWindow.isDestroyed()) callWindow.close();
});

ipcMain.on("desktop:call-action", (_event, action) => {
  if (action?.type === "accept" && callWindow && !callWindow.isDestroyed()) {
    callWindow.webContents.send("call:active");
  }
  if (action?.type !== "accept" && callWindow && !callWindow.isDestroyed()) {
    callWindow.close();
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("desktop:call-action", action);
    mainWindow.show();
    mainWindow.focus();
  }
});

ipcMain.handle("desktop:notify", (_event, payload = {}) => {
  if (!Notification.isSupported()) return false;
  const notification = new Notification({
    title: payload.title || "MissApp",
    body: payload.body || "New message"
  });
  notification.on("click", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
  notification.show();
  return true;
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
