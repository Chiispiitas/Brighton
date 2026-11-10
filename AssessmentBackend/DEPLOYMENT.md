# Brighton assessment service

The frontend stays at https://exams.bebrighton.net/ and publishes through
GitHub Pages. All assessment API calls share `Exams/config.js`.

The server publishes directly from this project, without opening Wix Editor.

| Purpose | Identity |
| --- | --- |
| Hosting site | `dbc6b0a6-da6e-4b6d-bf33-bb62fa192f79` |
| Hosting app | `2784ce3f-1eed-4481-95aa-79504763e86b` |
| API base | `https://headless-yvtolzojmbe-chiispiitas-140b.wix-site-host.com/api/assessment` |
| Original CMS and secrets site | `06a80236-67d7-4837-b4c8-2a62b29ee79b` |
| Server-only data application | `47b056bf-0d0b-4cc6-b454-9acee44fa8c4` |
| Data application instance | `9f83c8ae-910e-4fda-a449-fb11beb6902f` |

The server uses documented SDK AppStrategy client credentials to access the
original site's CMS and Secrets Manager. Its private environment variables are
`ASSESSMENT_DATA_APP_ID`, `ASSESSMENT_DATA_APP_SECRET`, and
`ASSESSMENT_DATA_INSTANCE_ID`. They were configured inside Wix, never exported
to GitHub. Hosting and data identities intentionally differ.

The original Editor publication stays available for older open browser tabs and
rollback. New traffic uses this service. No database import, copy, ID rewrite or
permission widening is needed. Existing session capabilities and class codes
continue to work. The earlier experiment attaching hosting to the Editor site
does not serve these routes and must not be used for future releases.

## Build and verify

From this directory:

```powershell
npm ci --ignore-scripts
Copy-Item .env.example .env.local
npm test
npm run build
python scripts/package.py <absolute-output-directory>
```

The build copies the eleven canonical assessment modules, adapting only their
Velo platform imports to server-only SDK/native HTTP adapters. It also bundles
the current immutable exam answer-key release as fallback for missing CMS keys.
Historical-version protections remain in the canonical grader. Public health
returns source hashes and the bundled-key hash for deployment verification.

The source ZIP includes canonical module and answer-key snapshots so the
Code Store download is independently buildable. Preparation uses the live repo
sources when present and the packaged canonical snapshots otherwise.

## Direct release through Wix tools

1. Read the current source revision using Code Store Generate Download URL for
   managed project `2784ce3f-1eed-4481-95aa-79504763e86b`, in hosting-site scope.
   Retain its revision as `expectedHeadRevisionId`. If someone else changed it,
   inspect/reconcile that source before replacing it.
2. Call `UploadHeadlessWebsiteFiles` with the hosting site ID, `prepare:true`,
   and the exact byte size of `assessment-build.zip`.
3. PUT the build and source ZIPs to the signed URLs returned by that call.
4. Complete the upload with its `uploadKey`, `sourceUploadId` and the expected
   source revision. This is a server build, not a static site drop.
5. Check `/api/assessment/brightonBackendHealth`, compare source hashes, and
   exercise the changed live routes before reporting success.

Use the same hosting site and stable URL for later releases. Never provision
another hosting site for an ordinary update. Source archives exclude installed
dependencies, build caches and private environment files.

## Contract checks and rollback

The router exports the same named assessment operations as the Velo router,
including Young Learners dashboards. It supports JSON/text POST, query-string
GET, CORS preflight, bounded request sizes and uncached results. Unknown routes
and unsupported methods cannot invoke generic CMS operations.

Live migration verification covers catalog/result parity, all catalog exams,
all configured unit Tests, progress insert/update, all writing profiles' saved
AI assessment and teacher save/revert, and real Adult/Young Learners audio
assessment. Synthetic records are identified and removed separately.

To roll the frontend back, restore `Exams/config.js` API base to
`https://chiispiitas.wixsite.com/brightonexams/_functions` and bump the config
cache key. Both servers use the original data, so rollback needs no database
restore. Preserve the last working source/build receipts for backend rollback.

