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

**Date:** 2026-11-12 · **Status:** ✅ (first commit on `v2`); glyph thumbnails 🔁 reverted in D15

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

## D15 · Revert the glyph thumbnails in the character panel

**Date:** 2026-11-12 · **Status:** ✅ on `feature/type-specimen`

- **Context:** D02 replaced each drawn letter in the character panel with a thumbnail of the user's drawing.
- **Decision (designer):** revert. The panel shows plain typed characters again, and a dot still marks the drawn ones.
- **Why:** _To be filled in by the designer._ Note: the Preview specimen (D12–D14) now shows every drawn letter in context, so the panel thumbnails duplicated it.

## D16 · Iteration 4 of the specimen: a working proof, not a display

**Date:** 2026-11-12 · **Status:** ✅ on `feature/type-specimen` 🧪

- **Context:** asked for a senior UX review of the Preview panel against type-specimen practice. The review proposed:
  1. spacing control strings (`HOHOHOH`, `nonono`)
  2. real words and a short paragraph
  3. clicking a letter in the specimen to open it on the canvas
  4. optional metric guide lines
  5. a coverage count
- **Designer's call:**
  - Ideas 1–2 were set aside: the product is not meant for professional type designers, so foundry testing conventions are the wrong register.
  - In their place, an optional input lets people preview **a phrase of their own**. This reverses part of D13 ("no inputs"). The difference: the input is optional, the pangram is the fallback, and the character set below stays fixed, so the specimen is still a stable reference.
  - Ideas 3, 4 and 5 were accepted.
- **What was built:**
  - **Own phrase:** a flat, underline-only input above the specimen. It replaces the first line; when it's empty, the pangram shows.
  - **Click to draw:** clicking any character in the specimen switches the canvas to that letter and style. On mobile, it also switches to the Draw view. This closes the loop from spotting a problem to fixing it. Keyboard users still select letters through the character panel.
  - **Guides:** an off-by-default toggle that adds dashed cap-height and x-height lines to every line of the specimen, so letters that sit low or run short stand out.
  - **Coverage:** "42 / 95 drawn" for the selected style, next to the toggle. It replaces the small per-tab counts, so the number appears once.
- **Why:** _To be filled in by the designer._

## D17 · Later: automatic styles from Regular

**Date:** 2026-11-12 · **Status:** 💡 backlog → specced in D23

- **Idea (designer):** once someone has drawn Regular, generate Bold, Italic and Bold Italic automatically. They can still adjust the generated styles or redraw them by hand.
- **Why it matters:** today, every style means drawing the whole set again, which is the main reason coverage is uneven across styles (see D10).
- Parked for later. Logged here so the specimen's style tabs and coverage count are designed with it in mind.

## D18 · Iteration 5: one style switcher, aligned columns, a calmer specimen

**Date:** 2026-11-12 · **Status:** ✅ on `feature/type-specimen` 🧪

- **Feedback from the designer on D16 (desktop screenshot):**
  - The layout is unbalanced.
  - The existing neumorphic input wasn't used.
  - Regular / Bold / Italic appears twice.
  - The right column isn't aligned with the canvas.
  - The preview looks messy and poor.
- **Decision:**
  - **One style switcher** above both columns, shared by Draw and Preview, also on mobile. The specimen always shows the style being drawn. Two switchers could disagree: you could draw Bold while previewing Regular. The per-tab counts are gone; coverage lives in Preview.
  - **Aligned columns:** on desktop, the Draw column starts at the top instead of centring vertically, and the preview starts level with the canvas.
  - **Input:** the phrase field uses the app's inset neumorphic field (the same one as the old note inputs). This reverses the flat underline from D16. D14's "no neumorphism" applied to the reading surface, not to inputs.
  - **Calmer specimen:**
    - Ruled lines are off by default and come back with Guides. A clean surface reads as type, not as a notebook.
    - Undrawn characters use one neutral sans, sized to the cap line. Before, they mixed a serif and a previously loaded handwriting font at different sizes.
    - The phrase leads, and the character set sits a size smaller (70%) underneath it, still on the same sheet with no labels.
    - The legend, coverage and the Guides toggle moved into one quiet footer row under the sheet.
  - Old community notes keep their original rules and fallback font (D11).
- **Why:** _To be filled in by the designer._ Note: the feedback above names the problems; the reasons for each specific fix are still the designer's to state.

## D19 · The cap guide moves down to where template capitals end

**Date:** 2026-11-12 · **Status:** ✅ on `feature/type-specimen` 🧪

- **Found by:** the designer, using the specimen's Guides toggle from D16. The drawn capitals stopped well short of the cap line.
- **Cause:** the canvas guides and the grey template letter disagreed.
  - The template font was set so its whole em (264px) equalled baseline-to-cap-guide, but a capital only fills about 71% of the em.
  - So the template capitals ended about 76px below the cap guide, while template lowercase sat right on the x guide.
  - Tracing the template therefore produced short capitals, and the export (D10) scaled from the cap guide, so every font came out with capitals about 30% shorter than its declared cap height.
- **Options considered:**
  1. Lower the cap guide to the template's capitals.
  2. Enlarge the template and move the x guide up.
  3. Size template capitals and lowercase separately.
- **Decision (designer):** option 1.
  - The cap guide now sits where the template capitals end (≈189px above the baseline, previously 264px), and the x guide stays where it was.
  - Letters already drawn by tracing the template become correctly sized.
  - Accented capitals get more room above the cap line.
  - The template now measures its font's real cap height, so a custom template font also lands on the guide.
- **Effects on the export (updates D10):**
  - Cap height is still 700 units, so the same drawing now exports about 40% larger.
  - x-height is now 535 (was 382), winAscent/winDescent are 1439/583, and line metrics stay 900/−300.
- **Preview:** each specimen line now crops the empty canvas space above the tallest letters, so lines sit closer together. Old community notes keep their original scale and look (D11).
- **Learning:** making the metrics visible in Preview (Guides) exposed a fault in Draw that had been there since v1. Preview isn't only for admiring the font; it checks the whole tool.
- **Why option 1:** _To be filled in by the designer._ Recommendation given at the time: it is the only option that keeps letters already drawn valid.

## D20 · Iteration 6 of the specimen: bugs, empty state, rhythm, controls

**Date:** 2026-11-13 · **Status:** ✅ on `feature/type-specimen` 🧪

- **Context:** a UI/UX review of the screenshot after D19, with nothing drawn yet. The designer approved the proposed pass ("go ahead").
- **Bugs fixed:**
  - Words split mid-word ("jump / s"). The preview now wraps between words; only a word longer than the line breaks between letters.
  - Every row after the first was indented by a space. Fixed.
  - Each character group now stays on one line: the set shrinks to fit the column instead of leaving "Z" alone on a line.
  - The coverage count included the 8 ligatures the specimen doesn't show ("0 / 114"). It now counts only visible characters ("0 / 106"). Ligatures stay drawable and still export.
  - Two empty-state messages said the same thing. One is left.
- **Empty state:**
  - With nothing drawn, Preview showed a complete, solid system font, which read as a finished font.
  - Now, until a letter is drawn in the style, a short empty state takes the specimen's place ("Your font will appear here as you draw").
  - Missing characters render much lighter (20%, was 40%), so drawn letters clearly lead.
- **Layout and rhythm:**
  - The preview column is narrower (max 36rem), so it pairs with the canvas column instead of running edge to edge.
  - One spacing scale: a fixed gap between the phrase and the character set. The set's rows have room for accents over capitals, and the empty canvas space above and below each line is cropped.
  - The character set is now 60% of the phrase size, and smaller if needed to fit.
- **Controls:**
  - Guides uses the app's neumorphic toggle switch instead of the browser checkbox.
  - Click-to-draw shows a soft cell behind the character under the pointer.
- **Deferred:**
  - **Canvas headroom.** About 170px of empty canvas above the cap line since D19. Fixing it changes geometry that stored drawings depend on, so it gets its own decision.
  - **Marking the current letter in the specimen:** the designer's call, given the "stable" rule from D13.
- **Why:** _To be filled in by the designer._ The review's reasoning is above; confirm or replace it.

## D21 · Desktop: balance the canvas and the preview

**Date:** 2026-11-13 · **Status:** ✅ on `feature/type-specimen` 🧪

- **Feedback from the designer (screenshot with 25 letters drawn):**
  - With the side panels closed, the preview stretches toward the right edge.
  - The two columns aren't balanced or aligned.
  - The preview sits toward the top instead of being centred against the canvas.
- **Decision:**
  - **One centred frame (max 76rem)** holds two equal columns with a fixed 3rem gap. The frame's side padding clears the fixed panel and settings buttons. The columns therefore mirror each other around the middle of the studio, with the panels open or closed, and the preview no longer runs to the edge.
  - **Vertical centring:** both columns are centred in the viewport, so the canvas group (letter, canvas, Undo/Clear) and the preview group (phrase field, specimen, footer) share a centre line. When the preview grows taller than the screen it extends downward while the canvas stays in view.
  - **Pinned style bar:** the shared style switcher stays pinned under the header on desktop, because both columns depend on it.
- **Also fixed:** "Z" still wrapped onto its own line. The fit-to-width step sized the row to exactly the available width, and sub-pixel rounding pushed the last letter over. It now leaves 2% headroom.
- **Cause found along the way:** the earlier "align the preview with the canvas top" padding (D18) never took effect, because utility classes overrode it. The vertical spacing of both columns now lives in the layout CSS only.
- **Why:** _To be filled in by the designer._

## D22 · The style switcher joins the centred block

**Date:** 2026-11-13 · **Status:** ✅ on `feature/type-specimen` 🧪

- **Feedback from the designer on D21:** with both columns centred, the style switcher sat pinned under the header, far above everything it controls.
- **Options considered:**
  - **A.** First row of the centred frame, spanning both columns.
  - **B.** Above the canvas only.
  - **C.** In the header.
- **Decision:** A.
  - The switcher, the canvas and the specimen now move as one block centred in the viewport.
  - The switcher sits centred over the gap between the columns. Its position says it changes both sides, which is the point of having one shared switcher (D18).
  - It no longer stays pinned on scroll; the canvas still does.
  - Mobile is unchanged: the switcher sits under the Draw | Preview tabs.
- **Why A:** _To be filled in by the designer._ Recommendation given at the time: B would need a second style label on the preview side, a mild return of the duplication removed in D18.

## D23 · Auto Bold and Italic from Regular (spec)

**Date:** 2026-11-13 · **Status:** 📐 specced; to build on `feature/auto-styles` (supersedes the D17 idea)

- **Idea (designer, D17):** once Regular is drawn, generate the other styles automatically, and let people override them.
- **How the styles are made:** letters are stored as pen strokes, so each style can be computed from Regular:
  - Italic slants the strokes (12° by default, the angle the export already writes).
  - Bold redraws the same strokes with a thicker pen. Spacing follows automatically, because it's measured from the ink.
  - Bold Italic does both.
- **Designer's answers:**
  1. **Override per letter.** Every letter in Bold, Italic and Bold Italic starts as *auto*. Drawing it in that style makes it *custom*, and "Reset to auto" goes back.
  2. **Auto letters follow Regular.** Redrawing a Regular letter updates its auto versions until they're overridden.
  3. **People can adjust it:** weight for Bold, slant for Italic.
  4. **When overriding, the auto letter is a ghost to trace**, not an editable copy of its strokes.
- **Implications to design:**
  - The character panel distinguishes auto from custom letters (proposal: hollow dot vs filled).
  - The canvas shows "Auto from Regular · draw to replace".
  - The specimen footer counts both ("75 drawn · 31 auto").
  - Letters already drawn in Bold become custom, so nothing is lost.
  - The download includes the whole family once Regular is complete, which fixes the uneven coverage found in D10.
  - Bold weight needs a cap, because small counters (e, a) fill in.
- **Open:** where the weight and slant controls live (settings panel, or next to the style switcher).
- **Why:** _To be filled in by the designer._

---

## Open questions

- D01: why the landing + community experiment was rolled back (designer to fill in).
- How do the Draw | Preview tabs feel on a real phone, and does the canvas fit on small screens such as the iPhone SE?
- ~~Should Preview show a sample of the font before anything is drawn?~~ Answered in D20: an empty state, not a sample.
- D12: where should writing and sharing a community note live now that Preview is a specimen?
- Canvas headroom: crop the empty space above the cap line (geometry change; affects stored drawings).
- Should the specimen mark the letter currently on the canvas?
