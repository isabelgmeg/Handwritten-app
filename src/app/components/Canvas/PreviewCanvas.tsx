import { useRef, useEffect, useCallback } from "react";
import { renderPreview } from "@/services";
import { getCanvasTheme } from "@/utils";
import type { Stroke, ScriptMode } from "@/types";

interface PreviewCanvasProps {
  previewText: string;
  glyphs: Record<string, Stroke[]>;
  previewSize: number;
  letterSpacing: number;
  scriptMode: ScriptMode;
}

export function PreviewCanvas({
  previewText,
  glyphs,
  previewSize,
  letterSpacing,
  scriptMode,
}: PreviewCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Keep render params in a ref so the ResizeObserver always reads fresh values
  const paramsRef = useRef({ previewText, glyphs, previewSize, letterSpacing, scriptMode });
  paramsRef.current = { previewText, glyphs, previewSize, letterSpacing, scriptMode };

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const w = wrapper.clientWidth;
    if (w <= 0) return;
    canvas.width = w;
    const { previewText, glyphs, previewSize, letterSpacing, scriptMode } = paramsRef.current;
    renderPreview(canvas, previewText, glyphs, previewSize, letterSpacing, getCanvasTheme(), scriptMode);
  }, []);

  // Observe container width changes and re-render
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const ro = new ResizeObserver(render);
    ro.observe(wrapper);
    return () => ro.disconnect();
  }, [render]);

  // Re-render whenever props change
  useEffect(() => {
    render();
  }, [previewText, glyphs, previewSize, letterSpacing, scriptMode, render]);

  return (
    <div ref={wrapperRef} className="preview-wrapper">
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}
