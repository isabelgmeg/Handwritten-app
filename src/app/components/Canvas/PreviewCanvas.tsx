import { useRef, useEffect, useCallback, useState } from "react";
import { renderPreview, type GlyphHit } from "@/services";
import { getCanvasTheme } from "@/utils";
import type { Stroke, ScriptMode } from "@/types";
import type { LayoutVersion } from "@/services/glyphLayout";

interface PreviewCanvasProps {
  previewText: string;
  glyphs: Record<string, Stroke[]>;
  previewSize: number;
  letterSpacing: number;
  lineHeight: number;
  scriptMode: ScriptMode;
  inkColor?: string;
  paddingX?: number;
  /** "legacy" = pre-v2 fixed-cell spacing, for notes shared before v2 */
  layoutVersion?: LayoutVersion;
  /** Show cap-height and x-height lines */
  guides?: boolean;
  /** Shrink the text so every line fits without wrapping */
  fitLines?: boolean;
  /** Space above the first line and below the last, in CSS pixels */
  padY?: number;
  /** Called with the character under the pointer when the preview is clicked */
  onGlyphClick?: (char: string) => void;
  /** Which characters onGlyphClick accepts; others aren't clickable */
  isGlyphClickable?: (char: string) => boolean;
}

export function PreviewCanvas({
  previewText,
  glyphs,
  previewSize,
  letterSpacing,
  lineHeight,
  scriptMode,
  inkColor,
  paddingX,
  layoutVersion,
  guides,
  fitLines,
  padY,
  onGlyphClick,
  isGlyphClickable,
}: PreviewCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Keep render params in a ref so the ResizeObserver always reads fresh values
  const paramsRef = useRef({ previewText, glyphs, previewSize, letterSpacing, lineHeight, scriptMode, inkColor, paddingX, layoutVersion, guides, fitLines, padY });
  paramsRef.current = { previewText, glyphs, previewSize, letterSpacing, lineHeight, scriptMode, inkColor, paddingX, layoutVersion, guides, fitLines, padY };
  const hitsRef = useRef<GlyphHit[]>([]);
  // Cell behind the clickable character under the pointer
  const [hover, setHover] = useState<GlyphHit | null>(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const w = wrapper.clientWidth;
    if (w <= 0) return;
    canvas.width = w;
    const { previewText, glyphs, previewSize, letterSpacing, lineHeight, scriptMode, inkColor, paddingX, layoutVersion, guides, fitLines, padY } = paramsRef.current;
    const base = getCanvasTheme();
    const theme = inkColor
      ? { ...base, previewInk: inkColor, previewInkFringe: inkColor, placeholderFill: inkColor, previewMissing: inkColor }
      : base;
    hitsRef.current = renderPreview(
      canvas, previewText, glyphs, previewSize, letterSpacing, theme, scriptMode, lineHeight, paddingX, layoutVersion, { guides, fitLines, padY },
    );
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
  }, [previewText, glyphs, previewSize, letterSpacing, lineHeight, scriptMode, inkColor, paddingX, layoutVersion, guides, fitLines, padY, render]);

  const hitAt = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const hit = hitsRef.current.find((h) => x >= h.x0 && x < h.x1 && y >= h.y0 && y < h.y1);
    return hit && (!isGlyphClickable || isGlyphClickable(hit.char)) ? hit : null;
  };

  // Text or size changes move every character: drop a stale hover cell
  useEffect(() => setHover(null), [previewText, previewSize, letterSpacing, scriptMode]);

  return (
    <div ref={wrapperRef} className="preview-wrapper" style={onGlyphClick ? { position: "relative" } : undefined}>
      {hover && (
        <div
          className="preview-hover-cell"
          aria-hidden
          style={{ left: hover.x0, top: hover.y0, width: hover.x1 - hover.x0, height: hover.y1 - hover.y0 }}
        />
      )}
      <canvas
        ref={canvasRef}
        style={{ display: "block", position: "relative", cursor: onGlyphClick && hover ? "pointer" : undefined }}
        onClick={onGlyphClick ? (e) => { const h = hitAt(e); if (h) onGlyphClick(h.char); } : undefined}
        onMouseMove={onGlyphClick ? (e) => {
          const h = hitAt(e);
          setHover((prev) => (prev?.x0 === h?.x0 && prev?.y0 === h?.y0 ? prev : h));
        } : undefined}
        onMouseLeave={onGlyphClick ? () => setHover(null) : undefined}
      />
    </div>
  );
}
