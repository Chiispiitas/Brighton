# Horizons image production guide

Latest environment rule (5 November): do not generate or display whole environment panels, landscape chunks or precomposed neighborhoods for the overworld. Retire the large v32 scenery panels. Use a sparse reusable tile set: individual complete trees and small bush/flower/grass tiles, independently placed with open space. Single native building landmarks may remain individual sprites. Keep the path 30% shorter (440px to 308px). Latest placement correction: player portrait ABOVE the island/building, activity details BELOW. No added headings/taglines/instruction messages; native vertical wheel and hold/swipe controls remain.

This is the mandatory production process for website imagery. It applies to new images, edits, extra cast poses, avatar items, vocabulary pictures, scenes, icons and decorative accents. It accompanies the [website process audit](../APP-AUDIT.md).

## 1 The seven reference files

The reference pack contains exactly seven PNG sheets, assembled from current native ImageGen artwork through the actual website renderer. The sheets are references, not replacements for the original source PNGs. Their labels, grids and neutral backgrounds are not artwork to reproduce.

| ID | Mandatory reference file | What it establishes |
| --- | --- | --- |
| R01 | [Brand and rendering](image-references/01-brand.png) | Horizons wordmark, M PLUS Rounded1c, palette and simple interface shapes |
| R02 | [Recurring cast](image-references/02-cast.png) | Pico, Mina, Alex and Jo; identity, proportions and coherent complete poses |
| R03 | [Avatar bases](image-references/03-avatar-bases.png) | Rounded-square faces, both internal bases, six skin tones and connected bust |
| R04 | [Hairstyles](image-references/04-hairstyles.png) | Twelve complete hair silhouettes, face openings and registration |
| R05 | [Wardrobe](image-references/05-wardrobe.png) | Ten garments, correct necklines, coherent shoulders and paired jacket lapels |
| R06 | [Accessories and colors](image-references/06-accessories-and-colors.png) | Eyewear, pins, hair colors and portrait backgrounds |
| R07 | [Scenes vocabulary and UI](image-references/07-scenes-vocabulary-ui.png) | Topic pictures, environment and native UI objects |

[reference-pack.json](image-references/reference-pack.json) records the exact PNG hashes, source hashes and source commit. Rebuild through tools/build-image-reference-pack.mjs after approved source changes, inspect all affected sheets, and update the manifest. Do not replace the pack with whichever generated picture happens to be most recent.

The sheets establish approved identities and geometry. Residual shading, glow, alpha fringes or other legacy defects do not override the flatness and quality rules. Never feed rejected torn-fabric examples or obsolete articulated characters as positive style references.

## 2 Required inputs before every ImageGen call

Run tools/check-image-brief.py on a saved brief before invoking generation. A written filename in the prompt is not an attached image. Pass the returned input_paths as actual referenced_image_paths to the built-in ImageGen tool. Label each input's role in the prompt.

**The maximum is seven image inputs in total, including edit targets, supporting inserts and reference sheets.** Never attach seven reference sheets plus an eighth target. Do not hide extra inputs in conversation-image selection. Use local paths for the complete selected set and omit num_last_images_to_include.

Every call requires R01 and its domain's references:

| Brief kind | Mandatory reference IDs |
| --- | --- |
| cast | R01, R02, R07 |
| avatar | R01, R03, R04, R05, R06 |
| hair | R01, R03, R04, R06 |
| clothing | R01, R03, R05, R06 |
| accessory | R01, R03, R04, R06 |
| vocabulary | R01, R02, R07 |
| scene | R01, R02, R07 |
| ui | R01, R06, R07 |

Additional sheets may be attached within the seven-input cap. For a new broad concept, attaching all seven is the default. For a narrow task, the mandatory domain subset plus the actual target is usually clearer. A cast-containing vocabulary/scene picture must retain R02. A new avatar outfit must retain the actual face/body reference, not just a clothing sample.

For an edit, attach the exact current native target as an input, in addition to the domain references. Maximum target count is whatever fits after those references. Split a larger change into sequential edits rather than dropping required references or exceeding the limit.

If a required file is missing, stale or cannot be attached, stop that image call and repair the pack. Do not generate from memory, substitute an old animation sheet or claim consistency without the inputs.

## 3 Brief and preflight

Create one brief per distinct deliverable. The brief includes:

- Stable asset ID, intended website location and brief kind.
- New generation or edit intent; exact target path(s) for an edit.
- Reference IDs and their roles.
- Subject and meaningful teaching/interface purpose.
- Composition: complete pose or bust, orientation, canvas, transparent margins, neck/eye anchors, crop and intended display sizes.
- Invariants: identity, silhouette, palette, clothing, pose or unrelated atlas cells that must remain unchanged.
- The one requested change, if editing.
- Required alpha/background behavior and style exclusions.
- Output filename, integration mapping and acceptance checklist.

A valid clothing-edit brief can contain these fields:

    {
      "asset_id": "explorer-jacket-lapel-repair",
      "kind": "clothing",
      "intent": "edit",
      "reference_ids": ["R01", "R03", "R05", "R06"],
      "target_paths": ["assets/art/avatar-static-clothes-v1.png"],
      "prompt": "Repair only the missing right lower lapel. Preserve the garment identity, orange shirt, badge and neckline."
    }

Run from Horizons/App:

    python tools/check-image-brief.py path/to/brief.json

The checker verifies required IDs, actual files, pinned hashes, current source hashes, edit-target existence, duplicate paths and the total input count. It prints the ordered list of absolute image paths to attach. It cannot prove that a later tool call actually attached them: the generation record must capture the exact tool inputs too. Never describe this repository check as a platform-wide enforcement mechanism.

## 4 Prompt contract

Use the built-in ImageGen tool. A model/API/CLI fallback is a separate explicit choice; do not silently switch models after a failure.

Structure each prompt so the model can distinguish identity references from the edit target:

    Asset type: [website location and brief kind]
    Inputs:
    Image 1 R01: visual identity reference, not an edit target.
    Image 2 R03: head, proportions and registration reference.
    Image 3 R05: garment family and neckline reference.
    Image 4 R06: accessories/color behavior reference.
    Image 5: exact native garment to edit.
    Change: [one precise change]
    Preserve: [explicit invariants]
    Framing: [view, aspect, complete silhouette, margins, anchors]
    Style: flat filled geometric shapes, native raster output.
    Background: [true alpha, or deliberately opaque neutral background]
    Exclude: outlines, borders, shadows, glow, gradients, modeled lighting,
             texture, detached parts, extra limbs, labels and slogans.

For new cast/scene artwork, specify the exact recurring character and a useful complete pose. For an avatar item, specify no head/skin/hands unless those are actually part of the requested deliverable. Do not ask a clothing overlay to become a full person.

Preserve the actual Horizons wordmark as a native/text asset; never ask ImageGen to redesign its typography. Keep instructions and exercise text in HTML. Generate text inside an image only where it is an intentional, reviewed object detail; it must not compromise readability, accessibility or later editing.

## 5 Production stages

1. Inspect the target locally before an edit. Confirm the defect is in the source, the crop or the renderer; fix the responsible layer.
2. Validate the brief and attach the checked image paths, within seven total.
3. Generate one distinct asset or variant per call. Prefer simple complete sprites over dense sheets that make registration ambiguous.
4. Inspect the native result before copying it into active mappings. A successful tool response is not visual approval.
5. Check true alpha against white, warm paper and a darker surface. Look for translucent fabric, colored fringes, glow and erased interior regions.
6. Keep solid fabric and skin opaque. Transparency belongs outside the silhouette and in intentional openings.
7. If transparent generation repeatedly damages solid regions, change the production method: generate a clean opaque neutral-backed source and make a separate extraction, or generate a narrow native overlay. Revalidate each call's references and targets. Do not keep retrying the identical failing prompt.
8. For the jacket repair, native collar-only artwork was integrated over the untouched garment. This preserved the body after complete transparent-shirt attempts introduced holes. Treat this as a narrow compositing solution, not permission to ignore bad alpha.
9. Save the selected native PNG in the repository under a versioned filename. Preserve original generated bytes and alpha. Keep rejected outputs out of active mappings.
10. Update renderer metadata and option thumbnails together. A correct editor thumbnail with a wrong composed avatar is a failed integration.

Uniform cropping/scaling, registration, approved native overlays and supported UI recoloring are production integration. Do not hand-paint missing anatomy with CSS/SVG/canvas, stretch a torso to fit, replace generated artwork with vectors, or threshold away useful native edges. Reference-sheet assembly is mechanical presentation of existing artwork, not a source of newly drawn characters.

## 6 Asset-specific acceptance

### Cast

Identity matches R02: face, hair/fur, two gentle eyebrows for Pico, characteristic clothes and satchel. Expression is welcoming. Neck, shoulders, elbows, wrists, hips and feet are connected before integration. Props are supported by real grips. Pose fits its reading/listening/travel/task purpose. No idle animation rig is introduced.

### Avatar

Match R03 geometry rather than inventing a new face style. Keep eyes, ears, chin and neck registered. Preserve both bases, six skins and saved IDs; hide the base selector in the UI.

Hair follows R04: no face covering, empty openings remain alpha, and ponytails/braids stay complete. Garments follow R05 and meet the neck below the chin. Lapels, collars and openings are complete. Eyewear follows measured eye centers, with transparent lenses and uniform scale. Pins stay within the bust.

Inspect full-size and small busts with relevant hair, skin, clothes and eyewear combinations. The body ends along the round portrait background; no rectangular floating hem or blank crescent. Hair must not be sacrificed to fix the lower crop. Saved hair-color/background behavior must remain intact.

### Vocabulary, scene and UI artwork

The image must clarify the taught word or situation. Avoid generic decorations that do no teaching work. Keep a suitable readable silhouette at the actual slot size. Do not repeat the same jacket/person/object across activities where distinction matters. UI accents remain secondary to text. A sparkle may appear briefly after an option change; it must not become a looping decoration.

## 7 Provenance and review record

For every selected asset, record:

- Exact prompt, tool/mode, generation intent and transparency setting.
- Exact ordered image inputs, roles, reference IDs and hashes; include edit targets.
- Native generated path, repository copy, dimensions, color mode, alpha range and SHA-256.
- Source atlas/frame and portrait placement, if applicable.
- Integration locations, stable IDs and thumbnails affected.
- Rejected attempts and concrete rejection reason.
- Browser screenshots at actual sizes, visual verdict, structural checks and reviewer/source revision.
- Hosted file-byte parity and cache verification when released.

Store provenance beside the artwork. Never record credentials, real learner profiles or private codes. Do not call an older asset compliant with this new seven-reference process retroactively; its existing provenance remains historical. New calls must meet this guide.

## 8 Release gate

Reject an asset for missing mandatory references, more than seven image inputs, changed identity, hostile expression, disconnected parts, wrong proportion, bad alpha, clipping, stretching, wrong registration, unreadable text, unwanted effects or a failed actual-page render.

The final approved result must be inspected in the real website, not only on a contact sheet. Where practical, obtain a second visual review; when unavailable, perform a separate inspection after integration and record the reviewer and limits accurately. Do not invent an independent reviewer.

Publish through the website process audit. Keep a reversible baseline and verify actual hosted native bytes. Updating this guide or a reference sheet alone does not approve new artwork.

## Scoped animation exception

The user reopened animation for Unit 1 banner Pico only. New parts still require this preflight and actual references. The separate ANIMATION-AUDIT.md governs reconstruction-first acceptance, mechanical masking/registration, motion, fallback, independent review and release. This does not authorize old rig reuse or motion elsewhere.

## Overworld imagery

R07 now includes the selected Unit 1 environments, building landmarks and wildlife cutouts. The map theme/production records are in OVERWORLD.md and docs/overworld/production-record.json. New environment art uses the same mandatory scene references and seven-total input cap. If transparent generation erases walkable ground, reject it and change to an intentionally opaque scene rather than keeping a hole or repeatedly retrying the same alpha approach. Native outputs remain untouched; atlas sprites use recorded mechanical alpha selection/crops.

## Modular overworld production

For environment decoration, generate complete isolated reusable tiles, never a whole landscape or district panel. Plan a small equal-cell atlas with generous margins (or independent tiles), a transparent/clean removable background, and only the specific tree/plant objects needed. Assemble sparse placements in the app; keep the route and portraits clear. A tile set does not justify baking terrain, paths, buildings or connected foreground into a single image. Individual building/activity sprites remain separate. Existing pedagogical illustrations are not permission to generate overworld scenery panels.

The current six-piece plant atlas used the built-in ImageGen tool, preflighted R01/R02/R07 (three inputs); a glow-defective first output was rejected. Its exact target plus those references (four inputs total) were attached for an opaque background repair. tools/prepare-overworld-tiles.py performs only documented color-key alpha extraction and per-cell cropping. Native originals, exact prompts, actual input paths/hashes and archived reference PNGs are in docs/overworld-tiles/production-record.json. Review on white/paper/dark backgrounds and at actual map sizes; review portrait/details clearance across all islands and mobile/desktop widths.
