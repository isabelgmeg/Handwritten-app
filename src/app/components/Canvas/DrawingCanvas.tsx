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
}: DrawingCanvasProps) {
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
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", touchAction: "none", cursor: cursorStyle }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
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
