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

## Admin and Study sources

Admin can start or resume a session without Study open. It writes source
snapshots directly through the existing `presenter` role; no additional CMS
collection, field, or backend deployment is required. `presenterStateJson`
contains `sourceRole` (`admin` or `study`), the Admin device's `sourceId`, and a
monotonic `sourceRevision`. Admin saves retain the word token, history, category,
difficulty, marks and feedback when resuming. Taking over explicitly moves the
source to the current Admin device and preserves the session code.

The former Presenter page is now Study. When connected to an Admin-owned
session it follows that source, disables word-changing controls and performs no
source writes. Disconnected Study remains local practice; existing Study-hosted
sessions continue accepting Admin commands. Admin offers an explicit takeover
for those sessions. Other Admin devices must take over before controlling an
Admin-owned source; this is a single-operator workflow, not a multi-writer lock.

Direct Admin input uses the same paced latest-snapshot writer as other sources,
without a command/acknowledgement round trip. Saved feedback means the source
snapshot was confirmed by Wix. Navigation, category and difficulty changes
always hide the new word in Study and reset its marks. Admin always shows the
full spelling, judge cards and word information regardless of that setting;
its visibility control is labeled Reveal/Hide in Study. Admin has no audio
elements, pronunciation control or result sounds. Grade
groups (`4TH-5TH`, `6TH-7TH`, `JUNIOR`, `SENIOR`) are the available categories.

Admin reads its own source only every six seconds to detect ownership changes
or repair a stale source snapshot; it does not continuously fetch its own
edits. Study follows an Admin source through the normal reader and same-device
channel. An older Study page can briefly overwrite a source while taking over;
Admin repairs that snapshot and refreshed Study pages become followers.

Run `node --test "Spelling Bee/tests/session-engine.test.cjs"` for selection and
revision rules, and `node "Spelling Bee/tests/admin-source-browser.cjs"` for
independent Admin, three judges, connected Study, category/difficulty hiding,
quota retry, public result publishing, resume and legacy session takeover.
The browser test uses isolated contexts and the actual Velo handlers against a
simulated CMS; it never changes live contest records.

## Shared synchronization

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

For Study-hosted sessions, Admin waits for the latest letter snapshot to be applied by Study before
replacing the single CMS command row with visibility, feedback, or navigation.
Snapshot failures retain the latest input and retry with a delay. HTTP 429 and
Wix WDE0014 errors pause background traffic and honor Retry-After. Read and
write quota failures have separate backoff counters, so successful reads cannot
reset an exhausted write quota. Non-idempotent control commands are not
replayed automatically after an uncertain outcome.

Confirmed saves are also sent through a BroadcastChannel scoped to the exact
session. This lets windows on the same device react without waiting for a poll.
The audience window accepts the same session code as Admin, Study and judges,
and resolves it locally to the separate public broadcast storage key. Admin's
screen link and code label both use the shared session code. The audience never
reads the private word session. Previously issued reserved broadcast codes
(`98` plus 18 digits) still open their public broadcasts directly.
The audience window subscribes only to its separate public broadcast session.
Word reveal has three manual scene choices: Correct, Neutral and Incorrect.
These are joined segments of one coloured control in Admin.
They publish `result=correct`, `pending` and `incorrect` respectively through
the existing broadcast contract. Choosing a variant changes only the preview;
Take scene live publishes it. Judging feedback events never change the draft
variant or publish a result. The audience uses a left-aligned Word heading,
large spelling and contestant identity, with green, white or red spelling.
Other devices, or browsers without BroadcastChannel, use the HTTP readers.

Preparing the next contestant skips Completed entries and increments the first
number in the round label when wrapping to the first eligible entry. With no
current selection, the first preparation starts the existing round; a single
eligible contestant completes a loop on each following preparation. Round
changes remain in the draft until Take scene live. Custom labels without a
number gain `2` on the first wrap. The remaining-words dialog lists saved used
words below the available pools for the current category, grouped by
difficulty, using the existing source snapshot without more CMS requests.

Button hold/release feedback does not perform an action until a native click.
Judge success means Wix saved the snapshot. Legacy Admin command success additionally
requires the Study acknowledgement; changing words cannot acknowledge an
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
