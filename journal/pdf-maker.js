/* =========================================================
   pdf-maker.js — builds a simple, nicely laid-out PDF by hand
   ---------------------------------------------------------
   No libraries and no internet needed. A PDF is just text in
   a special format, so we write that text ourselves:
     fonts → pages → a content "stream" per page with drawing
     instructions like "put this text at x, y".

   It uses the built-in PDF font Helvetica, which supports
   English and most accented letters (é, ñ, ü…). It can't show
   emoji or non-Latin scripts (like 한국어 or 中文). For those,
   journal.js uses the browser's "Save as PDF" print option.

   Usage:
     Calm.pdf.canEncode(text)  → true if Helvetica can show it
     Calm.pdf.journal({ title, prompt, body })  → a PDF Blob
   ========================================================= */

window.Calm = window.Calm || {};

(function () {
  // Page: US Letter, in points (72 points = 1 inch)
  const PAGE_W = 612, PAGE_H = 792, MARGIN = 72;
  const TEXT_W = PAGE_W - MARGIN * 2;

  // Helvetica letter widths for characters 32 (space) to 126 (~),
  // in 1/1000ths of the font size. Used to wrap lines nicely.
  const WIDTHS = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,
    556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,
    722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,
    667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,
    222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];

  // Curly quotes, dashes etc. → their byte in the PDF's "WinAnsi" alphabet
  const SPECIAL = {
    "‘": 0x91, "’": 0x92, "“": 0x93, "”": 0x94, "–": 0x96,
    "—": 0x97, "…": 0x85, "•": 0x95, "€": 0x80, "™": 0x99
  };

  function byteFor(ch) {
    const code = ch.charCodeAt(0);
    if (code === 9) return 32;                         // tab → space
    if (code >= 32 && code <= 126) return code;        // plain ASCII
    if (code >= 160 && code <= 255) return code;       // accented Latin letters
    if (SPECIAL[ch] !== undefined) return SPECIAL[ch];
    return -1;                                         // can't show this one
  }

  function canEncode(text) {
    for (const ch of text) {
      if (ch === "\n" || ch === "\r") continue;
      if (byteFor(ch) === -1) return false;
    }
    return true;
  }

  function charWidth(ch, size) {
    const code = ch.charCodeAt(0);
    const w = code >= 32 && code <= 126 ? WIDTHS[code - 32] : 556;
    return (w * size) / 1000;
  }
  function textWidth(str, size) {
    let w = 0;
    for (const ch of str) w += charWidth(ch, size);
    return w;
  }

  // Break text into lines that fit the page width
  function wrap(text, size, maxWidth) {
    const lines = [];
    text.replace(/\r/g, "").split("\n").forEach(function (para) {
      if (para.trim() === "") { lines.push(""); return; }
      let line = "";
      para.split(/ +/).forEach(function (word) {
        // A single huge word (like a long link): cut it up
        while (textWidth(word, size) > maxWidth) {
          let cut = word.length - 1;
          while (cut > 1 && textWidth(word.slice(0, cut), size) > maxWidth) cut--;
          if (line) { lines.push(line); line = ""; }
          lines.push(word.slice(0, cut));
          word = word.slice(cut);
        }
        const test = line ? line + " " + word : word;
        if (textWidth(test, size) <= maxWidth) line = test;
        else { lines.push(line); line = word; }
      });
      lines.push(line);
    });
    return lines;
  }

  // Turn text into a PDF string: (Hello \(world\))
  function pdfString(str) {
    let out = "(";
    for (const ch of str) {
      let b = byteFor(ch);
      if (b === -1) b = 63;                            // "?"
      if (b === 40 || b === 41 || b === 92) out += "\\" + String.fromCharCode(b);
      else if (b > 126) out += "\\" + b.toString(8).padStart(3, "0");
      else out += String.fromCharCode(b);
    }
    return out + ")";
  }

  // Colors (0–1 RGB): navy text, soft grey-blue details
  const NAVY = "0.07 0.12 0.2";
  const MUTED = "0.4 0.45 0.52";
  const LINE = "0.75 0.8 0.86";

  function journal(opts) {
    const pages = [[]];
    let y = PAGE_H - MARGIN;
    const BOTTOM = MARGIN + 10;

    function page() { return pages[pages.length - 1]; }
    function newPage() { pages.push([]); y = PAGE_H - MARGIN; }
    function text(str, font, size, color, x) {
      page().push("BT /" + font + " " + size + " Tf " + color + " rg " + (x || MARGIN) + " " + y.toFixed(1) + " Td " + pdfString(str) + " Tj ET");
    }
    function rule() {
      page().push(LINE + " RG 0.6 w " + MARGIN + " " + y.toFixed(1) + " m " + (PAGE_W - MARGIN) + " " + y.toFixed(1) + " l S");
    }
    function block(str, font, size, leading, color) {
      wrap(str, size, TEXT_W).forEach(function (line) {
        if (y - leading < BOTTOM) newPage();
        y -= leading;
        if (line) text(line, font, size, color);
      });
    }

    // Header
    y -= 2;
    text("EXHALE  ·  JOURNAL", "F1", 8.5, MUTED);
    y -= 34;
    text(opts.title, "F2", 20, NAVY);
    y -= 14;
    if (opts.prompt) {
      y -= 6;
      block(opts.prompt, "F3", 11, 16, MUTED);
    }
    y -= 16;
    rule();
    y -= 8;

    // The entry itself
    block(opts.body, "F1", 11.5, 18, NAVY);

    // Footer on every page: "Written privately · page 1 of 2"
    pages.forEach(function (ops, i) {
      const footer = "Written privately with exhale  ·  page " + (i + 1) + " of " + pages.length;
      ops.push("BT /F1 8.5 Tf " + MUTED + " rg " + MARGIN + " 40 Td " + pdfString(footer) + " Tj ET");
    });

    return build(pages);
  }

  // Assemble the actual PDF file
  function build(pages) {
    const objects = [];          // object text, numbered from 1
    const add = function (body) { objects.push(body); return objects.length; };

    add("<< /Type /Catalog /Pages 2 0 R >>");                         // 1
    add("PAGES");                                                     // 2 (filled in below)
    const font = function (name) {
      return "<< /Type /Font /Subtype /Type1 /BaseFont /" + name + " /Encoding /WinAnsiEncoding >>";
    };
    const f1 = add(font("Helvetica"));
    const f2 = add(font("Helvetica-Bold"));
    const f3 = add(font("Helvetica-Oblique"));

    const kids = [];
    pages.forEach(function (ops) {
      const stream = ops.join("\n");
      const content = add("<< /Length " + stream.length + " >>\nstream\n" + stream + "\nendstream");
      kids.push(add(
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + PAGE_W + " " + PAGE_H + "] " +
        "/Resources << /Font << /F1 " + f1 + " 0 R /F2 " + f2 + " 0 R /F3 " + f3 + " 0 R >> >> " +
        "/Contents " + content + " 0 R >>"));
    });
    objects[1] = "<< /Type /Pages /Kids [" + kids.map(function (k) { return k + " 0 R"; }).join(" ") + "] /Count " + kids.length + " >>";

    // Write everything out, remembering where each object starts
    let pdf = "%PDF-1.4\n";
    const offsets = [];
    objects.forEach(function (body, i) {
      offsets.push(pdf.length);
      pdf += (i + 1) + " 0 obj\n" + body + "\nendobj\n";
    });
    const xref = pdf.length;
    pdf += "xref\n0 " + (objects.length + 1) + "\n0000000000 65535 f \n";
    offsets.forEach(function (o) { pdf += String(o).padStart(10, "0") + " 00000 n \n"; });
    pdf += "trailer\n<< /Size " + (objects.length + 1) + " /Root 1 0 R >>\nstartxref\n" + xref + "\n%%EOF";

    return new Blob([pdf], { type: "application/pdf" });
  }

  Calm.pdf = { canEncode: canEncode, journal: journal };
})();
