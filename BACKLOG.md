# Backlog

## OpenType Ligature Substitution (GSUB `liga`)

**What:** Wire the `liga` GSUB feature table so apps (InDesign, Figma, Word, Pages) automatically substitute `f`+`i` → `fi` ligature glyph at render time.

**Current state:** Ligature glyphs are already drawable and export as regular glyphs. The `fi` glyph will be in the font — just without the substitution rule. Users can still access it manually.

**Why deferred:**
- `liga` only fires in apps that actively enable it; most casual users won't notice
- Requires post-construction glyph ID resolution (numeric indices, not names)
- Component glyphs (`f`, `i`) must exist in the font or the rule must be skipped gracefully
- Longer ligatures (`ffi`) must be registered before shorter ones (`fi`) or substitution breaks
- Entire GSUB block needs try/catch isolation so a failure never breaks the font export
- Significant test surface: Word, Pages, Figma, browsers (`font-feature-settings: "liga"`)

**Implementation notes (already researched):**
1. After `new opentype.Font({ glyphs: list })`, build a `name → index` map
2. For each drawn ligature (sorted by descending component length): look up component glyph IDs and ligature glyph ID
3. If all IDs resolve: `font.substitution.add('liga', { sub: [...componentIds], by: ligatureId })`
4. Skip + warn if any component glyph is missing from the font
5. Wrap the entire block in try/catch — font must export cleanly even if GSUB fails
6. opentype.js serializes GSUB automatically on `toArrayBuffer()`
