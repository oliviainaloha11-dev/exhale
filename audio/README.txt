audio/ — optional real sound recordings
=======================================

Right now every sound on the Calm sounds page is GENERATED in the
browser (no files needed), so this folder can stay empty.

If you'd like to use a real recording instead:

1. Find a loopable sound that you're allowed to use. Good free sources
   are freesound.org (check the license, CC0 is easiest) or
   pixabay.com/sound-effects. Keep each file small (under ~2 MB).
   .mp3 works everywhere.

2. Put it in this folder, for example:   audio/rain.mp3

3. Open activities/sounds/sounds.js, find the sound in the SOUNDS
   list, and change
        file: null,
   to
        file: "../../audio/rain.mp3",

4. Done. If the file ever fails to load, the page quietly falls
   back to the generated version.

Note: real files only load when the site is hosted (GitHub Pages,
Netlify) or run from a local server, not when you double-click
index.html on your computer. That's a browser safety rule.
