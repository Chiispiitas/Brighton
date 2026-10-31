# Separate Werewolves backend

Site: `b23cf550-cf21-4b59-b909-da9a7ec8658b`
Public OAuth app ID: `bfa90d5e-3cf7-4c0d-a5c9-7646d41130d1`
Live origin: https://headless-cdpoaidonzo-chiispiitas-140b.wix-site-host.com
Source revision at initial release: `21eb58562cdacaba900ff08fd092dc1ce6eb0bc0`
Source revision after unanimous pack choices and public elimination reveals: `59fecea4becd284222e2ff7e090d1841f320ddec`.

This is a **server build**, not a static website upload. Build using `npm ci --ignore-scripts` then `npx astro build`, with the ignored `.env.local` created by the Wix headless setup flow. Wix injects runtime identity at release. No private API keys belong in these files or the frontend.

Package `dist/` and `.wix/` in a build archive, and the source without `node_modules`, generated output or `.env*` in a source archive. Release with Wix's UploadHeadlessWebsiteFiles build/source flow, passing the current source revision as the expected head. Preserve the site identity and URL. Refresh the source head before an update; do not overwrite someone else's newer release.

`src/game/engine.mjs` must match `../server/engine.mjs`. `src/pages/api/game.ts` is the only public game API. It validates game capabilities and commands before scoped elevation. `WerewolvesStates` must remain admin-only for all operations.

The explicit relative `wrangler.json` path works around a Windows drive-letter URL issue in the shipped adapter while retaining Wix's server runtime entry.
