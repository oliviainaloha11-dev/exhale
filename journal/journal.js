/* =========================================================
   journal.js — prompt, writing, autosave, downloads
   ---------------------------------------------------------
   PRIVACY:
   - Your draft is saved ONLY in this browser's localStorage,
     under the key below. It is never sent anywhere.
   - "Clear my draft" deletes it.
   - Downloads are created right here in the browser.
   ========================================================= */

(function () {
  const DRAFT_KEY = "exhale.journal.draft";
  const prompts = Calm.PROMPTS;

  // ----- Elements -----
  const promptBox      = document.getElementById("promptBox");
  const promptText     = document.getElementById("promptText");
  const showPromptWrap = document.getElementById("showPromptWrap");
  const dateText       = document.getElementById("dateText");
  const entry          = document.getElementById("entry");
  const saveText       = document.getElementById("saveText");
  const countText      = document.getElementById("countText");
  const confirmClear   = document.getElementById("confirmClear");
  const statusEl       = document.getElementById("status");
  const printSheet     = document.getElementById("printSheet");

  // ----- Today -----
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  const niceDate = today.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const pdfDate  = today.toLocaleDateString("en-US",   { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const fileDate = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
  dateText.textContent = niceDate;

  // ----- State -----
  let promptIndex = dayOfYear % prompts.length;
  let showPrompt = true;
  let saveTimer = null;


  /* ---------- Saving the draft (this device only) ---------- */
  function storage() {
    try { return window.localStorage; } catch (e) { return null; }
  }

  function saveDraft() {
    const store = storage();
    if (!store) { saveText.textContent = "Autosave is off in this browser (private mode?)."; return; }
    try {
      if (entry.value.trim() === "") {
        store.removeItem(DRAFT_KEY);
        saveText.textContent = "Nothing saved yet.";
        return;
      }
      store.setItem(DRAFT_KEY, JSON.stringify({
        text: entry.value, promptIndex: promptIndex, showPrompt: showPrompt, savedAt: Date.now()
      }));
      const time = new Date().toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
      saveText.textContent = "Draft saved on this device · " + time;
    } catch (e) {
      saveText.textContent = "Couldn't autosave (storage is full or blocked).";
    }
  }

  function loadDraft() {
    const store = storage();
    if (!store) return;
    try {
      const d = JSON.parse(store.getItem(DRAFT_KEY));
      if (!d || !d.text) return;
      entry.value = d.text;
      if (typeof d.promptIndex === "number") promptIndex = d.promptIndex % prompts.length;
      showPrompt = d.showPrompt !== false;
      saveText.textContent = "Welcome back. Your draft is still here.";
    } catch (e) { /* ignore a broken draft */ }
  }


  /* ---------- Prompt ---------- */
  function renderPrompt(animate) {
    promptBox.hidden = !showPrompt;
    showPromptWrap.hidden = showPrompt;
    if (!animate || Calm.reducedMotion()) { promptText.textContent = prompts[promptIndex]; return; }
    promptText.classList.add("is-changing");
    setTimeout(function () {
      promptText.textContent = prompts[promptIndex];
      promptText.classList.remove("is-changing");
    }, 400);
  }

  document.getElementById("nextPromptBtn").addEventListener("click", function () {
    promptIndex = (promptIndex + 1) % prompts.length;
    renderPrompt(true);
    saveDraft();
  });
  document.getElementById("hidePromptBtn").addEventListener("click", function () {
    showPrompt = false;
    renderPrompt(false);
    saveDraft();
    entry.focus();
  });
  document.getElementById("showPromptBtn").addEventListener("click", function () {
    showPrompt = true;
    renderPrompt(false);
    saveDraft();
  });


  /* ---------- Writing ---------- */
  function autoGrow() {
    entry.style.height = "auto";
    entry.style.height = entry.scrollHeight + "px";
  }
  function updateCount() {
    const words = entry.value.trim() ? entry.value.trim().split(/\s+/).length : 0;
    countText.textContent = words === 1 ? "1 word" : words + " words";
  }

  entry.addEventListener("input", function () {
    autoGrow();
    updateCount();
    statusEl.textContent = "";
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveDraft, 600);   // save shortly after you pause typing
  });


  /* ---------- Downloads ---------- */
  function hasWriting() {
    if (entry.value.trim()) return true;
    statusEl.textContent = "Write something first, then you can download it.";
    entry.focus();
    return false;
  }

  function currentPrompt() {
    return showPrompt ? prompts[promptIndex] : "";
  }

  // Make the browser save a file
  function download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  document.getElementById("txtBtn").addEventListener("click", function () {
    if (!hasWriting()) return;
    let text = niceDate + "\n";
    if (currentPrompt()) text += "\nPrompt: " + currentPrompt() + "\n";
    text += "\n" + entry.value.trim() + "\n";
    download(new Blob([text], { type: "text/plain;charset=utf-8" }), "journal-" + fileDate + ".txt");
    statusEl.textContent = "Saved as a .txt file to your downloads.";
  });

  document.getElementById("pdfBtn").addEventListener("click", function () {
    if (!hasWriting()) return;
    const body = entry.value.trim();
    const prompt = currentPrompt();

    if (Calm.pdf.canEncode(body + prompt)) {
      download(Calm.pdf.journal({ title: pdfDate, prompt: prompt, body: body }), "journal-" + fileDate + ".pdf");
      statusEl.textContent = "Saved as a PDF to your downloads.";
      return;
    }

    // Emoji or non-Latin letters: let the browser make the PDF instead
    buildPrintSheet(body, prompt);
    statusEl.textContent = "Your entry has characters our PDF maker can't draw, so a print window will open. Choose “Save as PDF” there.";
    setTimeout(function () { window.print(); }, 50);
  });

  function buildPrintSheet(body, prompt) {
    printSheet.innerHTML = "";
    const add = function (tag, cls, text) {
      const el = document.createElement(tag);
      if (cls) el.className = cls;
      if (text) el.textContent = text;      // textContent = always safe
      printSheet.appendChild(el);
    };
    add("p", "ps-brand", "EXHALE · JOURNAL");
    add("h2", "", niceDate);
    if (prompt) add("p", "ps-prompt", prompt);
    add("hr");
    add("div", "ps-body", body);
    add("p", "ps-foot", "Written privately with exhale");
  }


  /* ---------- Clearing ---------- */
  document.getElementById("clearBtn").addEventListener("click", function () {
    confirmClear.hidden = false;
    document.getElementById("keepBtn").focus();
  });
  document.getElementById("keepBtn").addEventListener("click", function () {
    confirmClear.hidden = true;
    entry.focus();
  });
  document.getElementById("yesClearBtn").addEventListener("click", function () {
    const store = storage();
    try { if (store) store.removeItem(DRAFT_KEY); } catch (e) { /* ignore */ }
    entry.value = "";
    autoGrow();
    updateCount();
    confirmClear.hidden = true;
    saveText.textContent = "Draft cleared.";
    statusEl.textContent = "";
    entry.focus();
  });


  /* ---------- Start ---------- */
  loadDraft();
  renderPrompt(false);
  autoGrow();
  updateCount();
})();
