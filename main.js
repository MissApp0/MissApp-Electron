const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const ALLOWED_OWNER = "MissApp0";
const API_URL = "https://api.github.com/orgs/MissApp0/repos?per_page=100&sort=updated";

function createWindow() {
  const win = new BrowserWindow({
    width: 980, height: 720, minWidth: 760, minHeight: 560,
    title: "MissApp GitHub Cloner", backgroundColor: "#081216", autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  win.loadFile(path.join(__dirname, "cloner.html"));
}

function validateRepo(repo) {
  if (!repo || repo.owner !== ALLOWED_OWNER || typeof repo.name !== "string") throw new Error("Only MissApp0 repositories can be cloned.");
  if (!/^[A-Za-z0-9._-]+$/.test(repo.name)) throw new Error("Invalid repository name.");
  return { name: repo.name, fullName: ALLOWED_OWNER + "/" + repo.name, cloneUrl: "https://github.com/" + ALLOWED_OWNER + "/" + repo.name + ".git" };
}

function getCloneRoot() { return path.join(app.getPath("documents"), "MissApp", "Repositories"); }

async function listRepositories() {
  const response = await fetch(API_URL, { headers: { Accept: "application/vnd.github+json", "User-Agent": "MissApp-GitHub-Cloner" } });
  if (!response.ok) throw new Error("GitHub returned HTTP " + response.status + ".");
  const repos = await response.json();
  return repos.filter(r => r.owner?.login === ALLOWED_OWNER && !r.archived).map(r => ({
    owner:r.owner.login,name:r.name,fullName:r.full_name,description:r.description||"No description",
    defaultBranch:r.default_branch||"main",updatedAt:r.updated_at,private:Boolean(r.private)
  })).sort((a,b)=>a.name.localeCompare(b.name));
}

function runGitClone(repo,destination,sendProgress) {
  return new Promise((resolve,reject)=>{
    const git=spawn("git",["clone","--progress",repo.cloneUrl,destination],{windowsHide:true});
    let errorText="";
    git.stderr.on("data",chunk=>{const line=chunk.toString().trim();if(line){errorText+=line+"\n";sendProgress(line)}});
    git.on("error",e=>reject(new Error(e.code==="ENOENT"?"Git is not installed or is not available on PATH.":e.message)));
    git.on("close",code=>code===0?resolve():reject(new Error(errorText.trim()||"git clone exited with code "+code)));
  });
}

ipcMain.handle("repos:list",()=>listRepositories());

ipcMain.handle("repo:clone",async(event,input)=>{
  const repo=validateRepo(input);
  const root=getCloneRoot();
  await fs.promises.mkdir(root,{recursive:true});
  const destination=path.join(root,repo.name);
  if(fs.existsSync(destination))return{ok:false,exists:true,path:destination,message:"This repository is already cloned."};
  await runGitClone(repo,destination,message=>event.sender.send("clone:progress",{repo:repo.name,message}));
  return{ok:true,exists:false,path:destination,message:repo.fullName+" cloned successfully."};
});

ipcMain.handle("repo:open-folder",async(_event,folderPath)=>{
  if(typeof folderPath!=="string"||!folderPath)throw new Error("Invalid folder.");
  const root=path.resolve(getCloneRoot()),target=path.resolve(folderPath);
  if(target!==root&&!target.startsWith(root+path.sep))throw new Error("Folder is outside the MissApp repository directory.");
  if(!fs.existsSync(target))throw new Error("Repository folder does not exist.");
  const result=await shell.openPath(target);
  if(result)throw new Error(result);
  return true;
});

app.whenReady().then(()=>{
  createWindow();
  app.on("activate",()=>{if(BrowserWindow.getAllWindows().length===0)createWindow()});
});
app.on("window-all-closed",()=>{if(process.platform!=="darwin")app.quit()});
