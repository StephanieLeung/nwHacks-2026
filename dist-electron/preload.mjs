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
   *
   * The function below can accessed using `window.Main.sendMessage`
   */
  sendMessage: (message) => {
    electron.ipcRenderer.send("message", message);
  },
  /**
   * Provide an easier way to listen to events
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on: (channel, callback) => {
    electron.ipcRenderer.on(channel, (_, data) => callback(data));
  },
  git: {
    run: (command) => electron.ipcRenderer.invoke("git:run", command),
    getHistory: () => electron.ipcRenderer.invoke("git:getHistory")
  },
  path: {
    set: (path) => electron.ipcRenderer.invoke("path:set", path)
  }
};
electron.contextBridge.exposeInMainWorld("API", api);
