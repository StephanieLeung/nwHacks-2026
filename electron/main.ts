import { app, BrowserWindow, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { exec } from 'node:child_process'
import path from 'node:path'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

let repoPath = ""
// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: true
    },
    frame: false,
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

async function registerListeners () {
  /**
   * This comes from bridge integration, check bridge.ts
   */
  ipcMain.on('message', (_, message) => {
    console.log(message)
  })

  ipcMain.handle('git:run', async (_event, command: string) => {
    return new Promise((resolve, reject) => {
      // run git with cwd set to repoPath
      exec(`git ${command}`, { cwd: repoPath }, (err, stdout, stderr) => {
          console.log(`Running git ${command} in ${repoPath}`);
          if (stdout) console.log('stdout:', stdout);
          if (stderr) console.log('stderr:', stderr);

          if (err) {
            reject(stderr || err.message)
          } else {
            resolve(stdout)
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
  
          const commits = stdout
            .split("\n")
            .map((line) => {
              const [hash, parents, author, date, message] = line.split("|");
              return {
                hash,
                parents: parents ? parents.split(" ") : [],
                author,
                date,
                message,
              };
            });
  
          resolve(commits);
        }
      );
    });
  });
  

  ipcMain.handle('path:set', async (_event, path: string) => {
    return new Promise((resolve) => {
      repoPath = path
      console.log(`repoPath set to ${repoPath}`)
      resolve(repoPath)
    });
  });
}


app.whenReady()
  .then(() => {
    createWindow();
    return registerListeners();
  })
  .catch(e => console.error(e));