/**
 * Font Preview Renderer
 * Renders preview of font with text
 */

import type { Stroke, ScriptMode } from "@/types";
import type { CanvasTheme } from "@/utils/canvasTheme";
import {
  CANVAS_HEIGHT,
  BASELINE_Y,
  CAP_TO_BASE,
  PREVIEW_PADDING_X,
  PREVIEW_PADDING_TOP,
} from "@/constants";
import { svgPathFromStroke } from "@/utils";
import {
  layoutGlyph,
  resolveGlyphStrokes,
  spaceAdvancePx,
  legacyAdvancePx,
  type GlyphLayout,
  type LayoutVersion,
} from "./glyphLayout";

/**
 * Render font preview with text.
 * Spacing comes from glyphLayout — the same maths the font export uses — so
 * the preview matches the downloaded font.
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
  layoutVersion: LayoutVersion = "proportional",
): void {
  const legacy = layoutVersion === "legacy";
  const ctx = canvas.getContext("2d")!;
  // Canvas pixels → screen pixels: fontSizePx is the cap height
  const scale = fontSizePx / CAP_TO_BASE;
  const spaceW = spaceAdvancePx(layoutVersion) * scale;
  // lineH: baseline-to-baseline distance — fontSizePx IS the cap height (one "em"),
  // so lineHeight multiplies that directly, matching CSS line-height semantics.
  const lineH = fontSizePx * lineHeight;
  const padX = paddingX;
  const padTop = PREVIEW_PADDING_TOP;
  const fallbackFont = `${fontSizePx}px 'MyHandwriting','Amiri',serif`;

  // Lay out each distinct character once (outlines are reused for drawing)
  const layouts = new Map<string, GlyphLayout | null>();
  const layoutFor = (ch: string) => {
    if (!layouts.has(ch)) {
      // Legacy notes rendered a character's own strokes only (no accent base)
      const strokes = legacy ? (glyphs[ch] ?? []) : resolveGlyphStrokes(ch, glyphs);
      layouts.set(ch, layoutGlyph(strokes, letterSpacing, scriptMode, layoutVersion));
    }
    return layouts.get(ch)!;
  };
  // Undrawn characters fall back to a system font, measured at its own width
  const advanceFor = (ch: string) => {
    if (ch === " ") return spaceW;
    const layout = layoutFor(ch);
    if (layout) return layout.advancePx * scale;
    if (legacy) return legacyAdvancePx(letterSpacing, scriptMode) * scale;
    ctx.font = fallbackFont;
    return ctx.measureText(ch).width;
  };

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
    const w = advanceFor(ch);
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

    const advance = advanceFor(ch);
    if (x + advance > canvas.width - padX) {
      x = padX;
      lineIdx++;
    }

    const baselineY = padTop + BASELINE_Y * scale + lineIdx * lineH;
    const layout = layoutFor(ch);

    if (!layout) {
      ctx.save();
      ctx.font = fallbackFont;
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";
      ctx.fillStyle = theme.previewInk;
      ctx.fillText(ch, x, baselineY);
      ctx.restore();
    } else {
      ctx.save();
      // Put the glyph origin (originPx on the canvas) at the pen position
      ctx.translate(x - layout.originPx * scale, baselineY - BASELINE_Y * scale);
      ctx.scale(scale, scale);

      for (const { stroke, points } of layout.outlines) {
        const path = new Path2D(svgPathFromStroke(points));
        ctx.save();
        ctx.globalAlpha = stroke.opacity;
        ctx.fillStyle = theme.previewInk;
        ctx.fill(path);

        if (stroke.brushType === "ballpoint") {
          ctx.globalAlpha = stroke.opacity * 0.12;
          ctx.fillStyle = theme.previewInkFringe;
          ctx.fill(path);
        }

        ctx.restore();
      }

      ctx.restore();
    }

    x += advance;
  }
}
