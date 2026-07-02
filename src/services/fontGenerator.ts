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

export interface FontGeneratorResult {
  ok: boolean;
  error?: string;
  warnings: string[];
}

export interface DownloadProgress {
  styleKey: FontStyle;
  styleLabel: string;
  index: number;
  total: number;
  elapsedMs: number;
}

// A hang inside opentype.js / getStroke never throws — it just never
// resolves — so try/catch can't surface it. Race against a timeout instead,
// so the UI can recover and report an error rather than freezing forever.
const GENERATION_TIMEOUT_MS = 20_000;

// Below this many drawn characters, a style is likely an accident (e.g. one
// stray stroke on "Bold") rather than an intentionally sparse font.
const SPARSE_STYLE_THRESHOLD = 10;

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timed out generating ${label} (took longer than ${GENERATION_TIMEOUT_MS / 1000}s)`));
    }, GENERATION_TIMEOUT_MS);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

interface BuildStyleFontResult {
  ok: boolean;
  error?: string;
  warnings: string[];
  buffer?: ArrayBuffer;
}

function triggerDownload(buffer: ArrayBuffer | Uint8Array<ArrayBuffer>, fileName: string, mimeType: string): void {
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

// Builds the OTF buffer for a single style, without touching the DOM.
// Shared by the single-style download and the "download all" zip flow.
async function buildStyleFont(
  glyphs: StyleGlyphs,
  styleKey: FontStyle,
  fontName: string,
  letterSpacing: number,
  scriptMode: ScriptMode,
): Promise<BuildStyleFontResult> {
  const warnings: string[] = [];

  // Load opentype.js
  let opentype: typeof import("opentype.js");
  try {
    opentype = await import("opentype.js");
  } catch (err) {
    console.error("[FontGenerator] opentype.js failed to load:", err);
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

  // A style with only a handful of glyphs still exports successfully (opentype.js
  // only needs .notdef + one real glyph), but every undrawn character falls back
  // to blank/missing in whatever app uses it — easy to miss, worth flagging.
  if (ownDrawnChars.size < SPARSE_STYLE_THRESHOLD) {
    const styleMeta = FONT_STYLES.find((s) => s.key === styleKey);
    warnings.push(
      `${styleMeta?.label ?? styleKey} only has ${ownDrawnChars.size} character${ownDrawnChars.size === 1 ? "" : "s"} drawn — most letters will be blank in that file.`,
    );
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

  return { ok: true, warnings, buffer: arrayBuffer };
}

// Font name comes from a free-text input, but flows straight into a
// filename (and a zip entry name). Strip characters that are illegal in
// Windows/macOS filenames or that would create unintended nested paths in
// the zip, and cap the length so the resulting file stays usable.
function sanitizeFileNamePart(raw: string): string {
  const cleaned = raw
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 60);
  return cleaned || "My_Handwriting";
}

function fileBaseName(fontName: string, styleLabel: string): string {
  return `${sanitizeFileNamePart(fontName)}-${styleLabel.replace(/\s+/g, "")}`;
}

export async function downloadAllStyles(
  glyphs: StyleGlyphs,
  fontName: string,
  letterSpacing: number,
  scriptMode: ScriptMode = "normal",
  onProgress?: (progress: DownloadProgress) => void,
): Promise<FontGeneratorResult> {
  const allWarnings: string[] = [];
  const errors: string[] = [];
  const zipEntries: Record<string, Uint8Array> = {};

  const stylesToBuild = FONT_STYLES.filter(({ key }) =>
    Object.values(glyphs[key]).some((s) => s.length > 0),
  );

  const startedAt = Date.now();
  let index = 0;
  for (const { key, label } of stylesToBuild) {
    index += 1;
    onProgress?.({
      styleKey: key,
      styleLabel: label,
      index,
      total: stylesToBuild.length,
      elapsedMs: Date.now() - startedAt,
    });

    let result: BuildStyleFontResult;
    try {
      result = await withTimeout(
        buildStyleFont(glyphs, key, fontName, letterSpacing, scriptMode),
        label,
      );
    } catch (err) {
      errors.push(`${label}: ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }

    allWarnings.push(...result.warnings);
    if (!result.ok || !result.buffer) {
      if (result.error) errors.push(`${label}: ${result.error}`);
      continue;
    }

    const base = fileBaseName(fontName, label);
    zipEntries[`${base}.otf`] = new Uint8Array(result.buffer);
  }

  const fileNames = Object.keys(zipEntries);
  if (fileNames.length === 0) {
    return {
      ok: false,
      error: errors.length > 0 ? errors.join("\n") : "No characters drawn for any style.",
      warnings: allWarnings,
    };
  }

  try {
    if (fileNames.length === 1) {
      // Only one style was drawn — a zip-of-one is just friction, so hand
      // back the .otf directly instead.
      triggerDownload(zipEntries[fileNames[0]] as Uint8Array<ArrayBuffer>, fileNames[0], "font/otf");
    } else {
      const { zipSync } = await import("fflate");
      const zipped = zipSync(zipEntries, { level: 6 });
      triggerDownload(zipped as Uint8Array<ArrayBuffer>, `${sanitizeFileNamePart(fontName)}-fonts.zip`, "application/zip");
    }
  } catch (err) {
    console.error("[FontGenerator] Download failed:", err);
    return {
      ok: false,
      error: `Failed to bundle fonts: ${err instanceof Error ? err.message : String(err)}`,
      warnings: allWarnings,
    };
  }

  if (errors.length > 0) {
    return { ok: false, error: errors.join("\n"), warnings: allWarnings };
  }

  return { ok: true, warnings: allWarnings };
}
