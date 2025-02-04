import { useEffect, useState } from "react";
import { Button, Progress, Space, Tooltip } from "antd";
import {
  AudioOutlined,
  LoadingOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  SaveOutlined,
  StopOutlined,
} from "@ant-design/icons";

interface RecordingControlsProps {
  isRecording: boolean;
  isPaused: boolean;
  audioLevel: number;
  duration: number;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export function RecordingControls({
  isRecording,
  isPaused,
  audioLevel,
  duration,
  onStart,
  onPause,
  onResume,
  onStop,
}: RecordingControlsProps) {
  const [countdown, setCountdown] = useState(3);
  const [isStarting, setIsStarting] = useState(false);

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return `${hours.toString().padStart(2, "0")}:${(minutes % 60)
      .toString()
      .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (isStarting && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isStarting && countdown === 0) {
      setIsStarting(false);
      onStart();
    }
  }, [countdown, isStarting, onStart]);

  const handleStartClick = () => {
    setIsStarting(true);
    setCountdown(3);
  };

  return (
    <div style={{ padding: "10px" }}>
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        {isStarting ? (
          <div style={{ textAlign: "center", fontSize: "24px" }}>
            Starting in {countdown}...
          </div>
        ) : isRecording ? (
          <>
            <div style={{ textAlign: "center" }}>
              {formatDuration(duration)}
            </div>
            <Space>
              {isPaused ? (
                <Tooltip title="Resume">
                  <Button
                    type="primary"
                    shape="circle"
                    icon={<PlayCircleOutlined />}
                    onClick={onResume}
                  />
                </Tooltip>
              ) : (
                <Tooltip title="Pause">
                  <Button
                    shape="circle"
                    icon={<PauseCircleOutlined />}
                    onClick={onPause}
                  />
                </Tooltip>
              )}
              <Tooltip title="Stop">
                <Button
                  danger
                  shape="circle"
                  icon={<StopOutlined />}
                  onClick={onStop}
                />
              </Tooltip>
            </Space>
            <div>
              <AudioOutlined /> Audio Level
              <Progress
                percent={Math.round(audioLevel * 100)}
                size="small"
                showInfo={false}
                status="active"
              />
            </div>
          </>
        ) : (
          <Tooltip title="Start Recording">
            <Button
              type="primary"
              shape="circle"
              icon={isStarting ? <LoadingOutlined /> : <PlayCircleOutlined />}
              onClick={handleStartClick}
              size="large"
            />
          </Tooltip>
        )}
      </Space>
    </div>
  );
}
