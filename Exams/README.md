# Brighton Static Exam Platform

This package is designed for the setup where the visible website is fully static and Wix is used only as the CMS/API backend.

## Main static pages

- `teacher.html` — teacher exam control panel
- `results.html` — results dashboard
- `exams/b2-rue/index.html` — B2 Reading and Use of English exam

## Important files

- `assets/brighton-logo.png` — Brighton logo used by the teacher pages, results dashboard, and exam
- `answer-keys/brighton-b2-rue-final.json` — answer key for the included B2 RUOE exam
- `shared-grading.js` — dashboard-side grading fallback
- `wix-backend/http-functions.js` — Wix Velo backend API for CMS access and secure grading
- `cms-seed/Exams_brighton-b2-rue-final.json` — exam row seed data, including `answerKeyJson`
- `config.js` — static-site API configuration

## Hosting

Upload the whole folder to GitHub Pages, Netlify, Vercel, or any static host.

Then edit `config.js` and set:

```js
API_BASE_URL: "https://YOUR-WIX-SITE/_functions"
```

For a free Wix domain, it usually looks like:

```js
API_BASE_URL: "https://username.wixsite.com/site-name/_functions"
```

## Wix setup summary

1. Turn on Wix Velo.
2. Create the CMS collections described in `WIX_SETUP.md`.
3. Paste `wix-backend/http-functions.js` into `Backend > http-functions.js`.
4. Add one exam row to the `Exams` collection using `cms-seed/Exams_brighton-b2-rue-final.json`.
5. Update the exam row `shareUrl` to your static exam URL.
6. Publish the Wix site.
7. Open `teacher.html` from your static host.

## Grading

The Wix backend grades submissions when students finish the exam. The results dashboard also has a local grading fallback using `answer-keys/brighton-b2-rue-final.json`, so older ungraded submissions can still show a result.

For a high-security final exam, keep the answer key only in Wix CMS/backend and remove the public static `answer-keys` folder after the backend is confirmed working.
