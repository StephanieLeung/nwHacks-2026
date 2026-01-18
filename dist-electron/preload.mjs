"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    return electron.ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
  },
  off(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.invoke(channel, ...omit);
  }
  // You can expose other APTs you need here.
  // ...
});
const api = {
  /**
   * Here you can expose functions to the renderer process
   * so they can interact with the main (electron) side
   * without security problems.
   */
  sendMessage: (message) => {
    electron.ipcRenderer.send("message", message);
  },
  on: (channel, callback) => {
    electron.ipcRenderer.on(channel, (_, data) => callback(data));
  },
  git: {
    run: (command) => electron.ipcRenderer.invoke("git:run", command),
    getHistory: () => electron.ipcRenderer.invoke("git:getHistory")
  },
  path: {
    // Sets the path in main process (existing)
    set: (path) => electron.ipcRenderer.invoke("path:set", path),
    // opens a native folder chooser in main and returns selected path (or null)
    select: () => electron.ipcRenderer.invoke("path:select")
  }
};
electron.contextBridge.exposeInMainWorld("API", api);
electron.contextBridge.exposeInMainWorld("windowControls", {
  minimize: () => electron.ipcRenderer.invoke("window:minimize"),
  close: () => electron.ipcRenderer.invoke("window:close")
});
