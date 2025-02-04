import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";

interface DrawingCanvasProps {
  isEnabled: boolean;
  color: string;
  strokeWidth: number;
}

export const DrawingCanvas = forwardRef<
  { clear: () => void },
  DrawingCanvasProps
>(({ isEnabled, color, strokeWidth }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const context = canvas.getContext("2d");
      if (context) {
        context.scale(dpr, dpr);
        context.lineCap = "round";
        context.strokeStyle = color;
        context.lineWidth = strokeWidth;
        contextRef.current = context;
      }
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, [color, strokeWidth]);

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isEnabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    contextRef.current?.beginPath();
    contextRef.current?.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isEnabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    contextRef.current?.lineTo(x, y);
    contextRef.current?.stroke();
  };

  const stopDrawing = () => {
    if (!isEnabled) return;
    contextRef.current?.closePath();
    setIsDrawing(false);
  };

  useImperativeHandle(ref, () => ({
    clear: () => {
      const canvas = canvasRef.current;
      const context = contextRef.current;
      if (!canvas || !context) return;
      context.clearRect(0, 0, canvas.width, canvas.height);
    },
  }));

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        touchAction: "none",
      }}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
    />
  );
});
