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
const { spawn } = require("child_process");

let clickEvents: Array<{
  x: number;
  y: number;
  timestamp: number;
}> = [];
let cursorPositions: Array<{ x: number; y: number; timestamp: number }> = [];
let cursorTrackingInterval: NodeJS.Timeout | null = null;

const createWindow = () => {
  // Get the primary display dimensions
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } =
    primaryDisplay.workAreaSize;
  const windowWidth = 800;
  const windowHeight = 450;
  const xPosition = screenWidth - windowWidth - 20;
  const yPosition = screenHeight - windowHeight - 20;

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    x: xPosition,
    y: yPosition,
    width: windowWidth,
    height: windowHeight,
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
    // controlWindow.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}#/controls`);
    // overlayWindow.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}#/overlay`);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
    webcamWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
      { hash: "webcam" }
    );
  }

  webcamWindow.hide();

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

    webcamWindow.setAlwaysOnTop(true, "floating");
    webcamWindow.show();
  });

  // Add these handlers
  ipcMain.handle("minimize-windows", () => {
    webcamWindow.hide();
  });

  ipcMain.handle("close-windows", () => {
    webcamWindow.close();
  });

  ipcMain.handle("hide-recording-windows", () => {
    webcamWindow.hide();
  });

  ipcMain.handle("show-preview", (_, url: string) => {
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.send("show-preview", url);
  });

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Add this near the top of createWindow function
  if (process.platform === "darwin") {
    // Request screen capture permission if not granted
    systemPreferences.getMediaAccessStatus("screen");
  }

  // Modify metadata tracking
  ipcMain.handle("start-metadata-tracking", () => {
    clickEvents = [];
    cursorPositions = [];

    cursorTrackingInterval = setInterval(() => {
      const point = screen.getCursorScreenPoint();
      cursorPositions.push({
        x: point.x,
        y: point.y,
        timestamp: Date.now(),
      });
    }, 50);
    return true;
  });

  ipcMain.handle("stop-metadata-tracking", () => {
    if (cursorTrackingInterval) {
      clearInterval(cursorTrackingInterval);
      cursorTrackingInterval = null;
    }
    return { clickEvents, cursorPositions };
  });

  ipcMain.handle("record-click", (_: any, click: { x: number; y: number }) => {
    const currentTimestamp = Date.now();
    clickEvents.push({
      ...click,
      timestamp: currentTimestamp,
    });
    return true;
  });
};

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.whenReady().then(() => {
  app.commandLine.appendSwitch("enable-experimental-web-platform-features");
  console.log("Starting native mouse tracker...");

  // Create absolute path to the script
  const scriptPath = path.join(
    __dirname,
    "../../src/scripts/mouse_tracker.swift"
  );
  console.log("Script path:", scriptPath); // For debugging

  const mouseTracker = spawn("swift", [scriptPath], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  mouseTracker.stdout.setEncoding("utf8");
  mouseTracker.stderr.setEncoding("utf8");

  // Add debug logging for the process working directory
  console.log("Current working directory:", process.cwd());
  console.log("__dirname:", __dirname);

  mouseTracker.stdout.on("data", (data: string) => {
    try {
      // Try to parse the JSON output
      const event = JSON.parse(data.trim());
      console.log("Mouse Event:", event);
    } catch (e) {
      // If it's not JSON, just log the raw output
      console.log("Mouse Tracker Output:", data.trim());
    }
  });

  mouseTracker.stderr.on("data", (data: string) => {
    console.error(`Mouse Tracker Error: ${data.trim()}`);
  });

  mouseTracker.on("close", (code: number) => {
    console.log(`Mouse Tracker exited with code ${code}`);
  });
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
