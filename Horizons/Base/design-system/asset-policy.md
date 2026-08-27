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

When illustration is pedagogically preferable, use a **classic English-language-coursebook / ELT illustration style** with the visual logic of professionally commissioned ESL materials from roughly the late 1990s through early 2010s.

The most important production rule is that this is **shape-painted editorial illustration, not outlined vector illustration**.

### Rendering grammar

The approved style is:

- flat 2D, highly readable and editorial rather than app-like;
- constructed from **flat adjoining and overlapping color masses**;
- **shape-defined, not line-defined**;
- drawn with **NO contour outlines** around people, limbs, clothing, furniture, hair, architecture or objects;
- separated through color, value, negative space and overlap rather than dark edge strokes;
- similar in surface logic to digitally assembled **gouache or cut-paper shapes**: controlled enough for print, but subtly irregular rather than mathematically perfect;
- based on simplified but believable natural human proportions and clear body language;
- extremely restrained in facial rendering: tiny eyes, a small nose/nose shape and a minimal mouth only when useful;
- built with hair as one or two solid irregular masses rather than strands;
- built with clothing as broad flat shapes, usually with no more than one secondary shadow mass;
- lightly shaded with flat secondary color masses only; no volumetric rendering;
- composed with depth mainly through overlap, scale and placement;
- supported by economical functional backgrounds containing only what is needed to understand the situation;
- colored with a restrained, slightly desaturated printed-coursebook palette such as dusty blue, muted teal, warm ochre, brick red, coral, sage green, cream, beige, charcoal gray, muted brown and soft off-white;
- intentionally asymmetrical or slightly quirky where appropriate, with confident negative space and human-made compositional judgment;
- clear at small print size and focused on one immediately understandable situation.

**ABSOLUTELY NO visible contour outlines.** If an arm meets a shirt, a person meets a chair, or an object sits on a table, distinguish the forms through adjoining color masses, value contrast and overlap, never through a dark traced edge.

Do **not** describe this style as `vector-like` in prompts. That wording tends to produce modern corporate-vector geometry, dark contours and synthetic AI aesthetics. Preferred vocabulary is:

- `flat color-mass illustration`;
- `shape-defined rather than line-defined`;
- `cut-paper / gouache-like construction`;
- `editorial textbook artwork`;
- `subtly irregular human-made edges`.

### Consistency across an image family

Style consistency means repeating the **rendering grammar**, not repeating the same scene.

Across a family, keep consistent:

- edge treatment and absence of outlines;
- anatomy simplification;
- facial restraint;
- color-mass construction;
- shading amount;
- palette character;
- level of detail;
- overall print-era ELT editorial character.

Do **not** lock the same person, room, furniture, pose, camera angle, clothing, composition or object placement unless the task specifically requires a sequential scene. Different images should normally have natural visual variety while still looking as if the same illustrator made them for the same coursebook.

When an approved image is supplied as a style reference, use it to match only its **rendering language** unless the author explicitly asks for scene continuity.

### Reusable style prompt

Use the following as the stable style block, followed by scene-specific instructions:

> Create a professionally commissioned English-language coursebook illustration with a late-1990s / early-2000s editorial textbook aesthetic. Construct the entire illustration from flat overlapping color masses with NO contour outlines. Do not trace people, objects, clothing, furniture, hair or architecture with black, brown, navy or colored linework. Shapes must be separated by differences in color, value and overlap rather than outlines. The artwork should resemble digitally assembled gouache or cut-paper shapes: clean enough for textbook reproduction, but with subtly irregular, human-made edges rather than mathematically perfect geometry. Human anatomy should be simplified yet believable, with relatively natural proportions. Faces should be extremely restrained: tiny eyes, a small nose or nose shape and a minimal mouth only when needed. Hair should appear as one or two solid irregular color masses rather than individual strands. Clothing should use broad flat shapes with perhaps one secondary shadow shape. Hands should be simplified and readable, not anatomically over-rendered. Use very limited flat shading: a base color and, when needed, one slightly darker or lighter color mass. Use a restrained, slightly desaturated printed-coursebook palette: dusty blue, muted teal, warm ochre, brick red, coral, sage green, cream, beige, charcoal gray, muted brown and soft off-white. Backgrounds should be economical and intentionally simplified, with only enough architecture, furniture or environmental detail to establish the situation. Use broad flat planes, confident negative space and a deliberately human editorial composition. The finished artwork must feel purpose-made for a professional language coursebook, not like modern corporate vector illustration or generic AI art. ABSOLUTELY NO visible contour outlines.

Required final reinforcement for individual prompts:

> Important: render every boundary through adjoining flat color shapes, never through an outline. If an arm touches a shirt, a person touches a chair, or an object sits on a table, distinguish them through contrasting color masses and overlap, not dark contour strokes.

Negative guidance:

> Do not use thick outlines, thin outlines, dark edge strokes, comic linework, ink drawing, cel-shading outlines, modern corporate startup illustration, generic flat-vector people, rounded app mascots, oversized heads, anime, Disney-like characters, children's-book cartooning, 3D rendering, photorealism, painterly texture, glossy gradients, smooth plastic surfaces, perfect geometric vector shapes, cinematic lighting, excessive facial detail, individual hair strands, dramatic realistic shadows or generic AI smiles.

The key distinction is **intentional simplification through color masses**. The image should look as though a human editorial illustrator deliberately removed everything that does not help the learner understand the target meaning.

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

For approved illustration, use the stable ELT style block from Section 3 and then specify only the scene, action, required semantic evidence, framing/aspect ratio and exclusions. Do not add scene-locking language merely to enforce style consistency.

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
