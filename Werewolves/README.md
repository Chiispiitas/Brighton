# Brighton Werewolves

Play: https://exams.bebrighton.net/Werewolves/

The frontend lives in `Chiispiitas/Brighton`, beside the exams. The game uses a **separate** Wix site and CMS, not the exam or Spelling Bee data stores.

## Classroom use

1. The teacher chooses **Host a game**, enters a name and shares the six-digit code or invitation link.
2. Each player joins on their own device. Four to twelve players are supported. The host is a narrator by default and can choose **I'm playing too** in the lobby.
3. The host chooses the werewolf count (Auto: floor(players / 4), minimum one), enables the desired special roles, and deals the cards. Every deck reserves at least one ordinary villager. Enabled special roles are included as room allows, in this order: Fortune Teller, Witch, Little Girl, Hunter. With the default settings, four players get one wolf, Fortune Teller, Witch and one villager; five players add the Little Girl; six players include all four special roles.
4. Every player opens their private card and acknowledges it. The host puts the village to sleep.
5. The host reads each phase aloud and advances after the required actions are received. An explicit confirmation allows missing actions to be treated as passes, except for the werewolves: every living wolf must agree on the same victim. Neither the host nor a wolf can override this. Once the pack agrees, the host or a living wolf can continue. The hunter must choose or pass personally.
6. During daylight, discuss in the classroom. Day one has no elimination vote. From day two the host opens the vote, living players vote privately, and the host counts it.
7. After the result, the host can reuse the village for another game.

**Open village screen** launches a public projector view. It never uses the host's room key and receives no living players' secret roles, discoveries or private actions. Eliminated players' cards are public and visible there. Players' own browser keys restore access after a reload using **Return to your previous village**. Keys are device-local; clearing browser storage loses access to that identity. Join codes and invite links do not include keys. Rooms expire after 24 hours.

## Learn to play

Open **Learn to play** in the header, or select a role in the landing page's **Role tutorials** row. Each of the six roles has short, self-paced steps with one instruction beside the relevant practice controls. **Show me** demonstrates only the current example and never advances automatically. **Next step**, **Previous**, **Reset example** and a desktop lesson outline let the learner control the pace. Direct links use `?tutorial=witch` (or `villager`, `werewolf`, `girl`, `fortune`, `hunter`).

Tutorials use a calm, high-contrast layout and readable type. Each step hides unrelated game panels; phone-sized screens use large player cards for selection rather than tiny houses. Fictional examples run through the shared engine locally, without room-service requests or changes to the saved room. Motion follows the device's reduced-motion preference. Every example can be reset independently.

## Rules implemented

- A room supports 4–12 players. A thirteenth player cannot join, and an older oversized lobby cannot start. Wolf counts that would begin at parity are rejected.
- Night order: Fortune Teller → Werewolves → Little Girl → Witch → Dawn. Absent or eliminated roles are skipped.
- Villager: no night action.
- Werewolves: every living wolf must highlight the same living non-wolf. House selections are shared only with the living pack and can be revised until the phase ends. Missing selections, split choices and a majority without unanimity all block continuation with “Impossible to continue because the decision has not been made.” The host cannot force a pass. After agreement, the host or a living wolf may continue. No more than one werewolf victim per night.
- Fortune Teller: learns the exact role of one other living player, privately, once each night. Passing is allowed.
- Little Girl: may spy or stay asleep. Spying reveals one randomly selected living wolf. There is an equal chance of staying undiscovered or being discovered. If discovered, only that selected wolf privately learns who the girl is. The information can be discussed aloud the next day.
- Witch: one healing potion and one poison potion per game. Healing saves that night's wolf victim, including the witch herself. The witch privately sees a marked, darkened house and a prominent named revival target; the checkbox and confirmation button name exactly who will be revived. Map labels distinguish alive, attacked tonight, and previously eliminated players. Poison can target any living player, including the witch. Both can be used on the same night. A healed and poisoned player still dies. No resurrection of earlier-day eliminations.
- Hunter: death by any cause triggers one optional final shot. It resolves before victory is evaluated, including when wolf parity would otherwise end the game.
- Day one: discussion only. From day two: one private vote per living player, no self-vote, abstention allowed. The interface seals the player's choice when submitted. A unique highest vote eliminates that player; tied leaders or all-abstain eliminate nobody.
- Eliminated players cannot act or vote, except for the hunter's final shot. Their role and original card are revealed publicly immediately after a night kill, poison, vote or hunter shot. A reveal dialog appears, and the cards remain available below the village and by selecting an eliminated player's house. The hunter is revealed before taking the final shot. Living players' roles stay private until the game finishes.
- Village victory: zero living wolves. Wolf victory: living wolves equal or outnumber all other living players. Roles reveal after victory.

The witch interpretation, tie behavior, auto balance, and parity victory are implementation defaults resolving details left open in the original brief. The supplied paper cards are reproduced as artwork; the interactive handbook gives the rules used by this game.

## Architecture and privacy

- Separate Wix site: `b23cf550-cf21-4b59-b909-da9a7ec8658b` (Brighton Werewolves).
- Public OAuth app identity: `bfa90d5e-3cf7-4c0d-a5c9-7646d41130d1`.
- API: `https://headless-cdpoaidonzo-chiispiitas-140b.wix-site-host.com/api/game`.
- Dashboard: https://manage.wix.com/dashboard/b23cf550-cf21-4b59-b909-da9a7ec8658b
- Private CMS collection: `WerewolvesStates`. All four collection permissions are ADMIN/CMS_EDITOR. Browsers cannot query it directly.
- A narrowly scoped Astro endpoint validates a 256-bit room capability, command, actor, phase and target; only the necessary Wix calls are elevated. Capability hashes are stored server-side. Each player receives their own role and discoveries; living wolves also receive their pack's current highlights. Eliminated roles are public. Host controls use a separate capability and do not expose living role maps or pack targets.
- Immutable snapshots are committed with a unique room/version item ID. A duplicate insert cannot overwrite another action: the losing request reloads consistent data and retries. Command IDs make uncertain network retries idempotent.
- Reads use a short in-process coalescing cache. Clients stop polling in hidden tabs and back off after errors. Cache entries expire after 1.8 seconds; client views never regress to an older version.
- Every eighth mutation prunes snapshots older than the retry window. Room creation also removes up to 100 expired snapshots. No indefinite full-state history is retained. This reduces usage but does not remove Wix plan limits.
- Narration and discussion happen in the room, not through an online chat or microphone. Optional ambient sound is synthesized locally and starts only after a click.

## Development and checks

The deterministic game engine lives in `server/engine.mjs`; the Wix copy must match it. Frontend code is buildless HTML/CSS/JavaScript.

```sh
node --test Werewolves/tests/*.test.mjs
node --check Werewolves/app.js
```

`tests/live.mjs` is an opt-in integration test against the real separate Wix service. It creates a disposable room with synthetic names, joins eight players concurrently, checks shared highlights and mandatory consensus, revises choices, continues as a wolf, and verifies public death/vote reveals, privacy and idempotency through the night/day cycle. It is deliberately excluded from CI.

The backend's reproducible source is in `wix-backend/`. Build with the pinned lockfile, a local ignored `.env.local` generated by Wix setup, and `npx astro build`. Release through Wix's `UploadHeadlessWebsiteFiles` build-and-source flow to the same site ID. The source revision returned by the most recent release is required for a later update. Never use a static file drop for this service.

## Link previews

The public sharing URL is `https://exams.bebrighton.net/Werewolves/`. `index.html` includes the title, description, canonical URL, Open Graph and Twitter metadata directly in its initial HTML. The sharing image is `assets/werewolves-share-v1.jpg` (1200×630 JPEG). Keep image URLs absolute in the metadata, and use a new filename when replacing the sharing image. Room invitation query parameters still open the chosen room; the preview stays generic to the game.

## Artwork

All visible bitmap artwork was regenerated with built-in ImageGen. The illustrated village reference supplies the daytime and nighttime boards, twelve occupied cottages and their twelve matching closed states. The six square role cards follow the owner's 3×3 symbolic card reference: 2 Villager, 3 Werewolf, 4 Little Girl, 5 Fortune Teller, 6 Witch, 9 Hunter. Each has a matching icon; the wolf icon also serves as the logo and favicon. The shared blue-and-gold reverse abstracts the wolf's curves into a neutral symmetrical design. The houses use transparent 4×3 sprite atlases positioned around twelve paths. The UI uses parchment colours, dark ink borders, Alegreya and IM Fell English fonts, with factual labels instead of slogans. Prompts and output filenames are preserved in `assets/imagegen-prompts.json`. The earlier artwork has been removed from the published asset set.
