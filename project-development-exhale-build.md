# exhale: Build Log

**Track:** project development
**Verification tier:** Full (student deliverable)
**Owner role:** Web Builder (not yet a /team/ profile; roster gap is flagged)

---

## Stage 1: Shared styles, nav, home, box breathing (2026-11-12) ✅

### Summary
Stage 1 sets up the base of the static site in `exhale/`.

**Shared files**
- `css/base.css`: color tokens, Manrope font, top-right nav, buttons, a toggle switch, the footer with "Need to talk to someone?" and About links, a focus ring, a skip link, and a reduced-motion override.
- `js/main.js`: the `Calm.reducedMotion()` helper.
- `js/chime.js`: a soft bell made with the Web Audio API. The timer will reuse it.
- `favicon.svg`

**Home** (`index.html` + `css/home.css`)
- A welcome line and 7 round "bubble" links, each with a line icon.
- The bubbles float slowly at staggered times and glow warm on hover or keyboard focus.

**Box breathing** (`activities/breathing/`)
- A dot traces an SVG square in 16-second cycles (4 s in, hold, out, hold), with a traced line behind it.
- The inner square grows and shrinks with each breath.
- The cue text has a 4-3-2-1 countdown and is announced to screen readers.
- Controls: Pause, Resume and Start over, a round counter, and an optional chime that plays a different note for each step.

**Known gaps**
- Six bubbles and the Timer, Journal, Resources and About links lead to pages that don't exist yet. Stages 2–6 build them.
- Not yet tested on a real phone or in Safari.
- The site name "exhale" is a placeholder.

### Verification performed
- `node --check` passed on all JS files.
- A Node test with a fake clock ran `breathing.js` at 0, 1, 4, 6, 8, 10, 12, 16 and 17 seconds. At every point, the phase, countdown, dot position, square scale, traced line and round count were correct.
  - Pause then resume continues from where it paused.
  - Start over resets everything.
  - Reduced-motion mode lights up whole sides step by step, hides the dot and keeps the inner square still.
  - The chime plays the right note on each step.
- Headless Chrome screenshots at 1280px and 360px:
  - no horizontal scroll
  - the nav stays on one line on a phone
  - the bubbles wrap 3-3-1 on a phone and 4-3 on a desktop.
- Found and fixed: the cue text sat a little above center because of the countdown line under it.

---

## Stages 2–6 (overnight 2026-11-12 → 11-13) ✅

### Summary
The site is complete. It has 7 activities, the Study Timer, the Journal (with .txt download, a hand-made PDF maker and a print fallback), Resources, About, full SEO, and README deploy steps for GitHub Pages and Netlify. Every decision made without the student, and their morning checklist, is in `PROGRESS.md`.

**Known gaps**
- Not tested on a real phone or in Safari.
- The sounds haven't been checked by ear.
- The About story is still a placeholder.
- `YOUR-SITE-URL` needs replacing after publishing.
- The crisis lines should be re-checked before launch.

### Verification (Full tier)
- **Automated tests in headless Chrome:**
  - Stage 2: 21 checks.
  - Stage 3: 26 checks.
  - Stage 4: 18 checks, including offline audio analysis and live output measurement.
  - Stage 5: 38 checks, including a PDF structure check and a Quick Look render.
  - Whole site: 12 pages × 3 widths, a link and file-reference check, metadata, keyboard focus and reduced motion.
- **Regression:** I re-ran every test after the final changes. Everything passes except one known test-timing artifact, which a separate test proved is fine.
- **Console errors: 0. Broken links: 0.**
- **Corrective actions:** 7 issues were found by the tests and screenshots, and all were fixed. Details are in PROGRESS.md under "Testing log".
