import type { FontStyle, StyleGlyphs, ScriptMode, Stroke } from "@/types";
import {
  UPM,
  ASCENDER,
  DESCENDER,
  GLYPH_ADVANCE_WIDTH_BASE,
  CONNECT_OVERLAP,
} from "@/constants";
import { GLYPH_NAMES } from "@/constants/glyphs";
import { FONT_STYLES, ACCENT_BASE_MAP } from "@/constants/characters";
import { canvasToFont, getEffectivePoints } from "@/utils";
import getStroke from "perfect-freehand";

export type FontFormat = "otf" | "woff2" | "both";

export interface FontGeneratorResult {
  ok: boolean;
  error?: string;
  warnings: string[];
}

function triggerDownload(
  buffer: ArrayBuffer | Uint8Array<ArrayBuffer>,
  fileName: string,
  mimeType: string,
): void {
  const blob = new Blob([buffer as BlobPart], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadFont(
  glyphs: StyleGlyphs,
  styleKey: FontStyle,
  fontName: string,
  letterSpacing: number,
  scriptMode: ScriptMode = "normal",
  format: FontFormat = "otf",
): Promise<FontGeneratorResult> {
  const warnings: string[] = [];

  // Load opentype.js
  let opentype: typeof import("opentype.js");
  try {
    opentype = await import("opentype.js");
  } catch (err) {
    return {
      ok: false,
      error: "Failed to load font library. Please refresh the page and try again.",
      warnings,
    };
  }

  // Check for drawn glyphs
  const glyphMap = glyphs[styleKey];
  const ownDrawnChars = new Set(
    Object.keys(glyphMap).filter((c) => (glyphMap[c]?.length ?? 0) > 0),
  );

  // Also include accented chars whose base char has been drawn (even if accent
  // marks haven't been added yet — they inherit the base shape automatically).
  const impliedAccentChars = Object.keys(ACCENT_BASE_MAP).filter(
    (ac) => !ownDrawnChars.has(ac) && ownDrawnChars.has(ACCENT_BASE_MAP[ac]),
  );

  const drawn: [string, Stroke[]][] = [
    ...Array.from(ownDrawnChars).map((c): [string, Stroke[]] => [c, glyphMap[c]]),
    ...impliedAccentChars.map((ac): [string, Stroke[]] => [ac, []]),
  ];

  if (!drawn.length) {
    const styleMeta = FONT_STYLES.find((s) => s.key === styleKey);
    return {
      ok: false,
      error: `No characters drawn for ${styleMeta?.label ?? styleKey}. Draw some characters first.`,
      warnings,
    };
  }

  const styleMeta = FONT_STYLES.find((s) => s.key === styleKey)!;
  const isBold = styleKey.includes("bold");
  const overlap = scriptMode === "connected" ? CONNECT_OVERLAP : 0;
  const glyphAdvance = GLYPH_ADVANCE_WIDTH_BASE + letterSpacing - overlap;
  const resolvedName = fontName.trim() || "My Handwriting";

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const list: any[] = [notdef, space];

  // Convert each drawn glyph with per-glyph error isolation
  for (const [char, ownStrokes] of drawn) {
    try {
      // For accented chars, prepend base-char strokes so the exported glyph
      // contains both the base letter shape and the user-drawn accent marks.
      const baseChar = ACCENT_BASE_MAP[char];
      const baseStrokes: Stroke[] = baseChar ? (glyphMap[baseChar] ?? []) : [];
      const strokes = baseChar ? [...baseStrokes, ...ownStrokes] : ownStrokes;

      if (baseChar && ownStrokes.length === 0) {
        warnings.push(`"${char}" has no accent marks drawn — exported using base "${baseChar}" only`);
      }

      const p = new opentype.Path();
      let hasValidStroke = false;

      for (const stroke of strokes) {
        try {
          const outline = getStroke(getEffectivePoints(stroke), stroke.options);
          if (outline.length < 4) {
            warnings.push(`Short stroke in "${char}" skipped (too few points)`);
            continue;
          }

          const fp = outline.map(([x, y]: number[]) => {
            const pt = canvasToFont(x, y);
            if (!isFinite(pt[0]) || !isFinite(pt[1])) {
              throw new Error("coordinate out of range");
            }
            return pt;
          });

          p.moveTo(fp[0][0], fp[0][1]);
          for (let i = 0; i < fp.length; i++) {
            const [x0, y0] = fp[i];
            const [x1, y1] = fp[(i + 1) % fp.length];
            p.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
          }
          p.close();
          hasValidStroke = true;
        } catch (strokeErr) {
          warnings.push(
            `Stroke in "${char}" skipped: ${strokeErr instanceof Error ? strokeErr.message : String(strokeErr)}`,
          );
        }
      }

      if (!hasValidStroke) {
        warnings.push(`"${char}" had no valid strokes and was not included`);
        continue;
      }

      list.push(
        new opentype.Glyph({
          name: GLYPH_NAMES[char] ?? char,
          unicode: char.charCodeAt(0),
          advanceWidth: glyphAdvance,
          path: p,
        }),
      );
    } catch (glyphErr) {
      warnings.push(
        `"${char}" failed to process and was skipped: ${glyphErr instanceof Error ? glyphErr.message : String(glyphErr)}`,
      );
    }
  }

  if (list.length <= 2) {
    return {
      ok: false,
      error: "None of the drawn characters could be processed. Check your drawings and try again.",
      warnings,
    };
  }

  // Build font
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let font: any;
  try {
    font = new opentype.Font({
      familyName: resolvedName,
      styleName: styleMeta.label,
      weightClass: (isBold ? 700 : 400) as unknown as string,
      unitsPerEm: UPM,
      ascender: ASCENDER,
      descender: DESCENDER,
      glyphs: list,
    });
  } catch (err) {
    console.error("[FontGenerator] Font construction failed:", err);
    return {
      ok: false,
      error: `Failed to build font: ${err instanceof Error ? err.message : String(err)}`,
      warnings,
    };
  }

  // Serialize to binary
  let arrayBuffer: ArrayBuffer;
  try {
    arrayBuffer = font.toArrayBuffer();
    if (!arrayBuffer?.byteLength) {
      throw new Error("Serialized to empty buffer");
    }
  } catch (err) {
    console.error("[FontGenerator] Serialization failed:", err);
    return {
      ok: false,
      error: `Failed to generate font data: ${err instanceof Error ? err.message : String(err)}`,
      warnings,
    };
  }

  const baseName = resolvedName.replace(/\s+/g, "_");
  const styleLabel = styleMeta.label.replace(/\s+/g, "");

  // Download OTF
  if (format === "otf" || format === "both") {
    try {
      triggerDownload(arrayBuffer, `${baseName}-${styleLabel}.otf`, "font/otf");
    } catch (err) {
      console.error("[FontGenerator] OTF download failed:", err);
      return {
        ok: false,
        error: `Failed to trigger OTF download: ${err instanceof Error ? err.message : String(err)}`,
        warnings,
      };
    }
  }

  // Convert and download WOFF2
  if (format === "woff2" || format === "both") {
    try {
      const { compress } = await import("wawoff2");
      const woff2Buffer = await compress(new Uint8Array(arrayBuffer));
      triggerDownload(woff2Buffer as Uint8Array<ArrayBuffer>, `${baseName}-${styleLabel}.woff2`, "font/woff2");
    } catch (err) {
      console.error("[FontGenerator] WOFF2 conversion failed:", err);
      if (format === "woff2") {
        return {
          ok: false,
          error: `Failed to generate WOFF2: ${err instanceof Error ? err.message : String(err)}`,
          warnings,
        };
      }
      // In "both" mode, OTF already succeeded — report as warning
      warnings.push("WOFF2 generation failed — OTF was downloaded successfully.");
    }
  }

  return { ok: true, warnings };
}

export async function downloadAllStyles(
  glyphs: StyleGlyphs,
  fontName: string,
  letterSpacing: number,
  scriptMode: ScriptMode = "normal",
  format: FontFormat = "otf",
): Promise<FontGeneratorResult> {
  const allWarnings: string[] = [];
  const errors: string[] = [];

  for (const { key } of FONT_STYLES) {
    if (Object.values(glyphs[key]).some((s) => s.length > 0)) {
      const result = await downloadFont(
        glyphs,
        key,
        fontName,
        letterSpacing,
        scriptMode,
        format,
      );
      allWarnings.push(...result.warnings);
      if (!result.ok && result.error) {
        errors.push(`${key}: ${result.error}`);
      }
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  if (errors.length > 0) {
    return { ok: false, error: errors.join("\n"), warnings: allWarnings };
  }

  return { ok: true, warnings: allWarnings };
}
