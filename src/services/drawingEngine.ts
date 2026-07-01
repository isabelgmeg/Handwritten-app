/**
 * Drawing Engine
 * Handles canvas rendering, stroke drawing, and visual effects
 */

import getStroke from "perfect-freehand";
import type { Stroke, ScriptMode, BrushType, PFOptions } from "@/types";
import type { CanvasTheme } from "@/utils/canvasTheme";
import { GRAIN_TEXTURE_SIZE } from "@/constants";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  ADVANCE_CANVAS_WIDTH,
  CAP_Y,
  XHEIGHT_Y,
  BASELINE_Y,
  DESC_Y,
  GLYPH_ADVANCE_WIDTH_BASE,
  CONNECT_OVERLAP,
} from "@/constants";
import {
  svgPathFromStroke,
  applyGrain,
  getEffectivePoints,
  createGrainCanvas,
} from "@/utils";

/**
 * Draw typography guides on canvas
 */
export function drawGuides(ctx: CanvasRenderingContext2D, theme: CanvasTheme): void {
  const line = (y: number, color: string, dash: number[] = []) => {
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash(dash);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.stroke();
    ctx.restore();
  };

  line(CAP_Y,      theme.guideBase,   [5, 5]);
  line(XHEIGHT_Y,  theme.guideSoft,   [3, 5]);
  line(BASELINE_Y, theme.guideStrong, []);
  line(DESC_Y,     theme.guideSubtle, [3, 5]);

  // Vertical guide
  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = theme.guideFaint;
  ctx.lineWidth = 1;
  ctx.moveTo(34, 0);
  ctx.lineTo(34, CANVAS_HEIGHT);
  ctx.stroke();
  ctx.restore();

  // Guide labels
  ctx.save();
  ctx.font = "9px 'DM Mono',monospace";
  ctx.fillStyle = theme.guideLabel;
  ctx.fillText("cap", 38, CAP_Y - 4);
  ctx.fillText("x", 38, XHEIGHT_Y - 4);
  ctx.fillText("base", 38, BASELINE_Y - 4);
  ctx.fillText("desc", 38, DESC_Y - 4);
  ctx.restore();
}

/**
 * Returns the canvas-pixel X positions of the entry and exit anchor dots
 * for the current letter spacing and script mode. Exported so App.tsx can
 * use the same formula for pointer hit-detection without duplicating math.
 */
export function getAnchorPositions(
  letterSpacing: number,
  scriptMode: ScriptMode,
): { entryX: number; exitX: number } {
  const overlap = scriptMode === "connected" ? CONNECT_OVERLAP : 0;
  const spreadPx =
    ((GLYPH_ADVANCE_WIDTH_BASE + letterSpacing - overlap) /
      GLYPH_ADVANCE_WIDTH_BASE) *
    ADVANCE_CANVAS_WIDTH;
  const center = CANVAS_WIDTH / 2;
  return {
    entryX: Math.max(2, center - spreadPx / 2),
    exitX: Math.min(CANVAS_WIDTH - 2, center + spreadPx / 2),
  };
}

/**
 * Draw glyph boundary / connection guides, centered on the canvas.
 * Both entry and exit move symmetrically as letter spacing changes,
 * keeping the template character centred between them.
 *
 * Normal mode:  shows cell boundary lines (how wide this glyph "is")
 * Connected:    adds baseline anchor dots + shaded zones (where strokes must land)
 */
export function drawConnectionGuides(
  ctx: CanvasRenderingContext2D,
  letterSpacing: number,
  scriptMode: ScriptMode,
  anchorY: number = BASELINE_Y,
  theme: CanvasTheme,
): void {
  const { entryX, exitX } = getAnchorPositions(letterSpacing, scriptMode);

  const color    = scriptMode === "connected" ? theme.scriptLine : theme.guideBase;
  const dotColor = theme.scriptDot;
  const bandColor = theme.scriptBand;

  // Shaded connection zones (connected mode only)
  if (scriptMode === "connected") {
    ctx.save();
    ctx.fillStyle = bandColor;
    ctx.fillRect(0, 0, entryX, CANVAS_HEIGHT);
    ctx.fillRect(exitX, 0, CANVAS_WIDTH - exitX, CANVAS_HEIGHT);
    ctx.restore();
  }

  // Vertical dashed lines
  const vline = (x: number) => {
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = color;
    ctx.lineWidth = scriptMode === "connected" ? 1.5 : 1;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_HEIGHT);
    ctx.stroke();
    ctx.restore();
  };
  vline(entryX);
  vline(exitX);

  // Anchor dots + drag handle (connected mode only)
  if (scriptMode === "connected") {
    const dot = (x: number) => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, anchorY, 5, 0, Math.PI * 2);
      ctx.fillStyle = dotColor;
      ctx.fill();
      ctx.font = "bold 10px 'DM Mono',monospace";
      ctx.fillStyle = dotColor;
      ctx.textAlign = "center";
      ctx.fillText("↕", x, anchorY - 10);
      ctx.restore();
    };
    dot(entryX);
    dot(exitX);
  }

  // Labels
  ctx.save();
  ctx.font = "9px 'DM Mono',monospace";
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  const entryLabel = scriptMode === "connected" ? "entry" : "◀";
  const exitLabel  = scriptMode === "connected" ? "exit"  : "▶";
  ctx.fillText(entryLabel, entryX + 4, anchorY - 22);
  const labelW = ctx.measureText(exitLabel).width;
  const labelX =
    exitX + 4 + labelW > CANVAS_WIDTH ? exitX - labelW - 4 : exitX + 4;
  ctx.fillText(exitLabel, labelX, anchorY - 22);
  ctx.restore();
}

/**
 * Draw a template character for reference
 */
export function drawTemplate(
  ctx: CanvasRenderingContext2D,
  char: string,
  theme: CanvasTheme,
  templateFont?: string,
  italic = false,
  bold = false,
): void {
  ctx.save();
  const fontSize = (BASELINE_Y - CAP_Y) * 1.0;
  const family = templateFont
    ? `'${templateFont}'`
    : "'Open Sans', Arial, sans-serif";
  const weight = bold ? "bold " : "";
  ctx.font = `${weight}${fontSize}px ${family}`;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "center";
  ctx.fillStyle = theme.template;

  if (italic) {
    ctx.transform(
      1,
      0,
      -Math.tan((12 * Math.PI) / 180),
      1,
      BASELINE_Y * Math.tan((12 * Math.PI) / 180),
      0,
    );
  }

  ctx.fillText(char, CANVAS_WIDTH / 2, BASELINE_Y);
  ctx.restore();
}

/**
 * Apply brush-specific fill effects to a path, excluding grain.
 * Called by both drawStroke (committed) and renderActiveStroke (in-progress).
 * Assumes caller has already called ctx.save().
 */
export function applyBrushFill(
  ctx: CanvasRenderingContext2D,
  path: Path2D,
  pts: [number, number, number][],
  opts: PFOptions,
  brushType: BrushType,
  opacity: number,
  theme: CanvasTheme,
): void {
  ctx.globalAlpha = opacity;

  if (brushType === "brushpen") {
    ctx.fillStyle = theme.ink;
    ctx.fill(path);

    // Fringe: a wider, low-pressure outline clipped inside the stroke gives
    // a bristle-separation texture. Screen lightens the edge.
    const fringeOutline = getStroke(
      pts.map(([x, y, p]) => [x, y, p * 0.35] as [number, number, number]),
      { ...opts, size: opts.size * 1.55 },
    );

    if (fringeOutline.length >= 4) {
      ctx.save();
      ctx.clip(path);
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = opacity * 0.18;
      ctx.fillStyle = theme.inkFringe;
      ctx.fill(new Path2D(svgPathFromStroke(fringeOutline)));
      ctx.restore();
    }
  } else if (brushType === "marker") {
    // Multiply blend lets overlapping strokes accumulate — characteristic of
    // real markers where ink layers visibly.
    ctx.globalCompositeOperation = "multiply";
    ctx.globalAlpha = opacity * 0.72;
    ctx.fillStyle = theme.ink;
    ctx.fill(path);

    const bleedOutline = getStroke(pts, { ...opts, size: opts.size * 1.07 });
    if (bleedOutline.length >= 4) {
      ctx.globalAlpha = opacity * 0.14;
      ctx.fill(new Path2D(svgPathFromStroke(bleedOutline)));
    }
  } else {
    ctx.fillStyle = theme.ink;
    ctx.fill(path);
  }
}

// ── Ballpoint stamp renderer (Ploma technique) ────────────────────────────

let cachedGrainPixels: Uint8ClampedArray | null = null;

/** Return (and cache) the pixel data from the grain canvas for fast lookup. */
export function getOrCreateGrainPixels(): Uint8ClampedArray {
  if (!cachedGrainPixels) {
    const canvas = getOrCreateGrainCanvas();
    const ctx = canvas.getContext("2d")!;
    cachedGrainPixels = ctx.getImageData(0, 0, GRAIN_TEXTURE_SIZE, GRAIN_TEXTURE_SIZE).data;
  }
  return cachedGrainPixels;
}

/**
 * Render a ballpoint stroke as overlapping circular dabs (Ploma stamp approach).
 *
 * Input events from pointer/mouse can be 10–30 px apart on fast strokes, which
 * would leave visible gaps. We therefore interpolate between consecutive input
 * points so dabs are placed every ~10% of the stroke size regardless of speed.
 * Heavily overlapping dabs build up to a solid ink body; the edges where fewer
 * dabs overlap stay semi-transparent, giving natural rough stroke edges without
 * any extra code.
 */
export function drawBallpointDabs(
  ctx: CanvasRenderingContext2D,
  pts: [number, number, number][],
  size: number,
  opacity: number,
  grain: number,
  grainPixels: Uint8ClampedArray,
  theme: CanvasTheme,
): void {
  if (pts.length === 0) return;

  const halfSize = size / 2;
  const stepSize = Math.max(0.5, halfSize * 0.2);

  ctx.save();
  ctx.fillStyle = theme.ink;

  for (let i = 0; i < pts.length; i++) {
    const [x0, y0, p0] = pts[i];
    const [x1, y1, p1] = pts[Math.min(i + 1, pts.length - 1)];
    const dx = x1 - x0;
    const dy = y1 - y0;
    const segLen = i < pts.length - 1 ? Math.sqrt(dx * dx + dy * dy) : 0;
    const steps = Math.max(1, Math.ceil(segLen / stepSize));

    for (let s = 0; s < steps; s++) {
      const t = steps > 1 ? s / steps : 0;
      const x = x0 + dx * t;
      const y = y0 + dy * t;
      const p = p0 + (p1 - p0) * t;

      const r = halfSize * (0.35 + p * 0.65);

      const gx = Math.abs(Math.round(x)) % GRAIN_TEXTURE_SIZE;
      const gy = Math.abs(Math.round(y)) % GRAIN_TEXTURE_SIZE;
      const grainVal = grainPixels[(gy * GRAIN_TEXTURE_SIZE + gx) * 4] / 255;
      const skipFactor = 1 - grainVal * (grain / 100) * 0.75;

      const dabAlpha = opacity * (0.25 + p * 0.15) * skipFactor;

      ctx.globalAlpha = Math.max(0, Math.min(1, dabAlpha));
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

/**
 * Draw a single stroke with all visual effects
 */
export function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  grainCanvas: HTMLCanvasElement,
  grain = 0,
  theme: CanvasTheme,
): void {
  if (stroke.brushType === "ballpoint") {
    const grainPixels = getOrCreateGrainPixels();
    drawBallpointDabs(ctx, stroke.points, stroke.options.size, stroke.opacity, grain, grainPixels, theme);
    return;
  }

  const pts = getEffectivePoints(stroke);
  const outline = getStroke(pts, stroke.options);
  if (outline.length < 4) return;

  const path = new Path2D(svgPathFromStroke(outline));

  ctx.save();
  applyBrushFill(ctx, path, pts, stroke.options, stroke.brushType, stroke.opacity, theme);
  ctx.globalAlpha = stroke.opacity;
  applyGrain(ctx, path, grainCanvas, grain, stroke.opacity);
  ctx.restore();
}

/**
 * Render base-character strokes as a semi-transparent ghost layer.
 * Uses an offscreen canvas so each stroke's own opacity settings are respected
 * before the whole layer is composited at a reduced alpha.
 */
export function drawGhostStrokes(
  ctx: CanvasRenderingContext2D,
  baseStrokes: Stroke[],
  grainCanvas: HTMLCanvasElement,
  grain: number,
  theme: CanvasTheme,
): void {
  if (!baseStrokes.length) return;

  const offscreen = document.createElement("canvas");
  offscreen.width = CANVAS_WIDTH;
  offscreen.height = CANVAS_HEIGHT;
  const offCtx = offscreen.getContext("2d")!;

  for (const s of baseStrokes) {
    drawStroke(offCtx, s, grainCanvas, grain, theme);
  }

  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.drawImage(offscreen, 0, 0);
  ctx.restore();
}

/**
 * Full canvas redraw with all elements
 */
export function fullRedraw(
  canvas: HTMLCanvasElement,
  strokes: Stroke[],
  char: string,
  showGuides: boolean,
  showTemplate: boolean,
  grain: number,
  grainCanvas: HTMLCanvasElement,
  theme: CanvasTheme,
  templateFont?: string,
  isItalic = false,
  scriptMode: ScriptMode = "normal",
  letterSpacing = 0,
  anchorY: number = BASELINE_Y,
  baseStrokes?: Stroke[],
  isBold = false,
): void {
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (showGuides) drawGuides(ctx, theme);
  drawConnectionGuides(ctx, letterSpacing, scriptMode, anchorY, theme);
  if (showTemplate && char) drawTemplate(ctx, char, theme, templateFont, isItalic, isBold);

  if (baseStrokes?.length) drawGhostStrokes(ctx, baseStrokes, grainCanvas, grain, theme);

  for (const s of strokes) {
    drawStroke(ctx, s, grainCanvas, grain, theme);
  }
}

/**
 * Create and cache grain canvas on first use
 */
let cachedGrainCanvas: HTMLCanvasElement | null = null;

export function getOrCreateGrainCanvas(): HTMLCanvasElement {
  if (!cachedGrainCanvas) {
    cachedGrainCanvas = createGrainCanvas();
  }
  return cachedGrainCanvas;
}
