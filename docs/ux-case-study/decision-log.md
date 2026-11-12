# UX decision log: Love Letter Studio v2

A running record of design decisions, iterations and their reasons, kept for the UX case study. Newest entries are at the bottom. Each entry says what triggered it, what was decided and why, what else was considered, and what happened next.

**Status key:** ✅ shipped to a branch · 🔁 superseded by a later entry · 🧪 needs testing · 📝 planned

---

## D01 · Roll back the "landing + community notes" experiment

**Date:** 2026-11-12 · **Status:** ✅

- **Context:** An uncommitted experiment had added a community notes section to the landing page and moved the studio to `/studio`. The standalone `/community` page was kept for comparison.
- **Decision:** Roll back every landing and community change. Keep the unrelated studio work: panels open on desktop, glyph thumbnails, arrows beside the canvas, and a 17px base font size.
- **Why:** _To be filled in by the designer._ The experiment was judged not worth pursuing.
- **Method note:** The changes were tangled in shared files (App.tsx, components.css), so only the landing and community parts were removed and the rest was kept.

## D02 · Studio defaults: desktop panels open, drawn glyphs visible

**Date:** 2026-11-12 · **Status:** ✅ (first commit on `v2`)

- **Decision:**
  - On desktop, both side panels (characters, brush and settings) start open. On touch devices they start closed.
  - In the character panel, a drawn letter shows as a thumbnail of the user's own glyph instead of the typed letter.
  - From tablet width up, the previous/next arrows sit beside the canvas.
- **Why:**
  - Desktop has room, and the panels hold the main controls, so hiding them only hid features.
  - The thumbnails turn the panel into a live progress view of the user's own font.

## D03 · Issues raised after a review session

**Date:** 2026-11-12

These came from the designer's own walkthrough:

1. Scrolling to the canvas doesn't land the user in a usable position.
2. On mobile, the "scroll vs draw" control is unclear. Its label shows the current state rather than the action, and it sits in the wrong place: small, among Undo/Clear.
3. The note preview doesn't work for users. The inputs are disconnected from the card, the text looks wrong, the preview is too far from the canvas, and its purpose is unclear.
4. The exported fonts are technically broken. A font diagnostic found monospace spacing, letters floating above the baseline, and wrong metadata (see [BACKLOG.md](../../BACKLOG.md), item 1).
5. The experience should feel like designing a typeface, not filling in a form.
6. Users should be able to publish their handwriting as a font, not only as notes. Reference: <https://facetypes.xyz/>.

## D04 · Iteration 1: snap scrolling to the canvas

**Date:** 2026-11-12 · **Status:** 🔁 replaced by D07

- **Problem:** The hero sat above the studio in one long scroll. Users had to scroll themselves to a position where the whole canvas was visible.
- **Tried:** CSS `scroll-snap-type: y proximity` on the page, with the drawing area as the snap point. "Proximity" was chosen over "mandatory" so the snap could never trap free scrolling.
- **Result:** The designer couldn't trigger it on mobile or on desktop.
  - Technical cause: a wrapper element was technically scrollable, and it captured the snap point from the page.
  - The bug was fixed, but D07 made snapping unnecessary.
- **Learning:** Snapping was compensating for a layout that gave the tool no fixed place.

## D05 · Iteration 1: Scroll | Draw toggle as a floating bottom control

**Date:** 2026-11-12 · **Status:** 🔁 replaced by D06

- **Problem:** On touch screens, a swipe on the canvas can mean "scroll the page" or "draw a stroke". The old "Scroll"/"Drawing" pill was unclear.
- **Tried:** A two-option "Scroll | Draw" control floating at the bottom of the screen while the canvas was in view. Both options were visible and the current one was filled in. Drawing was also blocked on the canvas only, so swiping beside it still scrolled.
- **Feedback from the designer:**
  - The look and feel didn't fit the product.
  - It belongs at the top, not the bottom.
  - Above all, the control should switch between two views, canvas and preview of the work-in-progress font, not between two touch modes.

## D06 · Iteration 2: Canvas | Preview at the top, as scroll navigation

**Date:** 2026-11-12 · **Status:** 🔁 replaced by D07 before testing

- **Tried:** A "Canvas | Preview" switch pinned under the header. Tapping it scrolled to the canvas or the note, and the highlighted option followed the scroll position. Drawing turned on automatically when the canvas was fully in view.
- **Known risk at the time:** a user who stopped on the canvas and then swiped would draw instead of scrolling.

## D07 · Reframe: the hero is the root problem, so the studio becomes home

**Date:** 2026-11-12 · **Status:** ✅ on `feature/studio-home` 🧪

- **Trigger:** The designer paused building to reassess as a senior UX designer: "The canvas is the key feature, and enabling users to preview their font is the main objective."
- **Diagnosis:** The home page was trying to be a story page and a tool at once.
  - The hero is read once. The canvas is used over and over and needs the screen to hold still.
  - Sharing one scroll caused the touch conflict (D05), the need for snapping (D04), and the distance between drawing and previewing (D03 #3).
  - Returning users lost a full screen to the hero on every visit.
- **Decision:** `/` opens straight onto the studio. The hero ("A love letter in times of AI", the manifesto and the tagline) moves to About, which is being reworked as part of v2 anyway.
- **Considered:** a short first-visit welcome on the studio instead of moving the hero. Rejected in favour of a full move. The voice is kept through About and warm empty-state copy.
- **Risks noted:**
  - Losing the story for first-time visitors.
  - Visitors from shared links landing in a tool with no context.
  - An empty Preview before anything is drawn.

## D08 · Draw | Preview as real views; side by side on desktop

**Date:** 2026-11-12 · **Status:** ✅ on `feature/studio-home` 🧪

- **Decision:**
  - **Mobile:** "Draw" and "Preview" are two views that swap in place, not scroll positions. A tab switch sits at the top as the main control.
  - **Desktop:** the canvas and the preview sit side by side, and the preview updates as the user draws.
- **Why:**
  - Once the page no longer scrolls to reach the tool, the switch stops being navigation and becomes the core model: make letters, then see them as a font.
  - In Draw view the canvas owns touch input and nothing else needs to scroll, so the Scroll/Draw mode disappears entirely.
  - Side by side on desktop shows the font building up with every stroke, which is the most motivating moment in the product.
- **Implementation choices:**
  - The switch is based on the space actually available, not the screen size. The open side panels (272px each) shrink the studio, so a laptop with both panels open gets tabs and a wide screen gets side by side.
  - On mobile, the canvas scales to the screen height so the Draw view fits without scrolling.
  - The Preview tab shows a count of drawn letters, so it's discoverable before the user switches to it.
  - When nothing has been drawn, a first-run hint reads "Draw this letter to start your font."
  - The tab styling follows the product's soft-shadow look: a pressed-in track with a raised active tab in the accent colour. This responds to the feedback on D05.

## D09 · Process: a separate v2 branch for the redesign

**Date:** 2026-11-12 · **Status:** ✅

- **Decision:** All redesign work happens on a `v2` branch created from `develop`. Each feature gets its own branch and pull request into `v2`. `v2` merges into `develop` once it holds together as a whole.
- **Why:** `develop` stays shippable for urgent fixes, and each step of the redesign can be reviewed and explained on its own.
- **Considered:** naming it `release-2`. `v2` was chosen because in common git practice `release/*` means a short-lived branch for final testing just before shipping.

## D10 · Fix the exported fonts before redesigning Preview

**Date:** 2026-11-12 · **Status:** ✅ on `fix/font-metrics` 🧪

- **Order decision:** fix the fonts before redesigning the Preview view (backlog item 3). The biggest complaint about Preview was that "the text looks wrong", and the cause was the font maths, not the layout. Redesigning Preview first would have meant judging it with broken text.
- **Research input:** a font diagnostic of three exported fonts (D03 #4). Tracing the code also found a problem the diagnostic missed: exported glyphs were squashed to about 53% of their drawn width. Horizontal and vertical used different scales, so the preview and the downloaded font never matched.
- **Decision:** one shared layout used by both the on-screen preview and the font export, so "what you preview is what you download".
  - **Same scale on both axes.** Glyphs keep the proportions they were drawn with.
  - **Size.** The template's cap line becomes 700 units, a typical cap height, and the baseline becomes 0. Before, letters were small and floated about 60 units above the line.
  - **Proportional spacing.** Each letter takes its own width plus 40 units of space on each side, so an "l" is narrow and a "W" is wide. Before, every letter had the same slot.
  - **Line height.** One set of line metrics for the whole family, so line height is identical on Mac and Windows and doesn't change when switching styles.
  - **Labelling.** Italic is now labelled as italic, so apps link it to Ctrl/Cmd+I. Underline values are set too.
- **Verified:** fonts were generated from test strokes and read back. Every value from the diagnostic now checks out (see the PR).
- **Deliberately not changed:** in connected-script mode letters keep a fixed width, because strokes have to meet at the anchors shown on the canvas.

## D11 · Old community notes keep their original look; cell guides removed

**Date:** 2026-11-12 · **Status:** ✅ on `fix/font-metrics`

- **Context:** the spacing fix (D10) changes how every message is laid out. Notes already shared were composed by their authors on the old layout, often with negative letter spacing to close the old gaps. Under the new layout, those letters would sit too close or touch.
- **Decision (designer):** keep old notes as they are. Notes created before v2 goes live are drawn with the old fixed-width layout, so each one looks exactly as its author shared it. New notes use proportional spacing.
- **Why:** a shared note is something the author made and published. Changing its look after the fact breaks that, even when the new spacing is technically better.
- **Considered:** drawing old notes at spacing 0. Rejected because it would still change how they look.
- **Second decision (designer):** remove the dashed "cell" lines from the canvas in normal mode. They showed the old fixed letter width, which no longer exists. Connected script still shows its entry and exit anchors.

## D12 · Replace the note card with a type specimen

**Date:** 2026-11-12 · **Status:** ✅ v0 on `feature/type-specimen` 🧪

- **Context:** the Preview view showed a single love-letter note. It answered "what does a message look like?" but not the questions a person asks while designing a font: is the spacing even, which letters are missing or broken, how does it hold up at different sizes?
- **Decision (designer):** replace the note with an established type-specimen pattern, the kind type foundries and font sites use. It doesn't need to be perfect yet; it'll be refined later.
- **What the v0 contains:**
  - **Toolbar:** a style switcher (Regular, Bold, Italic, Bold Italic, each with a count of drawn letters) and a size slider. It follows the style being drawn, but the user can switch to compare.
  - **Type tester:** free text the user types.
  - **Spacing test** for the letter currently on the canvas, using the designers' standard strings (`nnannoaoo` for lowercase, `HHAHHOAOO` for capitals). It updates as the user moves through the alphabet.
  - **Glyph set:** uppercase, lowercase, accented letters, numbers and punctuation. Letters not yet drawn appear faint, so gaps are easy to spot.
  - **Pangrams:** English and Spanish.
  - **Waterfall:** one phrase at 16, 24, 40 and 64px.
- **Why this pattern:** it's what designers already know from type foundries, so it needs no explanation. Each block answers one testing question: spacing, coverage, size, real text.
- **Deferred:** where the community note's message, To and Date fields go now. Sharing still works from the Community page.

## D13 · Iteration 2 of the specimen: simpler and stable

**Date:** 2026-11-12 · **Status:** ✅ on `feature/type-specimen` 🧪

- **Feedback from the designer on D12:**
  - "Nothing shows." Likely cause: letters not drawn yet rendered at 18% opacity. Drawings aren't kept across reloads, so on a fresh page the whole specimen was close to invisible.
  - There should be no inputs, just a preview.
  - The preview shouldn't change as the user moves to a new letter.
- **Decision:** cut the specimen down to a style switcher, one fixed phrase, and every character grouped as in the character panel. Removed:
  - the type tester input
  - the per-letter spacing test, which changed with every letter
  - the waterfall
  - the second pangram
  - the size slider (font size is still in the settings panel)
- **Missing letters:** they now render in a readable grey (40%) instead of almost invisible, with a one-line legend.
- **Learning:** a reference that shifts while you work stops being a reference. The value is a stable view to glance at while drawing, not a set of tools.

## D14 · Iteration 3 of the specimen: one block, flat

**Date:** 2026-11-12 · **Status:** ✅ on `feature/type-specimen` 🧪

- **Feedback from the designer on D13:** too many sections; no soft-shadow styling on the inputs.
- **Decision:**
  - The phrase and every character are one continuous block on a single preview. The per-group sections and their labels are gone.
  - The preview has no inset shadow. With one, it read as an input field, when it's a reading surface.
  - The style switcher uses the same flat text tabs as the Draw view, with an accent circle on the active style, instead of a raised control.
- **Why:** each section added a frame, a label and spacing between blocks, and all that chrome competed with the letters. The same tabs in Draw and Preview also make the two views feel like one tool.

---

## Open questions

- D01: why the landing + community experiment was rolled back (designer to fill in).
- How do the Draw | Preview tabs feel on a real phone, and does the canvas fit on small screens such as the iPhone SE?
- Should Preview show a sample of the font before anything is drawn?
- D12: where should writing and sharing a community note live now that Preview is a specimen?
