# Desktop viewport fit - 6 November 2026

Latest revision: exercise artwork sizing (6 November2026). The initial viewport-fit pass made the cast too small. The question panel now uses available height for the illustration instead of an explicit48-145px miniature scene. Desktop scenes have a150px minimum and320px ceiling; mobile scenes have a112px minimum and180px ceiling. Cast slots widen with the art; topic image slots widen up to380px on desktop and270px on mobile. Existing native proportions and raster fitting are preserved. No art is regenerated or painted.

The question body separates a flexible, internally scrolling `.question-content` (prompt, cue, passage, audio and artwork) from fixed answer fields, choice lists and tile builders. These answer widgets remain fully inside their own region and above the dock, including focus outlines. Artwork expands into remaining room. Short desktop feedback uses question/art and answers side by side; listening controls share space beside the illustration. Mobile choice cues may sit beside art to preserve complete answer lists. Long reading stays scrollable above the fixed answer region, without clipping fields/options. Mobile's previous hide-on-wrong-answer rule is overridden so feedback keeps meaningful artwork. Focus outlines have internal breathing room. Listening keeps its audio/silent controls and answer privacy, with tighter desktop spacing.

Current cache is `horizons-companion-exercise-art-v84`, and the viewport stylesheet query is `sprites1`; app query is `sprites1`; the prop query remains `coffee2` for the four-frame coffee release. [exercise-art.json](../reports/exercise-art.json) measures the actual inner native raster bounds (not only containers), across typed, wrong, listening, choice feedback, topic pictures and synthetic long content at1024x600,1280x640,1366x768,1920x1080,800x540,320x640,390x740 and760x640. Standard typed desktop examples render over200px tall at600px and taller windows; all tested cast scenes retain at least150px desktop/112px mobile. Controls stay visible with no outer-page overflow. Bounds checks include every field, option and focus ring before/after feedback, plus full raster containment for normal questions. The word-tile proof also checks all tiles before/after feedback at desktop/mobile widths and performs mouse/touch dragging. Long-content access remains possible through the inner question panel. [exercise-art-cache.json](../reports/exercise-art-cache.json) verifies the actualv83-to-v84 upgrade and exact stylesheet bytes offline. The existing full screen-fit and mouse/touch tile checks also pass. Local screenshots are in `C:/Users/David/Documents/Codex/2026-11-06/exercise-art/`. Physical keyboard/browser chrome remains untested.

The original release notes below describe the broader desktop fit work; theirv82 cache identifiers are historical.

The user requested that every desktop screen fit one window's height and that the Unit banner's Continue shortcut be removed. This revision keeps the accepted artwork, lesson data and horizontal map. The removal applies on mobile too. Exercise Continue/Results and confirmation-dialog Continue buttons still perform necessary actions and remain.

## Behavior

- The desktop header and content area share the actual dynamic viewport height. The main page no longer needs vertical scrolling to reach primary actions.
- Learn uses a smaller banner on shorter windows and allocates the remaining height to the trail, capped at the accepted308px trail height. Full island orbs, buildings, upper/lower decorations, lesson headings and side arrows remain within its vertical bounds. No overflow-hiding rule is used on the main Learn area to conceal missing content.
- Island details prefer their existing below-island placement; when it would exceed a short desktop window, they open above the island. Desktop details do not append spacer rows or scroll the document. Mobile's established placement/reveal behavior is retained.
- Practice uses a compact heading and toolbar, a scrollable topic panel and a persistent launch panel. Selection, grammar mixing, round length and all four launch modes remain.
- The word bank preserves lesson accordions, search, all words and details/audio. Open groups scroll inside the list; the search toolbar stays visible.
- The profile editor uses the avatar preview/options and profile details side by side on desktop, stacking preview/options within their column at narrower desktop widths. Avatar options scroll with their existing hidden scrollbar. The profile save action remains visible; book information can scroll within its section. Saved IDs and native avatar layers are unchanged.
- Quizzes keep the header and answer dock in the viewport. Long question content scrolls independently; long answer explanations have their own bounded area. Typed autofocus, neutral draggable tiles, audio placement, wrong/correct feedback and retry rules remain.
- Memory/matching boards use height-aware cards and compact spacing. All current six pairs fit in the tested shortest desktop size. The game footer stays visible. Future larger sets can scroll inside the board.
- Results, welcome and recovery screens use compact height-aware spacing. Dialogs are constrained to the window and scroll internally when necessary.

## Source and cache

Shared desktop rules: [viewport.css](../styles/viewport.css), loaded after the accepted base/path styles. Learn's adaptive trail rules: [overworld.css](../styles/overworld.css). Below/above placement: [studio-ui.js](../src/studio-ui.js). Banner shortcut removed from [app.js](../src/app.js).

Worker: `horizons-companion-screen-fit-v82`. App/studio/viewport URLs use `screenfit1`; overworld stylesheet uses `desktopfit1`. The previous prop renderer and native assets remain unchanged. The two older active path proofs now assert absence of the banner shortcut instead of requiring its old target.

## Verification

- [desktop-fit.json](../reports/desktop-fit.json): nine desktop viewport combinations,800-2048px wide and540-1080px tall; all four lesson areas, banner shortcut absent, complete map bounds, profile shortcut and island details. Mobile320/390/760px at640px height still fits and retains its edge-to-edge map.
- [screen-fit.json](../reports/screen-fit.json): Practice, all expanded word-bank groups/last word, word dialog, profile hair choices/last hair, profile save, book dialog, typed quiz, correct/wrong feedback, saved results, listening/silent alternative, ordering tiles and feedback, memory/matching and welcome at800x540,1024x600,1280x640,1366x768 and1920x1080. All use the actual renderer and server application with a synthetic in-memory store, without learner records. Primary actions stay visible; long content remains reachable internally.
- [screen-fit-cache.json](../reports/screen-fit-cache.json): actual priorv81 worker upgrade, old-cache removal and exact current module/stylesheet bytes fetched offline.
- Existing `word-tiles-proof.mjs` passes mouse/touch dragging, reordering, return to bank, keyboard operation, mobile/desktop layout and a saved graded round.
- Screenshots reviewed at `C:/Users/David/Documents/Codex/2026-11-06/desktop-fit/` and `C:/Users/David/Documents/Codex/2026-11-06/screen-fit/`. Videos/large screenshot sets are kept outside the public repository.

No physical-device, browser-chrome/OS zoom or Safari/Firefox check is claimed. Desktop rules begin at761 CSS pixels, matching the existing sidebar breakpoint; existing mobile layouts are retained. Long lists are intentionally scrollable inside their panels; this is not a claim that all142 words can appear simultaneously.
