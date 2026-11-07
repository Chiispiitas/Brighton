# Brighton Saboteur

Play: https://exams.bebrighton.net/Saboteur/

The original base game for **3–10 players**, in three rounds. Create a room, share its six-digit code, and join with a name. No account is required.

## Game length

Choose **Standard** (original board and three rounds) or **Blitz** when creating a room. Blitz is a house-rule variant: a fixed 5 × 5 grid (columns 0–4, rows −2–2), goals in column 4, and one round with at most 30 turns total. Three intermediate tunnels reach the nearest goal. Finding gold on turn 30 wins; otherwise saboteurs win at the cap. Original roles, the 67-card deck, starting hands, drawing and gold rewards are unchanged. The highest gold total wins after that round. Rematches keep the selected length. Both lengths support online and classroom play. Existing rooms remain Standard.

## Play modes

- **Online game:** every player has the shared mine and private controls on their device.
- **Classroom with devices:** the presenter shows the public mine, turn, broken tools and results; phones open on discreet private controls. Discussion happens in the room. The host can manage without a seat or play with their own seat in either mode.

The host selects the first player (normally the youngest) and deals. Take turns playing one tunnel/action or discarding, then drawing one card if available. Select a tunnel, rotate 180° if needed, preview an outlined legal space and confirm. Broken tools prevent tunnel placement but still allow actions and discarding. A two-tool repair fixes just one matching tool. Maps reveal one goal privately; rockfall removes a tunnel, preserving the entrance and goals.

The board supports drag, touch pan/pinch, zoom buttons, Fit board, and keyboard arrows/+/- while focused. The ordinary mouse wheel continues scrolling the page. All important card and target controls are keyboard accessible. Motion respects reduced-motion preferences.

The host's **Presenter link** contains only the room code and a public-screen flag. A presenter can also enter the code from the landing page. It never receives hands, current secret roles, private map notes, private gold choices or unearned reward values, even if a host/player capability is supplied to the presenter request. Roles become public after each round; cumulative gold becomes public only when the game finishes. Room management has no secret roster.

**Show privately** reveals the player's role, hand and notes; hiding them or switching away from the tab covers them again. Gold choices have their own private reveal. Saved device capabilities reconnect after refresh. Use the same browser/device to return; clearing local storage loses that identity. Room codes and invitation links contain no capabilities. Rooms expire after 24 hours.

## Rules edition

This implements the original 110-card base game using [AMIGO's current English Version 4.0 rulebook](https://blog.amigo-spiele.de/content/ap/rule/04900-GB-AmigoRule.pdf), not an expansion. One of the shuffled role cards stays undealt. The draw pile has 40 paths and 27 actions; the reward bank has 16 one-nugget, 8 two-nugget and 4 three-nugget cards. Exact card topology and print-sheet differences are recorded in [docs/RULES.md](docs/RULES.md).

The edition choice is explicit: after a miner win, draw as many reward cards as **actual gold miners**, then each miner chooses one, counterclockwise from the finder (or the first miner to a saboteur finder's right). A saboteur win pays each actual saboteur 4 nuggets if alone, 3 each with two or three, or 2 each with four. If no saboteur was dealt, an exhausted round awards nobody. After three rounds the highest total wins, with ties sharing victory. Next-round play starts clockwise after the last actor. Rematches reset scores and reuse the room/seats.

## Learning

**Learn to play** offers six short interactive lessons: Miner, Saboteur, Tools, Map, Rockfall, and Gold and rounds. Each step has one task and the real card/board controls. **Show me** demonstrates only the current fictional example. Previous/Next, Reset example and the lesson menu let students choose their own pace. Practice uses the same pure engine locally and makes no room requests or saved-session changes.

## Independent service

- Separate Wix site: `84d715f7-dc9e-479c-9ceb-06b21aac8c1c` (Brighton Saboteur).
- Public app identity: `5a1ca7dc-4ade-4992-b775-e0600b3a33e8`.
- API: https://headless-avyovqbniao-chiispiitas-140b.wix-site-host.com/api/game
- [Backend dashboard](https://manage.wix.com/dashboard/84d715f7-dc9e-479c-9ceb-06b21aac8c1c).
- CMS collection: `SaboteurStates`, ADMIN/CMS_EDITOR for read, insert, update and remove.

The backend enforces every command against the actor, exact version, phase and legal target. It stores capability hashes and immutable snapshots with unique room/version IDs, resolving simultaneous inserts without overwriting a committed action. Actor-bound command receipts make uncertain retries idempotent. Strict stale-version checks reject changed turns. The client does not regress to older snapshots; polling backs off after errors and pauses in hidden tabs. Cleanup retains a bounded snapshot conflict window and removes expired records in bounded batches. See [wix-backend/DEPLOYMENT.md](wix-backend/DEPLOYMENT.md) for reproducible service release instructions.

## Verification

```sh
node --check Saboteur/app.js
node --test Saboteur/tests/*.test.mjs
```

CI checks frontend syntax, rules, privacy, tutorial fixtures, concurrent endpoint requests and engine/service parity, then typechecks and builds the Wix server. The opt-in `tests/live.mjs` exercises the separate deployed service with synthetic rooms; set `SABOTEUR_LIVE=1` to run it. Test evidence is in [docs/VERIFICATION.md](docs/VERIFICATION.md).

## Artwork and publication

After the owner's visual correction, the app uses the supplied physical card faces and reverses, extracted without redrawing or altering the originals. Card manifests record source sheet cells and rotations. The additional background uses built-in ImageGen with the supplied cards as style references. Prompts and current output filenames are in `assets/imagegen-prompts.json`. The UI follows their muted gray stone, cream paths and red/green tool markings.

The frontend is buildless HTML/CSS/ES modules in this folder and follows the existing GitHub Pages deployment. Only this folder, its CI workflow and the necessary `_config.yml` exclusions are changed. The initial HTML includes a canonical URL, title/description, icon, Open Graph/Twitter tags and a 1200×630 JPEG sharing image. No private room information appears in sharing metadata.

Public action cues: map inspections announce the player's name and numbered goal without exposing its contents. Updated clients animate a cursor at that goal. Placed tunnels animate and retain the player's name through the following player's turn, clearing on their next action. Existing open clients receive the richer log automatically; a normal refresh loads the new visual cues without losing the room or seat.
