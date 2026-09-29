const { contextBridge, ipcRenderer } = require("electron");

function createUpdateBanner() {
  if (document.getElementById("missapp-desktop-update")) return;

  const banner = document.createElement("div");
  banner.id = "missapp-desktop-update";
  banner.setAttribute("role", "status");
  banner.style.cssText = [
    "position:fixed",
    "left:50%",
    "bottom:20px",
    "transform:translateX(-50%)",
    "z-index:2147483647",
    "display:none",
    "max-width:min(520px,calc(100vw - 32px))",
    "padding:12px 16px",
    "border-radius:14px",
    "background:#102126",
    "color:#fff",
    "font:600 14px system-ui,sans-serif",
    "box-shadow:0 12px 35px rgba(0,0,0,.28)"
  ].join(";");

  document.documentElement.appendChild(banner);
  return banner;
}

function showUpdateStatus(status) {
  const banner = createUpdateBanner();
  if (!banner) return;

  if (status.state === "available") {
    banner.textContent = `MissApp ${status.version} is available. Downloading update…`;
    banner.style.display = "block";
  } else if (status.state === "downloading") {
    banner.textContent = `Updating MissApp… ${status.percent || 0}%`;
    banner.style.display = "block";
  } else if (status.state === "ready") {
    banner.textContent = `MissApp ${status.version} is ready. Restart the app to finish updating.`;
    banner.style.display = "block";
  } else if (status.state === "error") {
    banner.textContent = "MissApp could not complete the automatic update.";
    banner.style.display = "block";
    setTimeout(() => { banner.style.display = "none"; }, 6000);
  }
}

ipcRenderer.on("missapp:update-status", (_event, status) => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => showUpdateStatus(status), { once: true });
  } else {
    showUpdateStatus(status);
  }
});

contextBridge.exposeInMainWorld("missappDesktop", {
  isElectron: true,
  platform: process.platform,
  onUpdateStatus(callback) {
    if (typeof callback !== "function") return () => {};
    const listener = (_event, status) => callback(status);
    ipcRenderer.on("missapp:update-status", listener);
    return () => ipcRenderer.removeListener("missapp:update-status", listener);
  }
});
