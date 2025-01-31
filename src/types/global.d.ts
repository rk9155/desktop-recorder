interface Window {
  electronApi?: {
    showNotification: () => void;
    getVideoPermissions: () => Promise<boolean>;
    getAudioPermissions: () => Promise<boolean>;
    getScreenPermissions: () => Promise<boolean>;
    getAccessibilityPermissions: () => Promise<boolean>;
    showRecordingWindows: () => Promise<void>;
    getSources: () => Promise<
      Array<{
        id: string;
        name: string;
        display_id: string;
        thumbnailDataURL: string;
        appIcon: string | null;
      }>
    >;
  };
}
