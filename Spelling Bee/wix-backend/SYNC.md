# Spelling Bee synchronization

The existing Velo HTTP functions and CMS contracts are unchanged. These indexes
were created on the CMS server site on 2026-10-15 and verified ACTIVE:

| Collection | Index | Fields |
| --- | --- | --- |
| SpellingBeeSessions | bee_session_lookup | sessionCode ASC |
| SpellingBeeCommands | bee_command_lookup | sessionCode ASC |
| SpellingBeeJudges | bee_judge_record | recordKey ASC |
| SpellingBeeJudges | bee_judge_session_updates | sessionCode ASC, judgeUpdatedAt DESC |

All are non-unique indexes; no records or existing indexes were removed.

Each control view has one presenter reader; only Admin reads the judge
collection after joining. Active presenter reads run roughly every 950 ms and
quiet views ease to 2.8 seconds after 10 seconds without a word/input change.
Command acknowledgement waits temporarily use 250 ms reads. Presenter command
reads remain roughly 450 ms plus network time; Screen reads remain 1.1 seconds.
Reads are deduplicated within each page.

Idle presenter/judge heartbeats only write when the last successful save is at
least 25 seconds old (checked every 10 seconds). Freshness checks allow 75
seconds. Actual activity refreshes presence without another heartbeat write.
Admin's own judge card is rendered locally instead of being written a second
time. Fresh previous-word judge rows display as pending for a new word; their
old verdicts are never carried forward. Judges save their identity on joining,
then real progress, rather than an extra blank row for every word change.

Letter input remains immediate locally. Admin, Judge, and local Presenter
writers keep one newest complete unsent snapshot. Non-urgent saves are spaced
at least 1.5 seconds apart, waiting for a 220 ms input pause where possible;
continuous input still sends progress after 2.5 seconds. Network time and error
backoff can extend these intervals. New Presenter words and command
acknowledgements bypass local batching. Replicated Admin updates do not trigger
an extra Presenter save before the command acknowledgement.

Admin waits for the latest letter snapshot to be applied by Presenter before
replacing the single CMS command row with visibility, feedback, or navigation.
Snapshot failures retain the latest input and retry with a delay. HTTP 429 and
Wix WDE0014 errors pause background traffic and honor Retry-After. Read and
write quota failures have separate backoff counters, so successful reads cannot
reset an exhausted write quota. Non-idempotent control commands are not
replayed automatically after an uncertain outcome.

Confirmed saves are also sent through a BroadcastChannel scoped to the exact
session. This lets windows on the same device react without waiting for a poll.
The audience window subscribes only to its separate public broadcast session.
Other devices, or browsers without BroadcastChannel, use the HTTP readers.

Button hold/release feedback does not perform an action until a native click.
Judge success means Wix saved the snapshot. Admin command success additionally
requires the Presenter acknowledgement; changing words cannot acknowledge an
unrelated old-word action. Audience publishing has its own saved/error feedback.

Validation: `node --test "Spelling Bee/tests/cloud.test.cjs"` and
`node --test "Spelling Bee/tests/screen-model.test.cjs"`. Browser checks require
Playwright and Edge: `node "Spelling Bee/tests/sync-browser.cjs"` and
`node "Spelling Bee/tests/screen-browser.cjs"`. Set `BEE_ISOLATE_HOST=1` to test
Admin and Presenter without a shared browser channel. Set `BEE_BASELINE_REF` to
an earlier Git commit to compare the same six-view idle load with old assets.
The tests mock Wix and do not write production contest data.

The initial 10-second six-view rehearsal made 67 requests versus 460 on commit
87485d0dd4ce37ad7f01ca1923c2615cc73aab2d (about 85% fewer); exact counts depend
on network and browser timing. This reduces demand rather than changing the
site's [Wix quotas](https://dev.wix.com/docs/develop-websites-sdk/maintain-your-site/scale-your-site/about-data-feature-limitations).

Additional stress testing runs the actual repository Velo handlers with an
isolated CMS substitute, including the reads inside saves and rolling
1,000-read / 60-write per-minute quotas. Run `node "Spelling Bee/tests/stress-browser.cjs"`
with Playwright and Edge available. It defaults to 12 independent judges,
Presenter, Admin, and three independent audience screens. All shared browser
channels are disabled to exercise network synchronization. Set
`BEE_STRESS_JUDGES=3` and `BEE_STRESS_SUSTAINED=1` for repeated rounds, or
`BEE_STRESS_PRESENTER_ONLY=1` for the focused local Presenter write budget.
`BEE_STRESS_REPORT` writes a JSON report; `BEE_BASELINE_REF` serves an older
commit's browser assets for comparison. `BEE_BASE_URL` can rehearse published
pages while continuing to simulate every Wix data request.

See [stress results](../tests/STRESS-RESULTS.md) for the scenarios, measurements,
and production limits of these tests.
