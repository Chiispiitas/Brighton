# Horizons companion backend

Current mastery release: deployment `e86e3970-ba28-4e74-a361-94a433321094`, source revision `71ef9c622fde170e897849e7b8d3e687b8806685`. One unaided correct answer masters each item; no three-answer/75% gate. Live proof is `reports/live-one-correct.json`; the detailed build/test record is `reports/mastery-once-deployment.json`. Earlier release reports below are historical evidence.

This is the deployed private Wix API for the GitHub-hosted study app. It is a separate free Wix site and does not change the school website or another application's collections.

- API: `https://headless-hphybypweny-chiispiitas-140b.wix-site-host.com/api/horizons`
- Dashboard: `https://manage.wix.com/dashboard/09fbb304-3799-4b3a-8ec6-4a7097167f00`
- Site ID: `09fbb304-3799-4b3a-8ec6-4a7097167f00`
- Project/app ID: `ed2f1865-9249-46cd-b82e-37e2e844a870`
- Reviewed API contract: [API-CONTRACT.json](API-CONTRACT.json)

## Identity and access

There is one saved learner profile, no email/password account, and one or more book codes linked to it. The first redemption creates a claim with a fixed activation date and twelve-calendar-month expiry. Entering the code again creates a new device session and restores the original profile without extending access. Adding an unused code while signed in links it to that profile. A code already owned by a different profile returns409; it cannot merge or expose someone else's data.

The frontend stores an opaque random token in its own `Secure; SameSite=Lax; Path=/Horizons/App/` cookie and sends it in `X-Requested-With`. The original book code is never saved in browser storage. A static GitHub origin cannot set an HttpOnly server cookie, so this first-party cookie is JavaScript-readable; the frontend's restrictive content policy and escaped rendering matter. The Wix API does not depend on third-party cookies. Only a token hash is stored in private CMS. Device sessions last90days and signing out revokes that device's session. Entering any other valid linked code restores the profile on another device.

The issued-code `disabled:true` field revokes that code and removes its active entitlement immediately. Expiry/revocation is checked before every practice write and book redemption. Existing sessions can still read their profile/progress and add a new book; access to expired learning content must also be disabled in the frontend. A still-active different book remains usable. Returning an expired code does not renew it.

## Private collections

All collections require ADMIN permission for read, insert, update and remove. The API reaches them with Wix's elevated server identity after checking session, ownership, input and entitlement.

| Collection | Contents |
|---|---|
| HzIssuedCodes | Hashed code ID; book ID; disabled flag; example/production kind |
| HzClaims | One create-only claim per code; stable profile ID; immutable activation/expiry |
| HzProfiles | Display name, optional date of birth, avatar, daily goal, preferred book and time zone |
| HzSessions | Hashed opaque token; profile;90day expiry; revocation flag |
| HzAttempts | Create-only, profile-scoped, server-graded practice events |
| HzThrottle | Create-only, profile/day-scoped daily streak celebration claims; reserved namespace for a future distributed rate limiter |

There are no public staff, reset or seed endpoints. Public samplecodes intentionally provide shared example access; `demo:true` tells the app to request fictional profile details. Production codes should be individually printed, random and kept private. The current application-level code-entry rate limit is per running worker, with Wix's hosting protections underneath; a distributed limit should replace it before a broad public code campaign.

## Learning data

`scripts/sync-content.mjs` copies the reviewed Unit1 content and engine into this self-contained backend. Run it whenever the frontend content engine changes, then test and redeploy both together. The server reconstructs questions from the submitted activity, selected word sets, mode and seed, and grades the submitted answer. It ignores claimed correctness, XP, word IDs and mastery flags. Unknown/repeated questions are rejected. Choice answers should be text, ordered sentences should be arrays of token text, and matching answers should be the matched right-hand text.

An attempt ID is unique within its profile. Identical delivery retries award no additional XP; changing previously saved answers returns409. XP is five per correct answer plus ten for completing a round. Word mastery requires one unaided correct answer. Accepted synonyms credit the prompted item. Earlier/later errors do not undo mastery. Memory/matching recognition and hinted answers cannot create mastery. Incorrect vocabulary answers populate the review collection. Progress and local-calendar streaks are derived from stored events, not trusted client totals. Only registered path nodes enter completedActivities; custom mixes retain XP, attempts and word progress without increasing the path total. Avatar badges none/star-pin/trophy-pin/compass-pin are validated; earned badges require25/100/250storedXP. Basic avatar customization remains free.

## Daily streak celebration

Only a successful `saveAttempt` can return `attempt.dailyStreakCelebration`. The first saved round of the profile-local calendar day is eligible, whether Learn or Practice; it does not require completing every island in a lesson, earning mastery, or answering everything correctly. The existing completed-round API and XP rules remain unchanged. The app submits attempts only at the end of a round.

The server uses its own completion timestamp and the saved profile's validated IANA time zone (default `America/Guayaquil`). It returns the completion date, streak, active dates, a Monday–Sunday week, local hour/minute and actual minutes until the next local midnight. Time remaining accounts for daylight-saving day lengths; client clocks and submitted celebration flags are ignored.

Before a new event is inserted, existing daily history determines its eligibility. The immutable attempt stores a server-only candidate proof; historical events and later daily rounds cannot become candidates through retries. After the saved result can be read successfully, one uniquely identified `daily-streak:<profile>:<local-date>` claim is inserted into the existing private `HzThrottle` JSON collection. Concurrent workers and devices share this claim. A failed attempt write never consumes it; failed result reads or claim writes can recover through the original attempt ID without adding XP.

The winning attempt receives the same immutable metadata on identical retries within that local day. This recovers a lost response. Other attempts receive `null`, and a retry after the winning local date has ended also receives `null`. Bootstrap, login, profile updates and progress requests never return a celebration. The frontend must persist a per-profile/day seen marker only when the celebration is actually shown, and must not trigger it from streak totals. This is one durable winning event, with client deduplication of its presentation; deliberately replaying the exact winning UUID in another browser could show it again there. There is no global display acknowledgement API.

## Examples and QA

- User-facing fresh examples: `DEMO-HZ-A1-001` and `DEMO-HZ-A2-001`.
- Root/frontend QA: A1-002, A2-002 and A1-003.
- Learning UI QA: A1-004.
- Backend QA: A1-018 (avatar), A1-019, A1-020 and A2-010.
- A1 currently exposes Unit1. A2 is a labelled book-linking preview, without invented A2 lessons.

Do not use real learner details with public example codes. Reusing the same example code restores its shared example profile by design. Live-test reports contain no session tokens or original private codes.

## Development and release

Run `npm test`, then `npm run sync:content` and `npm run build:hosting`. The development `.env.local` contains Wix build credentials and must stay ignored. Never put it in the frontend, a source archive, a screenshot or a report. The current Windows `node_modules` is an ignored junction to the existing locked Wix/Astro toolchain; a fresh checkout can use `npm ci`.

`scripts/package-release.py` creates build/source archives outside the public repository, excluding environment files. Upload them with the Wix plugin's documented two-step `UploadHeadlessWebsiteFiles` flow, preserving its returned source head revision. No paid plan or custom domain is required. `scripts/upload-prepared.mjs` accepts short-lived upload URLs through hidden stdin instead of logging them. `scripts/receive-build-env.mjs` was used only to transfer build credentials encrypted to the local process.

The deployed release was verified with `node scripts/live-smoke.mjs`; the latest output is [reports/live-backend.json](reports/live-backend.json). It exercises the actual hosted API and private CMS. `reports/live-mixes.json` verifies complete142word vocabulary/recall rounds and208question mixed rounds on the hosted server. Attempts accept at most512 answers. `tests/application.test.mjs` additionally checks all shipped activity types, end-of-month/leap-day access, concurrent first redemption, revoked/expired books, profile isolation, input bounds and genuine retrieval mastery.

## Island mastery

The API now returns `progress.islands` and `progress.masteredLessons`, reconstructed from existing graded attempts. Vocabulary crowns require one unaided correct answer per word. Grammar and reading/listening crowns require one unaided correct answer per canonical question; silent alternatives cannot count toward listening crowns. Recognition never changes word mastery. Existing saved events are summarized under the new rule without rewriting them; stable recall question IDs recover credit for previously accepted synonyms. No data migration is required. The reserved synthetic example A1-017 verifies live mastery, duplicate saves and new-device restore without profile edits.
