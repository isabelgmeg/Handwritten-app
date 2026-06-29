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
}: DrawingCanvasProps) {
  return (
    <div
      className="relative rounded overflow-hidden w-full mx-auto shadow-md"
      style={{
        maxWidth: CW,
        aspectRatio: `${CW} / ${CH}`,
        border: "1px solid rgba(28,20,9,0.14)",
      }}
    >
      <canvas
        ref={committedRef}
        width={CW}
        height={CH}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
      <canvas
        ref={activeRef}
        width={CW}
        height={CH}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          touchAction: "none",
          cursor: "crosshair",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      />
      {showDot && dotRadius > 0 && (
        <div
          className="pointer-events-none absolute rounded-full border border-accent/60"
          style={{
            width: dotRadius * 2,
            height: dotRadius * 2,
            left: dotPos.x - dotRadius,
            top: dotPos.y - dotRadius,
            backgroundColor: "rgba(196,120,42,0.05)",
          }}
        />
      )}
    </div>
  );
}
