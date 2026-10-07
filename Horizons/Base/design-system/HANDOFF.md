# Horizons — Base Design System Handoff

**Status: OPERATIONAL ENTRY POINT**

Use this file to resume Horizons book production. It points to the authoritative shared sources; it is not another rulebook.

## Authority order

Read these sources in order:

1. `CANONICAL-STYLE.md` — shared visual/structural rules.
2. `GUIDED-DISCOVERY.md` — shared pedagogy, with level-specific language-load rules where stated.
3. `component-contracts.md` — reusable HTML/CSS semantics.
4. `asset-policy.md` — image/audio sourcing and production.

Shared implementation is intentionally small:

- `tokens.css` — colors, type, spacing and print legibility floors;
- `components.css` — reusable cross-book/cross-lesson CSS.

There is no refinements or override CSS layer.

## Current A1 production precedent

For the current A1 book, compare new work with the approved Unit 1 masters in `../../A1/Lessons/`:

- `1A.html`
- `1B.html`
- `1C.html`
- `1D.html`

Lesson masters use the definitive lesson code as their filenames. Their adjacent `lesson-*-local.css` files contain book/lesson-specific composition, crop tuning and corrections. They are precedents, not templates to copy mechanically.

For **early A1 learner-facing language**, 1A, 1B and the first page of 1C are especially important references for the deliberately narrow, Spanish-transparent register.

Recent Unit 1 refinements establish additional production precedents:

- simulated real-world UI should visually read as the intended artifact, not as a generic card;
- text/profile bodies should normally end with their content rather than carrying large artificial `min-height` floors;
- short semantic labels may use content-sized columns or no-wrap treatment when an awkward line break would damage readability;
- when the author removes answer choices or response spaces, do not replace them with a different affordance unless explicitly requested;
- forms should prefer restrained CSS-built structure and decoration before adding a background image that does no pedagogical work.

## Current A1 / Unit 2 workflow

For each new lesson:

1. lock the syllabus focus and identify what language is genuinely new;
2. audit what learners have already met in preceding A1 pages;
3. design the Guided Discovery sequence before styling;
4. choose a real/content-led visual world for the lesson;
5. build on Base components and keep one-off composition in the lesson-local CSS;
6. link that local stylesheet from the lesson HTML itself;
7. add only the book-specific assets the task needs;
8. use the definitive filename (`2A.html`, `2B.html`, etc.); the Student's Book compiler discovers it automatically;
9. compare the finished spread with neighboring approved lessons for language load, physical readability and visual weight.

## A1 visual calibration from the Unit 2 review

The author-made Unit 1 spreads remain the reference for visual finish. Unit 2's
2026-10-06 revision demonstrates how to apply that standard without making every
lesson use the same template:

- Give the lesson's real scene or reading/listening feature a clear visual lead.
  Keep crimson for shared lesson navigation and pale pink for canonical grammar
  focus. Editorial features may use their own coordinated palette.
- Make contextual people and task-bearing objects prominent. Crop only when the
  learner's evidence survives; preserve complete person/object distance scenes.
- Keep app chrome subordinate to its readable information and the people using it.
  Check all screen content for clipping, including the lowest fields and controls.
- Use Unit 1's purposeful variety of portrait circles, environmental photographs,
  paper conversations and functional artifacts. Avoid an uninterrupted sequence
  of small rectangular picture panels.
- Whitespace is useful. Add a new image when it models a task or establishes a
  needed scene, rather than filling a gap. Compare the finished two-page spread
  with Unit 1 at the same physical scale before publishing.

## Whole-book editorial redesign preview

The 2026-10-06 author request authorizes a reversible visual overhaul of all
current A1 lessons, 1A through 2D, informed by the supplied Personal Best series.
The preview is isolated on `codex/horizons-editorial-redesign`. The checkpoint
`horizons-before-editorial-redesign-2026-10-06` preserves the preceding book.
Do not treat a preview branch as permission to replace `main`.

This revision keeps the complete teaching content and audio resources while
recomposing every spread. The author's color correction authorizes independent
feature palettes and rejects repeated background boxes. Readings, dialogues,
photo families, response areas and pair models default to open page paper.
The Rivera reading uses green editorial type and a partial sage photo mat;
travel uses blue, work profiles coordinated individual accents, and transport
orange and blue. The photographic opening cutout remains. Grammar focus keeps
its canonical title tab and shell; functional artifacts retain needed structure.
Feature colors and geometry stay lesson-local. The previous preview is preserved
at `horizons-editorial-preview-v1-2026-10-06` as an additional rollback point.

Compare the whole book at print scale. Check source-text and exercise parity,
response affordances, image loading, phone-screen clipping, grammar emphasis,
option typography and every rendered PDF spread before publication. The GitHub
book publisher runs on `main` only; a manually rendered preview branch cannot
publish its compiled artifacts to `main`. PDF photo downsampling uses 300 dpi
and JPEG quality 94 to retain detail in printed crops.

## CSS loading boundary

`Base/shell/a4-shell.css` imports only shared Base components. It must never import a level- or lesson-specific stylesheet.

Each lesson HTML links its own adjacent local stylesheet. This prevents the shared shell from becoming a hidden override registry and lets future books use the same Base cleanly.

## Local Student's Book boundary

The A1 `Student's Book.html` is a **generated standalone file**. It must display correctly when opened directly through `file://` without embedding lesson files in iframes, fetching sibling local files, using cross-frame DOM access or requiring a local server.

`../build/build-students-book.mjs` scans `../../A1/Lessons/` for definitive lesson masters, sorts them naturally, resolves/inlines required CSS, and writes the assembled HTML book. The repository workflow `.github/workflows/build-horizons-a1-student-book.yml` runs automatically when lesson/shared production sources change.

Do not reintroduce a manual lesson manifest. A correctly named lesson master is sufficient for discovery.

The local browser does **not** build the PDF. The workflow generates `../../A1/Student's Book.pdf` from the compiled HTML using the shared A4 print contract, optimizes it, verifies A4 size and exact `.hz-page` parity, and commits it beside the HTML. The floating download button in the HTML is only a local link to that validated sibling PDF.

Do not reintroduce client-side PDF generation with canvas, SVG `foreignObject`, `html2canvas`, `jsPDF`, iframe cloning or browser Print/Save as PDF. Those approaches conflict with reliable `file://` operation and are outside the Student's Book boundary.

### PDF typography/render parity

The production PDF must preserve the typography and layout of the approved HTML as closely as possible. A CSS stack containing `system-ui` is environment-sensitive, so rendering on a different operating system can change font families, weight interpolation, metrics, wrapping and spacing even when the CSS is identical.

For the current A1 pipeline, render the PDF in a Windows Chrome environment compatible with the author's normal Windows browser environment. The renderer must wait for `document.fonts.ready`, image decoding and layout stabilization before capture. Keep true A4 output at 100% scale with print backgrounds and CSS page size honored.

If a future book moves to an explicitly bundled cross-platform font family, the runner may change only after HTML/PDF parity is revalidated. Do not compensate for font-environment drift by locally changing lesson font sizes or weights.

## Repository boundary

- series-wide design rules/components → `Horizons/Base/design-system/`;
- shared page shell → `Horizons/Base/shell/`;
- shared book compiler → `Horizons/Base/build/`;
- book-specific lessons, assets, audio, tests, keys and other resources → that book's folder, such as `Horizons/A1/`;
- lesson-specific CSS → beside its lesson in the book's `Lessons/` folder.

Do not create `production/`, `staging/` or override directories.

## Hard production checks

Across Horizons books:

- numbered exercises stay in one vertical lane;
- shared chrome is not patched differently per lesson;
- important learner text is not shrunk merely to force page fit;
- visual worlds follow lesson content rather than a generic school theme;
- no decorative ghost text or generic card/pill system;
- real-world UI is recognizable and functional rather than generically decorative;
- artificial content-height floors do not trap dead space;
- removed scaffolding is not silently replaced by new answer mechanics;
- reusable rules stay in Base and one-off decisions stay book-local.

For A1 specifically, also enforce the cumulative early-A1 language rule in `GUIDED-DISCOVERY.md`.

Before calling a spread complete, verify source fidelity, exercise order, level-appropriate language load, Guided Discovery evidence, readable type, content economy, functional artifacts, repeated-media crop/centering, natural content height, short-label wrapping, shared chrome, whitespace, content-led imagery and parity with surrounding lessons.
