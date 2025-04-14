import React from "react";
import { Button, Space } from "antd";
import {
  HighlightOutlined,
  RocketOutlined,
  StopOutlined,
  ClearOutlined,
  CloseSquareOutlined,
} from "@ant-design/icons"; // Example icons

const ToolbarPage: React.FC = () => {
  const handleDrawClick = () => {
    console.log("Draw button clicked");
    // IPC call to enable drawing mode on the overlay window
    window.electronApi?.enableDrawing();
  };

  const handleConfettiClick = () => {
    console.log("Confetti button clicked");
    // TODO: Implement IPC call to trigger confetti on the drawing overlay
    // Maybe send a message directly to the drawing overlay window?
    // Example: window.electronApi?.sendToOverlay('show-confetti');
  };

  const handleStopDrawingClick = () => {
    console.log("Stop Drawing button clicked");
    // IPC call to disable drawing mode on the overlay window
    window.electronApi?.disableDrawing();
  };

  const handleClearCanvasClick = () => {
    console.log("Clear Canvas button clicked");
    window.electronApi?.clearDrawingCanvas();
  };

  const handleStopRecClick = () => {
    console.log("Stop Recording button clicked (from toolbar)");
    window.electronApi?.requestStopRecording();
  };

  return (
    <div
      style={{
        padding: "5px",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        backgroundColor: "rgba(240, 240, 240, 0.8)",
        borderRadius: "5px",
      }}
    >
      <Space direction="vertical" size="small">
        <Button
          type="primary"
          shape="circle"
          icon={<HighlightOutlined />}
          onClick={handleDrawClick}
        />
        <Button
          type="default"
          danger
          shape="circle"
          icon={<StopOutlined />} // Icon for stop/disable drawing
          onClick={handleStopDrawingClick}
        />
        <Button
          shape="circle"
          icon={<ClearOutlined />} // Icon for clear
          onClick={handleClearCanvasClick}
        />
        <Button
          shape="circle"
          icon={<RocketOutlined />} // Example icon for confetti
          onClick={handleConfettiClick}
        />
        <Button
          type="primary"
          danger
          shape="circle"
          icon={<CloseSquareOutlined />} // Icon for stop recording
          onClick={handleStopRecClick}
          style={{ marginTop: "auto" }} // Push to bottom if needed
        />
        {/* Add more tools here: color picker, emoji picker, etc. */}
      </Space>
    </div>
  );
};

export default ToolbarPage;
