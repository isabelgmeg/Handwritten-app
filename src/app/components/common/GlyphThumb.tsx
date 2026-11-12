import { memo, useMemo } from "react";
import getStroke from "perfect-freehand";
import type { Stroke } from "@/types";
import { getEffectivePoints, svgPathFromStroke } from "@/utils";

// Fixed square crop of the drawing canvas (ascender → descender) shared by
// every thumbnail, so glyphs keep their relative size and common baseline.
const VIEW_BOX = "10 40 400 400";

export const GlyphThumb = memo(function GlyphThumb({ strokes }: { strokes: Stroke[] }) {
  const paths = useMemo(
    () =>
      strokes.map((stroke) => ({
        d: svgPathFromStroke(getStroke(getEffectivePoints(stroke), stroke.options)),
        opacity: stroke.opacity,
      })),
    [strokes],
  );

  return (
    <svg className="char-btn-glyph" viewBox={VIEW_BOX} aria-hidden="true">
      {paths.map((p, i) => p.d && <path key={i} d={p.d} fill="currentColor" fillOpacity={p.opacity} />)}
    </svg>
  );
});
