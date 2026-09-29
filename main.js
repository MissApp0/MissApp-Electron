const { app, BrowserWindow, ipcMain, shell, Notification } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const REPO_OWNER = "MissApp0";
const REPO_NAME = "MissApp0.github.io";
const BRANCH = "main";
const REPO_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}.git`;

let mainWindow = null;
let callWindow = null;

function getMainRoot() {
  return path.join(app.getPath("documents"), "MissApp", "Main");
}

function runGit(args, cwd, sendProgress) {
  return new Promise((resolve, reject) => {
    const git = spawn("git", args, { cwd, windowsHide: true });
    let errorText = "";
    git.stdout.on("data", c => {
      const line = c.toString().trim();
      if (line && sendProgress) sendProgress(line);
    });
    git.stderr.on("data", c => {
      const line = c.toString().trim();
      if (line) {
        errorText += line + "\n";
        if (sendProgress) sendProgress(line);
      }
    });
    git.on("error", e => reject(new Error(
      e.code === "ENOENT" ? "Git is not installed or is not available on PATH." : e.message
    )));
    git.on("close", code => code === 0
      ? resolve()
      : reject(new Error(errorText.trim() || "git exited with code " + code)));
  });
}

async function remoteHead() {
  let out = "";
  await runGit(["ls-remote", REPO_URL, "refs/heads/" + BRANCH], null, line => {
    out += line + "\n";
  });
  const sha = out.trim().split(/\s+/)[0];
  if (!/^[a-f0-9]{40}$/.test(sha)) {
    throw new Error("Could not read the MissApp update version.");
  }
  return sha;
}

async function localHead(dir) {
  let out = "";
  await runGit(["rev-parse", "HEAD"], dir, line => {
    out += line + "\n";
  });
  return out.trim().split(/\s+/)[0];
}

async function ensureMain(sendProgress = () => {}) {
  const root = getMainRoot();
  await fs.promises.mkdir(path.dirname(root), { recursive: true });

  if (!fs.existsSync(path.join(root, ".git"))) {
    sendProgress("Downloading MissApp for the first time…");
    await runGit(["clone", "--depth", "1", "--progress", "--branch", BRANCH, REPO_URL, root], null, sendProgress);
    return { updated: true, firstInstall: true };
  }

  const remote = await remoteHead();
  const local = await localHead(root);

  if (remote === local) {
    return { updated: false, firstInstall: false };
  }

  sendProgress("MissApp has an update. Syncing…");
  await runGit(["fetch", "--depth", "1", "origin", BRANCH], root, sendProgress);
  await runGit(["reset", "--hard", "origin/" + BRANCH], root, sendProgress);
  return { updated: true, firstInstall: false };
}

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
      sandbox: true
    }
  });

  mainWindow = win;
  win.loadURL("https://missapp0.github.io/");
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

ipcMain.handle("main:check", async () => {
  const root = getMainRoot();
  if (!fs.existsSync(path.join(root, ".git"))) {
    return { updateAvailable: true, message: "MissApp is ready for its first download." };
  }

  const remote = await remoteHead();
  const local = await localHead(root);
  return remote === local
    ? { updateAvailable: false, message: "MissApp is up to date." }
    : { updateAvailable: true, message: "A MissApp update is available." };
});

ipcMain.handle("main:update", async event => {
  const send = message => event.sender.send("main:progress", { message });
  const result = await ensureMain(send);
  return {
    ok: true,
    message: result.firstInstall
      ? "MissApp downloaded."
      : result.updated
        ? "MissApp updated."
        : "MissApp is already up to date."
  };
});

ipcMain.handle("main:remove", async () => {
  const root = getMainRoot();
  if (!fs.existsSync(root)) {
    return { ok: true, message: "Local MissApp copy is already removed." };
  }
  await fs.promises.rm(root, { recursive: true, force: true });
  return { ok: true, message: "Local MissApp copy removed." };
});

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
  // Show the UI immediately. GitHub sync must never block Electron startup.
  createWindow();

  // Sync the local copy in the background so slow downloads do not make
  // the desktop window feel frozen or delay the UI.
  ensureMain(message => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("main:progress", { message });
    }
  }).catch(error => {
    console.error("MissApp background sync failed:", error);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("main:progress", {
        message: "MissApp is open. Background sync failed: " + error.message
      });
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
