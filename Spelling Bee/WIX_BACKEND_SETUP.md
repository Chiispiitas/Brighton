# Brighton Spelling Bee · Dedicated Wix backend and CMS

Spelling Bee has its **own backend contract and its own CMS collections**. It must not use the Brighton Exams `updateProgress` / `getProgress` endpoints or the Exams progress/results collections.

The static frontend targets this dedicated Wix backend:

`https://chiispiitas.wixsite.com/cms-server/_functions`

The Wix site is:

`https://chiispiitas.wixsite.com/cms-server`

## CMS collections

Create these three Wix CMS collections using the exact collection IDs below.

### 1. `SpellingBeeSessions`

One row per numerical Presenter session.

| Field name | Field ID | Type |
| --- | --- | --- |
| Title | `title` | Text |
| Session code | `sessionCode` | Text |
| Status | `status` | Text |
| Level | `level` | Text |
| Difficulty | `difficulty` | Text |
| Current word | `currentWord` | Text |
| Word token | `wordToken` | Text |
| Word sequence | `wordSequence` | Number |
| Pool count | `poolCount` | Number |
| Last command sequence | `lastCommandSeq` | Number |
| Used words JSON | `usedWordsJson` | Text |
| Presenter state JSON | `presenterStateJson` | Text |
| Presenter updated at | `presenterUpdatedAt` | Date and Time |
| Started at | `startedAt` | Date and Time |

Create an index for `sessionCode` if Wix allows it.

### 2. `SpellingBeeJudges`

One row per judge/device per session. Each judge can therefore update independently.

| Field name | Field ID | Type |
| --- | --- | --- |
| Title | `title` | Text |
| Record key | `recordKey` | Text |
| Session code | `sessionCode` | Text |
| Actor ID | `actorId` | Text |
| Level | `level` | Text |
| Difficulty | `difficulty` | Text |
| Current word | `currentWord` | Text |
| Word token | `wordToken` | Text |
| Word sequence | `wordSequence` | Number |
| Verdict | `verdict` | Text |
| Pointer | `pointer` | Number |
| Vote sequence | `voteSeq` | Number |
| Letter marks JSON | `letterMarksJson` | Text |
| Judge state JSON | `judgeStateJson` | Text |
| Judge updated at | `judgeUpdatedAt` | Date and Time |
| Started at | `startedAt` | Date and Time |

Create indexes for `recordKey` and `sessionCode` if possible.

### 3. `SpellingBeeCommands`

One row per session. The row always contains the latest Remote Control command. Command sequence numbers prevent an old command from being replayed.

| Field name | Field ID | Type |
| --- | --- | --- |
| Title | `title` | Text |
| Session code | `sessionCode` | Text |
| Actor ID | `actorId` | Text |
| Current word | `currentWord` | Text |
| Word token | `wordToken` | Text |
| Word sequence | `wordSequence` | Number |
| Command sequence | `commandSeq` | Number |
| Command type | `commandType` | Text |
| Command value | `commandValue` | Text |
| Command state JSON | `commandStateJson` | Text |
| Command updated at | `commandUpdatedAt` | Date and Time |
| Started at | `startedAt` | Date and Time |

Create an index for `sessionCode` if possible.

## Collection permissions

The browser must **not write directly to CMS**. Set all three collections as restrictively as practical. The Wix backend uses `suppressAuth: true` for the dedicated HTTP functions.

## HTTP functions

The implementation is in:

`Spelling Bee/wix-http-functions.js`

Add those exports to the Wix Velo backend `http-functions.js` file on `cms-server` and publish the Wix site.

The frontend uses these full endpoints:

- `GET https://chiispiitas.wixsite.com/cms-server/_functions/spellingBeeSession?sessionCode=1234`
- `POST https://chiispiitas.wixsite.com/cms-server/_functions/spellingBeeSession`
- `GET https://chiispiitas.wixsite.com/cms-server/_functions/spellingBeeJudge?sessionCode=1234`
- `POST https://chiispiitas.wixsite.com/cms-server/_functions/spellingBeeJudge`
- `GET https://chiispiitas.wixsite.com/cms-server/_functions/spellingBeeCommand?sessionCode=1234`
- `POST https://chiispiitas.wixsite.com/cms-server/_functions/spellingBeeCommand`

## Responsibilities

**Presenter** writes only to `SpellingBeeSessions`.

**Each Judge** writes only its own row in `SpellingBeeJudges`. The frontend heartbeat updates `judgeUpdatedAt`, so Remote Control can ignore judges that have gone stale.

**Remote Control** writes only the latest command to `SpellingBeeCommands`. The Presenter processes commands only when `commandSeq` increases and acknowledges that sequence in its session state.

## Why three collections

This avoids the race condition that would occur if Presenter, Remote Control, and multiple Judges all updated one CMS row. It also makes it possible to inspect active sessions, judge decisions, and remote commands separately in Wix CMS.

## First deployment check

1. Create the three collections with the exact IDs and fields above on the `cms-server` Wix site.
2. Add the backend functions to `http-functions.js`.
3. Publish the Wix site.
4. Open Presenter View and connect a numerical code.
5. Confirm one row appears in `SpellingBeeSessions`.
6. Join the same code from Judge View and confirm a row appears in `SpellingBeeJudges`.
7. Join from Remote Control, send `Call new word`, and confirm `SpellingBeeCommands` receives/updates one row.
8. Confirm the Presenter changes word after the command and updates `lastCommandSeq`.
