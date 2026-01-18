import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { exec, execFile } from "node:child_process";
import path from "node:path";
createRequire(import.meta.url);
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
let repoPath = "";
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs"),
      nodeIntegration: true
    },
    frame: false
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
async function registerListeners() {
  ipcMain.on("message", (_, message) => {
    console.log(message);
  });
  ipcMain.handle("git:getHistory", async () => {
    return new Promise((resolve, reject) => {
      if (!repoPath) return reject("repoPath not set");
      execFile(
        "git",
        ["rev-parse", "--is-inside-work-tree"],
        { cwd: repoPath },
        (err, stdout) => {
          if (err || stdout.trim() !== "true") {
            return reject("Not a git repository at repoPath");
          }
          execFile(
            "git",
            ["log", "--all", "--parents", "--date-order", "--pretty=format:%H|%P|%D|%s"],
            { cwd: repoPath },
            (err2, stdout2, stderr) => {
              if (err2) return reject(stderr || err2.message);
              resolve(stdout2);
            }
          );
        }
      );
    });
  });
  ipcMain.handle("git:run", async (_event, command) => {
    return new Promise((resolve, reject) => {
      exec(`git ${command}`, { cwd: repoPath }, (err, stdout, stderr) => {
        if (err) reject(stderr || err.message);
        else resolve(stdout);
      });
    });
  });
  ipcMain.handle("path:set", async (_event, path2) => {
    return new Promise((resolve) => {
      repoPath = path2;
      console.log(`repoPath set to ${repoPath}`);
      resolve(repoPath);
    });
  });
  ipcMain.handle("window:minimize", () => win == null ? void 0 : win.minimize());
  ipcMain.handle("window:close", () => win == null ? void 0 : win.close());
  ipcMain.handle("path:select", async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ["openDirectory"]
      });
      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }
      repoPath = result.filePaths[0];
      console.log(`repoPath set to ${repoPath} via dialog`);
      return repoPath;
    } catch (err) {
      console.error("Error selecting path:", err);
      throw err;
    }
  });
  ipcMain.handle("git:startup", async () => {
    return new Promise((resolve, reject) => {
      exec("git status", { cwd: repoPath }, (err, stdout) => {
        const status = err ? "error" : stdout;
        exec(
          `git log -5 --pretty=format:"%h|%p|%an|%ar|%s"`,
          { cwd: repoPath },
          (err2, logs) => {
            if (err2) {
              reject(err2);
            } else {
              resolve({ status, logs });
            }
          }
        );
      });
    });
  });
}
app.whenReady().then(() => {
  createWindow();
  return registerListeners();
}).catch((e) => console.error(e));
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
