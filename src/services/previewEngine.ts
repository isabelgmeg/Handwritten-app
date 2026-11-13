/**
 * Font Preview Renderer
 * Renders preview of font with text
 */

import type { Stroke, ScriptMode } from "@/types";
import type { CanvasTheme } from "@/utils/canvasTheme";
import {
  CANVAS_HEIGHT,
  BASELINE_Y,
  DESC_Y,
  CAP_Y,
  XHEIGHT_Y,
  CAP_TO_BASE,
  LEGACY_CAP_TO_BASE,
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

/** Where a character landed on the preview canvas, in CSS pixels */
export interface GlyphHit {
  char: string;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

export interface PreviewOptions {
  /** Draw cap-height and x-height lines alongside the baseline */
  guides?: boolean;
  /** Shrink the text so every line fits without wrapping (never grows it) */
  fitLines?: boolean;
  /** Space above the first line and below the last, in CSS pixels */
  padY?: number;
}

const FALLBACK_FAMILY = "ui-sans-serif, system-ui, sans-serif";
let capRatio: number | null = null;
/** Cap height of the fallback font as a fraction of its font size */
function fallbackCapRatio(ctx: CanvasRenderingContext2D): number {
  if (capRatio === null) {
    ctx.save();
    ctx.font = `100px ${FALLBACK_FAMILY}`;
    const ascent = ctx.measureText("H").actualBoundingBoxAscent;
    ctx.restore();
    capRatio = ascent > 0 ? ascent / 100 : 0.7;
  }
  return capRatio;
}

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
  options: PreviewOptions = {},
): GlyphHit[] {
  const legacy = layoutVersion === "legacy";
  const ctx = canvas.getContext("2d")!;
  const padX = paddingX;
  const padY = options.padY ?? PREVIEW_PADDING_TOP;
  const maxX = canvas.width - padX;

  // Lay out each distinct character once (independent of display size)
  const layouts = new Map<string, GlyphLayout | null>();
  const layoutFor = (ch: string) => {
    if (!layouts.has(ch)) {
      // Legacy notes rendered a character's own strokes only (no accent base)
      const strokes = legacy ? (glyphs[ch] ?? []) : resolveGlyphStrokes(ch, glyphs);
      layouts.set(ch, layoutGlyph(strokes, letterSpacing, scriptMode, layoutVersion));
    }
    return layouts.get(ch)!;
  };

  // Everything below scales linearly with the size (fontSizePx = cap height)
  const metricsAt = (size: number) => {
    const scale = size / (legacy ? LEGACY_CAP_TO_BASE : CAP_TO_BASE);
    const spaceW = spaceAdvancePx(layoutVersion) * scale;
    // Undrawn characters: one neutral font, sized so its capitals reach the
    // cap line. (Legacy notes keep their original fallback.)
    const fallbackFont = legacy
      ? `${size}px 'MyHandwriting','Amiri',serif`
      : `${size / fallbackCapRatio(ctx)}px ${FALLBACK_FAMILY}`;
    const advanceFor = (ch: string) => {
      if (ch === " ") return spaceW;
      const layout = layoutFor(ch);
      if (layout) return layout.advancePx * scale;
      if (legacy) return legacyAdvancePx(letterSpacing, scriptMode) * scale;
      ctx.font = fallbackFont;
      return ctx.measureText(ch).width;
    };
    return { scale, spaceW, fallbackFont, advanceFor };
  };

  let size = fontSizePx;
  if (options.fitLines && !legacy) {
    const { advanceFor } = metricsAt(size);
    const widest = Math.max(0, ...text.split("\n").map((l) => [...l].reduce((w, ch) => w + advanceFor(ch), 0)));
    const avail = canvas.width - 2 * padX;
    // 2% headroom: font sizes and text measurement round slightly
    if (widest > avail && widest > 0) size *= (avail / widest) * 0.98;
  }
  const { scale, spaceW, fallbackFont, advanceFor } = metricsAt(size);
  // Baseline-to-baseline distance; size IS the cap height, so lineHeight
  // multiplies it directly, matching CSS line-height semantics.
  const lineH = size * lineHeight;

  // ── Line breaking ─────────────────────────────────────────────────────────
  type Placed = { ch: string; x: number; line: number; w: number };
  const placed: Placed[] = [];
  let line = 0;

  if (legacy) {
    // Pre-v2 behaviour, kept exactly: breaks between any two letters
    let x = padX;
    for (const ch of text.replace(/\n/g, " \n ").split("")) {
      if (ch === "\n") { x = padX; line++; continue; }
      const w = advanceFor(ch);
      if (ch !== " " && x + w > maxX) { x = padX; line++; }
      if (ch !== " ") placed.push({ ch, x, line, w });
      x += w;
    }
  } else {
    // Breaks between words; a word longer than the line breaks between letters
    text.split("\n").forEach((hardLine, i) => {
      if (i > 0) line++;
      let x = padX;
      for (const token of hardLine.split(/( +)/)) {
        if (!token) continue;
        if (token[0] === " ") {
          if (x > padX) x += token.length * spaceW; // no indent after a wrap
          continue;
        }
        const letters = [...token];
        const widths = letters.map(advanceFor);
        const wordW = widths.reduce((a, b) => a + b, 0);
        if (x > padX && x + wordW > maxX) { x = padX; line++; }
        letters.forEach((ch, k) => {
          if (x > padX && x + widths[k] > maxX) { x = padX; line++; }
          placed.push({ ch, x, line, w: widths[k] });
          x += widths[k];
        });
      }
    });
  }
  const lines = line + 1;

  // ── Canvas size ───────────────────────────────────────────────────────────
  // Each line shows a band of the drawing canvas. Specimens crop the empty
  // space above accents/ascenders and below descenders; legacy notes show
  // the whole canvas, as they always did.
  const topPx = legacy ? 0 : CAP_Y - CAP_TO_BASE * 0.45;
  const bottomPx = legacy ? CANVAS_HEIGHT : Math.min(CANVAS_HEIGHT, DESC_Y + CAP_TO_BASE * 0.15);
  const firstBaseline = padY + (BASELINE_Y - topPx) * scale;
  const totalH = padY + (lines - 1) * lineH + (bottomPx - topPx) * scale + padY;
  canvas.height = Math.max(legacy ? 80 : 24, totalH);

  // Background — transparent so wrapper bg shows through
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Baseline rules, plus cap-height and x-height lines when guides are on
  const rule = (y: number, dashed: boolean) => {
    ctx.save();
    ctx.strokeStyle = theme.previewRule;
    ctx.lineWidth = 1;
    if (dashed) ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(padX - 8, y);
    ctx.lineTo(canvas.width - padX + 8, y);
    ctx.stroke();
    ctx.restore();
  };
  // Specimens are clean by default: rules only with guides on.
  // Legacy notes keep the ruled-paper look they were shared with.
  const ruleLines = options.guides ? lines : legacy ? lines + 1 : 0;
  for (let l = 0; l < ruleLines; l++) {
    const baseline = firstBaseline + l * lineH;
    rule(baseline, false);
    if (options.guides) {
      rule(baseline - (BASELINE_Y - CAP_Y) * scale, true);
      rule(baseline - (BASELINE_Y - XHEIGHT_Y) * scale, true);
    }
  }

  // ── Glyphs ────────────────────────────────────────────────────────────────
  const hits: GlyphHit[] = [];
  for (const { ch, x, line: lineIdx, w } of placed) {
    const baselineY = firstBaseline + lineIdx * lineH;
    hits.push({
      char: ch,
      x0: x,
      x1: x + w,
      y0: baselineY - CAP_TO_BASE * 1.3 * scale,
      y1: baselineY + CAP_TO_BASE * 0.4 * scale,
    });

    const layout = layoutFor(ch);
    if (!layout) {
      ctx.save();
      ctx.font = fallbackFont;
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";
      // Greyed, so undrawn characters read as "not drawn yet"
      ctx.fillStyle = theme.previewMissing;
      ctx.fillText(ch, x, baselineY);
      ctx.restore();
      continue;
    }

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

  return hits;
}
