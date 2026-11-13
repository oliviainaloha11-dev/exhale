/* =========================================================
   sounds.js — ambient sound mixer (rain, ocean, wind, fire)
   ---------------------------------------------------------
   Every sound is GENERATED live with the Web Audio API from
   "noise" (random numbers) shaped by filters, no files needed.

   HOW TO USE A REAL RECORDING INSTEAD:
     1. Put a looping audio file in the /audio folder at the
        top of the site, e.g. audio/rain.mp3
     2. In the SOUNDS list below, set   file: "../../audio/rain.mp3"
     3. That's it. If the file can't load, it falls back to the
        generated sound. (Note: files only load when the site is
        hosted, e.g. on GitHub Pages, not from a double-clicked
        file on your computer.)

   Layout of this file:
     1. Noise helpers
     2. The four sounds (each is a small "recipe")
     3. Mixer (volume per sound + master volume)
     4. Building the sliders on the page
   ========================================================= */

(function () {
  const rand = function (a, b) { return a + Math.random() * (b - a); };


  /* =====================================================
     1. NOISE HELPERS
     White noise = hiss (all pitches equal).
     Pink noise  = softer, like steady rain.
     Brown noise = deep rumble, like distant surf.
     ===================================================== */
  const noiseCache = {};

  function noiseBuffer(ctx, type) {
    if (noiseCache[type]) return noiseCache[type];
    const length = ctx.sampleRate * 6;              // 6 seconds, looped
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;

    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      if (type === "white") {
        data[i] = white * 0.5;
      } else if (type === "pink") {
        // Paul Kellet's pink noise filter
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      } else {
        // brown: each sample drifts a little from the last one
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5;
      }
    }
    // Fade the loop seam so there's no click when it repeats
    const fade = Math.floor(ctx.sampleRate * 0.05);
    for (let i = 0; i < fade; i++) {
      data[length - 1 - i] *= i / fade;
      data[i] *= i / fade;
    }
    noiseCache[type] = buffer;
    return buffer;
  }

  // A never-ending noise source
  function loopNoise(ctx, type) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx, type);
    src.loop = true;
    src.loopStart = rand(0, 3);        // start somewhere random
    src.start(0, src.loopStart);
    return src;
  }

  // Small helpers to keep the recipes short
  function filter(ctx, type, freq, Q) {
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    if (Q !== undefined) f.Q.value = Q;
    return f;
  }
  function gain(ctx, value) {
    const g = ctx.createGain();
    g.gain.value = value;
    return g;
  }
  // A slow wobble ("LFO") that pushes an AudioParam up and down
  function lfo(ctx, rate, depth, target) {
    const osc = ctx.createOscillator();
    osc.frequency.value = rate;
    const amount = gain(ctx, depth);
    osc.connect(amount);
    amount.connect(target);
    osc.start();
    return osc;
  }
  // Connect a chain of nodes: chain(a, b, c) = a → b → c
  function chain() {
    for (let i = 0; i < arguments.length - 1; i++) arguments[i].connect(arguments[i + 1]);
  }
  // A tiny burst of noise (one raindrop, one crackle)
  function burst(ctx, out, when, length, freq, peak, filterType) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx, "white");
    const f = filter(ctx, filterType || "bandpass", freq, 2.5);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, when);
    env.gain.exponentialRampToValueAtTime(peak, when + 0.002);
    env.gain.exponentialRampToValueAtTime(0.0001, when + length);
    chain(src, f, env, out);
    src.start(when, rand(0, 5), length + 0.02);
  }
  // Runs fn every `ms` while the audio is actually playing
  function every(ctx, ms, fn) {
    const id = setInterval(function () { if (ctx.state === "running") fn(); }, ms);
    return function () { clearInterval(id); };
  }
  // Stop a list of sources + timers
  function stopper(sources, timers) {
    return {
      stop: function () {
        sources.forEach(function (s) { try { s.stop(); } catch (e) { /* already stopped */ } });
        (timers || []).forEach(function (t) { t(); });
      }
    };
  }


  /* =====================================================
     2. THE SOUNDS
     Each recipe gets the audio engine (ctx) and an output
     node (out), builds its sound, and returns { stop() }.
     `level` balances how loud each one is at the same slider.
     ===================================================== */
  const SOUNDS = [
    {
      id: "rain", label: "Rain", level: 0.9,
      file: null,   // e.g. "../../audio/rain.mp3"
      icon: '<path d="M7 15a4 4 0 0 1 .5-8A5 5 0 0 1 17 8a3.5 3.5 0 0 1 0 7z"/><path d="M8 18l-1 2M12 18l-1 2M16 18l-1 2"/>',
      synth: function (ctx, out) {
        // Steady hush of rain
        const hiss = loopNoise(ctx, "pink");
        chain(hiss, filter(ctx, "highpass", 400), filter(ctx, "lowpass", 7000), gain(ctx, 0.7), out);
        // Low patter on the roof
        const low = loopNoise(ctx, "brown");
        chain(low, filter(ctx, "lowpass", 500), gain(ctx, 0.35), out);
        // Individual drops
        const stopDrops = every(ctx, 80, function () {
          const n = Math.floor(rand(1, 4));
          for (let i = 0; i < n; i++) {
            burst(ctx, out, ctx.currentTime + rand(0, 0.08), rand(0.015, 0.04), rand(2200, 6000), rand(0.03, 0.12));
          }
        });
        return stopper([hiss, low], [stopDrops]);
      }
    },
    {
      id: "ocean", label: "Ocean waves", level: 0.65,
      file: null,   // e.g. "../../audio/ocean.mp3"
      icon: '<path d="M3 10c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>',
      synth: function (ctx, out) {
        // Deep surf: brown noise whose loudness and brightness swell slowly
        const surf = loopNoise(ctx, "brown");
        const lp = filter(ctx, "lowpass", 600, 0.7);
        const swell = gain(ctx, 0.5);
        chain(surf, lp, swell, out);
        // Foam: a bit of hiss that swells with the waves
        const foam = loopNoise(ctx, "white");
        const foamGain = gain(ctx, 0.05);
        chain(foam, filter(ctx, "highpass", 2500), foamGain, out);
        // One wave about every 9 seconds
        const l1 = lfo(ctx, 0.11, 0.42, swell.gain);
        const l2 = lfo(ctx, 0.11, 380, lp.frequency);
        const l3 = lfo(ctx, 0.11, 0.045, foamGain.gain);
        return stopper([surf, foam, l1, l2, l3]);
      }
    },
    {
      id: "wind", label: "Wind", level: 1.15,
      file: null,   // e.g. "../../audio/wind.mp3"
      icon: '<path d="M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h8"/>',
      synth: function (ctx, out) {
        // Air rushing: noise through a filter that wanders up and down
        const air = loopNoise(ctx, "pink");
        const bp = filter(ctx, "bandpass", 500, 0.8);
        const amp = gain(ctx, 0.9);
        chain(air, bp, amp, out);
        // A faint whistle
        const whistleSrc = loopNoise(ctx, "white");
        const whistle = filter(ctx, "bandpass", 1100, 9);
        chain(whistleSrc, whistle, gain(ctx, 0.12), out);
        // Gusts (two slow wobbles at different speeds feel less robotic)
        const l1 = lfo(ctx, 0.07, 260, bp.frequency);
        const l2 = lfo(ctx, 0.19, 110, bp.frequency);
        const l3 = lfo(ctx, 0.05, 0.4, amp.gain);
        const l4 = lfo(ctx, 0.07, 400, whistle.frequency);
        return stopper([air, whistleSrc, l1, l2, l3, l4]);
      }
    },
    {
      id: "fire", label: "Fireplace", level: 0.95,
      file: null,   // e.g. "../../audio/fire.mp3"
      icon: '<path d="M12 21c-4 0-6-2.5-6-6 0-4 3-6 4-10 2 2 3 4 3 6 1-1 1.5-2 1.5-3 2 2 3.5 4.5 3.5 7 0 3.5-2 6-6 6z"/>',
      synth: function (ctx, out) {
        // Soft low roar
        const roar = loopNoise(ctx, "brown");
        const roarGain = gain(ctx, 0.55);
        chain(roar, filter(ctx, "lowpass", 320), roarGain, out);
        const flicker = lfo(ctx, 0.3, 0.12, roarGain.gain);
        // Crackles and the occasional pop-pop-pop
        const stopCrackle = every(ctx, 60, function () {
          const t = ctx.currentTime;
          if (Math.random() < 0.3) {
            burst(ctx, out, t + rand(0, 0.05), rand(0.004, 0.02), rand(1500, 4500), rand(0.05, 0.3), "highpass");
          }
          if (Math.random() < 0.025) {
            const pops = Math.floor(rand(3, 7));
            for (let i = 0; i < pops; i++) {
              burst(ctx, out, t + rand(0, 0.25), rand(0.003, 0.012), rand(2000, 5000), rand(0.1, 0.4), "highpass");
            }
          }
        });
        return stopper([roar, flicker], [stopCrackle]);
      }
    }
  ];

  // Shared so other pages (or testing) can reuse the recipes
  Calm.SOUNDS = SOUNDS;

  // Quick mixes (values are 0–100 for each slider)
  const PRESETS = [
    { name: "Rainy study", mix: { rain: 60, ocean: 0, wind: 15, fire: 0 } },
    { name: "Cabin night", mix: { rain: 20, ocean: 0, wind: 25, fire: 55 } },
    { name: "By the sea",  mix: { rain: 0, ocean: 65, wind: 20, fire: 0 } }
  ];


  /* =====================================================
     3. THE MIXER
     sound → its own volume → master volume → speakers
     ===================================================== */
  let ctx = null;
  let master = null;
  let paused = false;
  const channels = {};      // id → { gain, voice, loading, stopTimer }

  function engine() {
    if (!ctx) {
      ctx = Calm.getAudio();             // shared with chime.js
      if (!ctx) return null;
      master = ctx.createGain();
      master.gain.value = Math.pow(masterSlider.value / 100, 2);
      // A gentle limiter so layering everything never gets harsh
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -10;
      limiter.ratio.value = 4;
      chain(master, limiter, ctx.destination);
    }
    return ctx;
  }

  // Start one sound: a real file if given, otherwise the recipe
  function startVoice(def, out) {
    if (!def.file) return Promise.resolve(def.synth(ctx, out));
    return fetch(def.file)
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(function (data) { return ctx.decodeAudioData(data); })
      .then(function (buffer) {
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        src.connect(out);
        src.start();
        return stopper([src]);
      })
      .catch(function () {
        return def.synth(ctx, out);       // couldn't load: use the generated one
      });
  }

  // Set one sound's volume (0–100)
  function setVolume(def, value) {
    if (!engine()) return;
    let ch = channels[def.id];
    if (!ch) {
      ch = channels[def.id] = { gain: gain(ctx, 0), voice: null, loading: false, stopTimer: null };
      ch.gain.connect(master);
    }
    // Slider feels more natural squared (quiet end gets more room)
    const v = Math.pow(value / 100, 2) * def.level;
    ch.gain.gain.setTargetAtTime(v, ctx.currentTime, 0.25);   // smooth fade

    clearTimeout(ch.stopTimer);
    if (value > 0 && !ch.voice && !ch.loading) {
      ch.loading = true;
      startVoice(def, ch.gain).then(function (voice) {
        ch.voice = voice;
        ch.loading = false;
      });
    }
    // Turned all the way down: stop it after it fades (saves battery)
    if (value === 0 && ch.voice) {
      ch.stopTimer = setTimeout(function () {
        if (ch.voice) { ch.voice.stop(); ch.voice = null; }
      }, 1500);
    }
    if (value > 0 && paused) togglePause();     // moving a slider un-pauses
    updatePlayingState();
  }


  /* =====================================================
     4. THE PAGE
     ===================================================== */
  const list         = document.getElementById("soundList");
  const presetBox    = document.getElementById("presets");
  const masterSlider = document.getElementById("master");
  const pauseBtn     = document.getElementById("pauseBtn");
  const stopBtn      = document.getElementById("stopBtn");
  const statusEl     = document.getElementById("status");
  const sliders = {};

  // Fill the slider track up to the thumb (purely visual)
  function paintSlider(input) {
    input.style.setProperty("--fill", input.value + "%");
  }

  SOUNDS.forEach(function (def) {
    const li = document.createElement("li");
    li.className = "sound";
    li.innerHTML =
      '<svg class="sound-icon" viewBox="0 0 24 24" aria-hidden="true">' + def.icon + "</svg>" +
      '<label class="sound-label" for="vol-' + def.id + '">' + def.label + "</label>" +
      '<input class="slider" type="range" min="0" max="100" step="1" value="0" id="vol-' + def.id + '">';
    const input = li.querySelector("input");
    input.addEventListener("input", function () {
      const value = Number(input.value);
      paintSlider(input);
      input.setAttribute("aria-valuetext", value === 0 ? "off" : value + "%");
      li.classList.toggle("is-on", value > 0);
      setVolume(def, value);
    });
    input.setAttribute("aria-valuetext", "off");
    paintSlider(input);
    sliders[def.id] = input;
    list.appendChild(li);
  });

  // Set a slider from code (presets, stop all)
  function setSlider(id, value) {
    const input = sliders[id];
    input.value = value;
    input.dispatchEvent(new Event("input"));
  }

  PRESETS.forEach(function (preset) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn chip";
    btn.textContent = preset.name;
    btn.addEventListener("click", function () {
      Object.keys(preset.mix).forEach(function (id) { setSlider(id, preset.mix[id]); });
      statusEl.textContent = preset.name + " is playing.";
    });
    presetBox.appendChild(btn);
  });

  masterSlider.addEventListener("input", function () {
    paintSlider(masterSlider);
    masterSlider.setAttribute("aria-valuetext", masterSlider.value + "%");
    if (master) master.gain.setTargetAtTime(Math.pow(masterSlider.value / 100, 2), ctx.currentTime, 0.2);
  });
  paintSlider(masterSlider);

  function anyOn() {
    return SOUNDS.some(function (def) { return Number(sliders[def.id].value) > 0; });
  }

  function togglePause() {
    if (!ctx) return;
    paused = !paused;
    if (paused) ctx.suspend(); else ctx.resume();
    updatePlayingState();
  }

  function updatePlayingState() {
    const on = anyOn();
    pauseBtn.disabled = !on;
    stopBtn.disabled = !on;
    pauseBtn.textContent = paused ? "Play" : "Pause";
    if (!on) statusEl.textContent = "Slide any sound up to start. Mix as many as you like.";
    else if (paused) statusEl.textContent = "Paused.";
    else if (statusEl.textContent.indexOf("is playing") === -1) statusEl.textContent = "Playing.";
  }

  pauseBtn.addEventListener("click", togglePause);
  stopBtn.addEventListener("click", function () {
    SOUNDS.forEach(function (def) { setSlider(def.id, 0); });
    if (paused) togglePause();
  });

  updatePlayingState();
})();
