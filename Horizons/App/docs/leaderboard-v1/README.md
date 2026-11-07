# Weekly leaderboard

Personal progression: Wood, Stone, Iron, Gold, Diamond, Obsidian, Masters. No ranks divide or label lobbies. The earlier journey theme was superseded by the user before release.

## Rules and persistence

Monday 00:00 UTC to Monday; 20 seats. Existing accounts with active individual/production A1 keys are reconciled into human lobbies on each standings request, without requiring those peers to open Rank or complete another lesson. Unclaimed, expired, disabled and demo/QA keys do not auto-enroll competitors. Caller enrollment on opening Rank or finishing a lesson remains, fixed across devices for that week. Human groups fill before new groups open, with stable hashed seat allocation and no rank filter. Vacant seats contain explicitly marked Practice players: fabricated pseudonyms and native avatar presets. Their deterministic scores grow with elapsed week time. Humans replace bot seats.

Weekly XP is read from immutable server-graded attempts, including earlier attempts in that week. No client score write. Top quarter (five of twenty) plus at least 100 XP advances one personal rank. Fixed weekly tie ordering; no demotions. Masters is capped. Closed weeks settle lazily on next request and persist create-only; retries cannot award twice. Browser acknowledgement suppresses repeated promotion presentation on that device; another device may show the same earned celebration again.

Standings refresh every45 seconds while visible, on navigation and manual refresh. Only pseudonymous competitor ID, display name, avatar, weekly XP, position and bot/self flags leave the server. No raw profile IDs, keys, birthdays, tokens or attempt history. Private HzThrottle scopes store seats, membership and results. Existing learning progress is untouched.

## Art and motion

Actual mandatory R01/R06/R07 images were attached after preflight. native-material-atlas.png is current; production-record.json records briefs, hashes and superseded/rejected sources. Chroma removal/cell cropping/downsampling are mechanical only. Seven native ImageGen badges are animated with whole-prop transforms: old-badge departure, new-badge overshoot and text pop. Standings use FLIP translation. No fades, new character rigs or redrawn art. Reduced motion is static. Native avatar presets are reused.

## Planned only: competitor profiles and friends

Names and avatars are not links yet. Future work: opt-in public profile resolution by pseudonymous ID; name/avatar/agreed progress summaries; friend request/accept/decline/cancel/unfriend; block/report, discoverability and rate limits. Only confirmed relationships count as friends. Never reveal codes, dates of birth, raw profiles or private attempts. Bots must remain identified and cannot accept friend requests. No social routes, mutations or placeholder buttons ship now.

## Evidence and limits

60 backend tests pass, including UTC boundaries, old-XP exclusion, privacy, human filling, concurrent enrollment, overflow, promotion retries, score reset and Masters cap. tools/leaderboard-proof.mjs uses only a synthetic in-memory API and actual app at1440x900,1024x600,390x844,320x640. Checks include avatars, quota, bot replacement, promotion once and reduced motion. Screenshots outside repository. Live checks read only API health and reject unauthenticated requests; no real learner QA or new live access codes. Physical-device testing remains outstanding.
