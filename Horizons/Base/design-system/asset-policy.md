# Horizons A1 — Asset Policy

This file governs production assets inside `Horizons/`. Visual/art-direction principles come from `CANONICAL-STYLE.md`.

## 1. Allowed / prohibited visuals

Allowed:

- real photography;
- generated realistic raster imagery;
- generated raster illustration in the approved classic ELT/coursebook style when pedagogically justified;
- raster collages/composites;
- screenshots or original UI recreations when functionally appropriate;
- CSS geometry;
- SVG only for small functional icons/interface symbols.

Prohibited:

- decorative vector people/scenes added only to fill space;
- generic corporate/startup illustration packs;
- generic `educational` clip-art or classroom-themed illustration packs;
- decorative SVG character artwork;
- glossy, synthetic AI-looking illustration that does not match the approved ELT style;
- watermarked preview images in final production.

Assets follow the lesson's actual visual world. Do not add school-coded props or `educational style` prompting unless the lesson itself requires them.

## 2. Realism remains mandatory

Horizons is **photographic rather than illustration-led**. The approval of drawn illustration does not replace the book's realistic visual language.

Realistic photography or realistic generated raster imagery **must continue to be used throughout the book**. Use realism when the learner benefits from seeing a believable person, place, atmosphere, authentic situation, real-world environment or contextual scene. Major contextual imagery should normally remain realistic unless there is a specific pedagogical reason not to.

Illustration is a controlled alternative for individual images or image families. It is especially appropriate when:

- the language point is extremely basic and concrete;
- a simplified drawing communicates the concept faster than a photograph;
- photographic detail would create ambiguity or distract from the exact distinction being taught;
- the learner needs to identify one action, object, adjective, quantity, direction or spatial relationship immediately;
- a repeated image family benefits from highly controlled visual equivalence.

A lesson may therefore mix realistic imagery with illustration. Do not convert the coursebook into an illustration-led book merely because illustration is permitted.

## 3. Approved illustration style

When illustration is pedagogically preferable, use a **classic English-language-coursebook / ELT illustration style**, similar in visual logic to professionally commissioned ESL materials from roughly the late 1990s through early 2010s.

The style is:

- flat 2D and highly readable;
- simple, diagrammatic and purposeful rather than decorative;
- stylized but not childish;
- based on simplified natural human proportions and clear body language;
- built from clean vector-like shapes with soft or gently irregular edges;
- minimal in facial detail: small eyes, simple noses and mouths, solid simplified hair shapes;
- restrained in detail so the teaching point is obvious immediately;
- lightly shaded with one simple darker tone at most;
- composed with depth mainly through overlap, scale and placement rather than realistic rendering;
- set against minimal functional backgrounds containing only the environmental information needed to understand the scene;
- colored with a muted, friendly palette such as dusty blue, teal, muted orange, coral, beige, cream, soft gray and gentle green;
- uncluttered, balanced and framed like a small professionally illustrated coursebook panel;
- intentionally human-designed in its simplification and visual hierarchy.

Avoid:

- photorealistic rendering inside an illustration;
- painterly or sketchbook treatment;
- 3D rendering;
- glossy corporate-vector or modern startup-character aesthetics;
- anime influence;
- thick comic outlines;
- exaggerated cartoon proportions;
- oversized expressive faces;
- neon or highly saturated palettes;
- gradients, cinematic lighting or dramatic realistic shadows;
- excessive texture;
- random decorative detail;
- the polished synthetic look commonly associated with generic AI illustration.

The key distinction is **intentional simplification**. The image should look as though an illustrator deliberately removed everything that does not help the learner understand the target meaning.

### Reusable style prompt

When generating this kind of illustration, the following may be used as the stable style block and then followed by the scene-specific instructions:

> Create an illustration in the style of a classic English language coursebook image. Use a clean, flat 2D educational illustration style typical of professionally commissioned late-1990s to early-2010s ESL/ELT textbooks. The artwork should be simple, clear and highly readable, designed to communicate meaning instantly. Use stylized but not childish human figures, with simplified natural anatomy, minimal facial features, solid simplified hair shapes and clear body language. Build the image with flat vector-like shapes, soft clean edges and very limited shading. Use a muted, friendly palette with dusty blues, teals, muted oranges, coral reds, beige, cream, soft gray and gentle greens. Keep shadows subtle and flat, with no realistic rendering, texture-heavy surfaces or dramatic lighting. Backgrounds should be minimal and functional, showing only the essential environmental elements needed to explain the scene. The composition should be uncluttered, balanced and immediately understandable, like a professionally illustrated panel from an English-language coursebook. The image should feel human-designed, restrained and purposeful, not glossy, trendy, childish or obviously AI-generated.

Negative guidance:

> Do not use photorealism, painterly rendering, 3D rendering, glossy corporate-vector style, modern startup illustration style, cartoon exaggeration, anime influence, thick outlines, hand-drawn sketchiness, heavy texture, cinematic lighting, dramatic shadows, saturated neon colors, oversized expressive faces or decorative visual clutter. Avoid the polished synthetic look common in generic AI-generated illustrations.

## 4. External images

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

## 5. Generated raster imagery

Use generated imagery when the task needs exact objects, action, interaction, framing or negative space that is difficult to source reliably.

Generated production imagery must be saved as raster (`.png`, `.jpg`, `.webp`). It may be either:

- credible realistic imagery from the represented world; or
- approved classic ELT illustration when simplification materially improves comprehension.

Do not choose illustration simply because it is easier to generate. Choose it because the teaching point benefits from drawing rather than photographic complexity.

## 6. Prompt requirements

For realistic production imagery, specify only what materially affects the asset:

1. real setting;
2. people/objects;
3. action;
4. photographic language/mood;
5. framing/crop;
6. subject direction or useful negative space;
7. realism constraints;
8. exclusions such as readable text, logos, watermarks or unwanted props.

Prompt a realistic scene as a photographer/art director commission, not as `an image for an English lesson`.

For approved illustration, use the stable ELT style block from Section 3 and then specify only the scene, action, required semantic evidence, framing/aspect ratio and exclusions.

Image-generation prompts and temporary art-direction notes stay outside the repository unless the author explicitly asks to save them. The reusable series-wide style specification above is part of the design system rather than a lesson-specific production prompt.

## 7. Real brands and apps

Brand names may appear when pedagogically relevant.

Do not copy commercial interfaces merely for decoration. Prefer original HTML/CSS recreations containing only the information needed for the language task, and do not imply endorsement/affiliation.

## 8. Functional SVG

SVG is limited to small functional symbols such as audio, play/pause, map pins, phone, arrows, calendar, QR/scanner cues and simple interface/section icons.

Icons remain secondary to learner content and should inherit Horizons colors where practical.

## 9. Audio

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

## 10. Naming

Recommended stable pattern:

`HZN_A1_U##_L#_E##_TYPE_##`

Examples:

- `HZN_A1_U02_LA_E01_IMG_01.webp`
- `HZN_A1_U03_LC_E04_ICON_01.svg`
- `HZN_A1_U05_LD_E03_AUD_01.mp3`

The activity ID should remain stable even if page numbers change.
