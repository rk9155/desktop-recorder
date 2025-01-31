import { Button, Space, Tooltip } from "antd";
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  SettingOutlined,
  CameraOutlined,
  AudioOutlined,
  DesktopOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useState } from "react";

export default function ControlPanel() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const handleStartRecording = () => {
    setIsRecording(true);
  };

  const handlePauseRecording = () => {
    setIsPaused(!isPaused);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        right: 20,
        top: "50%",
        transform: "translateY(-50%)",
        backgroundColor: "#fff",
        padding: "15px 10px",
        borderRadius: 12,
        boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        zIndex: 9999,
        WebkitAppRegion: "no-drag",
      }}
    >
      <Space direction="vertical" size={16}>
        {!isRecording ? (
          <Tooltip title="Start Recording" placement="left">
            <Button
              type="primary"
              shape="circle"
              icon={<PlayCircleOutlined />}
              size="large"
              onClick={handleStartRecording}
            />
          </Tooltip>
        ) : (
          <>
            <Tooltip title={isPaused ? "Resume" : "Pause"} placement="left">
              <Button
                shape="circle"
                icon={
                  isPaused ? <PlayCircleOutlined /> : <PauseCircleOutlined />
                }
                size="large"
                onClick={handlePauseRecording}
              />
            </Tooltip>
            <Tooltip title="Stop Recording" placement="left">
              <Button
                danger
                shape="circle"
                icon={<StopOutlined />}
                size="large"
                onClick={handleStopRecording}
              />
            </Tooltip>
          </>
        )}
      </Space>

      <div
        style={{
          width: "100%",
          height: 1,
          backgroundColor: "#eee",
          margin: "8px 0",
        }}
      />

      <Space direction="vertical" size={16}>
        <Tooltip title="Camera Settings" placement="left">
          <Button shape="circle" icon={<CameraOutlined />} size="large" />
        </Tooltip>
        <Tooltip title="Audio Settings" placement="left">
          <Button shape="circle" icon={<AudioOutlined />} size="large" />
        </Tooltip>
        <Tooltip title="Screen Settings" placement="left">
          <Button shape="circle" icon={<DesktopOutlined />} size="large" />
        </Tooltip>
        <Tooltip title="More Settings" placement="left">
          <Button shape="circle" icon={<SettingOutlined />} size="large" />
        </Tooltip>
      </Space>

      <div
        style={{
          width: "100%",
          height: 1,
          backgroundColor: "#eee",
          margin: "8px 0",
        }}
      />

      <Tooltip title="Close" placement="left">
        <Button
          shape="circle"
          icon={<CloseOutlined />}
          size="large"
          onClick={() => window.electronApi?.showRecordingWindows()}
        />
      </Tooltip>
    </div>
  );
}
