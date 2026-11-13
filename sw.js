/* =========================================================
   sw.js — the "service worker" that makes exhale work offline
   ---------------------------------------------------------
   A service worker is a small script the browser keeps in the
   background. Ours does one thing: it saves a copy of the
   site's files on the device, so the app still opens with no
   internet (on a plane, in a dead zone, during a test week
   with bad Wi-Fi).

   How it decides what to show:
   - Online  → always fetch the newest version from the web
               (so your edits show up right away) and quietly
               update the saved copy.
   - Offline → use the saved copy.

   IF YOU ADD A NEW FILE OR PAGE: add its path to FILES below,
   and change VERSION (e.g. "exhale-v2") so phones re-save.
   ========================================================= */

const VERSION = "exhale-v1";

// Every file the site needs, relative to this file
const FILES = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "favicon.svg",
  "icon-192.png",
  "icon-512.png",
  "css/base.css",
  "css/home.css",
  "css/pages.css",
  "js/main.js",
  "js/chime.js",
  "activities/breathing/index.html",
  "activities/breathing/breathing.css",
  "activities/breathing/breathing.js",
  "activities/mind-jar/index.html",
  "activities/mind-jar/mind-jar.css",
  "activities/mind-jar/mind-jar.js",
  "activities/unsent-letter/index.html",
  "activities/unsent-letter/unsent-letter.css",
  "activities/unsent-letter/unsent-letter.js",
  "activities/grounding/index.html",
  "activities/grounding/grounding.css",
  "activities/grounding/grounding.js",
  "activities/body-scan/index.html",
  "activities/body-scan/body-scan.css",
  "activities/body-scan/body-scan.js",
  "activities/stretches/index.html",
  "activities/stretches/stretches.css",
  "activities/stretches/stretches-data.js",
  "activities/stretches/stretches.js",
  "activities/sounds/index.html",
  "activities/sounds/sounds.css",
  "activities/sounds/sounds.js",
  "timer/index.html",
  "timer/timer.css",
  "timer/timer.js",
  "journal/index.html",
  "journal/journal.css",
  "journal/journal.js",
  "journal/prompts.js",
  "journal/pdf-maker.js",
  "resources/index.html",
  "about/index.html"
];

// 1. Install: save every file
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(VERSION)
      .then(function (cache) { return cache.addAll(FILES); })
      .then(function () { return self.skipWaiting(); })
  );
});

// 2. Activate: delete copies saved by older versions
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (key) {
          if (key !== VERSION) return caches.delete(key);
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

// 3. Every request: try the internet first, fall back to the saved copy
self.addEventListener("fetch", function (event) {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isOurs = url.origin === self.location.origin;
  const isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!isOurs && !isFont) return;    // anything else: let the browser handle it

  event.respondWith(
    fetch(request)
      .then(function (response) {
        // Save a fresh copy for next time we're offline
        if (response && (response.ok || response.type === "opaque")) {
          const copy = response.clone();
          caches.open(VERSION).then(function (cache) { cache.put(request, copy); });
        }
        return response;
      })
      .catch(function () {
        // Offline: use the saved copy (ignoring ?query bits)
        return caches.match(request, { ignoreSearch: true }).then(function (saved) {
          if (saved) return saved;
          // A page we never saved: show the home page instead
          if (request.mode === "navigate") return caches.match("index.html");
          return Response.error();
        });
      })
  );
});
