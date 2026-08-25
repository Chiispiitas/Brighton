# Horizons Asset Policy

This policy applies to all new Student's Book production inside `Horizons/`.

## 1. Visual rule

**Vector illustrations are prohibited.**

Allowed:

- real photography;
- generated raster imagery;
- raster collages/composites;
- screenshots or original UI recreations when pedagogically appropriate;
- CSS shapes and geometric decoration;
- SVG only for functional icons and simple interface symbols.

Not allowed:

- illustrated vector people;
- flat-vector educational scenes;
- cartoon/vector environments;
- decorative SVG character artwork;
- generic corporate vector illustration packs.

## 2. External images

Only assets that are free for the intended publication/use may be used.

Before an external image becomes a production asset, record:

- asset ID;
- lesson/activity ID;
- local filename;
- creator/photographer when supplied;
- source page;
- license/use terms;
- attribution requirement;
- date acquired;
- any edits/crops made;
- intended crop/composition;
- alt text.

Do not hotlink production images. Download approved assets into the project asset structure during the relevant production stage.

## 3. Generated raster imagery

Generated imagery is preferred when the pedagogical composition must be exact, for example:

- a bag containing a controlled set of vocabulary objects;
- a lost-and-found counter with required possessions;
- a grocery scene with a specific number of countable/uncountable items;
- a controlled set of people/items for matching or listening tasks.

Generated images must be rasterized for production (`.png`, `.jpg`, or `.webp`).

## 4. Photography preference

Use authentic photography when real-world recognition is important, especially for:

- cities and countries;
- transportation;
- food;
- weather;
- architecture;
- shopping environments;
- tiny homes;
- travel;
- recognizable public figures where use is appropriate.

Avoid watermarked preview images in all final material.

Follow `image-direction.md` for crop, gaze, negative-space, overlay and inset-photo rules.

## 5. Print quality

- Target **300 ppi effective resolution at final print size** where practical.
- Never knowingly ship a visibly low-resolution image.
- Preserve the original source file separately from any production export.
- Prefer CSS `object-fit` / `object-position` to destructive cropping so art direction remains editable.
- Final image QA should be performed at actual A4 print size, not only zoomed on screen.
- Use `.hz-qa-lowres` during layout review when an asset still needs replacement.

## 6. Real brands and apps

The syllabus includes real-world contexts such as transport apps, maps/reviews, shopping systems, and social-media-like activities.

Default rule:

- factual references and brand names may be used when pedagogically relevant;
- do not copy commercial screenshots merely for decoration;
- prefer original HTML/CSS recreations of the needed interface concept;
- retain only the visual information necessary for the language task;
- do not imply endorsement or affiliation.

## 7. Functional SVG rule

SVG is allowed for small functional symbols such as:

- audio/headphones;
- play/pause;
- map pin;
- phone;
- pencil;
- star;
- arrow/chevron;
- calendar;
- QR/scanner indicator;
- reading/writing/speaking task signals;
- pair/group work;
- simple grammar/vocabulary/pronunciation symbols.

Icons should inherit Horizons colors where practical and remain secondary to content.

The shared functional sprite lives at:

`assets/icons/horizons-icons.svg`

Do not add decorative character/scene artwork to the sprite.

## 8. Development placeholders

Placeholders must describe the **intended final composition**, not merely say “photo.”

Good:

`Toronto skyline + traveler · wide hero · subject right · text-safe space left`

Bad:

`Image here`

This allows sourcing/generation to follow the pedagogy and page design.

## 9. Audio policy

Planned audio production:

- ElevenLabs;
- American English voices by default;
- clear natural delivery suitable for A1 learners;
- no exaggeratedly slow speech unless the activity explicitly requires it;
- multiple voices when a dialogue needs distinct speakers;
- each audio item receives a permanent internal ID and a printed track number;
- printed Student's Book activities may include a QR code for direct access.

For each audio asset, retain:

- internal audio ID;
- printed track number;
- unit/lesson/activity ID;
- script;
- speaker labels;
- voice/voice ID;
- generation settings relevant to reproducibility;
- generation date;
- final filename.

## 10. QR policy

- QR codes must link to stable approved audio/digital destinations.
- Maintain enough white quiet zone for reliable scanning.
- Test from a physical A4 print before publication.
- Do not place a QR too close to trim, page edge, fold/gutter or a high-contrast photograph.
- Printed track number must remain visible even when QR access is offered.

## 11. Asset naming convention

Recommended pattern:

`HZN_A1_U##_L#_E##_TYPE_##`

Examples:

- `HZN_A1_U02_LA_E01_IMG_01.webp`
- `HZN_A1_U03_LC_E04_ICON_01.svg`
- `HZN_A1_U05_LD_E03_AUD_01.mp3`

The semantic activity ID should remain stable even if page numbers change later.
