import { app, BrowserWindow, ipcMain } from 'electron'
import { exec } from 'child_process'


let mainWindow: BrowserWindow | null

let repoPath: string = ""

declare const MAIN_WINDOW_WEBPACK_ENTRY: string
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string



// const assetsPath =
//   process.env.NODE_ENV === 'production'
//     ? process.resourcesPath
//     : app.getAppPath()

function createWindow () {
  mainWindow = new BrowserWindow({
    // icon: path.join(assetsPath, 'assets', 'icon.png'),
    width: 1100,
    height: 700,
    backgroundColor: '#191622',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY
    }
  })

  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}


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

  ipcMain.handle('path:set', async (_event, path: string) => {
    return new Promise((resolve) => {
      repoPath = path
      console.log(`repoPath set to ${repoPath}`)
      resolve(repoPath)
    });
  });
  
}

app.on('ready', createWindow)
  .whenReady()
  .then(registerListeners)
  .catch(e => console.error(e))

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
