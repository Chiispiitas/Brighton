# Horizons Asset Policy

This policy applies to all new Student's Book production inside `Horizons/`.

## 1. Visual rule

**Vector illustrations are prohibited.**

Allowed:

- real photography;
- generated raster imagery;
- raster collages/composites;
- screenshots or original UI recreations when functionally appropriate;
- CSS shapes and geometric decoration;
- SVG only for functional icons and simple interface symbols.

Not allowed:

- illustrated vector people;
- flat-vector educational scenes;
- cartoon/vector environments;
- decorative SVG character artwork;
- generic corporate vector illustration packs.

Horizons does **not** use a default school, classroom or `educational` visual theme. Assets should inherit their visual language from the actual subject and setting of the lesson.

## 2. Theme-neutral art direction

Image sourcing and generation should describe the **world being shown**, not the fact that the image will be used in a language coursebook.

A lesson may draw from hospitality, travel, documentary, lifestyle, workplace, sport, food, retail, transport, culture, home life, technology, entertainment, nature, street photography or another appropriate visual world.

Permanent prompt rules:

- do not append `educational style`, `school theme`, `classroom aesthetic`, `student textbook image` or equivalent as a default prompt instruction;
- do not add books, pencils, notebooks, desks, chalkboards, backpacks or classrooms unless they belong naturally in the requested scene;
- describe setting, people, action, mood, lighting, camera position, crop and negative space instead;
- when a lesson genuinely takes place at school, school imagery is allowed because it is the subject, not because it is the house style;
- book consistency should come from layout, crop, color system and typography rather than forcing unrelated images into one theme.

## 3. External images

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
- any edits/crops made.

Do not hotlink production images. Download approved assets into the project asset structure during the relevant production stage.

## 4. Generated raster imagery

Generated imagery is preferred when the composition, action or object set must be exact, for example:

- a hotel guest checking in at a reception desk with usable negative space for editorial copy;
- a bag containing a controlled set of vocabulary objects;
- a lost-and-found counter with required possessions;
- a grocery scene with a specific number of countable/uncountable items;
- a controlled set of people/items for matching or listening tasks;
- a specific real-world interaction that is difficult to source with the required crop.

Generated images should still look like credible photography from the world represented. Do not make them look like classroom posters or teaching materials unless the scene itself requires that.

Generated images must be rasterized for production (`.png`, `.jpg`, or `.webp`).

## 5. Photography preference

Use authentic photography when real-world recognition is important, especially for:

- cities and countries;
- transportation;
- food;
- weather;
- architecture;
- shopping environments;
- tiny homes;
- travel;
- hospitality and services;
- sports and fitness;
- workplaces;
- recognizable public figures where use is appropriate.

Prefer images with clear environmental storytelling over generic posed stock photography.

Avoid watermarked preview images in all final material.

## 6. Prompt construction

Production image prompts should normally specify:

1. the real setting;
2. the person/people or object(s);
3. the action;
4. the photographic language or mood;
5. camera framing and crop needs;
6. useful negative space or subject direction;
7. realism constraints;
8. exclusions such as visible text, logos, watermarks or unwanted school-coded props.

Prompt the image as if commissioning a photographer or art director for that scene. Do not prompt it as `an image for an English lesson` unless that fact materially changes what must be visible.

## 7. Real brands and apps

The syllabus includes real-world contexts such as transport apps, maps/reviews, shopping systems, and social-media-like activities.

Default rule:

- factual references and brand names may be used when pedagogically relevant;
- do not copy commercial screenshots merely for decoration;
- prefer original HTML/CSS recreations of the needed interface concept;
- retain only the visual information necessary for the language task;
- do not imply endorsement or affiliation.

## 8. Functional SVG rule

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
- simple grammar/vocabulary section symbols.

Icons should inherit Horizons colors where practical and remain secondary to content.

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

## 10. Asset naming convention

Recommended pattern:

`HZN_A1_U##_L#_E##_TYPE_##`

Examples:

- `HZN_A1_U02_LA_E01_IMG_01.webp`
- `HZN_A1_U03_LC_E04_ICON_01.svg`
- `HZN_A1_U05_LD_E03_AUD_01.mp3`

The semantic activity ID should remain stable even if page numbers change later.
