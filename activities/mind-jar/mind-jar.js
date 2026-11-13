/* =========================================================
   mind-jar.js — fold thoughts into a jar, shake, release
   ---------------------------------------------------------
   Big picture:
   1. You type a thought → a paper card shows it, folds up
      small, and drops into the jar's opening (Web Animations).
   2. Then it becomes a "slip" in a tiny physics simulation
      drawn on a <canvas>. Each slip is treated as a circle for
      bumping into things, but drawn as a folded paper rectangle.
   3. Shake = push every slip in a random direction.
      Release = flip gravity so slips rise out and fade away.

   PRIVACY: your words are only used for the folding paper
   preview. The slips in the jar never store any text, and
   nothing is ever saved anywhere.

   Everything is measured in "world units": the jar world is
   300 wide × 420 tall, and we scale it to fit the screen.
   ========================================================= */

(function () {
  // ---------- World + jar shape (world units) ----------
  const WORLD = { w: 300, h: 420 };
  const CX = WORLD.w / 2;                 // horizontal center
  const JAR = {
    rimY: 58,          // top of the jar opening
    neckBottom: 84,    // where the neck starts widening
    shoulderEnd: 150,  // where the sides become straight
    bottom: 404,       // inside bottom
    neckHalf: 40,      // half-width of the neck
    bodyHalf: 108,     // half-width of the body
    corner: 40,        // rounded bottom corners
    glass: 4           // how thick the glass looks (keeps slips inside it)
  };

  // ---------- Physics settings (tweak to taste) ----------
  const SLIP_R = 11;          // collision radius of a slip
  const GRAVITY = 0.12;       // downward pull per step
  const FLOAT_UP = 0.07;      // upward pull while releasing
  const DAMPING = 0.985;      // air resistance (1 = none)
  const SUBSTEPS = 2;         // physics steps per frame (more = steadier)
  const ITERATIONS = 3;       // collision passes per step
  const MAX_SLIPS = 55;

  // Paper colors: creams with one cool tint so the pile looks layered
  const PAPER = ["#f4ead8", "#efe2c8", "#f8f1e4", "#e6dccb", "#dfe4ea"];

  // ---------- Page elements ----------
  const stage      = document.getElementById("stage");
  const canvas     = document.getElementById("jarCanvas");
  const ctx        = canvas.getContext("2d");
  const form       = document.getElementById("thoughtForm");
  const input      = document.getElementById("thought");
  const statusEl   = document.getElementById("status");
  const shakeBtn   = document.getElementById("shakeBtn");
  const releaseBtn = document.getElementById("releaseBtn");

  // ---------- State ----------
  let slips = [];        // the paper slips in the jar
  let pending = 0;       // slips still folding (not in the jar yet)
  let scale = 1;         // world units → CSS pixels
  let frameId = null;
  let quietFrames = 0;   // frames in a row with almost no movement
  let releasing = false;
  let time = 0;

  const rand = function (a, b) { return a + Math.random() * (b - a); };


  /* =====================================================
     SIZING — make the canvas sharp on any screen
     ===================================================== */
  function resize() {
    const cssWidth = stage.clientWidth;
    const dpr = window.devicePixelRatio || 1;
    scale = cssWidth / WORLD.w;
    canvas.style.height = WORLD.h * scale + "px";
    canvas.width = Math.round(WORLD.w * scale * dpr);
    canvas.height = Math.round(WORLD.h * scale * dpr);
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
    draw();
  }


  /* =====================================================
     JAR SHAPE HELPERS
     ===================================================== */

  // How wide the inside of the jar is (half-width) at height y.
  // The shoulder follows the same curve we draw in drawJar().
  function halfWidthAt(y) {
    if (y <= JAR.neckBottom) return JAR.neckHalf - JAR.glass;
    if (y >= JAR.shoulderEnd) return JAR.bodyHalf - JAR.glass;
    const t = (y - JAR.neckBottom) / (JAR.shoulderEnd - JAR.neckBottom);
    const s = Math.sqrt(t);
    const curve = 1 - (1 - s) * (1 - s);
    return JAR.neckHalf + (JAR.bodyHalf - JAR.neckHalf) * curve - JAR.glass;
  }

  // Trace the jar outline (used for both the glass fill and outline)
  function jarPath() {
    const L = CX - JAR.bodyHalf, R = CX + JAR.bodyHalf;
    const nL = CX - JAR.neckHalf, nR = CX + JAR.neckHalf;
    const B = JAR.bottom + JAR.glass, c = JAR.corner;
    ctx.beginPath();
    ctx.moveTo(nL, JAR.rimY);
    ctx.lineTo(nL, JAR.neckBottom);
    ctx.quadraticCurveTo(L, JAR.neckBottom, L, JAR.shoulderEnd);
    ctx.lineTo(L, B - c);
    ctx.arcTo(L, B, L + c, B, c);
    ctx.lineTo(R - c, B);
    ctx.arcTo(R, B, R, B - c, c);
    ctx.lineTo(R, JAR.shoulderEnd);
    ctx.quadraticCurveTo(R, JAR.neckBottom, nR, JAR.neckBottom);
    ctx.lineTo(nR, JAR.rimY);
  }


  /* =====================================================
     PHYSICS
     Uses "Verlet" integration: each slip remembers where it
     was last step (px, py). Velocity = now − before. To push
     a slip, we just move its "before" position.
     ===================================================== */

  function makeSlip(x, y) {
    return {
      x: x, y: y, px: x, py: y - 1.5,   // tiny downward start speed
      r: SLIP_R,
      w: rand(26, 32), h: rand(15, 19),
      angle: rand(-0.6, 0.6), spin: 0,
      color: PAPER[Math.floor(Math.random() * PAPER.length)],
      alpha: 1,
      releaseAt: 0, seed: Math.random() * 10
    };
  }

  function step() {
    time += 1;

    // 1. Move every slip
    slips.forEach(function (s) {
      const vx = (s.x - s.px) * DAMPING;
      let vy = (s.y - s.py) * DAMPING;
      // Floating slips drift up slowly, like paper on warm air
      if (releasing && time >= s.releaseAt) vy = Math.max(vy, -1.3);
      s.px = s.x;
      s.py = s.y;

      let ay = GRAVITY;
      let ax = 0;
      const rising = releasing && time >= s.releaseAt;
      if (rising) {
        ay = -FLOAT_UP;
        // steer gently toward the opening so slips find the neck
        ax = (CX - s.x) * 0.004 + Math.sin(time * 0.05 + s.seed) * 0.02;
        if (s.y < JAR.rimY + 10) s.alpha -= 0.022;   // fade once outside
      }
      s.x += vx + ax;
      s.y += vy + ay;

      // Paper tilts as it slides sideways, then settles
      s.spin = (s.spin + vx * 0.012) * 0.9;
      s.angle += s.spin;
    });

    // 2. Fix overlaps and walls a few times so piles feel solid
    for (let k = 0; k < ITERATIONS; k++) {
      collide();
      slips.forEach(keepInside);
    }

    // 3. Remove slips that have floated away
    if (releasing) {
      slips = slips.filter(function (s) { return s.alpha > 0 && s.y > -40; });
    }
  }

  // Push apart any two slips that overlap
  function collide() {
    for (let i = 0; i < slips.length; i++) {
      const a = slips[i];
      for (let j = i + 1; j < slips.length; j++) {
        const b = slips[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const min = a.r + b.r;
        const d2 = dx * dx + dy * dy;
        if (d2 < min * min && d2 > 0.0001) {
          const d = Math.sqrt(d2);
          const push = (min - d) / d * 0.5;
          a.x -= dx * push; a.y -= dy * push;
          b.x += dx * push; b.y += dy * push;
        }
      }
    }
  }

  // Keep a slip inside the glass
  function keepInside(s) {
    const freeToLeave = releasing && time >= s.releaseAt;
    // Once it's floated above the rim, it's free
    if (freeToLeave && s.y < JAR.rimY) return;

    // Ceiling: don't let a shake throw slips out of the jar
    if (!freeToLeave && s.y < JAR.rimY + s.r) s.y = JAR.rimY + s.r;

    // Side walls (curved at the shoulder)
    const limit = halfWidthAt(s.y) - s.r;
    if (s.x < CX - limit) { s.x = CX - limit; s.px = s.x + (s.x - s.px) * 0.3; }
    if (s.x > CX + limit) { s.x = CX + limit; s.px = s.x + (s.x - s.px) * 0.3; }

    // Floor (with a little friction so the pile doesn't slide around)
    const floor = JAR.bottom - s.r;
    if (s.y > floor) {
      s.y = floor;
      s.px = s.x - (s.x - s.px) * 0.6;
    }

    // Rounded bottom corners
    const inner = JAR.bodyHalf - JAR.glass - JAR.corner;
    const cy = JAR.bottom - JAR.corner;
    if (s.y > cy && Math.abs(s.x - CX) > inner) {
      const cx = CX + Math.sign(s.x - CX) * inner;
      const dx = s.x - cx, dy = s.y - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      const maxD = JAR.corner - s.r;
      if (d > maxD) {
        s.x = cx + dx / d * maxD;
        s.y = cy + dy / d * maxD;
      }
    }
  }


  /* =====================================================
     DRAWING
     ===================================================== */

  function draw() {
    ctx.clearRect(0, 0, WORLD.w, WORLD.h);

    // Soft shadow under the jar
    ctx.save();
    ctx.fillStyle = "rgba(5, 10, 20, 0.35)";
    ctx.beginPath();
    ctx.ellipse(CX, JAR.bottom + 10, JAR.bodyHalf * 0.9, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Glass body (a very faint blue tint)
    const glass = ctx.createLinearGradient(CX - JAR.bodyHalf, 0, CX + JAR.bodyHalf, 0);
    glass.addColorStop(0, "rgba(168, 187, 211, 0.10)");
    glass.addColorStop(0.5, "rgba(168, 187, 211, 0.04)");
    glass.addColorStop(1, "rgba(168, 187, 211, 0.12)");
    jarPath();
    ctx.fillStyle = glass;
    ctx.fill();

    // Paper slips
    slips.forEach(drawSlip);

    // Glass outline + rim (drawn on top so slips sit "inside")
    jarPath();
    ctx.strokeStyle = "rgba(244, 234, 216, 0.38)";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.stroke();

    ctx.fillStyle = "rgba(244, 234, 216, 0.18)";
    ctx.strokeStyle = "rgba(244, 234, 216, 0.45)";
    roundRect(CX - JAR.neckHalf - 8, JAR.rimY - 9, JAR.neckHalf * 2 + 16, 10, 4);
    ctx.fill();
    ctx.stroke();

    // Light reflection on the glass
    ctx.strokeStyle = "rgba(255, 255, 255, 0.10)";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(CX - JAR.bodyHalf + 18, JAR.shoulderEnd + 10);
    ctx.lineTo(CX - JAR.bodyHalf + 18, JAR.bottom - 70);
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(CX + JAR.bodyHalf - 16, JAR.shoulderEnd + 30);
    ctx.lineTo(CX + JAR.bodyHalf - 16, JAR.shoulderEnd + 70);
    ctx.stroke();
  }

  // One folded paper slip
  function drawSlip(s) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, s.alpha);
    ctx.translate(s.x, s.y);
    ctx.rotate(s.angle);

    ctx.shadowColor = "rgba(5, 10, 20, 0.35)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 1.5;
    ctx.fillStyle = s.color;
    roundRect(-s.w / 2, -s.h / 2, s.w, s.h, 2.5);
    ctx.fill();
    ctx.shadowColor = "transparent";

    // The fold: one half slightly darker + a crease line
    ctx.fillStyle = "rgba(17, 31, 51, 0.07)";
    ctx.fillRect(0, -s.h / 2, s.w / 2, s.h);
    ctx.strokeStyle = "rgba(17, 31, 51, 0.18)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, -s.h / 2 + 1);
    ctx.lineTo(0, s.h / 2 - 1);
    ctx.stroke();
    ctx.restore();
  }

  // Rounded rectangle path (works in older browsers too)
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }


  /* =====================================================
     ANIMATION LOOP
     Only runs while something is moving, to save battery.
     ===================================================== */

  function loop() {
    for (let i = 0; i < SUBSTEPS; i++) step();
    draw();

    // Is everything resting?
    let maxSpeed = 0;
    slips.forEach(function (s) {
      maxSpeed = Math.max(maxSpeed, Math.abs(s.x - s.px) + Math.abs(s.y - s.py));
    });
    quietFrames = maxSpeed < 0.03 ? quietFrames + 1 : 0;

    if (releasing && slips.length === 0) finishRelease();

    if (quietFrames > 40 && !releasing) {
      frameId = null;          // everything settled: stop the loop
      return;
    }
    frameId = requestAnimationFrame(loop);
  }

  function wake() {
    quietFrames = 0;
    if (!frameId) frameId = requestAnimationFrame(loop);
  }

  // Reduced motion: run the physics instantly, then draw once
  function settleInstantly() {
    for (let i = 0; i < 600; i++) step();
    draw();
  }


  /* =====================================================
     ACTIONS
     ===================================================== */

  function dropIntoJar() {
    const s = makeSlip(CX + rand(-10, 10), JAR.rimY + SLIP_R + 2);
    slips.push(s);
    updateStatus();
    if (Calm.reducedMotion()) settleInstantly();
    else wake();
  }

  // The paper preview: show → fold in half → fold again → drop
  function foldThought(text) {
    const card = document.createElement("div");
    card.className = "slip-preview";
    card.setAttribute("aria-hidden", "true");
    const p = document.createElement("p");
    p.textContent = text;          // textContent = safe, never runs as HTML
    card.appendChild(p);
    stage.appendChild(card);

    // Sizes for the final folded shape and where the jar opening is
    const cardW = card.offsetWidth, cardH = card.offsetHeight;
    const sx = (29 * scale) / cardW;
    const sy = (17 * scale) / cardH;
    const dropY = (JAR.rimY + SLIP_R + 2) * scale - cardH / 2;
    const base = "translateX(-50%) ";

    const anim = card.animate([
      { offset: 0,    opacity: 0, transform: base + "translateY(-8px) scale(1, 1)" },
      { offset: 0.14, opacity: 1, transform: base + "translateY(0) scale(1, 1)" },
      { offset: 0.42, opacity: 1, transform: base + "translateY(0) scale(1, 1)" },        // read it
      { offset: 0.6,  opacity: 1, transform: base + "translateY(0) scale(1, 0.5)" },      // fold 1
      { offset: 0.76, opacity: 1, transform: base + "translateY(0) scale(" + sx + "," + sy + ")" }, // fold 2
      { offset: 0.96, opacity: 1, transform: base + "translateY(" + dropY + "px) scale(" + sx + "," + sy + ")" }, // drop
      { offset: 1,    opacity: 0, transform: base + "translateY(" + dropY + "px) scale(" + sx + "," + sy + ")" }
    ], { duration: 2600, easing: "ease-in-out", fill: "forwards" });

    // Words fade as the paper folds over them
    p.animate([
      { opacity: 1, offset: 0 }, { opacity: 1, offset: 0.45 }, { opacity: 0, offset: 0.6 }, { opacity: 0, offset: 1 }
    ], { duration: 2600, fill: "forwards" });

    pending++;
    anim.finished.then(function () {
      card.remove();
      pending--;
      dropIntoJar();
    });
  }

  function addThought(text) {
    if (slips.length + pending >= MAX_SLIPS) {
      statusEl.textContent = "The jar is pretty full. Maybe give it a shake, or let them all go.";
      return;
    }
    if (releasing) return;
    statusEl.textContent = "Folding it up…";
    if (Calm.reducedMotion()) dropIntoJar();
    else foldThought(text);
  }

  function shake() {
    if (!slips.length) return;
    if (Calm.reducedMotion()) {
      // No wobble: just mix the slips up and let them land
      slips.forEach(function (s) {
        s.x = CX + rand(-80, 80);
        s.y = rand(JAR.shoulderEnd, JAR.bottom - 60);
        s.px = s.x; s.py = s.y;
        s.angle = rand(-1, 1);
      });
      settleInstantly();
      statusEl.textContent = "Stirred up.";
      return;
    }
    // Wobble the jar (CSS) and toss the slips a few times
    stage.classList.remove("is-shaking");
    void stage.offsetWidth;   // restart the CSS animation
    stage.classList.add("is-shaking");
    [0, 220, 440].forEach(function (delay, i) {
      setTimeout(function () {
        const dir = i % 2 === 0 ? 1 : -1;
        slips.forEach(function (s) {
          s.px = s.x - dir * rand(1, 4);       // sideways push
          s.py = s.y + rand(2, 5);             // upward toss
        });
        wake();
      }, delay);
    });
    statusEl.textContent = "Stirred up.";
  }

  function release() {
    if (!slips.length || releasing) return;
    if (Calm.reducedMotion()) {
      slips = [];
      draw();
      finishRelease();
      return;
    }
    releasing = true;
    setButtons();
    statusEl.textContent = "Letting them go…";
    // Top slips leave first, one after another
    slips.slice()
      .sort(function (a, b) { return a.y - b.y; })
      .forEach(function (s, i) { s.releaseAt = time + i * 12 + rand(0, 10); });
    wake();
  }

  function finishRelease() {
    releasing = false;
    updateStatus("All gone. A little lighter now?");
    setButtons();
  }

  function updateStatus(message) {
    const n = slips.length;
    const count = n === 0 ? "The jar is empty." : n === 1 ? "1 slip in the jar." : n + " slips in the jar.";
    statusEl.textContent = message || count;
    canvas.setAttribute("aria-label",
      n === 0 ? "An empty glass jar" : "A glass jar holding " + n + " folded paper slip" + (n === 1 ? "" : "s"));
    setButtons();
  }

  function setButtons() {
    const empty = slips.length === 0;
    shakeBtn.disabled = empty || releasing;
    releaseBtn.disabled = empty || releasing;
  }


  /* =====================================================
     EVENTS
     ===================================================== */

  form.addEventListener("submit", function (e) {
    e.preventDefault();                 // don't reload the page
    const text = input.value.trim();
    if (!text) { input.focus(); return; }
    input.value = "";                   // clear it right away
    addThought(text);
  });

  shakeBtn.addEventListener("click", shake);
  releaseBtn.addEventListener("click", release);
  window.addEventListener("resize", resize);

  resize();
})();
