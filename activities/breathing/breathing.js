/* =========================================================
   breathing.js — box breathing (4 in, 4 hold, 4 out, 4 hold)
   ---------------------------------------------------------
   How it works:
   - One full "box" = 4 phases × 4 seconds = 16 seconds.
   - Every animation frame we ask "how many seconds since we
     started?" and from that work out which phase we're in,
     where the dot should be, and how big the inner square is.
   - Working from elapsed time (instead of counting frames)
     keeps it accurate even if the phone gets busy.
   ========================================================= */

(function () {
  // ----- Settings you can change -----
  const SECONDS_PER_PHASE = 4;

  // Each phase: what it says, the chime note, and which way the inner square moves
  const PHASES = [
    { label: "Breathe in",  pitch: 523.25, size: "grow"   }, // top edge
    { label: "Hold",        pitch: 392.0,  size: "full"   }, // right edge
    { label: "Breathe out", pitch: 329.63, size: "shrink" }, // bottom edge
    { label: "Hold",        pitch: 392.0,  size: "empty"  }  // left edge
  ];

  const CYCLE = SECONDS_PER_PHASE * PHASES.length;   // 16 seconds
  const SQUARE = { start: 20, side: 160 };            // matches the SVG path
  const PATH_LENGTH = SQUARE.side * 4;                // 640
  const MIN_SCALE = 0.55;                             // inner square at "empty"

  // ----- Grab the page elements -----
  const breath     = document.getElementById("breath");
  const fill       = document.getElementById("breathFill");
  const progress   = document.getElementById("breathProgress");
  const dot        = document.getElementById("breathDot");
  const phaseText  = document.getElementById("phaseText");
  const countText  = document.getElementById("countText");
  const announce   = document.getElementById("announce");
  const roundsText = document.getElementById("roundsText");
  const startBtn   = document.getElementById("startBtn");
  const resetBtn   = document.getElementById("resetBtn");
  const chimeToggle = document.getElementById("chimeToggle");

  // ----- State -----
  let running = false;
  let startedAt = 0;        // performance.now() when we last pressed play
  let elapsedBefore = 0;    // seconds banked from before a pause
  let lastPhase = -1;
  let lastRounds = 0;
  let frameId = null;

  // A smooth "ease in and out" curve: 0 → 1 with soft ends
  function ease(t) {
    return 0.5 - Math.cos(Math.PI * t) / 2;
  }

  // Where the dot sits for a given distance along the square
  function pointOnSquare(distance) {
    const s = SQUARE.side, o = SQUARE.start;
    const side = Math.min(3, Math.floor(distance / s));
    const along = distance - side * s;
    if (side === 0) return { x: o + along,     y: o };          // top: left → right
    if (side === 1) return { x: o + s,         y: o + along };  // right: down
    if (side === 2) return { x: o + s - along, y: o + s };      // bottom: right → left
    return               { x: o,             y: o + s - along };// left: up
  }

  // How big the inner square should be in this phase
  function scaleFor(phase, t) {
    const range = 1 - MIN_SCALE;
    if (phase.size === "grow")   return MIN_SCALE + range * ease(t);
    if (phase.size === "full")   return 1;
    if (phase.size === "shrink") return 1 - range * ease(t);
    return MIN_SCALE;
  }

  // Draw everything for a given number of elapsed seconds
  function render(elapsed) {
    const reduce = Calm.reducedMotion();
    const inCycle = elapsed % CYCLE;
    const phaseIndex = Math.floor(inCycle / SECONDS_PER_PHASE);
    const phaseT = (inCycle % SECONDS_PER_PHASE) / SECONDS_PER_PHASE; // 0 → 1
    const phase = PHASES[phaseIndex];

    if (reduce) {
      // Reduced motion: no gliding. Light up whole sides, step by step,
      // and keep the inner square still.
      progress.style.strokeDashoffset = PATH_LENGTH * (1 - (phaseIndex + 1) / PHASES.length);
      dot.style.display = "none";
      fill.style.transform = "scale(" + (phase.size === "grow" || phase.size === "full" ? 1 : MIN_SCALE) + ")";
    } else {
      const distance = (inCycle / CYCLE) * PATH_LENGTH;
      const p = pointOnSquare(distance);
      progress.style.strokeDashoffset = PATH_LENGTH - distance;
      dot.style.display = "";
      dot.setAttribute("cx", p.x);
      dot.setAttribute("cy", p.y);
      fill.style.transform = "scale(" + scaleFor(phase, phaseT) + ")";
    }

    // Countdown 4, 3, 2, 1
    countText.textContent = SECONDS_PER_PHASE - Math.floor(phaseT * SECONDS_PER_PHASE);

    // New phase? Update the words, announce it, maybe chime.
    if (phaseIndex !== lastPhase) {
      lastPhase = phaseIndex;
      setPhaseText(phase.label);
      announce.textContent = phase.label;
      if (chimeToggle.checked) Calm.chime({ pitch: phase.pitch, volume: 0.08 });
    }

    // Count finished boxes
    const rounds = Math.floor(elapsed / CYCLE);
    if (rounds !== lastRounds) {
      lastRounds = rounds;
      roundsText.textContent = rounds === 1 ? "1 round. Nice." : rounds + " rounds. Keep going, or stop whenever.";
    }
  }

  // Fade the words out and back in when they change
  function setPhaseText(text) {
    phaseText.classList.add("is-changing");
    setTimeout(function () {
      phaseText.textContent = text;
      phaseText.classList.remove("is-changing");
    }, Calm.reducedMotion() ? 0 : 250);
  }

  function currentElapsed() {
    return elapsedBefore + (performance.now() - startedAt) / 1000;
  }

  function tick() {
    render(currentElapsed());
    frameId = requestAnimationFrame(tick);
  }

  function start() {
    running = true;
    startedAt = performance.now();
    breath.classList.add("is-running");
    startBtn.textContent = "Pause";
    resetBtn.disabled = false;
    // Browsers need a click before sound can play: wake the audio now
    if (chimeToggle.checked) Calm.getAudio();
    tick();
  }

  function pause() {
    running = false;
    elapsedBefore = currentElapsed();
    cancelAnimationFrame(frameId);
    startBtn.textContent = "Resume";
    setPhaseText("Paused");
    announce.textContent = "Paused";
    countText.textContent = "";
    lastPhase = -1; // so the right cue shows again on resume
  }

  function reset() {
    if (running) cancelAnimationFrame(frameId);
    running = false;
    elapsedBefore = 0;
    lastPhase = -1;
    lastRounds = 0;
    breath.classList.remove("is-running");
    progress.style.strokeDashoffset = PATH_LENGTH;
    fill.style.transform = "scale(" + MIN_SCALE + ")";
    dot.setAttribute("cx", SQUARE.start);
    dot.setAttribute("cy", SQUARE.start);
    setPhaseText("Ready when you are");
    countText.textContent = "";
    roundsText.textContent = "";
    startBtn.textContent = "Begin";
    resetBtn.disabled = true;
    startBtn.focus();
  }

  startBtn.addEventListener("click", function () {
    running ? pause() : start();
  });
  resetBtn.addEventListener("click", reset);

  // Turning the chime on counts as a click, so unlock audio then
  chimeToggle.addEventListener("change", function () {
    if (chimeToggle.checked) Calm.getAudio();
  });
})();
