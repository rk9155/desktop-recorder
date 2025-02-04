const { contextBridge, ipcRenderer, desktopCapturer } = require("electron");

contextBridge.exposeInMainWorld("electronApi", {
  showNotification: () => ipcRenderer.invoke("show-notification"),
  getVideoPermissions: () => ipcRenderer.invoke("get-video-permissions"),
  getAudioPermissions: () => ipcRenderer.invoke("get-audio-permissions"),
  getScreenPermissions: () => ipcRenderer.invoke("get-screen-permissions"),
  getAccessibilityPermissions: () =>
    ipcRenderer.invoke("get-accessibility-permissions"),
  showRecordingWindows: () => ipcRenderer.invoke("show-recording-windows"),
  getSources: () => ipcRenderer.invoke("get-sources"),
  hideRecordingWindows: () => ipcRenderer.invoke("hide-recording-windows"),
  showPreview: (url: string) => ipcRenderer.invoke("show-preview", url),
  onShowPreview: (callback: (url: string) => void) =>
    ipcRenderer.on("show-preview", (_: any, url: string) => callback(url)),
  removePreviewListener: () => ipcRenderer.removeAllListeners("show-preview"),
  getSystemAudioStream: () => ipcRenderer.invoke("get-system-audio"),
  setOverlayInteractive: (interactive: boolean) =>
    ipcRenderer.invoke("set-overlay-interactive", interactive),
  setOverlayBounds: (bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  }) => ipcRenderer.invoke("set-overlay-bounds", bounds),
});
