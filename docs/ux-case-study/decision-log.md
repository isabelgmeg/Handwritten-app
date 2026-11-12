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

---

## Open questions

- D01: why the landing + community experiment was rolled back (designer to fill in).
- How do the Draw | Preview tabs feel on a real phone, and does the canvas fit on small screens such as the iPhone SE?
- Should Preview show a sample of the font before anything is drawn?
