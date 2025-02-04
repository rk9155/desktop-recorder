import { useEffect, useState, useRef } from "react";
import { DrawingCanvas } from "./DrawingCanvas";
import { DrawingTools } from "./DrawingTools";
import { SpotlightCanvas } from "./SpotlightCanvas";

export function OverlayWindow() {
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isSpotlightMode, setIsSpotlightMode] = useState(false);
  const [drawingColor, setDrawingColor] = useState("#ff0000");
  const [strokeWidth, setStrokeWidth] = useState(5);
  const canvasRef = useRef<{ clear: () => void }>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.electronApi?.setOverlayInteractive(isDrawingMode || isSpotlightMode);

    const toolsContainer = containerRef.current?.querySelector(
      ".drawing-tools-container"
    );
    if (toolsContainer) {
      toolsContainer.addEventListener("mouseenter", () => {
        window.electronApi?.setOverlayInteractive(true);
      });
      toolsContainer.addEventListener("mouseleave", () => {
        if (!isDrawingMode) {
          window.electronApi?.setOverlayInteractive(false);
        }
      });
    }

    // Set initial size
    const updateSize = () => {
      if (containerRef.current) {
        containerRef.current.style.width = `${window.innerWidth}px`;
        containerRef.current.style.height = `${window.innerHeight}px`;
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [isDrawingMode, isSpotlightMode]);

  const handleToggleSpotlight = () => {
    setIsSpotlightMode(!isSpotlightMode);
    if (isDrawingMode) setIsDrawingMode(false);
  };

  const handleToggleDrawing = () => {
    setIsDrawingMode(!isDrawingMode);
    if (isSpotlightMode) setIsSpotlightMode(false);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: isDrawingMode || isSpotlightMode ? "auto" : "none",
        border: "2px solid #1890ff",
        boxSizing: "border-box",
        backgroundColor: "transparent",
        overflow: "hidden",
      }}
    >
      <DrawingCanvas
        ref={canvasRef}
        isEnabled={isDrawingMode}
        color={drawingColor}
        strokeWidth={strokeWidth}
      />
      <SpotlightCanvas isEnabled={isSpotlightMode} spotlightSize={100} />
      <div
        className="drawing-tools-container"
        style={{
          position: "fixed",
          right: 20,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "auto",
          backgroundColor: "white",
          padding: "10px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          zIndex: 2,
        }}
      >
        <DrawingTools
          isDrawingMode={isDrawingMode}
          isSpotlightMode={isSpotlightMode}
          onToggleDrawing={handleToggleDrawing}
          onToggleSpotlight={handleToggleSpotlight}
          onColorChange={setDrawingColor}
          onStrokeWidthChange={setStrokeWidth}
          onClear={() => canvasRef.current?.clear()}
        />
      </div>
    </div>
  );
}
