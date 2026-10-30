# Brighton exam player

All formal exams and practice variants share the same presentation and shell behaviour.

## Adding an exam

- Add `class="brighton-exam-player"` to the document's `html` element.
- Load the exam's question-specific CSS first, then `exam-player-fonts.css` and `exam-player.css`. The shared stylesheet owns the welcome form, header, footer, buttons, dialogs, spacing and responsive shell. Its scoped priority also handles cached legacy stylesheets.
- Load `app-core.js`, then `exam-player-ui.js`, before the exam's data and main script. Reuse the existing shell IDs and classes.
- Register local state with `App.registerLocalState(STORAGE_KEY, () => state)`. Use `App.saveLocalState` and `App.clearLocalState` for writes and cleanup. This flushes pending changes when the page is hidden, warns when device storage is unavailable and prevents cleared attempts from being restored by a late timer.
- Use `App.playExamAudio(audio)` inside the listening gate's click handler. This preserves the user gesture and bounds startup time. Release the Play button in `finally` so it remains retryable.
- Do not autofocus writing fields on initial render. Open part navigation at its instructions; individual question navigation can still scroll to the relevant question.
- Keep questions, answer keys, grading and submission payloads in their existing modules. Shared shell code must not change them.
- Keep fonts local in `assets/fonts/`; their SIL Open Font License is included.

## Browser verification

Install Playwright 1.62.1 in a separate test runtime, install its browsers, then run:

```text
node Exams/validate-exam-player.cjs
```

The default engine is Chromium (Microsoft Edge on Windows). `EXAM_BROWSERS=chromium,firefox,webkit` runs all three engines. Set `EXAM_QA_OUTPUT` to retain screenshots and measured geometry. `EXAM_QA_WIDTHS` can restrict debugging to a comma-separated list of widths.

The suite covers all exam folders at 1440×900, 768×1024, 390×844, 320×568 and 844×390. It visits every numbered question, checks panel and control geometry, selects popup answers, exercises notes/flags/dialog keyboard behaviour, resumes local state, verifies failed submission followed by retry and checks reset. Separate scenarios exercise blocked storage, offline editing and real listening-audio decoding/startup.

Question images must finish decoding before geometry checks or screenshots. Navigation has a separate 30-second budget so the same suite can also run against the public site using `EXAM_BASE=https://exams.bebrighton.net/Exams/exams/`.

**Every non-GET request is intercepted in the main suite.** No production student records or grades are created. Audio is muted during real playback verification. Screenshots and browser emulation complement, but do not replace, testing on physical phones or assistive technology.

GitHub Actions runs the suite independently for Chromium, Firefox and WebKit and retains screenshots for seven days.
