# Horizons A1 — Asset Policy

This file governs production assets inside `Horizons/`. Visual/art-direction principles come from `CANONICAL-STYLE.md`.

## 1. Allowed / prohibited visuals

Allowed:

- real photography;
- generated raster imagery;
- raster collages/composites;
- screenshots or original UI recreations when functionally appropriate;
- CSS geometry;
- SVG only for small functional icons/interface symbols.

Prohibited:

- decorative vector people/scenes;
- flat-vector educational environments;
- decorative SVG character artwork;
- generic corporate/education illustration packs;
- watermarked preview images in final production.

Assets follow the lesson's actual visual world. Do not add school-coded props or `educational style` prompting unless the lesson itself requires them.

## 2. External images

Only use assets permitted for the intended publication/use.

For every external production asset record:

- asset ID;
- lesson/activity ID;
- local filename;
- creator/photographer when supplied;
- source page;
- license/use terms;
- attribution requirement;
- acquisition date;
- edits/crops.

Do not hotlink production images. Store approved assets locally under `Images/`.

## 3. Generated raster imagery

Use generated imagery when the task needs exact objects, action, interaction, framing or negative space that is difficult to source reliably.

Generated images must look like credible photography from the represented world and must be saved as raster (`.png`, `.jpg`, `.webp`) for production.

## 4. Prompt requirements

A production prompt should specify only what materially affects the asset:

1. real setting;
2. people/objects;
3. action;
4. photographic language/mood;
5. framing/crop;
6. subject direction or useful negative space;
7. realism constraints;
8. exclusions such as readable text, logos, watermarks or unwanted props.

Prompt the scene as a photographer/art director commission, not as `an image for an English lesson`.

Image-generation prompts and temporary art-direction notes stay outside the repository unless the author explicitly asks to save them.

## 5. Real brands and apps

Brand names may appear when pedagogically relevant.

Do not copy commercial interfaces merely for decoration. Prefer original HTML/CSS recreations containing only the information needed for the language task, and do not imply endorsement/affiliation.

## 6. Functional SVG

SVG is limited to small functional symbols such as audio, play/pause, map pins, phone, arrows, calendar, QR/scanner cues and simple interface/section icons.

Icons remain secondary to learner content and should inherit Horizons colors where practical.

## 7. Audio

Planned production defaults:

- American English voices;
- clear natural A1-appropriate delivery;
- multiple voices where dialogue requires distinct speakers;
- permanent internal audio ID plus printed track number;
- QR access may be added to printed activities.

For each audio asset retain:

- internal audio ID;
- printed track number;
- unit/lesson/activity ID;
- script and speaker labels;
- voice/voice ID;
- relevant generation settings;
- generation date;
- final filename.

## 8. Naming

Recommended stable pattern:

`HZN_A1_U##_L#_E##_TYPE_##`

Examples:

- `HZN_A1_U02_LA_E01_IMG_01.webp`
- `HZN_A1_U03_LC_E04_ICON_01.svg`
- `HZN_A1_U05_LD_E03_AUD_01.mp3`

The activity ID should remain stable even if page numbers change.
