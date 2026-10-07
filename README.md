# Personal Hub — Render static hosting

This repository contains prebuilt Personal Hub 0.3.4 installation files. No Bun server, Tailscale or PC needs to stay running to serve these assets. Runtime app start/stop permission on a URL installation must still be tested on your Mentra version. A static host cannot supply the dev WebSocket or grant host privileges. This package does not solve iPhone notification forwarding or silent-audio suspension.

## Setup

1. Create a GitHub repository named personal-hub (public or private).
2. Upload the extracted contents of this folder to the repository root: public/, render.yaml, README.md. Do not upload just the ZIP, and do not nest everything under another parent folder. GitHub browser upload supports dragging the public folder and files together. Commit.
3. On dashboard.render.com choose New → Static Site and connect that GitHub repository.
4. Name: personal-hub. Branch: main. Root Directory: blank. Build Command: true. Publish Directory: public. Create Static Site. No environment variables required. If prompted to choose a workspace plan, choose the free Hobby option. Do not create a paid Web Service for these static assets.
5. Once deployment is live, open https://YOUR-SITE.onrender.com/miniapp/miniapp.json and verify that it shows Personal Hub version 0.3.4. The /miniapp/bundle.zip URL should download a ZIP.
6. In Mentra Settings → Developer settings → Mini App Development → Load Mini App from URL, paste https://YOUR-SITE.onrender.com/miniapp (no miniapp.json suffix, no port number).
7. Stop the previous developer instance before testing this version. Hosted installation uses the same com.personal.ringshortcuts package, so it may update/replace the prior tile. Keep the source ZIP backed up for rollback.
8. First test HUD and ring controls, then app launches. If launches return NOT_PERMITTED, the hosted install has different host permissions. Keep the exact error; do not assume the static site failed.

Optional cache headers: in Render Headers add Cache-Control: no-cache for /miniapp/miniapp.json and /miniapp/bundle.zip. render.yaml supplies these if deployed via Blueprint; manual Static Site setup does not automatically apply render.yaml settings. Do not add a catch-all SPA rewrite: missing manifests/assets should return errors instead of HTML.

## Updating

These are prebuilt files, so source edits alone will not update the app. Build/prepare a new hosting package and commit its public/ folder. Bump the miniapp version for code changes. Existing install update/offline caching behavior depends on Mentra host support. The provider supplies HTTPS and a free onrender.com address; no custom domain purchase required. Free static hosting is subject to Render bandwidth/build quotas.
