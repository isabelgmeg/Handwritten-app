import { useState } from "react";
import type { FontStyle, ScriptMode, StyleGlyphs } from "@/types";
import { CHAR_GROUPS, FONT_STYLES } from "@/constants";
import { PreviewCanvas } from "../Canvas/PreviewCanvas";

/**
 * Type specimen — the Preview view. A fixed phrase plus every character, in
 * the chosen style. Read-only and stable: it doesn't change as the user moves
 * between letters on the canvas, so it works as a steady reference for
 * spotting spacing, size and glyph problems while drawing. Characters not
 * drawn yet render grey.
 */

interface TypeSpecimenProps {
  glyphs: StyleGlyphs;
  previewSize: number;
  letterSpacing: number;
  lineHeight: number;
  scriptMode: ScriptMode;
}

const PHRASE = "The quick brown fox jumps over the lazy dog";

export function TypeSpecimen({ glyphs, previewSize, letterSpacing, lineHeight, scriptMode }: TypeSpecimenProps) {
  const [style, setStyle] = useState<FontStyle>("regular");
  const common = { glyphs: glyphs[style], letterSpacing, lineHeight, scriptMode, paddingX: 12 };

  return (
    <div className="specimen">
      <div className="seg-control specimen-styles" role="tablist" aria-label="Preview style">
        {FONT_STYLES.map(({ key, label }) => {
          const count = Object.values(glyphs[key]).filter((s) => s.length > 0).length;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={style === key}
              onClick={() => setStyle(key)}
              className={["seg-btn", style === key ? "seg-btn-active" : ""].join(" ")}
              style={{
                fontStyle: key.includes("italic") ? "italic" : "normal",
                fontWeight: key.includes("bold") ? 700 : 400,
              }}
            >
              {label}
              <span className="specimen-count">{count}</span>
            </button>
          );
        })}
      </div>

      <PreviewCanvas {...common} previewText={PHRASE} previewSize={previewSize} />

      <div className="specimen-glyphs">
        {CHAR_GROUPS.map((group) => {
          const text = group.chars.filter((c) => c.length === 1).join(" ");
          if (!text) return null;
          return (
            <div key={group.label} className="specimen-glyph-row">
              <span className="specimen-row-label">{group.label}</span>
              <PreviewCanvas {...common} previewText={text} previewSize={Math.min(previewSize, 40)} />
            </div>
          );
        })}
      </div>

      <p className="field-hint">Grey characters haven't been drawn in this style yet.</p>
    </div>
  );
}
