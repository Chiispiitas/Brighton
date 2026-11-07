# Rules reference and edition decision

Checked 7 November 2026. This app implements **Saboteur, the original 110-card base game, using AMIGO's English Version 4.0 (2025)**. It does not use Saboteur 2, The Duel, Lost Mines, tournament roles, team colours, or expansion actions.

Primary source: [AMIGO English base-game rulebook, Version 4.0, two pages](https://blog.amigo-spiele.de/content/ap/rule/04900-GB-AmigoRule.pdf). Publisher inventory: [AMIGO Saboteur product](https://www.amigo-spiele.de/saboteur_4900_1122). The supplied card sheets were inspected as read-only physical-card references, not instructions to alter the requested rules.

## Edition ambiguity

Some older transcriptions distribute a number of gold cards equal to all players and allow multiple selection circuits. The selected publisher edition instead draws **one reward card per actual Gold Miner**, then gives each miner one choice, counterclockwise. It expressly handles a Saboteur finding the gold: miners still win and the first miner to that Saboteur's right chooses first. This app follows Version 4.0 consistently, rather than mixing scoring systems. Its round-ending rule is card exhaustion, not a subjective decision that a route looks impossible.

## Inventory audit

The official set contains 44 tunnel-related cards, 27 actions, 28 reward cards and 11 roles. Four tunnel-related cards are fixed setup cards: one start and three goals. Thus the shuffled playing deck has **40 path cards + 27 actions = 67 cards**.

The table below uses N/E/S/W for the four edges. Rotation is 180 degrees only. All openings within a through-path card interconnect. On a dead-end card, each opening is a separate stopped tunnel; the image's apparent collection of openings must not be treated as a junction.

| Playable path shape, allowing 180-degree rotation | Count |
| --- | ---: |
| Four-way connected crossing, NESW | 5 |
| Connected vertical T, NES / NSW | 5 |
| Connected horizontal T, NEW / ESW | 5 |
| Connected corner, NE / SW | 5 |
| Connected corner, NW / SE | 4 |
| Connected vertical straight, NS | 4 |
| Connected horizontal straight, EW | 3 |
| One stopped vertical opening, N / S | 1 |
| One stopped horizontal opening, E / W | 1 |
| Two separate stopped vertical openings, N and S | 1 |
| Two separate stopped horizontal openings, E and W | 1 |
| Two separate stopped corner openings, N and E / S and W | 1 |
| Two separate stopped corner openings, N and W / S and E | 1 |
| Three separate stopped openings, N, E and S / N, S and W | 1 |
| Three separate stopped openings, N, E and W / E, S and W | 1 |
| Four separate stopped openings, N, E, S and W | 1 |
| **Total** | **40** |

The supplied `CAMINOS 1/cartas de camino1.jpg` through `cartas de camino4.jpg` contain 36 playable paths. `CAMINOS 2/cartas de camino5.jpg` contains four further paths, the start, all three goals, and one three-nugget reward. The start and gold goal are connected four-way cards. The two rock goals are the two corner families, NE/SW and NW/SE.

| Action | Count |
| --- | ---: |
| Break pickaxe / lantern / cart | 3 each, 9 total |
| Repair pickaxe / lantern / cart | 2 each, 6 total |
| Repair either of pickaxe+lantern / pickaxe+cart / lantern+cart | 1 each, 3 total |
| Map | 6 |
| Rockfall | 3 |
| **Total** | **27** |

The official gold bank is **16 one-nugget, 8 two-nugget, and 4 three-nugget cards: 28 cards worth 44 nuggets**. The supplied reward print sheets appear to contain 15 ones, 9 twos and 4 threes when the extra reward on `cartas de camino5.jpg` is included. This is a printing-set discrepancy; the digital game uses the official 16/8/4 inventory. The original files are unchanged.

## Setup and private information

Three to ten players participate; a managing host and a presenter do not require seats. The role pool is one card larger than the player count:

| Players | Saboteurs in shuffled pool | Gold Miners in shuffled pool | Starting hand |
| --- | ---: | ---: | ---: |
| 3 | 1 | 3 | 6 |
| 4 | 1 | 4 | 6 |
| 5 | 2 | 4 | 6 |
| 6 | 2 | 5 | 5 |
| 7 | 3 | 5 | 5 |
| 8 | 3 | 6 | 4 |
| 9 | 3 | 7 | 4 |
| 10 | 4 | 7 | 4 |

Shuffle the appropriate pool, give each player one secret role, and set aside the final role unseen. Consequently a three- or four-player round may have no Saboteur. Saboteurs receive no teammate list. Roles change through a fresh deal each round. Hands, map discoveries, reward choices, and accumulated gold remain private to their owners. Current roles become public when that round ends; gold totals become public only when the three-round game ends. Room management grants no extra view of these secrets.

Put the start at (0,0) and shuffle the goals into (8,-2), (8,0), and (8,2): seven empty card-width slots between start and goal, and one empty card-height slot between adjacent goals. The layout may grow beyond this initial rectangle. The official first player is the youngest; a digital first-seat default or host selection is a setup convenience, without collecting birth dates. Subsequent turns proceed clockwise in seat order.

## A turn

Play exactly one path, play exactly one action, or discard exactly one selected card face down. Then draw one if the draw pile has any cards. The discard pile is never reshuffled into that pile during the round. When the pile is empty, hands shrink; players with no cards are skipped. Reaching the gold finishes the round immediately.

A new path occupies an empty adjacent grid cell, keeps portrait orientation, matches every already-visible neighbour edge (opening to opening and wall to wall), and has an actual tunnel connection back to the start. A card beside a disconnected island is insufficient. Dead ends are legal when one of their stopped entrances connects to the start, but do not transmit reachability through their other entrances. Broken tools prohibit paths, while actions and discarding remain available.

Sabotage targets another player, never oneself, and cannot duplicate a broken tool that target already has. Any broken tool blocks paths. A repair removes one matching existing break from oneself or another player; dual repairs choose one of their two tools, never both. Repairs cannot grant future protection. Rockfall removes one played path, never the start or any goal, and can leave disconnected islands. Map privately inspects one still-concealed goal without moving or publicly revealing it.

When a start-connected passage reaches a concealed goal, turn it face up in place. Gold ends the round for the miners, even when a Saboteur made the connection. A rock remains as a usable path and play continues. Orient that revealed goal to connect to the arriving passage. A revealed goal may exceptionally mismatch other adjacent edges; this exception does not permit ordinary new paths to mismatch visible neighbours. Concealed goal edges are not sent to clients or used as advance legality clues.

The engine's automatic goal orientation is a digital convention: favour the orientation that accepts the newly arriving reachable edge and fits the most other adjacent edges, with a stable tie-break. Source geometry makes accepting one arriving edge unambiguous for either rock corner. The presenter receives the same public reveal as all players.

## Round end, rewards, and the match

Gold discovery or complete exhaustion of everyone's cards ends the round. Reveal that round's roles. For a miner victory, draw as many gold cards as actual miners, not as players. Starting with the finder if a miner (otherwise the next miner counterclockwise from the Saboteur finder), each miner privately chooses one remaining reward, then passes the rest counterclockwise, skipping Saboteurs. Broken tools do not disqualify a miner from rewards.

If the gold was not reached, each actual Saboteur receives an exact nugget value: 4 for a lone Saboteur; 3 each for two or three; 2 each for four. With no Saboteurs, nobody receives a reward. The backend takes cards totalling that value from the remaining bank; choosing a fewest-card exact combination is an implementation convention, since the rulebook does not prescribe denominations. Awarded cards stay with players, and the remaining bank persists between rounds.

For rounds two and three, clear the board and tools, gather and reshuffle all 67 playing cards, reshuffle the same role pool including its unused card, and shuffle the three goals anew. Previous rewards remain owned. The player clockwise after the person who played the previous round's last card starts the next round. After round three, reveal totals; the greatest nugget total wins and tied leaders share victory. A rematch starts a fresh three-round match with a full bank and newly dealt roles.

## Required rule and privacy checks

Meaningful checks include every supported seat count; exact card conservation; legal 180-degree rotations; all-edge matching; the stopped-entrance reachability distinction; rockfall disconnection; matching and duplicate tools; hidden maps; goal-only mismatch handling; no-goal exhaustion; both miner and Saboteur rewards; clockwise turns versus counterclockwise rewards; three rounds; tied winners; and a fresh rematch. Transport checks must cover concurrent writes, command retries, stale turns, refresh and reconnection. Public and other-player responses must exclude hands, current roles, concealed goals, discoveries, reward pools, private accumulated gold, capability secrets, and draw order.
