# Brighton Werewolves

Play: https://exams.bebrighton.net/Werewolves/

The frontend lives in `Chiispiitas/Brighton`, beside the exams. The game uses a **separate** Wix site and CMS, not the exam or Spelling Bee data stores.

## Classroom use

1. The teacher chooses **Host a game**, enters a name and shares the six-digit code or invitation link.
2. Each player joins on their own device. Six to forty players are supported. The host is a narrator by default and can choose **I'm playing too** in the lobby.
3. The host chooses the werewolf count (Auto: floor(players / 4), minimum one), enables the desired special roles, and deals the cards.
4. Every player opens their private card and acknowledges it. The host puts the village to sleep.
5. The host reads each phase aloud and advances after the required actions are received. An explicit confirmation allows the host to treat missing actions as passes. The hunter must choose or pass personally.
6. During daylight, discuss in the classroom. Day one has no elimination vote. From day two the host opens the vote, living players vote privately, and the host counts it.
7. After the result, the host can reuse the village for another game.

**Open village screen** launches a public projector view. It never uses the host's room key and receives no secret roles, discoveries or private actions. Players' own browser keys restore access after a reload using **Return to your previous village**. Keys are device-local; clearing browser storage loses access to that identity. Join codes and invite links do not include keys. Rooms expire after 24 hours.

## Rules implemented

- Night order: Fortune Teller → Werewolves → Little Girl → Witch → Dawn. Absent or eliminated roles are skipped.
- Villager: no night action.
- Werewolves: each living wolf chooses one non-wolf. The unique most selected target is attacked; a tie produces no attack. No more than one werewolf victim per night. Wolves see their packmates.
- Fortune Teller: learns the exact role of one other living player, privately, once each night. Passing is allowed.
- Little Girl: may spy or stay asleep. Spying reveals one randomly selected living wolf. A secure server-side coin flip gives equal odds: heads stays hidden; tails also privately reveals the girl to that selected wolf. The information can be discussed aloud the next day.
- Witch: one healing potion and one poison potion per game. Healing saves that night's wolf victim, including the witch herself. Poison can target any living player, including the witch. Both can be used on the same night. A healed and poisoned player still dies. No resurrection of earlier-day eliminations.
- Hunter: death by any cause triggers one optional final shot. It resolves before victory is evaluated, including when wolf parity would otherwise end the game.
- Day one: discussion only. From day two: one private vote per living player, no self-vote, abstention allowed. The interface seals the player's choice when submitted. A unique highest vote eliminates that player; tied leaders or all-abstain eliminate nobody.
- Eliminated players cannot act or vote, except for the hunter's final shot. Eliminated roles stay private until the end.
- Village victory: zero living wolves. Wolf victory: living wolves equal or outnumber all other living players. Roles reveal after victory.

The witch interpretation, tie behavior, auto balance, and parity victory are implementation defaults resolving details left open in the original brief. The supplied paper cards are reproduced as artwork; the interactive handbook gives the rules used by this game.

## Architecture and privacy

- Separate Wix site: `b23cf550-cf21-4b59-b909-da9a7ec8658b` (Brighton Werewolves).
- Public OAuth app identity: `bfa90d5e-3cf7-4c0d-a5c9-7646d41130d1`.
- API: `https://headless-cdpoaidonzo-chiispiitas-140b.wix-site-host.com/api/game`.
- Dashboard: https://manage.wix.com/dashboard/b23cf550-cf21-4b59-b909-da9a7ec8658b
- Private CMS collection: `WerewolvesStates`. All four collection permissions are ADMIN/CMS_EDITOR. Browsers cannot query it directly.
- A narrowly scoped Astro endpoint validates a 256-bit room capability, command, actor, phase and target; only the necessary Wix calls are elevated. Capability hashes are stored server-side. Only the player's own role and discoveries leave the server. Host controls use a separate capability and do not expose role maps.
- Immutable snapshots are committed with a unique room/version item ID. A duplicate insert cannot overwrite another action: the losing request reloads consistent data and retries. Command IDs make uncertain network retries idempotent.
- Reads use a short in-process coalescing cache. Clients stop polling in hidden tabs and back off after errors. Cache entries expire after 1.8 seconds; client views never regress to an older version.
- Every eighth mutation prunes snapshots older than the retry window. Room creation also removes up to 100 expired snapshots. No indefinite full-state history is retained. This reduces usage but does not remove Wix plan limits.
- Narration and discussion happen in the room, not through an online chat or microphone. Optional ambient sound is synthesized locally and starts only after a click.

## Development and checks

The deterministic game engine lives in `server/engine.mjs`; the Wix copy must match it. Frontend code is buildless HTML/CSS/JavaScript.

```sh
node --test Werewolves/tests/engine.test.mjs
node --check Werewolves/app.js
```

`tests/live.mjs` is an opt-in integration test against the real separate Wix service. It creates a disposable room with synthetic names, joins eight players concurrently, checks privacy and idempotency, and exercises the night and day cycle. It is deliberately excluded from CI.

The backend's reproducible source is in `wix-backend/`. Build with the pinned lockfile, a local ignored `.env.local` generated by Wix setup, and `npx astro build`. Release through Wix's `UploadHeadlessWebsiteFiles` build-and-source flow to the same site ID. The source revision returned by the most recent release is required for a later update. Never use a static file drop for this service.

## Artwork

Original role cards and icons were extracted from the owner's supplied `Page 1.png`, `Page 2.png` and `Covers.png` in Downloads/Werewolves. `assets/village.webp` and the four house sprites were generated with built-in ImageGen. Prompts are preserved in `assets/imagegen-prompts.json`. Fonts use Cormorant Garamond and Manrope with local system fallbacks. All essential UI text is real, accessible HTML.
