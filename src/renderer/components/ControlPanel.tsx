import { useState, useEffect } from "react";
import { Button, message, Typography } from "antd";
import { recordingManager } from "../services/RecordingManager";
import { CheckOne, PauseOne, PlayOne, Viewfinder } from "@icon-park/react";
import { formatTime } from "../utils/utils";

export default function ControlPanel() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState("00:00");

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRecording && !isPaused) {
      timer = setInterval(() => {
        setDuration(formatTime(recordingManager.getRecordingDuration()));
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
        systemAudioStream
      );

      if (success) {
        setIsRecording(true);
        window.electronApi?.startMetadataTracking();
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
      window.electronApi?.stopMetadataTracking().then((metadata) => {
        console.log(metadata);
      });
      setIsRecording(false);
      setIsPaused(false);
      setDuration("00:00");
      message.success("Recording completed");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", flexDirection: "row", gap: 16 }}>
        {isRecording ? (
          <Button onClick={handleStopRecording} icon={<CheckOne />}>
            Stop Recording
          </Button>
        ) : (
          <Button onClick={handleStartRecording} icon={<Viewfinder />}>
            Start Recording
          </Button>
        )}
        {isPaused ? (
          <Button onClick={handlePauseRecording} icon={<PlayOne />}>
            Resume
          </Button>
        ) : (
          <Button onClick={handlePauseRecording} icon={<PauseOne />}>
            Pause
          </Button>
        )}
      </div>
      <Typography.Text>{duration}</Typography.Text>
    </div>
  );
}
