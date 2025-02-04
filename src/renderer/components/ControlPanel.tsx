import { useState, useEffect } from "react";
import { Button, Space, Tooltip, message } from "antd";
import {
  SettingOutlined,
  CameraOutlined,
  AudioOutlined,
  DesktopOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { recordingManager } from "../services/RecordingManager";
import { RecordingControls } from "./RecordingControls";

export default function ControlPanel() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording && !isPaused) {
      timer = setInterval(() => {
        setDuration(recordingManager.getRecordingDuration());
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording, isPaused]);

  const handleStartRecording = async () => {
    try {
      // First get the sources
      const sources = await window.electronApi?.getSources();
      if (!sources || sources.length === 0) {
        throw new Error("No screen sources found");
      }

      // Get screen stream (video only)
      const screenStream = await navigator.mediaDevices.getUserMedia({
        video: {
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: sources[0].id,
          },
        },
        audio: false,
      } as any);

      // Get the video track settings to determine screen bounds
      const videoTrack = screenStream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();

      // Set overlay bounds to match the screen being recorded
      await window.electronApi?.setOverlayBounds({
        x: settings.left || 0,
        y: settings.top || 0,
        width: settings.width || window.screen.width,
        height: settings.height || window.screen.height,
      });

      // Get microphone audio
      let audioStream: MediaStream | null = null;
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100,
          },
          video: false,
        });
      } catch (err) {
        console.warn("Microphone access denied:", err);
      }

      // Get webcam video
      let videoStream: MediaStream | null = null;
      try {
        videoStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
          audio: false,
        });
      } catch (err) {
        console.warn("Webcam access denied:", err);
      }

      // Get system audio using getDisplayMedia
      let systemAudioStream: MediaStream | null = null;
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: false,
          audio: true,
        });
        systemAudioStream = new MediaStream(displayStream.getAudioTracks());
        displayStream.getVideoTracks().forEach((track) => track.stop()); // Stop unused video track
      } catch (err) {
        console.warn("System audio access denied:", err);
      }

      if (!screenStream) {
        throw new Error("Screen capture is required");
      }

      const success = await recordingManager.startRecording(
        screenStream,
        audioStream,
        videoStream,
        systemAudioStream,
        (blob) => {
          console.log("Received data chunk:", blob.size);
        },
        setAudioLevel
      );

      if (success) {
        setIsRecording(true);
        message.success("Recording started");
      }
    } catch (error) {
      console.error("Failed to start recording:", error);
      message.error("Failed to start recording");
    }
  };

  const handlePauseRecording = () => {
    if (isPaused) {
      if (recordingManager.resumeRecording()) {
        setIsPaused(false);
        message.success("Recording resumed");
      }
    } else {
      if (recordingManager.pauseRecording()) {
        setIsPaused(true);
        message.success("Recording paused");
      }
    }
  };

  const handleStopRecording = async () => {
    const blob = await recordingManager.stopRecording();
    if (blob) {
      recordingManager.cleanup();
      window.electronApi?.hideRecordingWindows();
      window.electronApi?.showPreview(URL.createObjectURL(blob));

      setIsRecording(false);
      setIsPaused(false);
      setDuration(0);
      message.success("Recording completed");
    }
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
      }}
    >
      <RecordingControls
        isRecording={isRecording}
        isPaused={isPaused}
        audioLevel={audioLevel}
        duration={duration}
        onStart={handleStartRecording}
        onPause={handlePauseRecording}
        onResume={handlePauseRecording}
        onStop={handleStopRecording}
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
