# Horizons — semantic component contract

Current edition, 31 October 2026. Design is governed by CANONICAL-STYLE.md and editorial-edition.css; learning by GUIDED-DISCOVERY.md; provenance by asset-policy.md.

- One `.hz-page` is one A4 page with a unique consecutive `data-page`; footer agrees. Keep learner material inside the printable content region.
- `.hz-lesson-header` contains a compact `.hz-lesson-tab`, sentence-case title and a concise useful outcome in `.hz-objectives`. Keep local source headings separate.
- `.hz-continuation` is the small continued-lesson locator; the first content group reserves 12mm. Avoid giant empty top areas and overlapping copy.
- `.hz-exercise` has a real sequential visible number, instruction and body. Subparts may use letters; avoid decimal numbering such as 4.1 as a whole exercise. Numeric audio labels identify tracks, not exercise numbers.
- Reading order must be apparent in DOM and print. Single lanes, purposeful internal grids or clear two-column sections are permitted. If using columns, read down the left then right or explicitly group source/response; no interleaved numbering.
- `.hz-task-text` and explicit task-role roots use 10pt. `.hz-exercise__instruction` uses 9.2pt. `.hz-focus-box__body` uses 10pt; headings/changes remain semantic. Source features may have appropriate genre typography.
- `.hz-focus-box` groups one real concept or communication tool. Its light paper, thin crimson edge and open label are subordinate to learner examples. Do not use it as generic decoration.
- `.hz-word-bank` holds actual response choices/input; 9.5pt regular text. `.hz-answer-option` is an ordinary italic selectable choice; do not encode correct choices in color or weight.
- `.hz-new-words` labels explicit fresh input. Do not inject automatic vocabulary wrappers or blanket bolding.
- `.hz-go-to` names a stable future practice destination topic without fake pagination or visible development placeholders. Use `data-reference-topic` when helpful. Destinations excluded from the current core-book scope remain registered in the audit.
- `.hz-extra-practice` is one useful extension connected to the lesson outcome. Use 8.5pt prompt, with sufficient separation and no redundant location/footer labels.
- `.hz-audio-badge` contains an existing track label. The viewer creates an accessible play/pause button. Controls work on published static pages and disappear in print without changing page geometry.
- Recurring show markup and `horizons-on-air.css` preserve the recognizable main/secondary identity. Coverage is declared in book-audit.json and checked against actual linked recordings.
- Pictures use accurate alt text, known native dimensions, meaningful composition and active provenance. Simple diagrams/labels are live SVG/HTML. Do not stretch faces or create raster typography for ordinary learner instructions.
- Writing lines are normally7mm; factual fields normally6mm. A short gap is not a substitute for open composition in freer writing.
- End credits follow all lesson/review masters and are repaginated from the actual last page. The compiler and PDF export use identical current source styles.

Acceptance requires source/key/audio alignment, actual font roles, decoded imagery/backgrounds, ordered exercises/pages, no clipped copy or image evidence, independent saved-PDF inspection and live media verification. Preserve a versioned baseline; audits are evidence records, not automatic permission to declare quality.
