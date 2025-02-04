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
    hideRecordingWindows: () => Promise<void>;
    showPreview: (url: string) => Promise<void>;
    onShowPreview: (callback: (url: string) => void) => void;
    removePreviewListener: () => void;
    getSystemAudioStream: () => Promise<string>;
    setOverlayInteractive: (interactive: boolean) => Promise<void>;
    setOverlayBounds: (bounds: {
      x: number;
      y: number;
      width: number;
      height: number;
    }) => Promise<void>;
    recordClick: (click: { x: number; y: number }) => Promise<void>;
    startMetadataTracking: () => Promise<void>;
    stopMetadataTracking: () => Promise<void>;
  };
}

interface MediaDevices {
  getDisplayMedia(constraints?: MediaStreamConstraints): Promise<MediaStream>;
}

interface AudioConstraintSet {
  mandatory?: {
    chromeMediaSource?: string;
    chromeMediaSourceId?: string;
  };
}

interface MediaTrackConstraintSet {
  mandatory?: {
    chromeMediaSource?: string;
    chromeMediaSourceId?: string;
  };
}

interface MediaStreamConstraints {
  video?: boolean | MediaTrackConstraints;
  audio?: boolean | MediaTrackConstraints;
}
