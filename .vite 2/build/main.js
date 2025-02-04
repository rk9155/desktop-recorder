"use strict";
const electron = require("electron");
const path = require("node:path");
const createWindow = () => {
  const mainWindow = new electron.BrowserWindow({
    width: 800,
    height: 600,
    titleBarStyle: "hidden",
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: true
    }
  });
  const webcamWindow = new electron.BrowserWindow({
    width: 220,
    height: 220,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: true,
    type: "toolbar",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: true
    }
  });
  const controlWindow = new electron.BrowserWindow({
    width: 100,
    height: 450,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: true,
    type: "toolbar",
    // This makes it float above other windows
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: true
    }
  });
  const NOTIFICATION_TITLE = "Basic Notification";
  const NOTIFICATION_BODY = "Notification from the Main process";
  electron.ipcMain.handle("show-notification", () => {
    new electron.Notification({
      title: NOTIFICATION_TITLE,
      body: NOTIFICATION_BODY
    });
  });
  electron.ipcMain.handle("get-video-permissions", async () => {
    const hasMicrophonePermission = electron.systemPreferences.getMediaAccessStatus("camera") === "granted";
    if (hasMicrophonePermission) return hasMicrophonePermission;
    if (process.platform === "darwin") {
      const microPhoneGranted = await electron.systemPreferences.askForMediaAccess(
        "camera"
      );
      if (!microPhoneGranted) {
        electron.shell.openExternal(
          "x-apple.systempreferences:com.apple.preference.security?Privacy_Camera"
        );
      }
    } else if (process.platform === "win32") {
      electron.shell.openExternal("ms-settings:privacy-camera");
    }
    return hasMicrophonePermission;
  });
  electron.ipcMain.handle("get-audio-permissions", async () => {
    const hasMicrophonePermission = electron.systemPreferences.getMediaAccessStatus("microphone") === "granted";
    if (hasMicrophonePermission) return hasMicrophonePermission;
    if (process.platform === "darwin") {
      const microPhoneGranted = await electron.systemPreferences.askForMediaAccess(
        "microphone"
      );
      if (!microPhoneGranted) {
        electron.shell.openExternal(
          "x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone"
        );
      }
    } else if (process.platform === "win32") {
      electron.shell.openExternal("ms-settings:privacy-microphone");
    }
    return hasMicrophonePermission;
  });
  electron.ipcMain.handle("get-screen-permissions", async () => {
    try {
      const status = electron.systemPreferences.getMediaAccessStatus("screen");
      if (status !== "granted") {
        if (process.platform === "darwin") {
          electron.shell.openExternal(
            "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture"
          );
        } else if (process.platform === "win32") {
          return true;
        }
      }
      try {
        const testSource = await electron.desktopCapturer.getSources({
          types: ["window", "screen"],
          thumbnailSize: { width: 1, height: 1 }
        });
        return testSource.length > 0;
      } catch {
        return false;
      }
    } catch (error) {
      console.error("Error getting screen permissions:", error);
      return false;
    }
  });
  electron.ipcMain.handle("get-accessibility-permissions", async () => {
    try {
      if (process.platform === "darwin") {
        const isTrusted = electron.systemPreferences.isTrustedAccessibilityClient(true);
        if (!isTrusted) {
          electron.shell.openExternal(
            "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"
          );
        }
        return isTrusted;
      } else if (process.platform === "win32") {
        electron.shell.openExternal("ms-settings:easeofaccess");
        return true;
      }
      return true;
    } catch (error) {
      console.error("Error getting accessibility permissions:", error);
      return false;
    }
  });
  electron.ipcMain.handle("get-sources", async () => {
    try {
      const screens = await electron.desktopCapturer.getSources({
        types: ["screen"],
        thumbnailSize: { width: 300, height: 300 }
      });
      const windows = await electron.desktopCapturer.getSources({
        types: ["window"],
        thumbnailSize: { width: 300, height: 300 },
        fetchWindowIcons: true
      });
      const allSources = [...screens, ...windows].map((source) => {
        var _a;
        return {
          id: source.id,
          name: source.name,
          display_id: source.display_id,
          thumbnailDataURL: source.thumbnail.toDataURL(),
          appIcon: ((_a = source.appIcon) == null ? void 0 : _a.toDataURL()) || null
        };
      });
      return allSources;
    } catch (error) {
      console.error("Error getting sources:", error);
      return [];
    }
  });
  {
    mainWindow.loadURL("http://localhost:5173");
    webcamWindow.loadURL(`${"http://localhost:5173"}#/webcam`);
    controlWindow.loadURL(`${"http://localhost:5173"}#/controls`);
  }
  webcamWindow.hide();
  controlWindow.hide();
  electron.ipcMain.handle("show-recording-windows", () => {
    const { width: screenWidth, height: screenHeight } = electron.screen.getPrimaryDisplay().workAreaSize;
    webcamWindow.setBounds({
      x: 20,
      y: screenHeight - 240,
      width: 220,
      height: 220
    });
    controlWindow.setBounds({
      x: screenWidth - 120,
      y: Math.floor((screenHeight - 450) / 2),
      width: 100,
      height: 450
    });
    webcamWindow.setAlwaysOnTop(true, "floating");
    controlWindow.setAlwaysOnTop(true, "floating");
    webcamWindow.show();
    controlWindow.show();
  });
  electron.ipcMain.handle("minimize-windows", () => {
    webcamWindow.hide();
    controlWindow.hide();
  });
  electron.ipcMain.handle("close-windows", () => {
    webcamWindow.close();
    controlWindow.close();
  });
  mainWindow.webContents.openDevTools();
  if (process.platform === "darwin") {
    electron.systemPreferences.getMediaAccessStatus("screen");
  }
};
electron.app.on("ready", createWindow);
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
electron.app.on("activate", () => {
  if (electron.BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
