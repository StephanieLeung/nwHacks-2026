import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { exec, execFile } from 'node:child_process'
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


    ipcMain.handle('git:getHistory', async () => {
    return new Promise((resolve, reject) => {
      if (!repoPath) return reject('repoPath not set')
      execFile('git',
        ['rev-parse', '--is-inside-work-tree'],
        { cwd: repoPath },
        (err, stdout) => {
          if (err || stdout.trim() !== 'true') {
            return reject('Not a git repository at repoPath')
          }

          execFile(
            'git',
            ['log', '--all', '--parents', '--date-order', '--pretty=format:%H|%P|%D|%s'],
            { cwd: repoPath },
            (err, stdout, stderr) => {
              if (err) return reject(stderr || err.message)
              resolve(stdout)
            }
          )
        }
      )
    })
  })

ipcMain.handle('git:run', async (_event, command: string): Promise<string> => {
  const gitCommand = `git ${command}`

  return new Promise((resolve) => {
    exec(gitCommand, { cwd: repoPath }, (err, stdout, stderr) => {
      if (err) {
        console.error(`Error executing git command: ${stderr || err.message}`)
      } else {
        console.log(`Git command output: ${stdout}`)
      }

      resolve(gitCommand)
    })
  })
})


  ipcMain.handle('path:set', async (_event, path: string) => {
    return new Promise((resolve) => {
      repoPath = path
      console.log(`repoPath set to ${repoPath}`)
      resolve(repoPath)
    });
  });

  ipcMain.handle('window:minimize', () => win?.minimize());
  ipcMain.handle('window:close', () => win?.close());
  ipcMain.handle('path:select', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
      });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      repoPath = result.filePaths[0];
      console.log(`repoPath set to ${repoPath} via dialog`);
      return repoPath;
    } catch (err) {
      console.error('Error selecting path:', err);
      throw err;
    }
  });

  ipcMain.handle('git:startup', async () => {
    return new Promise((resolve, reject) => {
      // Get git status
      exec('git status', { cwd: repoPath }, (err, stdout) => {
        const status = err ? 'error' : stdout

        // Get git log -5
        exec(
          `git log -5 --pretty=format:"%h|%p|%an|%ar|%s"`,
          { cwd: repoPath },
          (err, logs) => {
            if (err) {
              reject(err)
            } else {
              resolve({ status, logs })
            }
          }
        )
      })
    })
  })

  ipcMain.handle('git:hasChanges', async () => {
    return new Promise((resolve, reject) => {
      if (!repoPath) return reject('repoPath not set')
      
      exec(
        'git status --porcelain',
        { cwd: repoPath },
        (err, stdout, stderr) => {
          if (err) {
            return reject(stderr || err.message)
          }
          
          // If stdout is empty, there are no changes
          // If stdout has content, there are uncommitted/unstaged changes
          const hasChanges = stdout.trim().length > 0
          console.log('git status check:', hasChanges, stdout.trim())
          resolve(hasChanges)
        }
      )
    })
  })
}

app.whenReady()
  .then(() => {
    createWindow();
    return registerListeners();
  })
  .catch(e => console.error(e));
