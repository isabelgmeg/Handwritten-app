/**
 * Font Generator Service
 * Handles OpenType font file generation and export
 */

import type { FontStyle, StyleGlyphs } from "@/types";
import {
  UPM,
  ASCENDER,
  DESCENDER,
  GLYPH_ADVANCE_WIDTH_BASE,
} from "@/constants";
import { GLYPH_NAMES } from "@/constants/glyphs";
import { FONT_STYLES } from "@/constants/characters";
import { canvasToFont, getEffectivePoints } from "@/utils";
import getStroke from "perfect-freehand";

/**
 * Download a font file for a specific style
 */
export async function downloadFont(
  glyphs: StyleGlyphs,
  styleKey: FontStyle,
  fontName: string,
  letterSpacing: number,
): Promise<void> {
  const opentype = await import("opentype.js");
  const drawn = Object.entries(glyphs[styleKey]).filter(
    ([, s]) => s.length > 0,
  );

  if (!drawn.length) {
    alert(`No glyphs drawn for ${styleKey}. Draw some characters first.`);
    return;
  }

  const styleMeta = FONT_STYLES.find((s) => s.key === styleKey)!;
  const isBold = styleKey.includes("bold");
  const glyphAdvance = GLYPH_ADVANCE_WIDTH_BASE + letterSpacing;

  // Create glyphs
  const notdef = new opentype.Glyph({
    name: ".notdef",
    unicode: 0,
    advanceWidth: glyphAdvance,
    path: new opentype.Path(),
  });

  const space = new opentype.Glyph({
    name: "space",
    unicode: 32,
    advanceWidth: 320,
    path: new opentype.Path(),
  });

  const list = [notdef, space];

  for (const [char, strokes] of drawn) {
    const p = new opentype.Path();

    for (const stroke of strokes) {
      const outline = getStroke(getEffectivePoints(stroke), stroke.options);
      if (outline.length < 4) continue;

      const fp = outline.map(([x, y]: number[]) => canvasToFont(x, y));
      p.moveTo(fp[0][0], fp[0][1]);

      for (let i = 0; i < fp.length; i++) {
        const [x0, y0] = fp[i];
        const [x1, y1] = fp[(i + 1) % fp.length];
        p.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      }

      p.close();
    }

    list.push(
      new opentype.Glyph({
        name: GLYPH_NAMES[char] ?? char,
        unicode: char.charCodeAt(0),
        advanceWidth: glyphAdvance,
        path: p,
      }),
    );
  }

  // Create font
  const font = new opentype.Font({
    familyName: fontName || "My Handwriting",
    styleName: styleMeta.label,
    weightClass: (isBold ? 700 : 400) as unknown as string,
    unitsPerEm: UPM,
    ascender: ASCENDER,
    descender: DESCENDER,
    glyphs: list,
  });

  // Generate filename and download
  const baseName = (fontName || "MyHandwriting").replace(/\s+/g, "_");
  const fileName = `${baseName}-${styleMeta.label.replace(/\s+/g, "")}.otf`;
  const arrayBuffer = font.toArrayBuffer();
  const blob = new Blob([arrayBuffer], { type: "font/otf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Download all available font styles
 */
export async function downloadAllStyles(
  glyphs: StyleGlyphs,
  fontName: string,
  letterSpacing: number,
): Promise<void> {
  for (const { key } of FONT_STYLES) {
    if (Object.values(glyphs[key]).some((s) => s.length > 0)) {
      await downloadFont(glyphs, key, fontName, letterSpacing);
      // Small gap between downloads
      await new Promise((r) => setTimeout(r, 300));
    }
  }
}
