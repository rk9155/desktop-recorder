import React, { useEffect, useRef, useState } from "react";

// Define a type for the border dimensions
interface BorderBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

const DrawingOverlayPage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  // State for the yellow border bounds
  const [borderBounds, setBorderBounds] = useState<BorderBounds | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      // Make canvas fill the window
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "yellow"; // Default drawing color
        ctx.lineWidth = 5;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        setContext(ctx);
      }
    }

    // Example: Listen for IPC messages (e.g., to show confetti)
    // const handleShowConfetti = () => { /* ... confetti logic ... */ };
    // window.electronApi?.onMessageFromMain('show-confetti', handleShowConfetti);
    // return () => window.electronApi?.removeMessageListener('show-confetti');

    // --- Real IPC Listener for Border Bounds ---
    const handleUpdateBounds = (bounds: BorderBounds) => {
      console.log("Received border bounds via IPC:", bounds);
      setBorderBounds(bounds);
    };

    window.electronApi?.onUpdateBorderBounds(handleUpdateBounds);

    // Cleanup listener on unmount
    return () => {
      window.electronApi?.removeBorderBoundsListener();
    };
    // --- End of Real IPC Listener ---
  }, []);

  // --- Listener for Clear Canvas Execution ---
  useEffect(() => {
    const doClear = () => {
      if (context && canvasRef.current) {
        console.log("Received do-clear-canvas request.");
        context.clearRect(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
      }
    };

    window.electronApi?.onDoClearCanvas(doClear);

    return () => {
      window.electronApi?.removeDoClearCanvasListener();
    };
  }, [context]); // Re-run if context changes
  // --- End Listener ---

  const startDrawing = ({
    nativeEvent,
  }: React.MouseEvent<HTMLCanvasElement>) => {
    if (!context) return;
    const { offsetX, offsetY } = nativeEvent;
    context.beginPath();
    context.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const stopDrawing = () => {
    if (!context) return;
    context.closePath();
    setIsDrawing(false);
  };

  const draw = ({ nativeEvent }: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context) return;
    const { offsetX, offsetY } = nativeEvent;
    context.lineTo(offsetX, offsetY);
    context.stroke();
  };

  // Logic to clear canvas (Now triggered by IPC)
  const clearCanvas = () => {
    if (context && canvasRef.current) {
      context.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
    }
  };

  // TODO: Implement logic to change color/brush size based on toolbar selection (via IPC?)
  // TODO: Implement yellow border logic

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      {/* Yellow Border Div */}
      {borderBounds && (
        <div
          style={{
            position: "absolute",
            left: `${borderBounds.x}px`,
            top: `${borderBounds.y}px`,
            width: `${borderBounds.width}px`,
            height: `${borderBounds.height}px`,
            border: "5px solid yellow", // Yellow border style
            pointerEvents: "none", // Ensure border doesn't block clicks
            boxSizing: "border-box", // Include border in width/height calculation
            zIndex: 0, // Keep border behind canvas
          }}
        />
      )}

      {/* Drawing Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing} // Stop drawing if mouse leaves canvas
        onMouseMove={draw}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 1,
          pointerEvents: "auto",
        }}
        // pointerEvents will be toggled by main process via setIgnoreMouseEvents
      />
    </div>
  );
};

export default DrawingOverlayPage;
