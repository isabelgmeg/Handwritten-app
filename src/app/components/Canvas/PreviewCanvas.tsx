import React from "react";

interface PreviewCanvasProps {
  previewRef: React.RefObject<HTMLCanvasElement>;
}

export function PreviewCanvas({ previewRef }: PreviewCanvasProps) {
  return (
    <div
      className="rounded overflow-hidden"
      style={{ border: "1px solid rgba(28,20,9,0.1)" }}
    >
      <canvas
        ref={previewRef}
        width={800}
        style={{ display: "block", width: "100%" }}
      />
    </div>
  );
}
