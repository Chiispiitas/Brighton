# Spelling Bee stress tests — 2026-10-15

The main stress test used **12 judges, one Presenter, one Admin and three
audience screens: 17 browser views**. Each used separate browser storage and
shared browser channels were disabled. All synchronization therefore travelled
through the HTTP transport.

The test ran this repository's actual Velo handlers against an isolated CMS
substitute. That substitute counted every `find`, `insert`, and `update`,
including reads inside saves, and enforced separate rolling one-minute quotas
of 1,000 reads and 60 writes. These match the documented
[Wix Free-site CMS limits](https://dev.wix.com/docs/develop-websites-sdk/maintain-your-site/scale-your-site/about-code-on-free-sites).
Fast requests had 90 ms simulated delay; the slow-link phase used 850 ms.

## Findings and changes

| Scenario | Before | After |
| --- | --- | --- |
| 312 simultaneous letter inputs: Admin plus 12 judges, 24 letters each | Repeated quota errors; not fully caught up within the 85-second recovery window | Every input persisted intact in approximately 3–4 seconds, 27–28 CMS writes, no CMS quota errors in that burst |
| Letter mark immediately followed by Reveal/Hide | The command could replace the letter snapshot before Presenter read it | Presenter applies the letters before the next command is sent |
| Three repeated rounds with three judges, Admin, Presenter and three screens | First pacing revision used 57 writes | Final batching used 42 writes over approximately 51 seconds, with no CMS quota errors |
| 24 rapid local Presenter marks | 13 saves | 2 saves, preserving all 24 marks |

The simultaneous burst comparison uses the previous published version,
`623565da57ee58d86b3fadcad2a6a8f9006d2924`, and the revised implementation.
Completion time includes entering the letters. Exact counts and timings can
vary with browser scheduling and network conditions.

Further checks passed:

- Simultaneous write-quota rejection on all devices for 5.5 seconds, followed by
  recovery without a retry storm or missing input.
- Slow connections, a response lost after a successful save, and a three-second
  outage during mark/undo operations.
- Late previous-word responses do not rewind Admin; every judge resets on a new
  word. Fresh previous-word judge records appear as pending, never as old verdicts.
- Native press/release feedback and truthful saved/applied acknowledgements.
- All 12 audience scenes, word-only reveal, result acknowledgement, optional
  lives, word privacy, countdown, failed publishing and reconnection.
- Unit checks for quota backoff, response validation, payload normalization and
  the CMS substitute's operation accounting.

## Live checks and limits

All three live Wix HTTP endpoints returned successful read-only responses.
All four Spelling Bee CMS lookup indexes were verified ACTIVE. The backend is
currently on the Free plan.

The heavy workload and injected failures were isolated simulations, not a load
test against Wix's shared production infrastructure. They did not change real
contest data. The CMS substitute does not benchmark Wix containers or model
compute-request quotas, unrelated site traffic, every network failure, or every
Wix consistency behaviour. Passing these tests does not remove the plan's limits
or guarantee unlimited judges. Button input is immediate locally; confirmed
remote progress is batched to reduce writes.

Run instructions are in [the sync notes](../wix-backend/SYNC.md). JSON reports can
be produced with `BEE_STRESS_REPORT`. Use `BEE_BASELINE_REF` to run the same
browser workload against older assets.
