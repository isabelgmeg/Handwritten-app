/**
 * Font Preview Renderer
 * Renders preview of font with text
 */

import getStroke from "perfect-freehand";
import type { Stroke, ScriptMode } from "@/types";
import type { CanvasTheme } from "@/utils/canvasTheme";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  BASELINE_Y,
  CAP_TO_BASE,
  GLYPH_ADVANCE_WIDTH_BASE,
  SPACE_WIDTH,
  PREVIEW_PADDING_X,
  PREVIEW_PADDING_TOP,
  PREVIEW_LINE_HEIGHT_MULTIPLIER,
  CONNECT_OVERLAP,
} from "@/constants";
import { svgPathFromStroke, getEffectivePoints } from "@/utils";

/**
 * Render font preview with text
 */
export function renderPreview(
  canvas: HTMLCanvasElement,
  text: string,
  glyphs: Record<string, Stroke[]>,
  fontSizePx: number,
  letterSpacing: number,
  theme: CanvasTheme,
  scriptMode: ScriptMode = "normal",
): void {
  const ctx = canvas.getContext("2d")!;
  const scale = fontSizePx / CAP_TO_BASE;

  // Convert font units → screen pixels (canvas width === one glyph advance cell)
  const fuToPx = (scale * CANVAS_WIDTH) / GLYPH_ADVANCE_WIDTH_BASE;
  const overlap = scriptMode === "connected" ? CONNECT_OVERLAP : 0;
  const advanceW = (GLYPH_ADVANCE_WIDTH_BASE + letterSpacing - overlap) * fuToPx;
  const spaceW = SPACE_WIDTH * fuToPx;
  const lineH = CANVAS_HEIGHT * scale * PREVIEW_LINE_HEIGHT_MULTIPLIER;
  const padX = PREVIEW_PADDING_X;
  const padTop = PREVIEW_PADDING_TOP;

  // Measure total height (word wrap)
  let x = padX;
  let lines = 1;
  const chars = text.replace(/\n/g, " \n ").split("");

  for (const ch of chars) {
    if (ch === "\n") {
      x = padX;
      lines++;
      continue;
    }
    const w = ch === " " ? spaceW : advanceW;
    if (ch !== " " && x + w > canvas.width - padX) {
      x = padX;
      lines++;
    }
    x += w;
  }

  const totalH = padTop + lines * lineH + CANVAS_HEIGHT * scale * 0.3 + padTop;
  canvas.height = Math.max(80, totalH);

  // Background — transparent so wrapper bg shows through
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Baseline rules
  for (let l = 0; l < lines + 1; l++) {
    const by = padTop + BASELINE_Y * scale + l * lineH;
    ctx.save();
    ctx.strokeStyle = theme.previewRule;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX - 8, by);
    ctx.lineTo(canvas.width - padX + 8, by);
    ctx.stroke();
    ctx.restore();
  }

  // Render glyphs
  x = padX;
  let lineIdx = 0;

  for (const ch of chars) {
    if (ch === "\n") {
      x = padX;
      lineIdx++;
      continue;
    }

    if (ch === " ") {
      x += spaceW;
      continue;
    }

    if (ch !== " " && x + advanceW > canvas.width - padX) {
      x = padX;
      lineIdx++;
    }

    const baselineY = padTop + BASELINE_Y * scale + lineIdx * lineH;
    const strokes = glyphs[ch];

    if (!strokes || strokes.length === 0) {
      // Placeholder
      ctx.save();
      ctx.strokeStyle = theme.placeholderLine;
      ctx.lineWidth = 0.75;
      ctx.setLineDash([2, 3]);
      ctx.strokeRect(
        x + 2,
        baselineY - CAP_TO_BASE * scale,
        advanceW - 4,
        CAP_TO_BASE * scale,
      );
      ctx.font = `${fontSizePx * 0.7}px 'Playfair Display',serif`;
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";
      ctx.fillStyle = theme.placeholderFill;
      ctx.fillText(ch, x + 4, baselineY);
      ctx.restore();
    } else {
      ctx.save();
      ctx.translate(x, baselineY - BASELINE_Y * scale);
      ctx.scale(scale, scale);

      for (const stroke of strokes) {
        const outline = getStroke(getEffectivePoints(stroke), stroke.options);
        if (outline.length < 4) continue;

        ctx.save();
        ctx.globalAlpha = stroke.opacity;
        ctx.fillStyle = theme.ink;
        ctx.fill(new Path2D(svgPathFromStroke(outline)));

        if (stroke.brushType === "ballpoint") {
          ctx.globalAlpha = stroke.opacity * 0.12;
          ctx.fillStyle = theme.inkFringe;
          ctx.fill(new Path2D(svgPathFromStroke(outline)));
        }

        ctx.restore();
      }

      ctx.restore();
    }

    x += advanceW;
  }
}
