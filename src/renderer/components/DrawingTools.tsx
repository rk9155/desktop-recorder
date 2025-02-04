import { Button, Popover, Space, ColorPicker, Slider } from "antd";
import {
  HighlightOutlined,
  DeleteOutlined,
  HeartOutlined,
  SmileOutlined,
  StarOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { Color } from "antd/es/color-picker";
import confetti from "canvas-confetti";

interface DrawingToolsProps {
  isDrawingMode: boolean;
  isSpotlightMode: boolean;
  onToggleDrawing: () => void;
  onToggleSpotlight: () => void;
  onColorChange: (color: string) => void;
  onStrokeWidthChange: (width: number) => void;
  onClear: () => void;
}

export function DrawingTools({
  isDrawingMode,
  isSpotlightMode,
  onToggleDrawing,
  onToggleSpotlight,
  onColorChange,
  onStrokeWidthChange,
  onClear,
}: DrawingToolsProps) {
  const handleColorChange = (color: Color) => {
    onColorChange(color.toRgbString());
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const addReaction = (type: string) => {
    const reaction = document.createElement("div");
    reaction.className = "floating-reaction";
    reaction.innerHTML = type;
    reaction.style.cssText = `
      position: fixed;
      font-size: 2em;
      pointer-events: none;
      animation: float 2s ease-out forwards;
      left: ${Math.random() * (window.innerWidth - 50)}px;
      top: ${window.innerHeight - 100}px;
    `;
    document.body.appendChild(reaction);
    setTimeout(() => reaction.remove(), 2000);
  };

  return (
    <Space direction="vertical">
      <Popover
        content={
          <div style={{ padding: "12px" }}>
            <Space direction="vertical">
              <ColorPicker onChange={handleColorChange} />
              <Slider
                min={1}
                max={20}
                defaultValue={5}
                onChange={onStrokeWidthChange}
              />
            </Space>
          </div>
        }
        trigger="click"
        placement="left"
      >
        <Button
          type={isDrawingMode ? "primary" : "default"}
          shape="circle"
          icon={<HighlightOutlined />}
          onClick={onToggleDrawing}
        />
      </Popover>

      <Button
        shape="circle"
        icon={<DeleteOutlined />}
        onClick={onClear}
        disabled={!isDrawingMode}
      />

      <Button
        shape="circle"
        icon={<HeartOutlined />}
        onClick={() => addReaction("❤️")}
      />

      <Button
        shape="circle"
        icon={<SmileOutlined />}
        onClick={() => addReaction("😊")}
      />

      <Button
        shape="circle"
        icon={<StarOutlined />}
        onClick={triggerConfetti}
      />

      <Button
        type={isSpotlightMode ? "primary" : "default"}
        shape="circle"
        icon={<SearchOutlined />}
        onClick={onToggleSpotlight}
      />
    </Space>
  );
}
