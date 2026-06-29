/**
 * Canvas and Drawing Utilities
 */

import type { Stroke } from "@/types";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  BASELINE_Y,
  CAP_Y,
  UPM,
  ASCENDER,
  DESCENDER,
  ITALIC_SHEAR,
} from "@/constants";

/**
 * Convert canvas coordinates to font units
 */
export function canvasToFont(x: number, y: number): [number, number] {
  return [
    (x / CANVAS_WIDTH) * UPM,
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
 * Get effective points for chisel brush
 * Remaps pressure based on stroke angle vs nib angle
 */
export function getEffectivePoints(stroke: Stroke): [number, number, number][] {
  if (stroke.brushType !== "chisel") return stroke.points;

  const pts = stroke.points;
  return pts.map(([x, y, p], i) => {
    const prev = pts[Math.max(0, i - 1)];
    const next = pts[Math.min(pts.length - 1, i + 1)];
    const dx = next[0] - prev[0];
    const dy = next[1] - prev[1];
    const angle = Math.atan2(dy, dx);
    // Nib at 0° (horizontal): cos(angle) = 1 → thick, sin → thin
    const nibPressure = Math.pow(Math.abs(Math.cos(angle)), 1.8);
    return [x, y, p * (0.06 + nibPressure * 0.94)] as [number, number, number];
  });
}

/**
 * Get cap height to baseline distance
 */
export function getCapToBaseline(): number {
  return BASELINE_Y - CAP_Y;
}
