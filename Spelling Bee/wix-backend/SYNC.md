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

The browser now uses one presenter reader per control view. Only Admin reads
the judge collection after joining. Idle presenter/judge heartbeats run every
20 seconds, with 45-second freshness checks. Command reads run roughly every
450 ms plus network time; presenter state reads run roughly every 950 ms
(250 ms while waiting for a command acknowledgement). Reads are deduplicated
within each page. Screen reads run roughly every 1.1 seconds.

Rapid letter inputs update locally immediately. Each writer keeps one newest
complete unsent snapshot rather than replaying a queue of obsolete snapshots.
Snapshot save failures retain that latest input and retry with a delay.
HTTP 429 and Wix WDE0014 quota errors pause the page's background traffic;
Retry-After is respected when supplied. Non-idempotent control commands are
not automatically retried after an uncertain outcome.

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

The 10-second six-view rehearsal made 67 requests versus 460 on commit
87485d0dd4ce37ad7f01ca1923c2615cc73aab2d (about 85% fewer); exact counts depend
on network and browser timing. This reduces demand rather than changing the
site's [Wix quotas](https://dev.wix.com/docs/develop-websites-sdk/maintain-your-site/scale-your-site/about-data-feature-limitations).
