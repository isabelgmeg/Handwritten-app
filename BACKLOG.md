# Backlog

## v2 redesign (started 2026-11-12)

**Objective:** make Love Letter Studio feel like designing your own typeface. The canvas is the core feature, and seeing your work-in-progress font is the main goal. v2 makes the studio the home page, pairs Draw with a live Preview, exports fonts that are technically sound, and moves toward publishing your handwriting as a font.

**This is a UX case study.** Log every design decision and iteration in [docs/ux-case-study/decision-log.md](docs/ux-case-study/decision-log.md).

All v2 work branches off `v2`, which was created from `develop`. Each feature gets its own PR into `v2`, and `v2` merges into `develop` once it holds together as a whole. Merge `develop` into `v2` now and then so hotfixes reach it.

Suggested branch for each item in brackets.

### 1. Font export: spacing, metrics, metadata — `fix/font-metrics`

**Status (2026-11-12):** spacing, baseline, size, proportions, vertical metrics, italic flags, cap/x-height and underline are fixed on `fix/font-metrics` (decision log D10). Still open:

- **CFF FontBBox:** opentype.js writes `[0, yMin, ascender, advanceWidthMax]` and has no override. This is an upstream bug. Most renderers use the `head` bounding box instead.
- **Coverage per style:** surface it in the download dialog (UI work).
- **Kerning:** now possible, since the side bearings are right.
- **Old community notes:** decide how notes saved with old-system letter spacing should render.
- **Normal-mode cell guides:** the dashed lines on the canvas no longer mean anything.

The original findings follow.

A diagnostic of three exported fonts found the following.

- **Spacing is monospace.** Every glyph uses the same advance: `GLYPH_ADVANCE_WIDTH_BASE + letterSpacing - overlap` ([fontGenerator.ts](src/services/fontGenerator.ts)). The ink fills about a third of its cell and sits toward the right. The hmtx left side bearing (LSB) is 0, but the real one is about 170. The preview ([previewEngine.ts](src/services/previewEngine.ts)) uses the same fixed advance, so words look gappy there too.
  - Fix: measure each glyph's ink bounding box. Shift the outline so its LSB is about 30 units, and set the advance to the ink width plus both side bearings plus `letterSpacing`. Use the same maths in the preview. Make the space about 150–200 units.
  - Caveat: in connected-script mode the strokes have to meet at the guides, so that mode keeps fixed advances.
- **The baseline is about 60 units above 0.** `canvasToFont` maps the whole canvas height to the 800/−200 range, so `BASELINE_Y` (74% of the height) lands at y≈60 instead of 0. Map the baseline to 0 instead, and scale so that `CAP_TO_BASE` is about 700 units (the cap height is about 450–470 today).
- **Vertical metrics disagree.** hhea/typo say 800/−200, but win matches the ink, and `USE_TYPO_METRICS` is off. That gives about 25% different line spacing on Windows and macOS, and winAscent also differs per style. Fix: one shared set of metrics for every style, `USE_TYPO_METRICS` on, and win values that cover the ink of all styles.
- **Metadata:**
  - Italic is flagged as Regular (fsSelection, macStyle and italicAngle are all 0).
  - Cap height comes out wrong for styles that have no capitals.
  - The CFF FontBBox is wrong: [0, −150, 800, 320].
  - The underline position and thickness are 0/0.
- **Coverage:** the drawn sets are uneven per style. Bold has no numbers or punctuation, and Italic is lowercase only. Show this in the download dialog, or offer to fall back to Regular's glyphs.
- Kerning (GPOS) waits until the side bearings are right.

### 2. Studio is the home page — `feature/studio-home`

The hero above the studio caused the scroll and touch problems: the canvas had no fixed place, and on mobile a swipe could mean scroll or draw. Snapping and a Scroll/Draw toggle were tried and dropped.

- Move the hero ("A love letter in times of AI" and the sub-tagline) to About, which is being reworked anyway. `/` opens straight onto the studio.
- **Mobile:** Draw | Preview become two views that swap in place, not scroll positions. The switch is the main control, styled as tabs at the top.
  - Draw view: style selector, char nav, canvas, Undo/Clear. The canvas owns touch and nothing scrolls, so no mode toggle is needed.
  - Preview view: note card / type tester, Download, Share. It scrolls normally.
- **Desktop:** the canvas and a live preview sit side by side, and the preview updates on every stroke.
- Keep the project's voice: a strong About link in the header, a first-visit welcome line, warm empty states. Show a sample in Preview when nothing has been drawn yet.

### 3. Preview view content — `feature/preview-view`

The current note preview, rebuilt as the Preview view's content. Confirmed problems with it today:

- **The inputs are disconnected.** The To/Date/Message fields sit 120px above the card. Edit directly on the card instead.
- **The text looks wrong.** It's gappy because of the fixed advance (see 1), and undrawn characters are blank.
- **It's too far from the canvas.** Fixed by 2.
- **The purpose is unclear.** Make Preview the place for "here's what you made", with Download and Share to community as the next steps.

### 4. Live WIP font preview

Preview should show the work-in-progress font itself, not only the note, for example as a type tester or specimen. Overlaps with 5.

### 5. Font-face–driven redesign — `explore/typeface-design`

Redesign the experience around designing a typeface rather than filling in characters:

- a specimen view
- a glyph grid as the primary surface
- metrics guides
- weights/styles as a family
- live type tester

Needs a design pass before code.

### 6. Publish handwriting as a font — `feature/font-gallery`

Reference: <https://facetypes.xyz/>. Keep community notes, and also let users publish their handwriting as a font that others can browse, type with, and download. Needs:

- a Supabase table and storage for font files (watch the egress quota issue below)
- licensing/consent copy
- moderation
- a gallery page with type testers

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
