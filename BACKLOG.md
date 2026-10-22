# Backlog

## Supabase: over the free-plan quota (cached egress)

**What:** Supabase's grace period ended on 2026-09-20 and the Fair Use Policy now applies. If the organization goes over quota, its projects can be restricted and requests will fail with `402`, which would break this app's community notes and analytics too. On 2026-10-22, cached egress was at 4.92 of 5 GB.

**Cause (found 2026-10-22):** the `case-study-media` project, which holds the portfolio's media. It served about 4.6 GB of cached egress between 15 and 21 Oct, with a peak of 2.5 GB on 18 Oct. This app isn't the cause, because it doesn't use Supabase Storage.

**To do (in the portfolio, not here):** compress the images to the size they're shown at, as WebP. Move videos to a video host, or serve the media from the site's own host. Or upgrade the plan.

## Community page: paginate notes

`fetchNotes()` loads every note at once. Notes now store only the glyphs their message uses, so each one is small, but the page should still load them in pages once there are a lot.

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
