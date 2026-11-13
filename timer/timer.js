/* =========================================================
   timer.js — a gentle Pomodoro-style study timer
   ---------------------------------------------------------
   - Focus (default 25 min) and Break (default 5 min).
   - The timer remembers WHEN it should end (a clock time),
     not "how many ticks are left". Phones slow down timers in
     background tabs, but this way it still ends on time.
   - When time is up: soft chime (optional) + warm glow. It
     switches to the next mode but waits for you to start it.
   - During breaks it suggests one calm activity.
   - Only your time settings are saved (on this device).
   ========================================================= */

(function () {
  const RING = 289.03;
  const SETTINGS_KEY = "exhale.timer.settings";

  // Break ideas. minBreak = only suggest if the break is at least this long.
  const BREAK_IDEAS = [
    { name: "Box breathing",   desc: "A minute of slow, even breaths.",             href: "../activities/breathing/index.html",     minBreak: 0 },
    { name: "Desk stretches",  desc: "A quick reset for your neck and wrists.",     href: "../activities/stretches/index.html",     minBreak: 2 },
    { name: "5-4-3-2-1",       desc: "Come back to the room you're in.",            href: "../activities/grounding/index.html",     minBreak: 0 },
    { name: "Mind jar",        desc: "Put down whatever's buzzing in your head.",   href: "../activities/mind-jar/index.html",      minBreak: 0 },
    { name: "Body scan",       desc: "A few quiet minutes, head to toe.",           href: "../activities/body-scan/index.html",     minBreak: 5 },
    { name: "Calm sounds",     desc: "Pick a soft background for the next round.",  href: "../activities/sounds/index.html",        minBreak: 0 }
  ];

  // ----- Elements -----
  const clock       = document.getElementById("clock");
  const ringFill    = document.getElementById("ringFill");
  const timeText    = document.getElementById("timeText");
  const modeText    = document.getElementById("modeText");
  const focusTab    = document.getElementById("focusTab");
  const breakTab    = document.getElementById("breakTab");
  const startBtn    = document.getElementById("startBtn");
  const resetBtn    = document.getElementById("resetBtn");
  const skipBtn     = document.getElementById("skipBtn");
  const statusEl    = document.getElementById("status");
  const sessionsEl  = document.getElementById("sessionsText");
  const breakCard   = document.getElementById("breakCard");
  const breakLink   = document.getElementById("breakLink");
  const breakName   = document.getElementById("breakName");
  const breakDesc   = document.getElementById("breakDesc");
  const anotherBtn  = document.getElementById("anotherBtn");
  const focusInput  = document.getElementById("focusMin");
  const breakInput  = document.getElementById("breakMin");
  const soundToggle = document.getElementById("soundToggle");

  // ----- State -----
  let mode = "focus";       // "focus" or "break"
  let duration = 0;         // seconds in this round
  let remaining = 0;        // seconds left (used while paused)
  let endAt = 0;            // Date.now() value when it should finish
  let running = false;
  let timerId = null;
  let sessions = 0;         // focus rounds finished this visit
  let ideaIndex = -1;
  const defaultTitle = document.title;

  // ----- Settings (saved on this device only) -----
  function loadSettings() {
    try {
      const s = JSON.parse(localStorage.getItem(SETTINGS_KEY));
      if (s) {
        focusInput.value = s.focus || 25;
        breakInput.value = s.break || 5;
        soundToggle.checked = s.sound !== false;
      }
    } catch (e) { /* storage blocked: just use defaults */ }
  }
  function saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({
        focus: minutes(focusInput, 25), break: minutes(breakInput, 5), sound: soundToggle.checked
      }));
    } catch (e) { /* ignore */ }
  }
  // Read a minutes box safely (whole number, within its min/max)
  function minutes(input, fallback) {
    const n = Math.round(Number(input.value));
    if (!n || n < 1) return fallback;
    return Math.min(n, Number(input.max));
  }

  // ----- Display -----
  function format(sec) {
    const s = Math.max(0, Math.ceil(sec));
    const m = Math.floor(s / 60);
    return String(m).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  }

  function render() {
    timeText.textContent = format(remaining);
    ringFill.style.strokeDashoffset = RING * (1 - remaining / duration);
    if (running) document.title = format(remaining) + " · " + (mode === "focus" ? "Focus" : "Break") + " · exhale";
    else document.title = defaultTitle;
  }

  function label() {
    if (running) return "Pause";
    const fresh = remaining === duration;
    if (!fresh) return "Resume";
    return mode === "focus" ? "Start focus" : "Start break";
  }

  // Switch to a mode and fill the clock back up (does not start it)
  function setMode(next) {
    stopTicking();
    mode = next;
    duration = (mode === "focus" ? minutes(focusInput, 25) : minutes(breakInput, 5)) * 60;
    remaining = duration;
    focusTab.setAttribute("aria-pressed", String(mode === "focus"));
    breakTab.setAttribute("aria-pressed", String(mode === "break"));
    modeText.textContent = mode === "focus" ? "Focus" : "Break";
    clock.classList.toggle("is-break", mode === "break");
    breakCard.hidden = mode !== "break";
    if (mode === "break") showIdea();
    startBtn.textContent = label();
    render();
  }

  // ----- Running -----
  function start() {
    running = true;
    endAt = Date.now() + remaining * 1000;
    clock.classList.remove("is-done");
    if (soundToggle.checked) Calm.getAudio();     // unlock sound while we have a click
    timerId = setInterval(tick, 250);
    startBtn.textContent = label();
    statusEl.textContent = mode === "focus" ? "Focusing. You've got this." : "On a break. Step away from the screen if you can.";
    render();
  }

  function pause() {
    remaining = Math.max(0, (endAt - Date.now()) / 1000);
    stopTicking();
    startBtn.textContent = label();
    statusEl.textContent = "Paused.";
    render();
  }

  function stopTicking() {
    running = false;
    clearInterval(timerId);
  }

  function tick() {
    remaining = Math.max(0, (endAt - Date.now()) / 1000);
    render();
    if (remaining <= 0) complete();
  }

  function complete() {
    stopTicking();
    clock.classList.remove("is-done");
    void clock.offsetWidth;          // restart the glow animation
    clock.classList.add("is-done");
    if (soundToggle.checked) softBells();

    if (mode === "focus") {
      sessions++;
      sessionsEl.textContent = sessions === 1 ? "1 focus session done this visit." : sessions + " focus sessions done this visit.";
      setMode("break");
      statusEl.textContent = "Nice work. Time for a break.";
    } else {
      setMode("focus");
      statusEl.textContent = "Break's over. Start when you're ready.";
    }
  }

  // Three soft rising notes
  function softBells() {
    [392, 523.25, 659.25].forEach(function (pitch, i) {
      setTimeout(function () { Calm.chime({ pitch: pitch, volume: 0.09, length: 3 }); }, i * 450);
    });
  }

  // ----- Break ideas -----
  function showIdea() {
    const breakMinutes = minutes(breakInput, 5);
    const options = BREAK_IDEAS.filter(function (b) { return breakMinutes >= b.minBreak; });
    // Pick a different one than last time
    let i = Math.floor(Math.random() * options.length);
    if (options.length > 1 && options[i].name === (BREAK_IDEAS[ideaIndex] || {}).name) i = (i + 1) % options.length;
    const idea = options[i];
    ideaIndex = BREAK_IDEAS.indexOf(idea);
    breakName.textContent = idea.name;
    breakDesc.textContent = idea.desc;
    breakLink.href = idea.href;
  }

  // ----- Buttons -----
  startBtn.addEventListener("click", function () { running ? pause() : start(); });

  resetBtn.addEventListener("click", function () {
    setMode(mode);
    clock.classList.remove("is-done");
    statusEl.textContent = "";
  });

  skipBtn.addEventListener("click", function () {
    setMode(mode === "focus" ? "break" : "focus");
    statusEl.textContent = mode === "focus" ? "Skipped to focus." : "Skipped to a break.";
  });

  focusTab.addEventListener("click", function () { if (mode !== "focus") { setMode("focus"); statusEl.textContent = ""; } });
  breakTab.addEventListener("click", function () { if (mode !== "break") { setMode("break"); statusEl.textContent = ""; } });
  anotherBtn.addEventListener("click", showIdea);

  // Changing a time applies right away if the timer hasn't started yet
  [focusInput, breakInput].forEach(function (input) {
    input.addEventListener("change", function () {
      input.value = minutes(input, input === focusInput ? 25 : 5);
      saveSettings();
      if (!running && remaining === duration) setMode(mode);
    });
  });
  soundToggle.addEventListener("change", saveSettings);

  loadSettings();
  setMode("focus");
})();
