# Verification record

Date: 7 November 2026. Rules: AMIGO original Saboteur base game, English v4.0 (2025).

## Automated checks

`node --test Saboteur/tests/*.test.mjs` passed **70 tests, zero failures** after the supplied-card rendering and tutorial fixtures were complete:

- 27 engine checks and 13 independent adversarial checks cover the complete 67-card playing deck, 28 gold cards worth 44 nuggets, all player counts, role pools, legal placements, stopped tunnel entrances, tool actions, maps, rockfalls, rewards, three-round transitions, rematches and private projections.
- One stress check runs **48 seeded complete matches / 144 rounds**, covering every supported player count from three through ten, with both successful mines and exhaustion. Physical card identities and gold are conserved throughout every match.
- Seven transport checks execute the actual endpoint against an atomic in-memory CMS substitute. They force competing inserts, eight simultaneous joins, conflicting actions, duplicate delivery and a timeout after a successful commit. They also cover presenter isolation, create retries, request validation and origins.
- Twenty tutorial-step checks validate isolated fictional examples through the same rules engine. Two rendering checks cover separated stopped tunnel entrances and all four effective stone-goal bitmap orientations.

## Released backend and live checks

Service: `https://headless-avyovqbniao-chiispiitas-140b.wix-site-host.com/api/game`.

Released Wix source revision: **`cb066c65550adebf5585a618927e23bbf09988d2`**.

`SABOTEUR_LIVE=1 node Saboteur/tests/live.mjs` passed against that real service. It created only a disposable synthetic classroom room, **218755**, and completed:

- Three rounds, 112 move-planner turns plus two initial delivery/race test turns (114 committed turns total), two miner wins through actual tunnel connections, one complete deck-and-hand exhaustion, and five private reward selections.
- Every action kind: tunnel, map, broken tool, repair and rockfall.
- Concurrent joins, duplicate requests, conflicting turn requests, stale-version rejection, saved-identity reconnection, correct next-round starters, final scores and winners, a rematch reset, and a fresh start after that reset.
- **248 privacy checks** across player, managing-host and presenter responses. Presenter reads supplied with either host or player capabilities still returned only the public projection. Another player's hand, map notes, current role and pre-final accumulated gold were absent.

An additional disposable online room, **775622**, accepted **ten simultaneous joins without losing a seat**, started with ten players and four cards per hand, and allowed its host to play a seat. A presenter using that playing host's capability received no private hand or role. An extra join was rejected. These room codes identify synthetic evidence, not player credentials; the service expires its rooms after 24 hours.

Before the live run, the integration harness also completed five independently seeded, in-memory three-round runs to verify its legal move planner. Those simulations are distinct from the real-service results above.

## Browser verification

The primary agent used the actual browser at the desktop layout and a 390×844 phone viewport. A real classroom room, **602986**, was created through the UI on the released service: managing host, host taking a seat, player joins, first-player selection, dealing, private role/hand cover, 180° rotation, legal placement preview and confirmation all worked. The action drew one replacement, advanced to the next player, and appeared on a separately connected presenter. That presenter displayed only the board, hand counts, public tools and the current turn.

The Map tutorial was practised through actual card selection, keyboard Enter on the middle goal, confirmation and a private note; the shared goal stayed face down. The Tools demonstration played through the real practice controls and left the learner on the same step. Phone layout had no horizontal page overflow. Tutorial steps reset their example view, while ordinary moves, polling and reconnection preserve navigation. Unrelated board panels are hidden during tool, discard and reward practice. Card bitmaps use the owner's supplied artwork, with source cells/orientations recorded in the manifests.

The release uses the Saboteur GitHub workflow and the existing repository Pages deployment. Live publication status and finished screenshots are reported with the delivery pull request; the automated/live-service results above are distinct from physical-device testing.
