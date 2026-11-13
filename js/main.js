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
