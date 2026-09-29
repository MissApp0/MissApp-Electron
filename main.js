const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const REPO_OWNER = "MissApp0";
const REPO_NAME = "MissApp0.github.io";
const BRANCH = "main";
const REPO_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}.git`;

function createWindow() {
  const win = new BrowserWindow({
    width: 820, height: 600, minWidth: 650, minHeight: 500,
    title: "MissApp", backgroundColor: "#081216", autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  win.loadFile(path.join(__dirname, "cloner.html"));
}

function getMainRoot() { return path.join(app.getPath("documents"), "MissApp", "Main"); }

function runGit(args, cwd, sendProgress) {
  return new Promise((resolve, reject) => {
    const git = spawn("git", args, { cwd, windowsHide: true });
    let errorText = "";
    git.stdout.on("data", c => { const line=c.toString().trim(); if(line&&sendProgress)sendProgress(line); });
    git.stderr.on("data", c => { const line=c.toString().trim(); if(line){errorText+=line+"\\n";if(sendProgress)sendProgress(line);} });
    git.on("error", e => reject(new Error(e.code==="ENOENT" ? "Git is not installed or is not available on PATH." : e.message)));
    git.on("close", code => code===0 ? resolve() : reject(new Error(errorText.trim() || "git exited with code "+code)));
  });
}

async function remoteHead(dir) {
  let out="";
  await runGit(["ls-remote",REPO_URL,"refs/heads/"+BRANCH],null,line=>{out+=line+"\n"});
  const sha=out.trim().split(/\s+/)[0];
  if(!/^[a-f0-9]{40}$/.test(sha)) throw new Error("Could not read the MissApp update version.");
  return sha;
}

async function localHead(dir) {
  let out="";
  await runGit(["rev-parse","HEAD"],dir,line=>{out+=line+"\n"});
  return out.trim().split(/\s+/)[0];
}

async function ensureMain(sendProgress) {
  const root=getMainRoot();
  await fs.promises.mkdir(path.dirname(root),{recursive:true});
  if(!fs.existsSync(path.join(root,".git"))){
    sendProgress("Downloading MissApp for the first time…");
    await runGit(["clone","--progress","--branch",BRANCH,REPO_URL,root],null,sendProgress);
    return {updated:true,firstInstall:true};
  }
  const remote=await remoteHead(root);
  const local=await localHead(root);
  if(remote===local)return {updated:false,firstInstall:false};
  sendProgress("MissApp has an update. Syncing…");
  await runGit(["fetch","origin",BRANCH],root,sendProgress);
  await runGit(["reset","--hard","origin/"+BRANCH],root,sendProgress);
  return {updated:true,firstInstall:false};
}

ipcMain.handle("main:check",async()=>{
  const root=getMainRoot();
  if(!fs.existsSync(path.join(root,".git"))) return {updateAvailable:true,message:"MissApp is ready for its first download."};
  const remote=await remoteHead(root);
  const local=await localHead(root);
  return remote===local ? {updateAvailable:false,message:"MissApp is up to date."} : {updateAvailable:true,message:"A MissApp update is available."};
});

ipcMain.handle("main:update",async event=>{
  const send=m=>event.sender.send("main:progress",{message:m});
  const r=await ensureMain(send);
  return {ok:true,message:r.firstInstall?"MissApp downloaded.":r.updated?"MissApp updated.":"MissApp is already up to date."};
});

ipcMain.handle("main:open",async()=>{
  const root=getMainRoot();
  const result=await shell.openPath(root);
  if(result)throw new Error(result);
  return {ok:true,message:"Opened the MissApp folder."};
});

app.whenReady().then(()=>{
  createWindow();
  app.on("activate",()=>{if(BrowserWindow.getAllWindows().length===0)createWindow()});
});
app.on("window-all-closed",()=>{if(process.platform!=="darwin")app.quit()});