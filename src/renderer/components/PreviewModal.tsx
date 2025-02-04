import { Modal, Button, Space } from "antd";
import { DownloadOutlined, DeleteOutlined } from "@ant-design/icons";

interface PreviewModalProps {
  videoUrl: string | null;
  onClose: () => void;
}

export function PreviewModal({ videoUrl, onClose }: PreviewModalProps) {
  const handleDownload = () => {
    if (videoUrl) {
      const a = document.createElement("a");
      a.href = videoUrl;
      a.download = `recording-${new Date().toISOString()}.webm`;
      a.click();
    }
  };

  return (
    <Modal
      title="Recording Preview"
      open={!!videoUrl}
      onCancel={onClose}
      width={800}
      footer={
        <Space>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleDownload}
          >
            Download
          </Button>
          <Button icon={<DeleteOutlined />} onClick={onClose}>
            Discard
          </Button>
        </Space>
      }
    >
      <div style={{ width: "100%", aspectRatio: "16/9", background: "#000" }}>
        {videoUrl && (
          <video
            src={videoUrl}
            controls
            style={{ width: "100%", height: "100%" }}
            autoPlay
          />
        )}
      </div>
    </Modal>
  );
}
