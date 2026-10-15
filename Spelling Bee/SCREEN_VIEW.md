# Stage Screen View

Open the normal presenter, connect a numerical session, and join that session in **Admin View**. The new **Screen View · Show control** panel appears beneath the existing controls.

1. Paste contestants as `Name | Grade / class | Number`, one per line. Spreadsheet tabs work too. Edit names, numbers, status, and podium places in the table; publish the contestant list.
2. Click **Open audience screen** and move that window to the stage display. Press **F** or the fullscreen button. The screen has a 16:9 canvas and keeps safe margins for TV displays.
3. Choose a contestant, round and scene. Review the embedded preview, then **Take scene live**. Preparing the next contestant only changes the preview.
4. Load the current presenter's word information for definition and example scenes. The target word is masked. If the presenter changes words before a word cue is taken, that cue is blocked until reviewed.
5. Set a result manually. The **Reveal the current word** checkbox permits spelling to be sent only on the result scene. Leaving that scene clears permission. Judge votes and countdown expiry never publish a result.
6. Now Spelling has no timer. Admin's countdown controls apply only to the Break scene. Start, pause, reset or hide that countdown as needed.
7. To show lives, enable **Show remaining lives**, set the lives column for each contestant (or use **Set lives for all in preview**), and publish the contestant list. Blank hides the count for that contestant; zero displays **0 lives remaining**. Lives are off by default and are never changed automatically by judging, results or timers.
8. Mark contestants **Finalist** for the finalists scene and assign unique first, second and third places for the podium. The competition board lists everyone alphabetically with equal styling, without contestant numbers, ranks, placement badges or status highlights. Optional lives are labeled explicitly and never used to sort the board.

Scenes: standby, competition board, round introduction, now spelling, word definition, word example, decision pending, result / word reveal, break message, finalists, podium, closing.

The competition board rotates eight contestants per page; finalists rotate six per page, every eight seconds. Single-page boards remain still. Turn off rotation and select a page for manual operation. Scene changes use a smooth 1.4-second school-logo sweep with feathered edges, a short central hold and a gentle content fade underneath. Board page changes use content fades. Countdown-only updates do not replay the sweep. **Quiet / reduced motion** removes animated transitions; the OS reduced-motion preference is also respected.

The audience display follows the default view's ivory text, muted gold, Georgia type and subdued dark background. It uses factual scene labels without slogans or confetti. Optional break and closing messages are blank by default; the former stock messages are also hidden for existing saved broadcasts.

For rehearsal, open `screen.html?demo=1`. It cycles all twelve scenes with clearly labeled sample contestants and never connects to Wix. The admin iframe previews drafts without writing them to Wix.

## Backend contract

The existing published `spellingBeeSession` endpoint and `SpellingBeeSessions.presenterStateJson` field already preserve arbitrary JSON. No Wix code deployment or schema migration is required. A screen uses a separate session record with `screenBroadcast: true` and a normalized `broadcast` object. Its 20-digit numerical code is derived from SHA-256 of `bee-screen-v1:<presenter code>` with a `98` prefix. It never writes to the presenter's record, judge records or remote command stream.

The screen reads only its broadcast session. It never fetches presenter words, word pools or judge state. The audience contract excludes private presenter properties, word tokens and all spelling except an explicitly permitted result reveal. Contestants are stored in Wix with the broadcast, so reopening Admin View restores the published show. An unpublished draft is also retained in that browser.

Use one show operator at a time. An observed newer broadcast revision stops a stale write and asks the operator to review. This is a best-effort conflict check, not an atomic multi-operator lock. Session codes use the existing application's access model; screen codes are connection codes, not authenticated accounts.

Failed writes are reported and never labeled live. The screen keeps its last successful scene during connection loss, retries automatically, and shows a small reconnecting notice after three failures. Reloading the display restores the last published scene. There are no automatic eliminations or sound effects.

Validation: `node --test "Spelling Bee/tests/screen-model.test.cjs"` from the repository root.
