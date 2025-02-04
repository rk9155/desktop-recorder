"use strict";
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("electronApi", {
  showNotification: () => ipcRenderer.invoke("show-notification"),
  getVideoPermissions: () => ipcRenderer.invoke("get-video-permissions"),
  getAudioPermissions: () => ipcRenderer.invoke("get-audio-permissions"),
  getScreenPermissions: () => ipcRenderer.invoke("get-screen-permissions"),
  getAccessibilityPermissions: () => ipcRenderer.invoke("get-accessibility-permissions"),
  showRecordingWindows: () => ipcRenderer.invoke("show-recording-windows"),
  getSources: () => ipcRenderer.invoke("get-sources")
});
