import { useState } from "react";
import type { FontStyle, ScriptMode, StyleGlyphs } from "@/types";
import { CHAR_GROUPS, FONT_STYLES } from "@/constants";
import { PreviewCanvas } from "../Canvas/PreviewCanvas";
import { StyleCircle } from "../common/StyleCircle";

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
const ALL_SINGLE_CHARS = CHAR_GROUPS.map((g) => g.chars.filter((c) => c.length === 1).join("")).filter(Boolean);
const SPECIMEN_TEXT = [PHRASE, "", ...ALL_SINGLE_CHARS].join("\n");

export function TypeSpecimen({ glyphs, previewSize, letterSpacing, lineHeight, scriptMode }: TypeSpecimenProps) {
  const [style, setStyle] = useState<FontStyle>("regular");
  const common = { glyphs: glyphs[style], letterSpacing, lineHeight, scriptMode, paddingX: 12 };

  return (
    <div className="specimen">
      {/* Same flat style tabs as the Draw view */}
      <div className="flex flex-wrap items-center justify-center gap-1.5" role="tablist" aria-label="Preview style">
        {FONT_STYLES.map(({ key, label }) => {
          const count = Object.values(glyphs[key]).filter((s) => s.length > 0).length;
          const isActive = style === key;
          return (
            <button
              key={key}
              role="tab"
              aria-selected={isActive}
              onClick={() => setStyle(key)}
              className={isActive ? "style-btn-active" : "style-btn"}
              style={{
                fontStyle: key.includes("italic") ? "italic" : "normal",
                fontWeight: isActive || key.includes("bold") ? 700 : 400,
              }}
            >
              {isActive && <StyleCircle />}
              <span>{label}</span>
              {count > 0 && <span className="text-[10px] opacity-50 ml-0.5">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* One block: the phrase, then every character */}
      <PreviewCanvas {...common} previewText={SPECIMEN_TEXT} previewSize={previewSize} />

      <p className="field-hint text-center">Grey characters haven't been drawn in this style yet.</p>
    </div>
  );
}
