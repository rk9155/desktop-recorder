import { useEffect, useRef, useState } from "react";

interface SpotlightCanvasProps {
  isEnabled: boolean;
  spotlightSize?: number;
  zoomLevel?: number;
}

export function SpotlightCanvas({
  isEnabled,
  spotlightSize = 150,
  zoomLevel = 1.5,
}: SpotlightCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(
    null
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;

      const context = canvas.getContext("2d");
      if (context) {
        context.scale(dpr, dpr);
        contextRef.current = context;
      }
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  useEffect(() => {
    if (!isEnabled || !mousePos) return;

    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;

    const dpr = window.devicePixelRatio || 1;
    const scaledX = mousePos.x * dpr;
    const scaledY = mousePos.y * dpr;

    // Clear previous spotlight
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Create spotlight effect
    context.save();

    // Create dark overlay
    context.fillStyle = "rgba(0, 0, 0, 0.6)";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Create circular spotlight
    context.globalCompositeOperation = "destination-out";
    context.beginPath();
    context.arc(mousePos.x, mousePos.y, spotlightSize, 0, Math.PI * 2, false);
    context.fill();

    // Add spotlight border
    context.globalCompositeOperation = "source-over";
    context.strokeStyle = "#1890ff";
    context.lineWidth = 2;
    context.stroke();

    context.restore();
  }, [isEnabled, mousePos, spotlightSize]);

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isEnabled) return;
    setMousePos({
      x: event.clientX,
      y: event.clientY,
    });
  };

  const handleMouseLeave = () => {
    setMousePos(null);
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  if (!isEnabled) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "auto",
        zIndex: 1,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
