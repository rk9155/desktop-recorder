import { Select, Button, Typography, Card, Segmented } from "antd";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DesktopOutlined, AppstoreOutlined } from "@ant-design/icons";

interface ScreenSource {
  id: string;
  name: string;
  display_id: string;
  thumbnailDataURL: string;
  appIcon: string | null;
}

type SourceType = "screen" | "window";

export default function DeviceSelection() {
  const navigate = useNavigate();
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [screenSources, setScreenSources] = useState<ScreenSource[]>([]);
  const [selectedAudio, setSelectedAudio] = useState<string>("");
  const [selectedVideo, setSelectedVideo] = useState<string>("");
  const [selectedScreen, setSelectedScreen] = useState<string>("");
  const [sourceType, setSourceType] = useState<SourceType>("screen");

  const handleStartRecording = () => {
    navigate("/recording");
  };

  useEffect(() => {
    setSelectedAudio(audioDevices[0]?.deviceId || "");
    setSelectedVideo(videoDevices[0]?.deviceId || "");
  }, [audioDevices, videoDevices]);

  useEffect(() => {
    const getDevices = async () => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAudioDevices(devices.filter((device) => device.kind === "audioinput"));
      setVideoDevices(devices.filter((device) => device.kind === "videoinput"));
    };

    const getSources = async () => {
      try {
        const sources = await window.electronApi?.getSources();
        console.log(
          "Available sources:",
          sources?.map((s) => ({
            id: s.id,
            name: s.name,
            isScreen: s.id.startsWith("screen:"),
          }))
        );

        if (sources) {
          setScreenSources(sources);
          // Set first screen as default selection
          const firstScreen = sources.find((source) =>
            source.id.includes("screen")
          );
          if (firstScreen) {
            setSelectedScreen(firstScreen.id);
          }
        }
      } catch (error) {
        console.error("Error getting sources:", error);
      }
    };

    getSources();
    window.electronApi?.showRecordingWindows();
    getDevices();
  }, []);

  const filteredSources = screenSources.filter((source) => {
    const isScreen = source.id.startsWith("screen:");
    return sourceType === "screen" ? isScreen : !isScreen;
  });

  const getSourceName = (source: ScreenSource) => {
    if (source.id.includes("screen")) {
      return `Display ${source.display_id || source.id.split(":")[1]}`;
    }
    // Clean up window names
    return source.name.replace(/\s-\s.*$/, ""); // Remove everything after " - "
  };

  return (
    <div style={{ padding: 20 }}>
      <Typography.Title level={4}>Device Selection</Typography.Title>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <Typography.Text>Select Microphone</Typography.Text>
          <Select
            style={{ width: "100%" }}
            value={selectedAudio}
            onChange={setSelectedAudio}
          >
            {audioDevices.map((device) => (
              <Select.Option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </Select.Option>
            ))}
          </Select>
        </div>
        <div>
          <Typography.Text>Select Camera</Typography.Text>
          <Select
            style={{ width: "100%" }}
            value={selectedVideo}
            onChange={setSelectedVideo}
          >
            {videoDevices.map((device) => (
              <Select.Option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </Select.Option>
            ))}
          </Select>
        </div>
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Segmented
              options={[
                {
                  label: "Screen",
                  value: "screen",
                  icon: <DesktopOutlined />,
                },
                {
                  label: "Window",
                  value: "window",
                  icon: <AppstoreOutlined />,
                },
              ]}
              value={sourceType}
              onChange={(value) => setSourceType(value as SourceType)}
            />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
              gap: 16,
              marginTop: 8,
            }}
          >
            {filteredSources.map((source) => (
              <Card
                key={source.id}
                hoverable
                size="small"
                style={{
                  width: "100%",
                  border:
                    selectedScreen === source.id
                      ? "2px solid #1890ff"
                      : undefined,
                }}
                cover={
                  <div
                    style={{
                      height: 100,
                      background: "#f5f5f5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      alt={source.name}
                      src={source.thumbnailDataURL}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                    />
                  </div>
                }
                onClick={() => setSelectedScreen(source.id)}
              >
                <Card.Meta
                  title={getSourceName(source)}
                  avatar={
                    source.appIcon ? (
                      <img
                        src={source.appIcon}
                        alt=""
                        style={{ width: 16, height: 16 }}
                      />
                    ) : null
                  }
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                />
              </Card>
            ))}
          </div>
        </div>
        <Button
          type="primary"
          onClick={handleStartRecording}
          disabled={!selectedAudio || !selectedVideo || !selectedScreen}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
