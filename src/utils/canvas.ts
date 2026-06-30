/**
 * Canvas and Drawing Utilities
 */

import type { Stroke } from "@/types";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  BASELINE_Y,
  CAP_Y,
  GLYPH_ADVANCE_WIDTH_BASE,
  ASCENDER,
  DESCENDER,
  ITALIC_SHEAR,
} from "@/constants";

/**
 * Convert canvas coordinates to font units.
 * X maps canvas width → GLYPH_ADVANCE_WIDTH_BASE so the full canvas equals
 * one glyph cell; the template character at CANVAS_WIDTH/2 lands at 230 fu,
 * exactly the centre of the 460 fu advance.
 */
export function canvasToFont(x: number, y: number): [number, number] {
  return [
    (x / CANVAS_WIDTH) * GLYPH_ADVANCE_WIDTH_BASE,
    ASCENDER - (y / CANVAS_HEIGHT) * (ASCENDER - DESCENDER),
  ];
}

/**
 * Apply italic shear transformation to points
 */
export function applyItalicToPoints(
  pts: [number, number, number][],
): [number, number, number][] {
  return pts.map(
    ([x, y, p]) =>
      [x + (BASELINE_Y - y) * ITALIC_SHEAR, y, p] as [number, number, number],
  );
}

/**
 * Convert perfect-freehand points to SVG path string
 */
export function svgPathFromStroke(pts: number[][]): string {
  if (pts.length < 4) return "";
  const d: (string | number)[] = ["M", pts[0][0], pts[0][1], "Q"];
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % pts.length];
    d.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
  }
  d.push("Z");
  return d.join(" ");
}

/**
 * Create grain/texture pattern canvas
 * Deterministic - uses sin instead of Math.random() for reproducibility
 */
export function createGrainCanvas(): HTMLCanvasElement {
  const SIZE = 256;
  const c = document.createElement("canvas");
  c.width = c.height = SIZE;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(SIZE, SIZE);
  const d = img.data;

  for (let i = 0; i < d.length; i += 4) {
    const idx = i / 4;
    const x = idx % SIZE;
    const y = Math.floor(idx / SIZE);
    // Deterministic value noise
    const n = Math.abs(Math.sin(x * 127.1 + y * 311.7) * 43758.5453) % 1;
    const v = Math.floor(n * 255);
    d[i] = d[i + 1] = d[i + 2] = v;
    d[i + 3] = v; // alpha mirrors value
  }

  ctx.putImageData(img, 0, 0);
  return c;
}

/**
 * Apply grain texture to canvas path
 */
export function applyGrain(
  ctx: CanvasRenderingContext2D,
  path: Path2D,
  grainCanvas: HTMLCanvasElement,
  grain: number,
  opacity: number,
) {
  if (grain <= 0) return;
  const pattern = ctx.createPattern(grainCanvas, "repeat");
  if (!pattern) return;

  ctx.save();
  ctx.clip(path);
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = opacity * (grain / 100) * 0.55;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.restore();
}

/**
 * Remap pressure by stroke angle for nib-based brushes (chisel, calligraphy).
 * nibAngle: the orientation of the nib flat edge in radians.
 * Width is maximum when stroke is perpendicular to the nib.
 */
function angleBasedPressure(
  pts: [number, number, number][],
  nibAngle: number,
  power: number,
  baseline: number,
): [number, number, number][] {
  return pts.map(([x, y, p], i) => {
    const prev = pts[Math.max(0, i - 1)];
    const next = pts[Math.min(pts.length - 1, i + 1)];
    const dx = next[0] - prev[0];
    const dy = next[1] - prev[1];
    const angle = Math.atan2(dy, dx);
    // |sin(angle − nibAngle)|: 1 when stroke ⊥ nib (widest), 0 when stroke ∥ nib (thinnest)
    const nibPressure = Math.pow(Math.abs(Math.sin(angle - nibAngle)), power);
    return [x, y, p * (baseline + nibPressure * (1 - baseline))] as [number, number, number];
  });
}

/**
 * Get effective points, remapping pressure for angle-sensitive brushes.
 */
export function getEffectivePoints(stroke: Stroke): [number, number, number][] {
  if (stroke.brushType === "chisel") {
    // Horizontal nib (0°): cos = sin(angle − 0) rotated — use the original formula
    // Keeping as cos for backwards compatibility with existing strokes
    const pts = stroke.points;
    return pts.map(([x, y, p], i) => {
      const prev = pts[Math.max(0, i - 1)];
      const next = pts[Math.min(pts.length - 1, i + 1)];
      const dx = next[0] - prev[0];
      const dy = next[1] - prev[1];
      const angle = Math.atan2(dy, dx);
      const nibPressure = Math.pow(Math.abs(Math.cos(angle)), 1.8);
      return [x, y, p * (0.06 + nibPressure * 0.94)] as [number, number, number];
    });
  }

  if (stroke.brushType === "calligraphy") {
    // Classic broad-nib at 45°: down-left strokes thick, down-right strokes thin
    return angleBasedPressure(stroke.points, Math.PI / 4, 1.4, 0.05);
  }

  return stroke.points;
}

/**
 * Get cap height to baseline distance
 */
export function getCapToBaseline(): number {
  return BASELINE_Y - CAP_Y;
}
