/* =========================================================
   unsent-letter.js — write it, then let it dissolve
   ---------------------------------------------------------
   1. The textarea grows as you type (no tiny scroll box).
   2. "Let it go" asks once ("Ready?") so it can't vanish by
      accident.
   3. To dissolve, we copy your words into a "ghost" layer
      where every word is its own <span>, then each word
      drifts up and blurs away at its own moment.
   4. Then everything is wiped. Nothing is saved, ever.
   ========================================================= */

(function () {
  const letter    = document.getElementById("letter");
  const toInput   = document.getElementById("to");
  const body      = document.getElementById("body");
  const actions   = document.getElementById("actions");
  const letGoBtn  = document.getElementById("letGoBtn");
  const confirmEl = document.getElementById("confirm");
  const yesBtn    = document.getElementById("yesBtn");
  const notYetBtn = document.getElementById("notYetBtn");
  const after     = document.getElementById("after");
  const againBtn  = document.getElementById("againBtn");
  const announce  = document.getElementById("announce");

  const rand = function (a, b) { return a + Math.random() * (b - a); };

  // Pressing Enter in the "Dear ___" box must never submit the letter anywhere
  letter.addEventListener("submit", function (e) { e.preventDefault(); });

  // ----- Grow the textarea to fit the words -----
  function autoGrow() {
    body.style.height = "auto";
    body.style.height = body.scrollHeight + "px";
  }

  // Only allow "Let it go" once something is written
  function updateButton() {
    letGoBtn.disabled = body.value.trim() === "" && toInput.value.trim() === "";
  }

  body.addEventListener("input", function () { autoGrow(); updateButton(); });
  toInput.addEventListener("input", updateButton);

  // ----- Step 1: ask "Ready?" -----
  letGoBtn.addEventListener("click", function () {
    actions.hidden = true;
    confirmEl.hidden = false;
    yesBtn.focus();
  });

  notYetBtn.addEventListener("click", function () {
    confirmEl.hidden = true;
    actions.hidden = false;
    body.focus();
  });

  // ----- Step 2: dissolve -----
  yesBtn.addEventListener("click", function () {
    confirmEl.hidden = true;

    if (Calm.reducedMotion()) {
      // No drifting: it simply goes
      wipe();
      showAfter();
      return;
    }

    // Build the ghost copy: "Dear ___," line + every word of the letter
    const ghost = document.createElement("div");
    ghost.className = "letter-ghost";
    ghost.setAttribute("aria-hidden", "true");

    // The "Dear ___" line fades where it is (see .is-dissolving in CSS);
    // only the letter body becomes drifting words, so nothing jumps.
    const text = body.value;

    // Split into words + the spaces between them (spaces stay as plain text)
    const parts = text.split(/(\s+)/);
    const wordCount = parts.filter(function (p) { return p.trim(); }).length;
    // Very long letters: group words so phones don't struggle
    const groupSize = Math.max(1, Math.ceil(wordCount / 700));

    let index = 0;
    let buffer = "";
    parts.forEach(function (part, i) {
      if (!part.trim()) {                       // whitespace
        if (buffer) { buffer += part; return; }
        ghost.appendChild(document.createTextNode(part));
        return;
      }
      buffer += part;
      const isLastWord = parts.slice(i + 1).every(function (p) { return !p.trim(); });
      if ((index + 1) % groupSize === 0 || isLastWord) {
        ghost.appendChild(makeWord(buffer.replace(/\s+$/, ""), index, wordCount));
        const trailing = buffer.match(/\s+$/);
        if (trailing) ghost.appendChild(document.createTextNode(trailing[0]));
        buffer = "";
      }
      index++;
    });

    // Swap the textarea for the ghost, and let the "Dear" line fade
    toInput.disabled = true;
    letter.querySelector(".letter-to").classList.add("is-dissolving");
    body.hidden = true;
    letter.appendChild(ghost);
    announce.textContent = "Letting it go.";

    // Like a breeze passing over the page: early words go first
    const total = 1400 + 900 + 2200;   // max delay + jitter + word animation
    setTimeout(function () {
      letter.classList.add("is-fading");
      setTimeout(function () {
        wipe();
        ghost.remove();
        showAfter();
      }, 900);
    }, total);
  });

  // One drifting word
  function makeWord(text, index, total) {
    const span = document.createElement("span");
    span.className = "ghost-word";
    span.textContent = text;
    const progress = total > 1 ? index / (total - 1) : 0;
    span.style.setProperty("--delay", Math.round(progress * 1400 + rand(0, 900)) + "ms");
    span.style.setProperty("--dx", rand(-14, 14).toFixed(1) + "px");
    span.style.setProperty("--dy", rand(-36, -14).toFixed(1) + "px");
    span.style.setProperty("--rot", rand(-8, 8).toFixed(1) + "deg");
    return span;
  }

  // Erase everything that was written
  function wipe() {
    toInput.value = "";
    body.value = "";
    letter.hidden = true;
  }

  function showAfter() {
    after.hidden = false;
    announce.textContent = "It's gone.";
    after.focus();
  }

  // ----- Write another -----
  againBtn.addEventListener("click", function () {
    after.hidden = true;
    letter.classList.remove("is-fading");
    letter.hidden = false;
    letter.querySelector(".letter-to").classList.remove("is-dissolving");
    toInput.disabled = false;
    body.hidden = false;
    actions.hidden = false;
    autoGrow();
    updateButton();
    body.focus();
  });

  autoGrow();
  updateButton();
})();
