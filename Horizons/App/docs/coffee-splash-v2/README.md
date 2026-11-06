# Four-frame coffee splash

The user requested at least four splash frames. This release uses four separate built-in ImageGen calls and four native transparent outputs; it replaces the earlier one-image transform effect. Existing red/yellow cup art and their clink, other decorations, character/avatar motion, layout, grading, backend and printed book are unchanged.

## Current production references

- [Exact prompts, preflights, source hashes, native paths and registrations](production-record.json).
- [Four composed poses](review.png), captured from the actual production renderer.
- [Runtime frames and sequence metadata](../../assets/art/coffee-splash-v2/sequence.json).
- Registered native sprite derivatives: `frame-01-emerge.png`, `frame-02-peak.png`, `frame-03-breakup.png`, `frame-04-fall.png`, all in `assets/art/coffee-splash-v2/`.
- Original generated images remain unchanged in `assets/art/coffee-splash-v2/native/`. Native hashes were verified against the exact tool outputs.

Each saved brief passed `tools/check-image-brief.py` before its call. All five returned paths were actually attached: mandatory R01 brand, R02 cast/style, R07 object/style, the original native splash edit target and accepted cups edit target. Every input counts toward the seven-image total. The common prompt requests one isolated frame only, matching opaque dark-navy coffee silhouettes, without cups/scenery/text/outline/glow. Each individual brief then specifies its distinct action pose.

Dark native previews initially appeared to have a halo. White and pink composites established clean edges, and an alpha check found no alpha>10 pixels more than5 pixels from an alpha>200 contour. Color in fully transparent pixels explains the misleading dark preview. No regeneration or pixel painting was needed; the four original outputs were accepted. This is documented explicitly rather than claiming rejected/repair calls that did not occur.

## Registration and playback

[prepare-coffee-splash-v2.py](../../tools/prepare-coffee-splash-v2.py) only crops by meaningful alpha bounds, uniformly resamples and places the original pixels. All four outputs use a512x265 transparent canvas. The jet root/tail is registered to the same release point for the first three frames. Falling droplets move outward and lower. One constant registration transform aligns the canvases with the red cup rim; this does not animate their shape or size.

The existing cup clock remains10500ms plus its slot stagger. Four contiguous normalized intervals begin after anticipation:0.095-0.105,0.105-0.119,0.119-0.135 and0.135-0.151 after the rig's start offset. Cup contact peaks at0.11. In the actual map's11150ms cups loop, the full splash lasts about624ms. There is a long neutral rest between clinks. Exactly one frame is visible at a time; all images have opacity1. The splash frames have no Web Animation transform/opacity tracks and use no crossfade.

The runtime manifest retains the stable `coffee-splash` actor ID with a four-image `frames` array. All four images must decode before mounting. A failure in any frame retains the original accepted still. The original prop preparation script also preserves this sequence when rebuilding its manifest. Native v1 splash files remain archived and are no longer precached for playback.

## Verification

- [Browser report](../../reports/coffee-frames.json): four different asset URLs, exact frame ordering, one frame at a time, opaque swaps, no splash transform animation, normal-speed playback observes0/1/2/3, shared cup clock, original reduced-motion still, missing-sequence-frame fallback, offscreen/document-hidden pause and disposal. Existing mailbox insertion, blank notebook/no scribble, smear-free globe and all eight rigs remain checked.
- [Cache report](../../reports/coffee-frames-cache.json): priorv82 worker upgraded to `horizons-companion-coffee-frames-v83`, old cache removed, exact new app/prop module/manifest and all four frame bytes fetched offline. App and prop module queries are `coffee2`; manifest uses `v=3`.
- Mobile390px actual-path poses and enlarged composed frames were visually inspected. Normal-speed recording and a short, faster-looping preview GIF remain outside the repository at `C:/Users/David/Documents/Codex/2026-11-06/coffee-splash/`.

Testing uses the actual renderer with a synthetic session/store. No real learner records, physical phone or Safari/Firefox test is claimed. No deployment wait requested.

For future frame animation, create and preflight one brief per distinct frame, attach the exact mandatory references and edit targets, preserve each original output, compare alpha composites on light/colored backgrounds, register shared joints/emission points without redrawing, and inspect every discrete pose and normal-speed playback in the actual app. Keep source-frame playback separate from cup/body transforms and retain lifecycle/fallback/reduced-motion checks. The broader from-scratch process remains in [ANIMATION-AUDIT.md](../ANIMATION-AUDIT.md).
