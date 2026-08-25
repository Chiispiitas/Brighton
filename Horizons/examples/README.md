# Horizons examples

The `examples/` folder contains complementary A4 showcases for the current Stage 3 design plus one internal compatibility lab.

## Stage 2 — photography and overlays

`stage-2-showcase.html` demonstrates dynamic editorial media treatments:

1. **3A — What’s your routine?**: full-photo lead with title/text overlay, time annotation, photo index, visual matching strip and timeline.
2. **3C — Where do you go?**: large neighborhood photo with an overlapping lower-right copy block, review layout and two-column questions.
3. **5A — What are you wearing?**: dominant thrift-store image, two inset detail crops and a pull quote overlapping the photo edge.
4. **8B — It’s so cold!**: weather-news photo with a lower-third editorial band, four-image matching strip and compact advice facts.

## Stage 3 — full-page text and shape-led composition

`stage-3-shape-showcase.html` pushes the production system further toward magazine/coursebook art direction:

1. **2C — Meet my family!**: large interview feature sheet with oversized title, substantial reading text, geometric background shapes, portrait crops and a pull quote.
2. **3B — Weekdays or weekends?**: full article masthead with a strong color field, overlapping hero image, two-column reading and vertically labeled weekday/weekend modules.
3. **6B — My dream home**: floor-plan-inspired composition, folded-corner vocabulary note and a speech-bubble question cloud.
4. **8A — Let’s go to Toronto!**: poster-style travel feature with oversized background numeral, anchored photo, large white-on-color title and a process strip.

## Stage 3 — internal legacy structure reproduction

`stage-3-legacy-structure-lab.html` is **not a production design showcase**. It is an internal compatibility test proving that semantic HTML/CSS can reproduce representative structures extracted from the frozen Student’s Book without editing those pages.

The four test pages cover:

1. legacy lesson header, angled lesson tab, objectives, triangular exercise markers, image-led vocabulary, `NEW WORDS`, audio badge, form structure and a Vocabulary Practice cross-reference;
2. Grammar and Pronunciation focus boxes, Grammar Reference cross-reference, internal two-column practice, writing lines and Extra Practice;
3. pale reading/profile panel, selective target-language highlighting, true/false mechanics, listening table, simplified real-world UI and partner-response line;
4. representative Vocabulary Practice and Grammar Reference back-of-book structures.

The compatibility lab loads `../design-system/legacy-compat.css` explicitly. That stylesheet is **not imported by the production A4 shell**, so the current independent Stage 3 visual language remains unchanged.

## What the showcases prove

Every numbered exercise still flows in one vertical sequence. Visual variety comes from layouts **inside** each exercise rather than by placing exercises beside one another.

The current production design vocabulary includes:

- one dominant unit color;
- neutral typography;
- substantial white space;
- large raster-photo areas;
- simple exercise numerals;
- full-page and near-full-page reading treatments;
- oversized typography used as composition;
- large CSS geometric fields and clipped panels;
- circles, angled cuts, folded corners and speech-bubble shapes;
- photo overlays and crop-driven composition;
- controlled text/image overlap;
- detail-photo insets and collages;
- pull quotes crossing image edges;
- lower-third information bands;
- numbered/lettered photo strips;
- two- and three-column internal question grids;
- process/timeline strips;
- bespoke page CSS instead of forcing every layout into the same template.

## Shape rule

Shapes must support hierarchy, reading flow or task meaning. They are not filler decoration. Large shapes are preferred over many tiny decorative objects.

CSS shapes may use circles, polygons, clipped corners, bands, folds and speech-bubble geometry. Vector illustrations remain prohibited; SVG is still reserved for functional icons only.

## Overlay rule

Photography may carry text directly when the image composition supports it. A dark gradient/scrim is allowed only to preserve text legibility over a photograph; decorative gradients should not be used as general page furniture.

Development placeholders use the same intended crop, overlay and overlap geometry as final raster photography so layout decisions survive asset replacement.

The screenshots used as references informed only broad editorial principles such as hierarchy, skill signaling, varied media scale, full-page reading features and activity rhythm. Their exact composition, colors, tabs, icons, typography and decorative structure are not reproduced in the active production design.

All examples are **layout or compatibility demonstrations only**. They do not replace, rewrite or modify pre-existing Student's Book pages and do not change the locked syllabus.
