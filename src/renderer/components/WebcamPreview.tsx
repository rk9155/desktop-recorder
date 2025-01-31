import { useEffect, useRef, useState } from "react";
import { Button } from "antd";
import { DragOutlined } from "@ant-design/icons";

export default function WebcamPreview() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({
    x: 20,
    y: window.innerHeight - 220,
  });

  useEffect(() => {
    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    };
    startWebcam();

    return () => {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // Update position when window is resized
  useEffect(() => {
    const handleResize = () => {
      if (!isDragging) {
        setPosition({
          x: 20,
          y: window.innerHeight - 220,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const container = containerRef.current;
    if (container) {
      const startX = e.pageX - position.x;
      const startY = e.pageY - position.y;

      const handleMouseMove = (e: MouseEvent) => {
        const maxX = window.screen.width - 220;
        const maxY = window.screen.height - 220;

        setPosition({
          x: Math.min(Math.max(0, e.pageX - startX), maxX),
          y: Math.min(Math.max(0, e.pageY - startY), maxY),
        });
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        width: 200,
        height: 200,
        borderRadius: "50%",
        overflow: "hidden",
        boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
        backgroundColor: "#000",
        cursor: isDragging ? "grabbing" : "grab",
        WebkitAppRegion: "drag",
        zIndex: 9999,
      }}
      onMouseDown={handleMouseDown}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: "scaleX(-1)", // Mirror effect
        }}
      />
      <Button
        icon={<DragOutlined />}
        size="small"
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          background: "rgba(0,0,0,0.5)",
          borderColor: "transparent",
          color: "#fff",
        }}
      />
    </div>
  );
}
