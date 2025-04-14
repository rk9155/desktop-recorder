const { contextBridge, ipcRenderer, desktopCapturer } = require("electron");
import { IpcRendererEvent } from "electron";

// Define bounds type for clarity
interface BorderBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

contextBridge.exposeInMainWorld("electronApi", {
  showNotification: () => ipcRenderer.invoke("show-notification"),
  getVideoPermissions: () => ipcRenderer.invoke("get-video-permissions"),
  // getAudioPermissions: () => ipcRenderer.invoke("get-audio-permissions"),
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
  recordClick: (click: { x: number; y: number }) =>
    ipcRenderer.invoke("record-click", click),
  startMetadataTracking: () => ipcRenderer.invoke("start-metadata-tracking"),
  stopMetadataTracking: () => ipcRenderer.invoke("stop-metadata-tracking"),

  // Drawing controls
  enableDrawing: () => ipcRenderer.invoke("enable-drawing"),
  disableDrawing: () => ipcRenderer.invoke("disable-drawing"),
  showDrawingTools: () => ipcRenderer.invoke("show-drawing-tools"),
  hideDrawingTools: () => ipcRenderer.invoke("hide-drawing-tools"),

  // Listener for border bounds update from main
  onUpdateBorderBounds: (callback: (bounds: BorderBounds) => void) =>
    ipcRenderer.on(
      "update-border-bounds",
      (_event: IpcRendererEvent, bounds: BorderBounds) => callback(bounds)
    ),
  removeBorderBoundsListener: () =>
    ipcRenderer.removeAllListeners("update-border-bounds"),

  // Stop recording flow
  requestStopRecording: () => ipcRenderer.invoke("request-stop-recording"),
  onExecuteStopRecording: (callback: () => void) =>
    ipcRenderer.on("execute-stop-recording", callback),
  removeExecuteStopRecordingListener: () =>
    ipcRenderer.removeAllListeners("execute-stop-recording"),

  // Clear drawing canvas flow
  clearDrawingCanvas: () => ipcRenderer.invoke("clear-drawing-canvas"),
  onDoClearCanvas: (callback: () => void) =>
    ipcRenderer.on("do-clear-canvas", callback),
  removeDoClearCanvasListener: () =>
    ipcRenderer.removeAllListeners("do-clear-canvas"),
});
