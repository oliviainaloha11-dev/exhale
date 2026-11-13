/* =========================================================
   grounding.js — the 5-4-3-2-1 step-by-step flow
   ---------------------------------------------------------
   To change the wording, edit the STEPS list below.
   ========================================================= */

(function () {
  const STEPS = [
    { n: 5, sense: "see",   prompt: "Notice 5 things you can see",
      hint: "Look for small things: a shadow, a color you like, the corner of something." },
    { n: 4, sense: "touch", prompt: "Notice 4 things you can touch",
      hint: "Your sleeve, the desk under your hand, your feet in your shoes, the air on your skin." },
    { n: 3, sense: "hear",  prompt: "Notice 3 things you can hear",
      hint: "Something far away, something close, and maybe the quiet in between." },
    { n: 2, sense: "smell", prompt: "Notice 2 things you can smell",
      hint: "If nothing stands out, try your sleeve, your hands, or just the air in the room." },
    { n: 1, sense: "taste", prompt: "Notice 1 thing you can taste",
      hint: "Even just the inside of your mouth. Or take a sip of water and really taste it." }
  ];

  const screens = {
    intro: document.getElementById("intro"),
    step:  document.getElementById("step"),
    done:  document.getElementById("done")
  };
  const progressText = document.getElementById("progressText");
  const bigNumber    = document.getElementById("bigNumber");
  const promptText   = document.getElementById("promptText");
  const hintText     = document.getElementById("hintText");
  const dots         = document.getElementById("dots");
  const backBtn      = document.getElementById("backBtn");
  const nextBtn      = document.getElementById("nextBtn");
  const announce     = document.getElementById("announce");

  let current = 0;

  // Show one screen, hide the others, and move keyboard focus to its heading
  function show(name) {
    Object.keys(screens).forEach(function (key) {
      screens[key].hidden = key !== name;
    });
    // Re-run the fade-in animation
    const screen = screens[name];
    screen.style.animation = "none";
    void screen.offsetWidth;
    screen.style.animation = "";
    screen.querySelector("h1").focus();
  }

  function renderStep() {
    const s = STEPS[current];
    progressText.textContent = "Step " + (current + 1) + " of " + STEPS.length;
    bigNumber.textContent = s.n;
    promptText.textContent = s.prompt;
    hintText.textContent = s.hint;
    backBtn.textContent = current === 0 ? "Back to start" : "Back";
    nextBtn.textContent = current === STEPS.length - 1 ? "Finish" : "Next";

    // Make one dot per thing to notice
    dots.innerHTML = "";
    for (let i = 0; i < s.n; i++) {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "g-dot";
      dot.setAttribute("aria-pressed", "false");
      dot.setAttribute("aria-label", "Noticed thing " + (i + 1) + " you can " + s.sense);
      dot.addEventListener("click", function () {
        const on = dot.getAttribute("aria-pressed") === "true";
        dot.setAttribute("aria-pressed", String(!on));
      });
      dots.appendChild(dot);
    }
    show("step");
    announce.textContent = "Step " + (current + 1) + " of 5. " + s.prompt + ".";
  }

  document.getElementById("beginBtn").addEventListener("click", function () {
    current = 0;
    renderStep();
  });

  nextBtn.addEventListener("click", function () {
    if (current < STEPS.length - 1) {
      current++;
      renderStep();
    } else {
      show("done");
    }
  });

  backBtn.addEventListener("click", function () {
    if (current === 0) { show("intro"); return; }
    current--;
    renderStep();
  });

  document.getElementById("againBtn").addEventListener("click", function () {
    current = 0;
    renderStep();
  });
})();
