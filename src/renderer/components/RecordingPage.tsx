import { useEffect } from "react";

import { useState } from "react";
import { PreviewModal } from "./PreviewModal";
import ControlPanel from "./ControlPanel";

const RecordingPage = () => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    window.electronApi?.showRecordingWindows();

    const handleMouseClick = (e: MouseEvent) => {
      window.electronApi?.recordClick({ x: e.clientX, y: e.clientY });
    };

    window.electronApi?.onShowPreview((url: string) => {
      setPreviewUrl(url);
    });
    document.addEventListener("click", handleMouseClick);

    return () => {
      window.electronApi?.removePreviewListener();
      document.removeEventListener("click", handleMouseClick);
    };
  }, []);

  const handleClosePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <ControlPanel />
      <PreviewModal videoUrl={previewUrl} onClose={handleClosePreview} />
    </div>
  );
};

export default RecordingPage;
