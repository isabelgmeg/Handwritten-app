/**
 * Font Preview Renderer
 * Renders preview of font with text
 */

import getStroke from "perfect-freehand";
import type { Stroke, ScriptMode } from "@/types";
import type { CanvasTheme } from "@/utils/canvasTheme";
import {
  CANVAS_HEIGHT,
  ADVANCE_CANVAS_WIDTH,
  BASELINE_Y,
  CAP_TO_BASE,
  GLYPH_ADVANCE_WIDTH_BASE,
  SPACE_WIDTH,
  PREVIEW_PADDING_X,
  PREVIEW_PADDING_TOP,
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
  lineHeight: number = 1.15,
  paddingX: number = PREVIEW_PADDING_X,
): void {
  const ctx = canvas.getContext("2d")!;
  const scale = fontSizePx / CAP_TO_BASE;

  // Convert font units → screen pixels using ADVANCE_CANVAS_WIDTH (narrower than CANVAS_WIDTH)
  const fuToPx = (scale * ADVANCE_CANVAS_WIDTH) / GLYPH_ADVANCE_WIDTH_BASE;
  const overlap = scriptMode === "connected" ? CONNECT_OVERLAP : 0;
  const advanceW = (GLYPH_ADVANCE_WIDTH_BASE + letterSpacing - overlap) * fuToPx;
  const spaceW = SPACE_WIDTH * fuToPx;
  // lineH: baseline-to-baseline distance — fontSizePx IS the cap height (one "em"),
  // so lineHeight multiplies that directly, matching CSS line-height semantics.
  // (Previous bug: used CANVAS_HEIGHT * scale ≈ 1.82 × fontSizePx, inflating every
  //  lineHeight value by ~1.82 and producing ~2× spacing at the default 1.15 setting.)
  const lineH = fontSizePx * lineHeight;
  const padX = paddingX;
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

  // Total height: (lines-1) baseline-to-baseline gaps + one full glyph body (cap→descender) + padding
  const totalH = padTop + (lines - 1) * lineH + CANVAS_HEIGHT * scale + padTop;
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
      // Fallback: render with the handwriting font instead of the template outline
      ctx.save();
      ctx.font = `${fontSizePx}px 'MyHandwriting','Amiri',serif`;
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";
      ctx.fillStyle = theme.previewInk;
      ctx.fillText(ch, x, baselineY);
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
        ctx.fillStyle = theme.previewInk;
        ctx.fill(new Path2D(svgPathFromStroke(outline)));

        if (stroke.brushType === "ballpoint") {
          ctx.globalAlpha = stroke.opacity * 0.12;
          ctx.fillStyle = theme.previewInkFringe;
          ctx.fill(new Path2D(svgPathFromStroke(outline)));
        }

        ctx.restore();
      }

      ctx.restore();
    }

    x += advanceW;
  }
}
