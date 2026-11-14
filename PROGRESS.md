# exhale: Progress

_Track: project development · Last updated: 2026-11-13 (overnight build, Stages 2–6)_

## ☀️ Check these first in the morning
1. **Open `exhale/index.html`** (double-click it) and click through every bubble. It all works offline from your computer.
2. **Listen to Calm sounds** (`activities/sounds/`). The sounds were checked by measuring them in code, not by ear. Try each slider and the 3 quick mixes. If one sounds off, tell me which one and how ("rain is too hissy").
3. **Try it on your phone.** Easiest way: publish it first (README, section 4, about 15 min), then open the link on your phone. On iPhone, sounds and chimes only play when the ring/silent switch is **not** on silent.
4. **Write your About story:** `about/index.html`, look for **EDIT ME** (2 placeholder lines).
5. **Double-check the crisis lines** on the Resources page before sharing: 988 (call or text) and text HOME to 741741.
6. **Decide on the name.** "exhale" is a placeholder. If you rename it, the README explains how.
7. Try making a journal PDF with your own writing to see if you like the layout.

## Stage status
| Stage | What | Status |
|---|---|---|
| 1 | Shared styles, nav, home bubbles, box breathing | ✅ done + tested |
| 2 | Mind jar, unsent letter | ✅ done + tested |
| 3 | 5-4-3-2-1 grounding, body scan, desk stretches | ✅ done + tested |
| 4 | Ambient sound mixer | ✅ done + tested |
| 5 | Study timer, journal | ✅ done + tested |
| 6 | Resources, About, SEO, deploy steps | ✅ done + tested |

**Nothing is broken that I know of, and there are no unfinished TODOs.** The open items are listed under "Things only you can do" below.

## Decisions I made on my own
_You can change any of these. Just say which._

**Whole site**
- **Name:** "exhale" is a placeholder. It appears in the brand link, page titles, the share image and the PDF header.
- **Folder:** the site lives in `exhale/`, separate from Feeling Compass.
- **Links:** they all end in `index.html`, so the site works by double-clicking files and also on GitHub Pages.
- **Fonts:** I used Manrope from Google Fonts, as you asked. It's the site's only outside connection, and the About page says so honestly. I can download the font into the site instead if you want zero outside requests.
- **Asking first:** anything that erases your writing asks "are you sure?" first (letting a letter go, clearing the journal draft).

**Mind jar**
- Thoughts are capped at 120 characters, and the jar holds up to 55 slips. When it's full, a message suggests shaking or releasing.
- Your words appear only on the folding paper. The slips in the jar don't store any text.

**Unsent letter**
- "Let it go" asks "Ready?" once, so a stray tap can't erase a letter.
- After it dissolves, there's a link to box breathing.
- The browser is told not to bring the text back if you return to the page.

**Reduced motion**
- With reduce motion on, everything still works but nothing glides.
- The jar settles instantly, the letter simply disappears, and the breathing square lights up one side at a time.

**Grounding**
- Each step has optional tap dots to keep count. They don't block "Next".

**Body scan**
- You can choose about 3 minutes (183 s) or about 5 minutes (279 s).
- It covers 11 areas, from "settling in", through head to feet, to "whole body".
- A simple shape figure glows warm on the area in focus.

**Desk stretches**
- Three routines: Quick reset (2 min), Neck and eyes (2 min), and Full desk break (about 4.7 min).
- There are 11 stretches, each with its own simple line drawing.
- Two-sided stretches say "Switch sides" halfway through, and there's a 3-second "Next up" pause between stretches.

**Sound mixer**
- I added 3 quick mixes you didn't ask for: Rainy study, Cabin night and By the sea.
- There's also an overall volume slider, Pause and Stop all, and a gentle limiter so layered sounds never get harsh.

**Study timer**
- When a round ends, it **waits for you to press Start**. It doesn't auto-start.
- It plays 3 soft rising notes (you can turn them off) and the ring glows warm.
- Break ideas **open in a new tab** so the timer keeps running.
- Body scan is suggested only for breaks of 5+ minutes, and stretches only for 2+ minutes.
- The "sessions done" count is only for this visit; nothing is tracked.

**Journal**
- There are 40 prompts, one per day in order, plus "Another prompt" and "Free write instead".
- The draft autosaves about 0.6 seconds after you stop typing.
- There's a note for people using shared computers.

**Journal PDF**
- I hand-wrote a tiny PDF maker, so there's no library and it works offline.
- Its built-in font can't draw emoji or Korean/Chinese/etc. Entries with those automatically open the browser's print window, where you choose "Save as PDF". That route supports every language.

**Resources page**
- I added "call 911 in an emergency" and findahelpline.com for people outside the US.
- There's a "Chat online" button for 988.
- The tone is warm: "You don't need to be in crisis to reach out."

**About page**
- It explains the privacy facts in plain words, including exactly what is stored on the device: the journal draft and timer settings.
- It includes a "not medical advice" note.

**SEO**
- Every page has a title, description, canonical link, Open Graph and Twitter tags, a favicon and an iPhone icon.
- There's a share image (`og-image.png`, 1200×630), a `sitemap.xml` and a `robots.txt`.
- **Search engines need your full web address, which doesn't exist until you publish.** So it's written as `https://YOUR-SITE-URL/` everywhere for now. README Step 5 shows how to replace it in one go with Find & Replace.

## Things only you can do (not bugs)
- Fill in the About page placeholders.
- Publish (GitHub account + upload). Then replace `YOUR-SITE-URL`, and optionally submit to Google Search Console. Every click is in README section 4.
- Listen to the sounds and try it on a real phone and in Safari. I could only test in Chrome on a computer.

## Known limits
- **iPhone:** web audio follows the ring/silent switch. That's Apple's rule, not a site bug.
- **Mind jar and unsent letter:** if you leave the page, they're gone. That's on purpose.
- **Real audio files** in `audio/` only load once the site is hosted, not from a double-clicked file. See `audio/README.txt`.

## Testing log
All tests ran in headless Chrome with an automated test script. I took screenshots and looked at them after each stage.
- **Stage 1:** a breathing logic test with a fake clock, plus screenshots at 360px and 1280px.
- **Stage 2:**
  - Mind jar: add 12 thoughts → shake → release → empty. Also tested with reduced motion.
  - Letter: write → "Not yet" keeps the text → let go → dissolve → wiped → write another.
  - Fixed: slips flew out too fast at the top, and the letter's text jumped at the dissolve.
- **Stage 3:**
  - Grounding: all steps, Back, dots, keyboard focus.
  - Body scan and stretches: a full run at 40× speed, plus pause/resume, skip, all 11 drawings and the routine data.
  - Fixed: a stray "0" during rests, and the body scan figure was too tall on phones.
- **Stage 4:**
  - Each sound rendered offline: audible, no clipping, no broken samples. Loudness was then balanced.
  - Live output measured on the real page: a preset plays, Pause/Play work, and Stop all goes silent.
- **Stage 5:** 38 checks.
  - Timer: a full 25-minute and 5-minute cycle run on a fast-forwarded clock, plus pause, settings, saving and bad input.
  - Journal: autosave, reload, .txt, PDF, the print fallback for Korean and emoji, and Clear.
  - The PDF's internal structure was checked, and it rendered correctly across 4 pages in macOS Quick Look.
- **Stage 6, whole site:**
  - All 12 pages at 360, 768 and 1280px: no sideways scroll.
  - **Every internal link and file reference resolves to a real file.** Every page has a title, description, OG tags, a skip link and a help link.
  - The sitemap is valid XML and covers all 12 pages.
  - Real Tab-key presses show a visible warm focus ring.
  - With reduced motion on, no long animations run and the bubbles stop floating.
- **Regression:** I re-ran all stage tests at the end. Everything passes except one body-scan timing check. That one read the text halfway through a 0.7-second fade; a separate test confirmed pause and resume work correctly.
- **Console errors across the whole site: 0.**

## 🚀 Launched: 2026-11-13
- **Live at https://exhalebetween.com.** The domain is through Porkbun, renews Nov 2027, auto-renew on, and is hosted free on GitHub Pages.
- **Address forwarding works:** HTTPS is on, http goes to https, and the old link `oliviainaloha11-dev.github.io/exhale/` forwards to the new domain.
- **DNS:** 4 A records point to GitHub Pages, plus a `www` CNAME. Porkbun's default link-in-bio forward was removed.
- **Your About note is live.**
- **It's an installable app now:**
  - `manifest.webmanifest`, 3 app icons, `sw.js` (offline mode) and `color-scheme: dark` (stops Android auto-darkening).
  - Tested on the live domain at Android size: Chrome reports it's installable, and all 12 pages and breathing work with the internet off.
- **When you add a new file later,** add it to the `FILES` list in `sw.js` and bump `VERSION`.

## 🔒 Privacy upgrade + visit counter (2026-11-13)
- **Font stored on our own site** (`fonts/`, OFL license). Visitors never contact Google.
- **Security lock (CSP)** on every page: pages can only load exhale's own files and can only send to the visit counter. Forms can't submit anywhere.
- **Journal:** a new "Save my draft on this device" switch. Turning it off deletes any saved draft and is remembered on that device, which suits shared and library computers.
- **New Privacy page** (`privacy/`), linked in every footer. It's written for teens and parents, and Google Play needs it later. The About page wording and the "no tracking" meta descriptions were updated to stay honest.
- **GoatCounter** (code `exhalebetween`):
  - The counter script is stored locally at `js/count.js`.
  - It sends only page, title, referrer and screen width. No cookies, no IP stored.
  - The installed app opens with `?ref=app`, so app use shows up separately. Library QR codes can use `?ref=library`.
- **Tested:**
  - 0 security-lock violations across all 13 pages and every feature (downloads, audio, canvas, drawings).
  - The only outside host contacted is the counter.
  - Offline mode still works for 13/13 pages.
  - All stage regressions pass.
- **Next:**
  - Install it on your Android phone.
  - Submit `sitemap.xml` in Google Search Console (README, Step 6).
  - Turn on 2FA for Porkbun and GitHub.
