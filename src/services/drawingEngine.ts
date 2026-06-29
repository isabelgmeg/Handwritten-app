/**
 * Drawing Engine
 * Handles canvas rendering, stroke drawing, and visual effects
 */

import getStroke from "perfect-freehand";
import type { Stroke } from "@/types";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CAP_Y,
  XHEIGHT_Y,
  BASELINE_Y,
  DESC_Y,
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
export function drawGuides(ctx: CanvasRenderingContext2D): void {
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

  line(CAP_Y, "rgba(196,120,42,0.38)", [5, 5]);
  line(XHEIGHT_Y, "rgba(196,120,42,0.25)", [3, 5]);
  line(BASELINE_Y, "rgba(196,120,42,0.58)", []);
  line(DESC_Y, "rgba(196,120,42,0.20)", [3, 5]);

  // Vertical guide
  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = "rgba(196,120,42,0.16)";
  ctx.lineWidth = 1;
  ctx.moveTo(34, 0);
  ctx.lineTo(34, CANVAS_HEIGHT);
  ctx.stroke();
  ctx.restore();

  // Guide labels
  ctx.save();
  ctx.font = "9px 'DM Mono',monospace";
  ctx.fillStyle = "rgba(196,120,42,0.5)";
  ctx.fillText("cap", 38, CAP_Y - 4);
  ctx.fillText("x", 38, XHEIGHT_Y - 4);
  ctx.fillText("base", 38, BASELINE_Y - 4);
  ctx.fillText("desc", 38, DESC_Y - 4);
  ctx.restore();
}

/**
 * Draw a template character for reference
 */
export function drawTemplate(
  ctx: CanvasRenderingContext2D,
  char: string,
  templateFont?: string,
  italic = false,
): void {
  ctx.save();
  const fontSize = (BASELINE_Y - CAP_Y) * (templateFont ? 1.0 : 1.4);
  const family = templateFont
    ? `'${templateFont}'`
    : "'Pinyon Script', 'Great Vibes', cursive";
  ctx.font = `${fontSize}px ${family}`;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(196,120,42,0.14)";

  if (italic) {
    // Shear the canvas to slant the template letter ~12°
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
 * Draw a single stroke with all visual effects
 */
export function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke,
  grainCanvas: HTMLCanvasElement,
  grain = 0,
): void {
  const pts = getEffectivePoints(stroke);
  const outline = getStroke(pts, stroke.options);
  if (outline.length < 4) return;

  const path = new Path2D(svgPathFromStroke(outline));

  ctx.save();
  ctx.globalAlpha = stroke.opacity;

  if (stroke.brushType === "ballpoint") {
    ctx.fillStyle = "#1a1835";
    ctx.fill(path);
    ctx.globalAlpha = stroke.opacity * 0.18;
    ctx.fillStyle = "#4a4aaa";
    ctx.fill(path);
  } else if (stroke.brushType === "brushpen") {
    ctx.fillStyle = "#080808";
    ctx.fill(path);

    const fringeOutline = getStroke(
      pts.map(([x, y, p]) => [x, y, p * 0.35] as [number, number, number]),
      { ...stroke.options, size: stroke.options.size * 1.55 },
    );

    if (fringeOutline.length >= 4) {
      ctx.save();
      ctx.clip(path);
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = stroke.opacity * 0.18;
      ctx.fillStyle = "#555555";
      ctx.fill(new Path2D(svgPathFromStroke(fringeOutline)));
      ctx.restore();
    }
  } else if (stroke.brushType === "marker") {
    ctx.globalCompositeOperation = "multiply";
    ctx.globalAlpha = stroke.opacity * 0.72;
    ctx.fillStyle = "#1c1409";
    ctx.fill(path);

    const bleedOutline = getStroke(pts, {
      ...stroke.options,
      size: stroke.options.size * 1.07,
    });

    if (bleedOutline.length >= 4) {
      ctx.globalAlpha = stroke.opacity * 0.14;
      ctx.fill(new Path2D(svgPathFromStroke(bleedOutline)));
    }
  } else if (stroke.brushType === "chisel") {
    ctx.fillStyle = "#1c1409";
    ctx.fill(path);
  } else {
    ctx.fillStyle = "#1c1409";
    ctx.fill(path);
  }

  ctx.globalAlpha = stroke.opacity;
  applyGrain(ctx, path, grainCanvas, grain, stroke.opacity);
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
  templateFont?: string,
  isItalic = false,
): void {
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.fillStyle = "#faf6f0";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  if (showGuides) drawGuides(ctx);
  if (showTemplate && char) drawTemplate(ctx, char, templateFont, isItalic);

  for (const s of strokes) {
    drawStroke(ctx, s, grainCanvas, grain);
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
