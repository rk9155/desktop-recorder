import { Button, Typography } from "antd";
import {
  HashRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import appLogo from "../assets/images/app-logo.png";
import { useEffect, useState } from "react";
import DeviceSelection from "./components/DeviceSelection";
import WebcamPreview from "./components/WebcamPreview";
import RecordingPage from "./components/RecordingPage";

function PermissionsPage() {
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState<Record<string, boolean>>({
    audio: false,
    video: false,
    screen: false,
    accessibility: false,
  });

  const handleGetAudioPermissions = async () => {
    const permission = await window?.electronApi?.getAudioPermissions();
    setPermissions((prev) => ({ ...prev, audio: permission }));
  };

  const handleGetVideoPermissions = async () => {
    const permission = await window?.electronApi?.getVideoPermissions();
    setPermissions((prev) => ({ ...prev, video: permission }));
  };

  const handleGetScreenPermissions = async () => {
    const permission = await window?.electronApi?.getScreenPermissions();
    setPermissions((prev) => ({ ...prev, screen: permission }));
  };

  const handleGetAccessibilityPermissions = async () => {
    const permission = await window?.electronApi?.getAccessibilityPermissions();
    setPermissions((prev) => ({ ...prev, accessibility: permission }));
  };

  useEffect(() => {
    handleGetAudioPermissions();
    handleGetVideoPermissions();
    handleGetScreenPermissions();
    handleGetAccessibilityPermissions();
  }, []);

  const handleProceed = () => {
    navigate("/device-selection");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
        }}
      >
        <img src={appLogo} alt="logo" style={{ width: 100, height: "auto" }} />
        <Typography.Title level={5} style={{ margin: 0 }}>
          Welcome to Jeeves 👋🏻
        </Typography.Title>
        <Typography.Text type="secondary">
          Enable permissions to get started.
        </Typography.Text>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 10,
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Typography.Text>Camera</Typography.Text>
          <Button
            onClick={handleGetVideoPermissions}
            disabled={permissions.video}
          >
            {permissions.video ? "Enabled" : "Enable"}
          </Button>
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Typography.Text>Microphone</Typography.Text>
          <Button
            onClick={handleGetAudioPermissions}
            disabled={permissions.audio}
          >
            {permissions.audio ? "Enabled" : "Enable"}
          </Button>
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Typography.Text>Accessibility</Typography.Text>
          <Button
            onClick={handleGetAccessibilityPermissions}
            disabled={permissions.accessibility}
          >
            {permissions.accessibility ? "Enabled" : "Enable"}
          </Button>
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Typography.Text>Screen Recording</Typography.Text>
          <Button
            onClick={handleGetScreenPermissions}
            disabled={permissions.screen}
          >
            {permissions.screen ? "Enabled" : "Enable"}
          </Button>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Button
          type="primary"
          onClick={handleProceed}
          disabled={!Object.values(permissions).every(Boolean)}
        >
          Proceed
        </Button>
      </div>
    </div>
  );
}

function WebcamWindow() {
  return <WebcamPreview />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PermissionsPage />} />
        <Route path="/device-selection" element={<DeviceSelection />} />
        <Route path="/recording" element={<RecordingPage />} />
        <Route path="/webcam" element={<WebcamWindow />} />
      </Routes>
    </Router>
  );
}
