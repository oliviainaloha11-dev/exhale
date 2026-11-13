/* =========================================================
   stretches-data.js — the stretches + routines (edit me!)
   ---------------------------------------------------------
   STRETCHES: every stretch the site knows about.
     name      → title
     how       → instructions
     sides     → true = "switch sides" halfway through
     art       → a simple line drawing (SVG, 120×120 box).
                 BODY is the shared head + shoulders + torso.
   ROUTINES: lists of [stretch id, seconds].
   ========================================================= */

window.Calm = window.Calm || {};

(function () {
  // Shared parts of every drawing
  const BODY =
    '<path d="M44 58 Q40 82 46 108 M76 58 Q80 82 74 108"/>' +   // torso sides
    '<path d="M40 58 Q60 52 80 58"/>';                          // shoulders
  const HEAD = function (x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="11"/>'; };
  const ARMS_DOWN = '<path d="M40 58 Q32 80 36 100 M80 58 Q88 80 84 100"/>';
  // A soft curved arrow (accent color via the .accent class)
  const ARROW = function (d) { return '<path class="accent" d="' + d + '"/>'; };

  Calm.STRETCHES = {
    "neck-tilt": {
      name: "Neck tilt",
      how: "Slowly drop your right ear toward your right shoulder. Let gravity do the work. Breathe into the left side of your neck.",
      sides: true,
      art: BODY + ARMS_DOWN + HEAD(50, 36) + ARROW("M70 22 Q76 34 68 44")
    },
    "chin-tuck": {
      name: "Chin tuck",
      how: "Sit tall. Gently glide your chin straight back, like making a double chin. Hold for a moment, release, and repeat.",
      sides: false,
      art: BODY + ARMS_DOWN + HEAD(60, 36) + '<path d="M60 47 V52"/>' + ARROW("M86 36 H74 M78 32 L74 36 L78 40")
    },
    "shoulder-rolls": {
      name: "Shoulder rolls",
      how: "Lift your shoulders up toward your ears, roll them back, then let them drop down. Slow circles. Switch direction halfway.",
      sides: true,
      art: BODY + ARMS_DOWN + HEAD(60, 34) + ARROW("M30 54 A8 8 0 1 1 38 46") + ARROW("M90 54 A8 8 0 1 0 82 46")
    },
    "chest-opener": {
      name: "Chest opener",
      how: "Reach both hands behind you and clasp them (or hold the back of your chair). Gently lift your chest and squeeze your shoulder blades together.",
      sides: false,
      art: BODY + HEAD(60, 34) + '<path d="M40 58 Q28 82 54 104 M80 58 Q92 82 66 104"/>' + '<circle cx="60" cy="106" r="4"/>'
    },
    "wrist-stretch": {
      name: "Wrist stretch",
      how: "Hold one arm straight out, palm facing up. With your other hand, gently pull your fingers back toward you. Switch hands halfway.",
      sides: true,
      art: BODY + HEAD(60, 34) + '<path d="M80 58 Q86 80 84 100"/>' +
           '<path d="M40 58 L12 62"/><path d="M12 62 L8 50"/>' + '<path d="M44 72 Q30 66 14 56"/>' + ARROW("M18 44 Q8 40 4 48")
    },
    "finger-spread": {
      name: "Open and close",
      how: "Make two gentle fists, then spread your fingers as wide as they'll go. Open, close, open, close. Slowly.",
      sides: false,
      art: '<path d="M30 100 V70 M30 70 L22 50 M30 70 L28 46 M30 70 L36 46 M30 70 L42 52 M30 76 L18 68"/>' +
           '<path d="M90 100 V70 M90 70 L98 50 M90 70 L92 46 M90 70 L84 46 M90 70 L78 52 M90 76 L102 68"/>' +
           ARROW("M50 60 H70 M66 56 L70 60 L66 64")
    },
    "seated-twist": {
      name: "Seated twist",
      how: "Sit tall. Put your right hand on the back of your chair and your left hand on your right knee. Gently turn to the right. Switch sides halfway.",
      sides: true,
      art: BODY + HEAD(64, 34) + '<path d="M40 58 Q50 80 70 84 M80 58 Q96 70 98 88"/>' + ARROW("M30 96 Q60 116 90 96 M86 92 L90 96 L85 100")
    },
    "reach-round": {
      name: "Reach and round",
      how: "Hold your arms out in front of you like you're hugging a big beach ball. Round your upper back and let your head drop forward.",
      sides: false,
      art: BODY + HEAD(60, 38) + '<path d="M40 58 Q16 70 40 84 Q60 92 80 84 Q104 70 80 58"/>'
    },
    "overhead-reach": {
      name: "Overhead reach",
      how: "Lace your fingers together and reach your palms up toward the ceiling. Get tall. Breathe in. Then gently lean a little to each side.",
      sides: false,
      art: BODY + HEAD(60, 40) + '<path d="M40 58 Q40 30 56 10 M80 58 Q80 30 64 10"/>' + '<circle cx="60" cy="8" r="4"/>'
    },
    "look-far": {
      name: "Look far away",
      how: "Look away from your screen. Find something at least 20 feet away (out a window if you can) and let your eyes rest on it.",
      sides: false,
      art: '<path d="M14 60 Q34 40 54 60 Q34 80 14 60 Z"/><circle cx="34" cy="60" r="6"/>' +
           '<path class="accent" d="M62 60 H84" stroke-dasharray="3 5"/>' +
           '<path d="M84 74 L96 52 L104 64 L110 56 L118 74 Z"/>'
    },
    "palming": {
      name: "Eye palming",
      how: "Rub your palms together until they feel warm. Close your eyes and gently cup your hands over them, without pressing. Rest in the dark.",
      sides: false,
      art: BODY + HEAD(60, 34) + '<path d="M40 58 Q30 44 50 34 M80 58 Q90 44 70 34"/>' + '<path class="accent" d="M48 34 Q60 28 72 34"/>'
    }
  };

  Calm.ROUTINES = [
    {
      id: "quick", name: "Quick reset", note: "About 2 minutes · neck, shoulders, wrists",
      steps: [["neck-tilt", 30], ["shoulder-rolls", 20], ["wrist-stretch", 30], ["overhead-reach", 20], ["look-far", 20]]
    },
    {
      id: "eyes", name: "Neck and eyes", note: "About 2 minutes · for screen-tired eyes",
      steps: [["chin-tuck", 20], ["neck-tilt", 30], ["look-far", 20], ["palming", 30], ["shoulder-rolls", 20]]
    },
    {
      id: "full", name: "Full desk break", note: "About 5 minutes · head to hands to back",
      steps: [["neck-tilt", 30], ["chin-tuck", 20], ["shoulder-rolls", 20], ["chest-opener", 25], ["wrist-stretch", 30],
              ["finger-spread", 20], ["seated-twist", 40], ["reach-round", 25], ["overhead-reach", 20], ["look-far", 20], ["palming", 30]]
    }
  ];
})();
