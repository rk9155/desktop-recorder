import {
  app,
  BrowserWindow,
  ipcMain,
  Notification,
  shell,
  systemPreferences,
  screen,
  desktopCapturer,
} from "electron";
import path from "node:path";

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    x: 50,
    y: 50,
    width: 800,
    height: 600,
    titleBarStyle: "hidden",
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: true,
    },
  });

  // Create webcam preview window
  const webcamWindow = new BrowserWindow({
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
      nodeIntegration: true,
    },
  });

  // Create control panel window
  const controlWindow = new BrowserWindow({
    width: 400,
    height: 450,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    hasShadow: true,
    type: "toolbar", // This makes it float above other windows
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: true,
      webSecurity: false,
    },
  });

  // Create overlay window for drawing
  const overlayWindow = new BrowserWindow({
    width: screen.getPrimaryDisplay().workAreaSize.width,
    height: screen.getPrimaryDisplay().workAreaSize.height,
    x: 0,
    y: 0,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    focusable: true,
    type: "toolbar",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: true,
      webSecurity: false,
    },
    skipTaskbar: true,
    hasShadow: false,
    roundedCorners: false,
  });

  const NOTIFICATION_TITLE = "Basic Notification";
  const NOTIFICATION_BODY = "Notification from the Main process";

  ipcMain.handle("show-notification", () => {
    new Notification({
      title: NOTIFICATION_TITLE,
      body: NOTIFICATION_BODY,
    });
  });

  ipcMain.handle("get-video-permissions", async () => {
    const hasMicrophonePermission =
      systemPreferences.getMediaAccessStatus("camera") === "granted";
    if (hasMicrophonePermission) return hasMicrophonePermission;
    if (process.platform === "darwin") {
      const microPhoneGranted = await systemPreferences.askForMediaAccess(
        "camera"
      );
      if (!microPhoneGranted) {
        shell.openExternal(
          "x-apple.systempreferences:com.apple.preference.security?Privacy_Camera"
        );
      }
    } else if (process.platform === "win32") {
      shell.openExternal("ms-settings:privacy-camera");
    }
    return hasMicrophonePermission;
  });

  ipcMain.handle("get-audio-permissions", async () => {
    const hasMicrophonePermission =
      systemPreferences.getMediaAccessStatus("microphone") === "granted";
    if (hasMicrophonePermission) return hasMicrophonePermission;
    if (process.platform === "darwin") {
      const microPhoneGranted = await systemPreferences.askForMediaAccess(
        "microphone"
      );
      if (!microPhoneGranted) {
        shell.openExternal(
          "x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone"
        );
      }
    } else if (process.platform === "win32") {
      shell.openExternal("ms-settings:privacy-microphone");
    }
    return hasMicrophonePermission;
  });

  ipcMain.handle("get-screen-permissions", async () => {
    try {
      const status = systemPreferences.getMediaAccessStatus("screen");

      if (status !== "granted") {
        if (process.platform === "darwin") {
          // On macOS, open system preferences for screen recording
          shell.openExternal(
            "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture"
          );
        } else if (process.platform === "win32") {
          // On Windows, no explicit permission needed
          return true;
        }
      }

      // Test if we can actually capture
      try {
        const testSource = await desktopCapturer.getSources({
          types: ["window", "screen"],
          thumbnailSize: { width: 1, height: 1 },
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

  ipcMain.handle("get-accessibility-permissions", async () => {
    try {
      if (process.platform === "darwin") {
        const isTrusted = systemPreferences.isTrustedAccessibilityClient(true);
        if (!isTrusted) {
          shell.openExternal(
            "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"
          );
        }
        return isTrusted;
      } else if (process.platform === "win32") {
        shell.openExternal("ms-settings:easeofaccess");
        return true;
      }
      return true;
    } catch (error) {
      console.error("Error getting accessibility permissions:", error);
      return false;
    }
  });

  ipcMain.handle("get-sources", async () => {
    try {
      // First get screens
      const screens = await desktopCapturer.getSources({
        types: ["screen"],
        thumbnailSize: { width: 300, height: 300 },
      });

      // Then get windows separately with more options
      const windows = await desktopCapturer.getSources({
        types: ["window"],
        thumbnailSize: { width: 300, height: 300 },
        fetchWindowIcons: true,
      });

      // Combine and convert thumbnails to base64 strings before sending
      const allSources = [...screens, ...windows].map((source) => ({
        id: source.id,
        name: source.name,
        display_id: source.display_id,
        thumbnailDataURL: source.thumbnail.toDataURL(),
        appIcon: source.appIcon?.toDataURL() || null,
      }));

      return allSources;
    } catch (error) {
      console.error("Error getting sources:", error);
      return [];
    }
  });

  ipcMain.handle("get-system-audio", async () => {
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width: 0, height: 0 },
    });

    return sources[0].id;
  });

  // Load different routes for each window
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
    webcamWindow.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}#/webcam`);
    controlWindow.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}#/controls`);
    overlayWindow.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}#/overlay`);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
    webcamWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
      { hash: "webcam" }
    );
    controlWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
      { hash: "controls" }
    );
    overlayWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
      { hash: "overlay" }
    );
  }

  // Initially hide the webcam, control, and overlay windows
  webcamWindow.hide();
  controlWindow.hide();
  overlayWindow.hide();

  // Handle window show/hide based on route changes
  ipcMain.handle("show-recording-windows", () => {
    const { width: screenWidth, height: screenHeight } =
      screen.getPrimaryDisplay().workAreaSize;

    // Position webcam window at bottom left with some padding
    webcamWindow.setBounds({
      x: 20,
      y: screenHeight - 240,
      width: 220,
      height: 220,
    });

    // Position control window at middle right
    controlWindow.setBounds({
      x: screenWidth - 420,
      y: Math.floor((screenHeight - 450) / 2),
      width: 400,
      height: 450,
    });

    // Position overlay window to cover the entire screen
    overlayWindow.setBounds({
      x: 0,
      y: 0,
      width: screenWidth,
      height: screenHeight,
    });

    webcamWindow.setAlwaysOnTop(true, "floating");
    controlWindow.setAlwaysOnTop(true, "floating");
    overlayWindow.setAlwaysOnTop(true, "screen-saver");
    overlayWindow.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true,
    });

    webcamWindow.show();
    controlWindow.show();
    overlayWindow.show();
    overlayWindow.setIgnoreMouseEvents(true);
  });

  // Add these handlers
  ipcMain.handle("minimize-windows", () => {
    webcamWindow.hide();
    controlWindow.hide();
    overlayWindow.hide();
  });

  ipcMain.handle("close-windows", () => {
    webcamWindow.close();
    controlWindow.close();
    overlayWindow.close();
  });

  ipcMain.handle("hide-recording-windows", () => {
    webcamWindow.hide();
    controlWindow.hide();
    overlayWindow.hide();
  });

  ipcMain.handle("show-preview", (_, url: string) => {
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.send("show-preview", url);
  });

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
  controlWindow.webContents.openDevTools();

  // Add this near the top of createWindow function
  if (process.platform === "darwin") {
    // Request screen capture permission if not granted
    systemPreferences.getMediaAccessStatus("screen");
  }

  // Add IPC handlers for overlay
  ipcMain.handle("set-overlay-interactive", (_event, interactive: boolean) => {
    overlayWindow.setIgnoreMouseEvents(!interactive);
  });

  // Add a new IPC handler for overlay window bounds
  ipcMain.handle(
    "set-overlay-bounds",
    (
      _event,
      bounds: { x: number; y: number; width: number; height: number }
    ) => {
      overlayWindow.setBounds(bounds);
    }
  );
};

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.whenReady().then(() => {
  app.commandLine.appendSwitch("enable-experimental-web-platform-features");
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
