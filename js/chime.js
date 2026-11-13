/* =========================================================
   chime.js — a soft bell sound made with the Web Audio API
   ---------------------------------------------------------
   No audio files needed: we stack a few quiet sine waves
   (like the overtones of a small bell) and let them fade out.

   Usage:   Calm.chime();                 // default soft chime
            Calm.chime({ pitch: 392 });   // lower note

   Browsers only allow sound after the user clicks/taps
   something, so the first chime must come from a button press.
   ========================================================= */

window.Calm = window.Calm || {};

(function () {
  let audioCtx = null;

  // Create the audio engine the first time we need it
  function getAudio() {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;          // very old browser: stay silent
      audioCtx = new AudioCtx();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  Calm.getAudio = getAudio;

  Calm.chime = function (options) {
    const opts = Object.assign({ pitch: 523.25, volume: 0.1, length: 2.6 }, options);
    const ctx = getAudio();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Master volume envelope: quick soft attack, long gentle fade
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(opts.volume, now + 0.05);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + opts.length);
    envelope.connect(ctx.destination);

    // Three overtones: [frequency multiplier, loudness]
    const partials = [[1, 1], [2.01, 0.28], [3.02, 0.1]];

    partials.forEach(function (p) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = opts.pitch * p[0];
      gain.gain.value = p[1];
      osc.connect(gain);
      gain.connect(envelope);
      osc.start(now);
      osc.stop(now + opts.length + 0.1);
    });
  };
})();
