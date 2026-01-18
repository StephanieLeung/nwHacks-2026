import { app, BrowserWindow, ipcMain } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { exec } from "node:child_process";
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
  ipcMain.handle("git:run", async (_event, command) => {
    return new Promise((resolve, reject) => {
      exec(
        `git ${command}`,
        { cwd: repoPath },
        (err, stdout, stderr) => {
          console.log(`Running git ${command} in ${repoPath}`);
          if (stdout) console.log("stdout:", stdout);
          if (stderr) console.log("stderr:", stderr);
          if (err) {
            reject(stderr || err.message);
          } else {
            resolve(stdout);
          }
        }
      );
    });
  });
  ipcMain.handle("git:getHistory", () => {
    return new Promise((resolve, reject) => {
      exec(
        `git log --pretty=format:"%h|%p|%an|%ar|%s" --all`,
        { cwd: repoPath },
        (err, stdout) => {
          if (err) return reject(err);
          const commits = stdout.split("\n").map((line) => {
            const [hash, parents, author, date, message] = line.split("|");
            return {
              hash,
              parents: parents ? parents.split(" ") : [],
              author,
              date,
              message
            };
          });
          resolve(commits);
        }
      );
    });
  });
  ipcMain.handle("path:set", async (_event, path2) => {
    return new Promise((resolve) => {
      repoPath = path2;
      console.log(`repoPath set to ${repoPath}`);
      resolve(repoPath);
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
