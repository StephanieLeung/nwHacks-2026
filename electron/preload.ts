import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // You can expose other APTs you need here.
  // ...
})


export const api = {
  /**
   * Here you can expose functions to the renderer process
   * so they can interact with the main (electron) side
   * without security problems.
   *
   * The function below can accessed using `window.Main.sendMessage`
   */

  sendMessage: (message: string) => {
    ipcRenderer.send('message', message)
  },

  /**
   * Provide an easier way to listen to events
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on: (channel: string, callback: any) => {
    ipcRenderer.on(channel, (_, data) => callback(data))
  },

  git: {
    run: (command: string) => ipcRenderer.invoke('git:run', command)
  },

  path: {
    set: (path: string) => ipcRenderer.send('path:set', path)
  }
}

contextBridge.exposeInMainWorld('API', api)
