# Horizons — editorial standard

Effective 31 October 2026. This shared design standard governs every Horizons level. The current implementation is the completed A1 Units 1–8; the author delegates editorial authority, including the right to replace earlier cosmetic instructions. This standard supersedes conflicting historical rules. Earlier A1 evidence and rejected designs are archived in `../../A1/Audit archive/2026-10-31-before-editorial/`; they are history, not active acceptance gates.

## Purpose and identity

A Horizons coursebook should make a learner want to look, understand what to do, notice useful language and use it for an actual purpose. Warmth, imaginative visual teaching and clear editorial craft work together. Horizons retains crimson navigation, strong sans-serif titles, near-white A4 paper, recognizable lesson codes and its recurring radio show, alongside lively letter/number graphics, purposeful cutouts, rich local colour and tactile learning objects. Adult appropriateness comes from content, craft and readability; it does not require muting the book. Language load and task demands follow the intended level.

The author's own How to Talk to your Dog about Cambridge B2 First is the primary emotional reference. Its colour, physical concept metaphors and playful image/page relationships express the desired spirit. [Visual spirit](VISUAL-SPIRIT.md) governs all current and future Horizons levels. English File Beginner, Evolve 3 and the Personal Best collection inform editorial craft. Transfer principles through original Horizons material; higher-level books inform art direction, not A1 language load. Preserve approved expressive details during cleanup or redesign.

## Current edition system

Shared implementation: `editorial-edition.css`, imported by the shell and applied last by the assembled-book compiler. Local lesson CSS owns the source composition.

| Role | Standard |
| --- | --- |
| Lesson title | 25pt, sentence case, black, semibold/heavy sans-serif |
| Lesson locator | Compact crimson 15mm opening badge; 16 × 9mm continuation locator |
| Ordinary learner tasks and concept models | 10pt; the same body family; useful line spacing |
| Instructions | 9.2pt, clear task verbs, semibold |
| Word bank | 9.5pt, regular weight; quiet neutral surface/crimson rule |
| Extra Practice prompt | 8.5pt; a useful extension, not decorative homework |
| Small labels/navigation | Normally 7.5–8.5pt; never shrink important evidence into metadata |
| Reading/source features | Normally 9.5–10.5pt; intentional headings, notes and interface labels may differ |
| Visual learning objects | Letters, numbers, dates and diagram labels can use larger expressive display type, colour and shapes; record the intentional role |

Use colour for recognition, grouping, personality, genre and exact language contrasts. Saturated hues and colourful learning objects are welcome. Keep sufficient dark/light contrast at actual print size and use text/shape as well as colour for meaning. Bold the target auxiliary, ending, word or phrase selectively; do not make a complete vocabulary set bold merely because NEW WORDS is present. Choice options are ordinary italics unless the response method needs another treatment. Do not reveal answers through colour.

Grammar and communication explanations use readable light paper, a functional coloured edge and an open label. Grammar/form tools use cobalt, vocabulary green, communication/writing skills plum and pronunciation warm orange. Declare the tool role with data-hz-tool. Local diagrams may distinguish roles with their own appropriate colour/shape relationships. Separate meaning, form and one accurate example. Use pictures, arrows, aligned questions/answers, physical-object metaphors or a scale when these clarify the concept. A focus panel should explain something, not restate a topic name. Avoid a dense wall of miniature tables or crossing arrows. A wrong/right pair is useful only if the error is plausible and the correction unambiguous.

## Composition and variety

Each spread needs one clear learner action and an identifiable visual idea. A feature can be remembered as a club noticeboard, an annotated route, a review exchange, a weather archive or a ticket record. Change source genre, image scale, response mechanism and reading rhythm as content demands. A fresh colour on the same structure is insufficient. Protect distinctive local shapes, letter/number objects and source title treatments when they work. Compare neighbouring spreads for fatigue; expressive variety is a positive acceptance requirement.

Preserve backgrounds that establish the situation. Use a crop deliberately, keeping full faces, hands, actions and answer-bearing details. A cutout must interact with the task and have useful visible scale. Do not let transparent padding or a tall canvas impose an empty text panel. Do not add a photo simply to fill a quota: both pages should have meaningful visual evidence, context or a useful document. Tiny decorative props do not count.

Keep a clear reading route. Single-lane exercises are often best, but two balanced columns are now allowed in any lesson when they genuinely improve source/response hierarchy. Number in reading order; never interleave columns or force a learner to guess where to continue. An internal grid and a page-level pair of lanes have different purposes. Reviews can combine a strong source anchor with open retrieval and writing tasks. Leave enough space between instructions, sources, models and response areas.

Ordinary practice belongs on open paper. A box must represent a document/interface, collect a coherent concept, or guide a necessary comparison. Avoid both extremes: framing everything and stripping every helpful background. Standard handwritten lines are 7mm; short factual fields usually need 6mm clearance. Reduce redundancy or recompose an image before compressing teaching type or writing space. Two A4 pages per lesson remain the normal architecture; quality, rather than fitting a fixed activity count, governs editing.

## Lesson jobs and useful outcomes

A/C normally develop language. B develops substantial reading or listening, with a planned mix across the book. D develops speaking/writing with a practical outcome. Follow the cumulative language progression. Keep instructions and metalanguage accessible; do not import advanced grammar because a reference book uses it.

Start from understandable evidence; ask the learner to notice something; clarify it; practise it with enough variation; use it to choose, solve, arrange, create or find out something. A personal answer, genuinely private information, evidence-linked choice, real recipient or usable record gives a task a purpose. Repeated gap filling alone does not create communication. An information gap must be unknown to the partner; visible facing answer tables do not qualify. Open writing needs choice and space, not a compulsory sentence frame for every response.

Give feedback a job. A short peer check can verify the agreed time, identify a missing detail or test whether a route works. Avoid a vague extra instruction such as discuss your answers when there is nothing to discover. Reviews retrieve language through fresh themes and a manageable mixture of controlled and independent work. BEYOND HORIZONS remains the review transfer feature; compact challenge shapes are optional, not an eight-circle obligation.

## Media, navigation and recurring identity

See `asset-policy.md`. The author rejected the new drawn substitutes and asked to keep the old artwork. This edition restores baseline fd497fd image uses in existing lessons and reviews, while improving their composition, scale, useful backgrounds and relationship to tasks. Do not treat the rejected illustration experiment as an approved visual direction. The subsequent author clarification authorizes useful new images, artifacts and sections as part of a full overhaul, without repeating the rejected portrait treatment. The new7&8Review has its own original photographs; it does not replace an existing image set.

Audio must agree with the actual printed input and teacher scripts. Jessica remains the narrator; approved returning roles retain exact voice IDs. Never use the forbidden clarity tag or a throat-clearing substitute. Existing audio can be retained when its source words and answer facts remain; changing a task does not automatically require regenerating the unchanged input. Track IDs are not activity numbers and need not change after renumbering.

Horizons on Air is a genuine recurring programme. Keep the recognizable main/secondary show identity, voices and episode logic; do not brand ordinary grammar or unrelated speaking as broadcast material. Keep a useful B-skill mix and avoid two consecutive units without an episode. The exact recurring frame should support, not flatten, each episode's distinctive evidence.

NEW WORDS must sit at an explicit new input. Related practice references should name a stable destination topic. Do not print `page ---`, fake page numbers, internal file IDs or development notes. A1’s grammar, vocabulary and practical-language banks now exist. Use their real topic anchors, printed pages and working links; see PRACTICE-BANKS.md. For future levels without authored banks, register unresolved destinations without invented pagination. Source/image attribution belongs in end credits. A short factual reading source can remain near the text when useful; do not insert photo-licensing strips into tasks.

## Substantive editorial revision

An overhaul must change the learner experience and the page composition, not merely apply smaller headings or a new color. Record the actual source feature, image/text relationship, response mechanism, useful outcome and check per spread. Develop distinctive documents, listening organizers, planning/output surfaces or concept graphics when they serve the learning. Do not add the same strategy box to every page or impose a uniform workshop ladder. Keep strong current features where they already work, but require concrete whole-book evidence of the improved design.

## Acceptance

Check the actual spread, its neighbours and the whole-book rhythm. Review VISUAL-SPIRIT.md, the protected-element register and the previous edition before accepting a visual cleanup. Inspect the saved PDF independently, not only a browser screenshot. Verify learner reading order, face/action crops, type, contrast, handwriting space, controlled keys, source facts, real audio mappings and live playback. Count evidence accurately. Preserve a reversible baseline and new/versioned assets. Technical fit is necessary; editorial authority also requires an honest, recorded judgment of teaching purpose, warmth and visual quality. Do not confuse inventory, automated checks or previous approval with proof of a current revision.
