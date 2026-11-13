/* =========================================================
   stretches.js — plays a routine one stretch at a time
   ---------------------------------------------------------
   The stretches and routines live in stretches-data.js.
   This file: shows the routine list, then runs a countdown for
   each stretch, says "switch sides" halfway when needed, and
   moves on to the next stretch by itself.
   ========================================================= */

(function () {
  const REST_SECONDS = 3;    // little pause between stretches
  const RING = 289.03;       // ring circumference (matches CSS)

  const screens = {
    chooser: document.getElementById("chooser"),
    player:  document.getElementById("player"),
    done:    document.getElementById("done")
  };
  const routineList = document.getElementById("routineList");
  const stepText    = document.getElementById("stepText");
  const nameText    = document.getElementById("nameText");
  const art         = document.getElementById("art");
  const ringFill    = document.getElementById("ringFill");
  const timeText    = document.getElementById("timeText");
  const howText     = document.getElementById("howText");
  const switchText  = document.getElementById("switchText");
  const pauseBtn    = document.getElementById("pauseBtn");
  const skipBtn     = document.getElementById("skipBtn");
  const endBtn      = document.getElementById("endBtn");
  const chimeToggle = document.getElementById("chimeToggle");
  const announce    = document.getElementById("announce");

  let routine = null;
  let index = 0;          // which stretch
  let length = 0;         // seconds for this stretch
  let left = 0;           // seconds left (can be fractional)
  let resting = false;    // in the short pause between stretches
  let switched = false;
  let paused = false;
  let lastTick = 0;
  let timerId = null;

  // ----- Build the routine buttons -----
  Calm.ROUTINES.forEach(function (r) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "routine-btn";
    btn.innerHTML = "<strong></strong><span></span>";
    btn.querySelector("strong").textContent = r.name;
    btn.querySelector("span").textContent = r.note + " · " + r.steps.length + " stretches";
    btn.addEventListener("click", function () { startRoutine(r); });
    li.appendChild(btn);
    routineList.appendChild(li);
  });

  function show(name) {
    Object.keys(screens).forEach(function (key) { screens[key].hidden = key !== name; });
    screens[name].querySelector("h1").focus();
  }

  function startRoutine(r) {
    routine = r;
    index = 0;
    paused = false;
    pauseBtn.textContent = "Pause";
    show("player");
    loadStretch();
    lastTick = performance.now();
    clearInterval(timerId);
    timerId = setInterval(tick, 250);
    if (chimeToggle.checked) Calm.getAudio();
  }

  function loadStretch() {
    const step = routine.steps[index];
    const s = Calm.STRETCHES[step[0]];
    length = step[1];
    left = length;
    resting = false;
    switched = false;
    stepText.textContent = (index + 1) + " of " + routine.steps.length;
    nameText.textContent = s.name;
    howText.textContent = s.how;
    art.innerHTML = s.art;      // our own drawing from the data file
    switchText.textContent = "";
    skipBtn.textContent = index === routine.steps.length - 1 ? "Finish" : "Skip";
    draw();
    announce.textContent = s.name + ". " + length + " seconds. " + s.how;
  }

  function draw() {
    timeText.textContent = Math.ceil(left);
    // Ring empties as time passes
    ringFill.style.strokeDashoffset = RING * (1 - left / length);
  }

  function tick() {
    const now = performance.now();
    const dt = (now - lastTick) / 1000;
    lastTick = now;
    if (paused) return;

    left -= dt;

    if (resting) {
      if (left <= 0) { index++; loadStretch(); }
      return;
    }

    // Halfway on a two-sided stretch: switch!
    const s = Calm.STRETCHES[routine.steps[index][0]];
    if (s.sides && !switched && left <= length / 2) {
      switched = true;
      switchText.textContent = "Switch sides";
      if (chimeToggle.checked) Calm.chime({ pitch: 392, volume: 0.06 });
    }

    if (left <= 0) {
      left = 0;
      draw();
      if (chimeToggle.checked) Calm.chime({ pitch: 523.25, volume: 0.07 });
      nextOrFinish();
      return;
    }
    draw();
  }

  // After a stretch: short rest with "Next up", or the end screen
  function nextOrFinish() {
    if (index >= routine.steps.length - 1) { finish(); return; }
    const next = Calm.STRETCHES[routine.steps[index + 1][0]];
    resting = true;
    left = REST_SECONDS;
    switchText.textContent = "Next up: " + next.name;
    timeText.textContent = "";                    // no number during the little rest
    ringFill.style.strokeDashoffset = RING;       // ring clears, ready for the next one
  }

  function finish() {
    clearInterval(timerId);
    show("done");
    announce.textContent = "Routine finished. Nice work.";
  }

  pauseBtn.addEventListener("click", function () {
    paused = !paused;
    pauseBtn.textContent = paused ? "Resume" : "Pause";
    announce.textContent = paused ? "Paused" : "Resumed";
  });

  skipBtn.addEventListener("click", function () {
    if (index >= routine.steps.length - 1) { finish(); return; }
    index++;
    loadStretch();
  });

  endBtn.addEventListener("click", function () {
    clearInterval(timerId);
    show("chooser");
  });

  document.getElementById("againBtn").addEventListener("click", function () { show("chooser"); });
  chimeToggle.addEventListener("change", function () { if (chimeToggle.checked) Calm.getAudio(); });
})();
