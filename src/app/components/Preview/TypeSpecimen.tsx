import { useState } from "react";
import type { FontStyle, ScriptMode, StyleGlyphs } from "@/types";
import { ALL_CHARS, CHAR_GROUPS, FONT_STYLES } from "@/constants";
import { PreviewCanvas } from "../Canvas/PreviewCanvas";

/**
 * Type specimen: the Preview view. A phrase plus every character, in the
 * style selected in the shared style bar. The character set is fixed and doesn't follow the canvas, so
 * it works as a steady reference for spotting spacing, size and glyph problems
 * while drawing. The phrase defaults to a pangram and can be swapped for the
 * user's own text. Characters not drawn yet render grey; clicking a character
 * opens it on the canvas. Until anything is drawn in the style, a short
 * empty state stands in for the specimen.
 */

interface TypeSpecimenProps {
  glyphs: StyleGlyphs;
  /** The style being drawn; the specimen always shows the same one */
  style: FontStyle;
  previewSize: number;
  letterSpacing: number;
  lineHeight: number;
  scriptMode: ScriptMode;
  /** Open a character on the canvas */
  onGlyphSelect: (char: string) => void;
}

const DEFAULT_PHRASE = "The quick brown fox jumps over the lazy dog";
/** One row per character group (ligatures aren't shown: they need GSUB to work) */
const CHARSET_ROWS = CHAR_GROUPS.map((g) => g.chars.filter((c) => c.length === 1).join("")).filter(Boolean);
const SPECIMEN_CHARS = CHARSET_ROWS.join("").split("");
const DRAWABLE = new Set(ALL_CHARS);
const isDrawable = (ch: string) => DRAWABLE.has(ch);

/** The character set is a step smaller than the phrase, so the phrase leads.
 *  Rows shrink further if needed so each group stays on one line. */
const CHARSET_SCALE = 0.6;
/** Row height for the character set: room for accents over capitals */
const CHARSET_LINE_HEIGHT = 1.7;
/** Space above/below each block; the sheet's gap does the rest */
const SHEET_PADDING_Y = 6;
/** Matches the input's inner padding, so typed text and specimen line up */
const SHEET_PADDING_X = 14;

export function TypeSpecimen({ glyphs, style, previewSize, letterSpacing, lineHeight, scriptMode, onGlyphSelect }: TypeSpecimenProps) {
  const [phrase, setPhrase] = useState("");
  const [guides, setGuides] = useState(false);

  const drawn = SPECIMEN_CHARS.filter((c) => (glyphs[style][c]?.length ?? 0) > 0).length;
  const styleLabel = FONT_STYLES.find((f) => f.key === style)?.label ?? style;
  const common = {
    glyphs: glyphs[style],
    letterSpacing,
    scriptMode,
    paddingX: SHEET_PADDING_X,
    padY: SHEET_PADDING_Y,
    guides,
    isGlyphClickable: isDrawable,
    onGlyphClick: onGlyphSelect,
  };

  if (drawn === 0) {
    return (
      <div className="specimen-empty">
        <p className="specimen-empty-title">Your {style === "regular" ? "font" : styleLabel} will appear here as you draw.</p>
        <p className="specimen-empty-body">
          Every letter you draw shows up in a sample phrase and in the full character set, so you can check spacing and size as you go.
        </p>
      </div>
    );
  }

  return (
    <div className="specimen">
      <input
        type="text"
        className="specimen-input"
        value={phrase}
        onChange={(e) => setPhrase(e.target.value)}
        placeholder="Type your own phrase…"
        aria-label="Preview phrase"
        maxLength={120}
      />

      {/* One sheet: the phrase, then every character a size smaller */}
      <div className="specimen-sheet">
        <PreviewCanvas {...common} lineHeight={lineHeight} previewText={phrase.trim() || DEFAULT_PHRASE} previewSize={previewSize} />
        <PreviewCanvas
          {...common}
          lineHeight={CHARSET_LINE_HEIGHT}
          previewText={CHARSET_ROWS.join("\n")}
          previewSize={Math.round(previewSize * CHARSET_SCALE)}
          fitLines
        />
      </div>

      <div className="specimen-footer">
        <span>Grey characters aren't drawn yet. Click any character to draw it.</span>
        <span className="specimen-footer-controls">
          <span className="specimen-coverage">{drawn} / {SPECIMEN_CHARS.length} drawn</span>
          <span className="specimen-toggle">
            <button
              type="button"
              role="switch"
              aria-checked={guides}
              aria-labelledby="specimen-guides-label"
              className="toggle-switch"
              data-state={guides ? "on" : "off"}
              onClick={() => setGuides((g) => !g)}
            />
            <span id="specimen-guides-label" onClick={() => setGuides((g) => !g)}>Guides</span>
          </span>
        </span>
      </div>
    </div>
  );
}
