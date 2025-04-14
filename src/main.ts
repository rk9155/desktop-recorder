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

// Keep track of all windows
let mainWindow: BrowserWindow | null = null;
let webcamWindow: BrowserWindow | null = null;
let toolbarWindow: BrowserWindow | null = null;
let drawingOverlayWindow: BrowserWindow | null = null;

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
  mainWindow = new BrowserWindow({
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
  webcamWindow = new BrowserWindow({
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

  // Create toolbar window (vertical on left)
  toolbarWindow = new BrowserWindow({
    width: 120, // Increased width
    height: 300, // Adjust height as needed
    x: 10, // Position near left edge
    y: screenHeight / 2 - 150, // Center vertically
    frame: false,
    transparent: true, // Optional: for rounded corners/styling
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false, // Keep nodeIntegration false for security
    },
  });

  // Create drawing overlay window (covers screen)
  drawingOverlayWindow = new BrowserWindow({
    x: primaryDisplay.bounds.x,
    y: primaryDisplay.bounds.y,
    width: screenWidth,
    height: screenHeight,
    frame: false,
    transparent: true,
    alwaysOnTop: true, // Must be on top to draw over content
    skipTaskbar: true,
    resizable: false,
    // IMPORTANT: Ignore mouse events initially so it doesn't block interaction
    // We'll toggle this when drawing mode is active
    // Note: On some platforms, even with ignore mouse events, it might capture focus briefly when shown.
    focusable: false, // Try to prevent focus stealing
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false, // Keep nodeIntegration false for security
    },
  });
  drawingOverlayWindow.setIgnoreMouseEvents(true, { forward: true }); // Forward allows underlying windows to receive events

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
    toolbarWindow.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}#/toolbar`); // Add toolbar route
    drawingOverlayWindow.loadURL(`${MAIN_WINDOW_VITE_DEV_SERVER_URL}#/drawing`); // Add drawing route
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
    toolbarWindow.loadFile(
      // Add toolbar file load
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
      { hash: "toolbar" }
    );
    drawingOverlayWindow.loadFile(
      // Add drawing file load
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
      { hash: "drawing" }
    );
  }

  webcamWindow.hide();
  toolbarWindow.hide(); // Hide initially
  drawingOverlayWindow.hide(); // Hide initially

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
    if (webcamWindow && !webcamWindow.isDestroyed()) webcamWindow.close();
    if (toolbarWindow && !toolbarWindow.isDestroyed()) toolbarWindow.close(); // Close toolbar
    if (drawingOverlayWindow && !drawingOverlayWindow.isDestroyed())
      drawingOverlayWindow.close(); // Close drawing overlay
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

  // Show/Hide Drawing Tools
  ipcMain.handle("show-drawing-tools", async () => {
    try {
      // --- Determine Shared Screen Bounds ---
      // Assumption: Using the first screen source, like in ControlPanel.tsx
      const sources = await desktopCapturer.getSources({ types: ["screen"] });
      if (sources && sources.length > 0 && drawingOverlayWindow) {
        const primarySource = sources[0];
        const allDisplays = screen.getAllDisplays();
        // Find the display that matches the source's display_id (if available)
        // Or fallback to primary display if no match (might happen in some setups)
        const sharedDisplay =
          allDisplays.find(
            (d) => d.id.toString() === primarySource.display_id
          ) || screen.getPrimaryDisplay();

        const bounds = sharedDisplay.bounds; // Use the bounds of the identified display

        // Resize and position the overlay window
        drawingOverlayWindow.setBounds(bounds);

        // Send bounds to the overlay renderer for the yellow border
        // Note: bounds are relative to the top-left of the combined screen space
        // The renderer uses CSS pixels relative to the window, so send relative bounds
        const relativeBounds = {
          x: 0,
          y: 0,
          width: bounds.width,
          height: bounds.height,
        };
        drawingOverlayWindow.webContents.send(
          "update-border-bounds",
          relativeBounds
        );

        // --- Show Windows ---
        if (toolbarWindow) toolbarWindow.show();
        if (drawingOverlayWindow) drawingOverlayWindow.show();
      } else {
        console.warn(
          "Could not determine shared screen or drawing overlay window not found."
        );
        // Fallback: Just show windows without resizing/sending bounds
        if (toolbarWindow) toolbarWindow.show();
        if (drawingOverlayWindow) drawingOverlayWindow.show();
      }
    } catch (error) {
      console.error("Error in show-drawing-tools:", error);
      // Fallback in case of error
      if (toolbarWindow) toolbarWindow.show();
      if (drawingOverlayWindow) drawingOverlayWindow.show();
    }
  });

  ipcMain.handle("hide-drawing-tools", () => {
    if (toolbarWindow) toolbarWindow.hide();
    if (drawingOverlayWindow) drawingOverlayWindow.hide();
    if (drawingOverlayWindow)
      drawingOverlayWindow.setIgnoreMouseEvents(true, { forward: true }); // Ensure mouse events are ignored when hidden
  });

  // Enable/Disable Drawing Interaction on Overlay
  ipcMain.handle("enable-drawing", () => {
    if (drawingOverlayWindow) drawingOverlayWindow.setIgnoreMouseEvents(false);
  });

  ipcMain.handle("disable-drawing", () => {
    if (drawingOverlayWindow)
      drawingOverlayWindow.setIgnoreMouseEvents(true, { forward: true });
  });

  // Start Cursor Tracking
  ipcMain.handle("start-cursor-tracking", () => {
    if (cursorTrackingInterval) return; // Already running
    cursorPositions = []; // Reset positions
    clickEvents = []; // Reset click events

    // Permission Check (macOS specific for listening to global events)
    if (process.platform === "darwin") {
      const isTrusted = systemPreferences.isTrustedAccessibilityClient(false); // Check without prompting
      if (!isTrusted) {
        console.warn(
          "Accessibility permission not granted. Click tracking may not work."
        );
        // Optionally notify the user or attempt to request permission again
        // systemPreferences.isTrustedAccessibilityClient(true); // This would prompt
      }
    }

    // Start tracking position
    cursorTrackingInterval = setInterval(() => {
      const point = screen.getCursorScreenPoint();
      cursorPositions.push({
        x: point.x,
        y: point.y,
        timestamp: Date.now(),
      });
    }, 50);
  });

  // Stop Recording Request Handler
  ipcMain.handle("request-stop-recording", () => {
    // Forward the stop request to the main window's renderer
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("execute-stop-recording");
    } else {
      console.warn("Main window not available to stop recording.");
    }
  });

  // Clear Canvas Request Handler
  ipcMain.handle("clear-drawing-canvas", () => {
    // Forward the clear request to the drawing overlay window's renderer
    if (drawingOverlayWindow && !drawingOverlayWindow.isDestroyed()) {
      drawingOverlayWindow.webContents.send("do-clear-canvas");
    } else {
      console.warn("Drawing overlay window not available to clear canvas.");
    }
  });
};

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  mainWindow = null;
  webcamWindow = null;
  toolbarWindow = null;
  drawingOverlayWindow = null;
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
