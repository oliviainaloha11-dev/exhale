/* =========================================================
   body-scan.js — a guided head-to-toe body scan
   ---------------------------------------------------------
   The script is the AREAS list below. Each area has:
     name     → the small label above the words
     parts    → which shapes in the figure light up
     seconds  → how long to stay (multiplied by the length choice)
     cue      → what it says
   Edit the words freely!
   ========================================================= */

(function () {
  const AREAS = [
    { name: "Settling in", parts: [], seconds: 20,
      cue: "Let your eyes soften or close. Take one slow breath in… and a long breath out." },
    { name: "Top of your head", parts: ["head"], seconds: 22,
      cue: "Bring your attention to the top of your head and your forehead. Let your forehead go smooth." },
    { name: "Eyes and jaw", parts: ["face"], seconds: 24,
      cue: "Notice your eyes, your cheeks, your jaw. Let your teeth part a little. Let your tongue rest." },
    { name: "Neck and shoulders", parts: ["neck", "shoulders"], seconds: 28,
      cue: "Notice your neck and shoulders. If they're lifted toward your ears, let them drop, just a little." },
    { name: "Arms and hands", parts: ["arms", "hands"], seconds: 24,
      cue: "Feel the weight of your arms. Notice your hands. Let your fingers uncurl." },
    { name: "Chest", parts: ["chest"], seconds: 24,
      cue: "Notice your chest rising and falling. You don't need to change your breath. Just watch it." },
    { name: "Stomach", parts: ["belly"], seconds: 20,
      cue: "Let your stomach soften. There's nothing to hold in right now." },
    { name: "Back", parts: ["shoulders", "chest", "belly"], seconds: 20,
      cue: "Notice your back against the chair or the floor. Let it be supported." },
    { name: "Hips and legs", parts: ["hips", "legs"], seconds: 24,
      cue: "Notice your hips and the length of your legs. Let them feel heavy and still." },
    { name: "Feet", parts: ["feet"], seconds: 22,
      cue: "Feel your feet. The floor beneath them. Wiggle your toes if you'd like." },
    { name: "Whole body", parts: ["head", "neck", "shoulders", "chest", "belly", "hips", "arms", "hands", "legs", "feet"], seconds: 26,
      cue: "Now notice your whole body at once, head to toe. Breathing. Here. When you're ready, gently come back." }
  ];

  const figure      = document.getElementById("figure");
  const areaText    = document.getElementById("areaText");
  const cueText     = document.getElementById("cueText");
  const progressBar = document.getElementById("progressBar");
  const startBtn    = document.getElementById("startBtn");
  const stopBtn     = document.getElementById("stopBtn");
  const lengthBox   = document.getElementById("lengthChoice");
  const chimeToggle = document.getElementById("chimeToggle");

  let durations = [];     // seconds per area, after the length choice
  let total = 0;
  let elapsed = 0;        // seconds done so far
  let lastTick = 0;
  let timerId = null;
  let currentArea = -1;
  let running = false;

  // Light up the figure shapes for one area
  function highlight(parts) {
    figure.querySelectorAll("[data-area]").forEach(function (shape) {
      shape.classList.toggle("is-active", parts.indexOf(shape.dataset.area) !== -1);
    });
  }

  // Fade the words out, swap them, fade back in
  function setWords(name, cue) {
    const delay = Calm.reducedMotion() ? 0 : 700;
    areaText.classList.add("is-changing");
    cueText.classList.add("is-changing");
    setTimeout(function () {
      areaText.textContent = name;
      cueText.textContent = cue;
      areaText.classList.remove("is-changing");
      cueText.classList.remove("is-changing");
    }, delay);
  }

  function areaAt(seconds) {
    let sum = 0;
    for (let i = 0; i < durations.length; i++) {
      sum += durations[i];
      if (seconds < sum) return i;
    }
    return durations.length;   // finished
  }

  function tick() {
    const now = performance.now();
    elapsed += (now - lastTick) / 1000;
    lastTick = now;

    const index = areaAt(elapsed);
    progressBar.style.width = Math.min(100, (elapsed / total) * 100) + "%";

    if (index >= AREAS.length) { finish(); return; }

    if (index !== currentArea) {
      currentArea = index;
      const a = AREAS[index];
      highlight(a.parts);
      setWords(a.name, a.cue);
      if (chimeToggle.checked && index > 0) Calm.chime({ pitch: 440, volume: 0.06, length: 3 });
    }
  }

  function start() {
    if (elapsed === 0) {
      const factor = parseFloat(lengthBox.querySelector("input:checked").value);
      durations = AREAS.map(function (a) { return Math.round(a.seconds * factor); });
      total = durations.reduce(function (x, y) { return x + y; }, 0);
      currentArea = -1;
    }
    running = true;
    lastTick = performance.now();
    timerId = setInterval(tick, 250);
    tick();
    if (chimeToggle.checked) Calm.getAudio();
    startBtn.textContent = "Pause";
    stopBtn.hidden = false;
    lengthBox.hidden = true;
  }

  function pause() {
    running = false;
    clearInterval(timerId);
    startBtn.textContent = "Resume";
  }

  function reset() {
    clearInterval(timerId);
    running = false;
    elapsed = 0;
    currentArea = -1;
    highlight([]);
    progressBar.style.width = "0";
    startBtn.textContent = "Begin";
    stopBtn.hidden = true;
    lengthBox.hidden = false;
  }

  function finish() {
    reset();
    highlight([]);
    setWords("Done", "Welcome back. Take your time getting up. Notice how you feel now compared to when you started.");
    startBtn.textContent = "Do it again";
    if (chimeToggle.checked) Calm.chime({ pitch: 523.25, volume: 0.07, length: 4 });
  }

  startBtn.addEventListener("click", function () { running ? pause() : start(); });
  stopBtn.addEventListener("click", function () {
    reset();
    setWords("Ready when you are", "");
  });
  chimeToggle.addEventListener("change", function () { if (chimeToggle.checked) Calm.getAudio(); });
})();
