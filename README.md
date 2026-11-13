# exhale

A free, calm website for busy high school students: a place to breathe, unwind, and reset between studying.
No ads, no accounts, no tracking. Everything runs in the visitor's own browser.

Plain HTML, CSS, and JavaScript. No frameworks, no build step, no server.

---

## 1. Look at it on your computer

Double-click `index.html`. That's it. Every page works this way.

> One exception: if you ever add real audio files to `audio/`, browsers only load them from a real web address.
> To test those on your computer, open Terminal in this folder and run `python3 -m http.server`, then visit
> http://localhost:8000.

---

## 2. What's where

```
exhale/
├── index.html              Home page (welcome + activity bubbles)
├── css/
│   ├── base.css            Colors, font, nav, footer, buttons. Used by EVERY page
│   ├── home.css            The bubble buttons
│   └── pages.css           Resources + About pages
├── js/
│   ├── main.js             Tiny shared helpers (reduced-motion check)
│   └── chime.js            Soft bell sound (breathing, body scan, stretches, timer)
├── activities/
│   ├── breathing/          Box breathing
│   ├── mind-jar/           Mind jar (canvas + mini physics)
│   ├── unsent-letter/      Unsent letter
│   ├── grounding/          5-4-3-2-1
│   ├── body-scan/          Body scan
│   ├── stretches/          Desk stretches (edit stretches-data.js)
│   └── sounds/             Ambient sound mixer
├── timer/                  Study timer
├── journal/                Journal (+ prompts.js, pdf-maker.js)
├── resources/              "Need to talk to someone?"
├── about/                  About
├── audio/                  (optional) real sound recordings, see audio/README.txt
├── favicon.svg             Browser tab icon
├── apple-touch-icon.png    Icon when saved to an iPhone home screen
├── og-image.png            Preview picture when the link is shared
├── sitemap.xml + robots.txt   For Google
└── README.md               This file
```

Every activity folder has its own `index.html` (the page), a `.css` file (its look), and a `.js` file (what it does).
Every file has comments explaining what each part does.

---

## 3. Easy things to change

| I want to… | Edit this |
|---|---|
| Change the colors | The top of `css/base.css` (the `:root` section) |
| Change the welcome words | `index.html` |
| Add or change journal prompts | `journal/prompts.js` |
| Change the body scan words or timing | The `AREAS` list in `activities/body-scan/body-scan.js` |
| Add a stretch or a routine | `activities/stretches/stretches-data.js` |
| Change the grounding wording | The `STEPS` list in `activities/grounding/grounding.js` |
| Change the break ideas in the timer | `BREAK_IDEAS` in `timer/timer.js` |
| Use a real rain or ocean recording | See `audio/README.txt` |
| Write your story on the About page | `about/index.html`. Look for **EDIT ME** |
| Rename the site from "exhale" | Use your editor's "Find in folder" (VS Code: ⇧⌘F) for `exhale` and replace it. Also remake `og-image.png`, which has the name in the picture. |

---

## 4. Put it online for free (GitHub Pages)

**Time: about 15 minutes. Cost: $0.**

### Step 1: Make a GitHub account
1. Go to **github.com** and click **Sign up**.
2. Pick a username carefully: it becomes part of your web address
   (`https://USERNAME.github.io/exhale/`).
3. Verify your email.

### Step 2: Create a repository (a project folder on GitHub)
1. Click the **+** in the top-right → **New repository**.
2. Repository name: `exhale` (or whatever you want in your address).
3. Choose **Public** (free GitHub Pages needs a public repository).
4. Leave everything else as is → **Create repository**.

### Step 3: Upload the files
1. On the new repository page, click **uploading an existing file**.
2. Open the `exhale` folder on your computer, select **everything inside it**
   (not the folder itself), and drag it all into the browser window.
   *Make sure `index.html` ends up at the top level, not inside another folder.*
3. Scroll down and click **Commit changes**. Wait for the upload to finish.

### Step 4: Turn on GitHub Pages
1. In the repository, click **Settings** → **Pages** (left sidebar).
2. Under **Build and deployment** → **Source**, choose **Deploy from a branch**.
3. Branch: **main**, folder: **/ (root)** → **Save**.
4. Wait 1–3 minutes, then refresh. A box appears: **"Your site is live at …"**. 🎉

### Step 5: Put your real address into the SEO files
Your address looks like `https://USERNAME.github.io/exhale/`. Search engines and link previews need it written out.

1. Open the `exhale` folder in VS Code.
2. Press **⇧⌘F** (Find in folder). Search for `https://YOUR-SITE-URL/`.
3. Replace it with your address, **including the ending slash**, for example `https://maya-k.github.io/exhale/`.
4. Click **Replace All**. This updates every page, plus `sitemap.xml` and `robots.txt`.
5. Upload the changed files to GitHub again (same as Step 3; GitHub replaces the old ones).

### Step 6: Tell Google about it (optional, but helps it show up)
1. Go to **search.google.com/search-console** and sign in.
2. Add a property → **URL prefix** → paste your site address.
3. Verify it. The easiest way is the **HTML tag** option: copy the `<meta name="google-site-verification" …>` tag
   into the `<head>` of `index.html`, upload it, then click **Verify**.
4. In the left menu → **Sitemaps** → enter `sitemap.xml` → **Submit**.
5. Google usually starts showing new sites within a few days to a few weeks.

### Updating the site later
Change files on your computer → upload them to the repository again (**Add file → Upload files**) → wait a minute.

---

## 5. Or: Netlify (even quicker, also free)
1. Go to **app.netlify.com/drop**.
2. Drag the whole `exhale` folder onto the page. It's live in seconds at a random address.
3. Make a free account to keep it and to rename the address (Site settings → Change site name).
4. Then do Step 5 and Step 6 above with your Netlify address.

---

## 6. Before you share it
- [ ] Write your own words on the About page (`about/index.html`, look for **EDIT ME**).
- [ ] Double-check the crisis line info on the Resources page is still current
      (988lifeline.org and crisistextline.org).
- [ ] Try every page on your phone.
- [ ] Share the link with a friend and see if the preview picture shows up.

---

## Privacy (what the site actually stores)
- **Nothing is sent anywhere.** There's no server, no analytics, no cookies.
- **Saved on the visitor's own device only:**
  - the journal draft, under `exhale.journal.draft`
  - timer settings, under `exhale.timer.settings`
- The mind jar and unsent letter save nothing.
- The only outside request is the Manrope font from Google Fonts.
