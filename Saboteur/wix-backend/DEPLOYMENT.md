# Independent Saboteur service

- Wix site: `84d715f7-dc9e-479c-9ceb-06b21aac8c1c` (Brighton Saboteur).
- Public OAuth app identity: `5a1ca7dc-4ade-4992-b775-e0600b3a33e8`.
- Service origin: https://headless-avyovqbniao-chiispiitas-140b.wix-site-host.com
- API: `/api/game`.
- Private CMS: `SaboteurStates`; all four permissions ADMIN / CMS_EDITOR.
- Initial live release: `8110c489-890d-4435-81af-7c25fb37e18b`, source revision `cb066c65550adebf5585a618927e23bbf09988d2`.

This service is separate from Werewolves and every other Brighton app. It uses an Astro server build with Wix's hosting adapter. Do not publish it as a static file upload. Runtime credentials are injected by Wix; `.env.example` contains build placeholders, never a reusable service secret.

Copy `../server/*.mjs` to `src/game/` before building; CI verifies both directories match. Install from the pinned lock with `npm ci --ignore-scripts`, copy `.env.example` to the ignored `.env.local`, then run `npx tsc --noEmit -p .` and `npx astro build`. `../tools/package-backend.py` packages `dist/` plus `.wix/build-metadata.json` and the source separately, excluding logs and local credentials. Use the Wix UploadHeadlessWebsiteFiles server build/source flow; preserve the returned source revision and supply it as `expectedHeadRevisionId` on updates.

POST bodies use `{ type, code, token, requestId, expectedVersion, ...actionFields }`. Create uses a six-digit code, 64-hex device-generated host capability, name and mode. Join uses a separate player capability. `state` with `screen:true` always ignores the token and returns only the public projection. Other state reads are restricted to their supplied capability's projection. Commands validate actor, phase, version and legal targets before any write.

SHA-256 capability hashes stay inside admin-only immutable snapshots. Each write inserts an item with unique ID `roomCode-version`; duplicate inserts cannot overwrite a winner. Conflict losers reload consistent state before retrying the command. Actor-bound request receipts run before version checks. Responses forbid caching; frontend views never move to an older version. Rooms expire after 24 hours. Every eighth write prunes old snapshots beyond the conflict window, and room creation cleans a bounded expired batch. Receipts are bounded to the most recent 256 mutations.

The Wix CLI generator reports HTTP_ENDPOINT unsupported for this editorless Site project. Astro filesystem routing follows the existing deployed Werewolves pattern and the Wix Backend API runtime reference; `/api/game` was verified in the build output.

Public action-cue release: `b358eda5-7b87-4140-814c-a086fe3cb94b`; current Wix source revision `286d5f126e3823fd1a1813965b11338620f55781`. This is an additive snapshot update. No collections, identities, hands or active turns are reset.

Blitz release: `7c8482f0-0978-422b-beb1-1301a3ad2d22`; current Wix source revision `bb185481f730efe3cd15521ae94cc3afd8ec5048`. Optional `variant` on create defaults to Standard. Legacy snapshots keep the original board and three rounds. No active room migration.
