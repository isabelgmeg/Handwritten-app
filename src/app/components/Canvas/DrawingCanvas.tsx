import React from "react";
import { CANVAS_WIDTH as CW, CANVAS_HEIGHT as CH } from "@/constants";

interface DrawingCanvasProps {
  committedRef: React.RefObject<HTMLCanvasElement>;
  activeRef: React.RefObject<HTMLCanvasElement>;
  onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp: () => void;
  showDot: boolean;
  dotPos: { x: number; y: number };
  dotRadius: number;
  cursorStyle?: string;
  drawMode?: boolean;
}

export function DrawingCanvas({
  committedRef,
  activeRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  showDot,
  dotPos,
  dotRadius,
  cursorStyle = "crosshair",
  drawMode = true,
}: DrawingCanvasProps) {
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === "touch" && !drawMode) return;
    onPointerDown(e);
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.pointerType === "touch" && !drawMode) return;
    onPointerMove(e);
  };

  return (
    <div
      className="canvas-wrapper"
      style={{ maxWidth: CW, aspectRatio: `${CW} / ${CH}` }}
    >
      <canvas
        ref={committedRef}
        width={CW}
        height={CH}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      />
      <canvas
        ref={activeRef}
        width={CW}
        height={CH}
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          touchAction: drawMode ? "none" : "auto",
          cursor: cursorStyle,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      />
      {showDot && dotRadius > 0 && (
        <div
          className="lazy-dot"
          style={{
            width:  dotRadius * 2,
            height: dotRadius * 2,
            left:   dotPos.x - dotRadius,
            top:    dotPos.y - dotRadius,
          }}
        />
      )}
    </div>
  );
}
