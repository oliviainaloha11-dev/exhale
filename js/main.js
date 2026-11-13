/* =========================================================
   main.js — tiny shared helpers, loaded on every page
   ---------------------------------------------------------
   Everything lives on one object called `Calm` so different
   files can share helpers without stepping on each other.
   ========================================================= */

window.Calm = window.Calm || {};

/* Does this person prefer less motion? (a phone/computer setting)
   Activities call Calm.reducedMotion() before animating. */
Calm.reducedMotion = function () {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/* Turn on offline mode / app install (see sw.js at the top of
   the site). Only works on a real web address, not when you
   double-click a file, so we skip it there. */
(function () {
  if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
  // This script lives in /js/, so the service worker is one folder up
  const swUrl = new URL("../sw.js", document.currentScript.src);
  window.addEventListener("load", function () {
    navigator.serviceWorker.register(swUrl).catch(function () { /* offline mode just won't be available */ });
  });
})();
