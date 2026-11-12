import { useEffect, useState } from "react";
import type { FontStyle, ScriptMode, StyleGlyphs } from "@/types";
import { CHAR_GROUPS, FONT_STYLES } from "@/constants";
import { PreviewCanvas } from "../Canvas/PreviewCanvas";
import { SliderRow } from "../common/SliderRow";

/**
 * Type specimen — the Preview view. Follows the established type-foundry
 * pattern (style switcher + size, type tester, spacing strings, glyph set,
 * pangrams, waterfall) so the user can test spacing, size and glyph errors
 * while they draw. Undrawn characters render faint so gaps are easy to spot.
 */

interface TypeSpecimenProps {
  glyphs: StyleGlyphs;
  /** The style being drawn — the specimen follows it unless the user picks another */
  activeStyle: FontStyle;
  /** The character on the canvas — drives the live spacing test */
  currentChar: string;
  previewSize: number;
  onPreviewSizeChange: (v: number) => void;
  letterSpacing: number;
  lineHeight: number;
  scriptMode: ScriptMode;
  testerText: string;
  onTesterTextChange: (v: string) => void;
}

const PANGRAMS = [
  "The quick brown fox jumps over the lazy dog.",
  "El veloz murciélago hindú comía feliz cardillo y kiwi.",
];
const WATERFALL_SIZES = [16, 24, 40, 64];
const WATERFALL_TEXT = "Handwritten with love";

/** Classic spacing string: the letter between straight and round neighbours */
function spacingString(ch: string): string {
  const [straight, round] = /[a-zß-ÿ]/.test(ch) ? ["n", "o"] : /[0-9]/.test(ch) ? ["1", "0"] : ["H", "O"];
  return `${straight}${straight}${ch}${straight}${straight}${round}${ch}${round}${round}  ${straight}${ch}${straight}${ch}${straight}${round}${ch}${round}${ch}${round}`;
}

export function TypeSpecimen({
  glyphs,
  activeStyle,
  currentChar,
  previewSize,
  onPreviewSizeChange,
  letterSpacing,
  lineHeight,
  scriptMode,
  testerText,
  onTesterTextChange,
}: TypeSpecimenProps) {
  const [style, setStyle] = useState<FontStyle>(activeStyle);
  // Follow the style being drawn; the user can still switch here to compare
  useEffect(() => setStyle(activeStyle), [activeStyle]);

  const styleGlyphs = glyphs[style];
  const common = { glyphs: styleGlyphs, letterSpacing, lineHeight, scriptMode, paddingX: 12 };
  const singleChar = currentChar.length === 1;

  return (
    <div className="specimen">
      {/* Toolbar: style + size */}
      <div className="specimen-toolbar">
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
        <div className="specimen-size">
          <span className="label-caps">Size</span>
          <div className="flex-1">
            <SliderRow value={previewSize} min={16} max={96} step={4} onChange={onPreviewSizeChange} />
          </div>
          <span className="value-badge">{previewSize}px</span>
        </div>
      </div>

      {/* Type tester */}
      <section className="specimen-section">
        <h3 className="label-caps">Type tester</h3>
        <input
          type="text"
          value={testerText}
          onChange={(e) => onTesterTextChange(e.target.value)}
          className="specimen-tester-input"
          placeholder="Type anything to test your font…"
          aria-label="Test text"
        />
        <PreviewCanvas {...common} previewText={testerText || "Type anything to test your font"} previewSize={previewSize} />
      </section>

      {/* Spacing test for the letter on the canvas */}
      {singleChar && (
        <section className="specimen-section">
          <h3 className="label-caps">
            Spacing · <span className="specimen-char">{currentChar}</span>
          </h3>
          <PreviewCanvas {...common} previewText={spacingString(currentChar)} previewSize={previewSize} />
        </section>
      )}

      {/* Glyph set */}
      <section className="specimen-section">
        <h3 className="label-caps">Glyph set</h3>
        <p className="field-hint">Faint characters haven't been drawn in this style yet.</p>
        {CHAR_GROUPS.map((group) => {
          const text = group.chars.filter((c) => c.length === 1).join("");
          if (!text) return null;
          return (
            <div key={group.label} className="specimen-glyph-row">
              <span className="specimen-row-label">{group.label}</span>
              <PreviewCanvas {...common} previewText={text} previewSize={Math.min(previewSize, 48)} />
            </div>
          );
        })}
      </section>

      {/* Pangrams */}
      <section className="specimen-section">
        <h3 className="label-caps">Pangrams</h3>
        <PreviewCanvas {...common} previewText={PANGRAMS.join("\n")} previewSize={previewSize} />
      </section>

      {/* Waterfall */}
      <section className="specimen-section">
        <h3 className="label-caps">Waterfall</h3>
        {WATERFALL_SIZES.map((size) => (
          <div key={size} className="specimen-glyph-row">
            <span className="specimen-row-label">{size}px</span>
            <PreviewCanvas {...common} previewText={WATERFALL_TEXT} previewSize={size} />
          </div>
        ))}
      </section>
    </div>
  );
}
