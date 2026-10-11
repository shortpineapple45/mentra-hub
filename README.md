# Personal Hub — Render static hosting

This repository contains prebuilt Personal Hub 0.4.1 installation files. No Bun server, Tailscale or PC needs to stay running to serve these assets. Runtime app start/stop permission on a URL installation must still be tested on your Mentra version. A static host cannot supply the dev WebSocket or grant host privileges. This package does not solve iPhone notification forwarding or silent-audio suspension.

## Setup

1. Create a GitHub repository named personal-hub (public or private).
2. Upload the extracted contents of this folder to the repository root: public/, render.yaml, README.md. Do not upload just the ZIP, and do not nest everything under another parent folder. GitHub browser upload supports dragging the public folder and files together. Commit.
3. On dashboard.render.com choose New → Static Site and connect that GitHub repository.
4. Name: personal-hub. Branch: main. Root Directory: blank. Build Command: true. Publish Directory: public. Create Static Site. No environment variables required. If prompted to choose a workspace plan, choose the free Hobby option. Do not create a paid Web Service for these static assets.
5. Once deployment is live, open https://YOUR-SITE.onrender.com/miniapp/miniapp.json and verify that it shows Personal Hub version 0.4.1. The /miniapp/bundle.zip URL should download a ZIP.
6. In Mentra Settings → Developer settings → Mini App Development → Load Mini App from URL, paste https://YOUR-SITE.onrender.com/miniapp (no miniapp.json suffix, no port number).
7. Stop the previous developer instance before testing this version. Hosted installation uses the same com.personal.ringshortcuts package, so it may update/replace the prior tile. Keep the source ZIP backed up for rollback.
8. First test HUD and ring controls, then app launches. If launches return NOT_PERMITTED, the hosted install has different host permissions. Keep the exact error; do not assume the static site failed.

Optional cache headers: in Render Headers add Cache-Control: no-cache for /miniapp/miniapp.json and /miniapp/bundle.zip. render.yaml supplies these if deployed via Blueprint; manual Static Site setup does not automatically apply render.yaml settings. Do not add a catch-all SPA rewrite: missing manifests/assets should return errors instead of HTML.

## Updating

These are prebuilt files, so source edits alone will not update the app. Build/prepare a new hosting package and commit its public/ folder. Bump the miniapp version for code changes. Existing install update/offline caching behavior depends on Mentra host support. The provider supplies HTTPS and a free onrender.com address; no custom domain purchase required. Free static hosting is subject to Render bandwidth/build quotas.

## Update your existing mentra-hub deployment to 0.4.1
1. Extract this ZIP. Upload the contents of `personal-hub-render` to your existing GitHub repository root, replacing `public/`, README.md and render.yaml. Commit. Do not upload only the ZIP or add an extra outer folder. `source/` is optional for hosting and contains the editable Hub source.
2. Wait for the Render deployment to finish (use Deploy latest commit if automatic deploy is off).
3. Open https://mentra-hub.onrender.com/miniapp/miniapp.json and check `version: 0.4.1`.
4. In Mentra Developer settings, load https://mentra-hub.onrender.com/miniapp again to update the installed Personal Hub.
5. Open Personal Hub, scroll to Quick Insight, enter your Gemini key and tap Save settings. The separate Quick Insight app has a different storage namespace; its key does not automatically transfer to the Hub. Enter it once here. Never commit the key to GitHub or this package.
6. Try Display test and a typed sentence, then select Quick Insight from the ring menu (or tap Start listening on the phone). Pause stops Quick Insight and returns to the ring menu. Stop the separate Quick Insight app to avoid competing transcripts and displays.

Quick Insight is built into the Hub; no developer app-start privilege is needed for this option. Original Merge, Translation, Notes and Teleprompter shortcuts remain. Menu scrolls to fit five G1 text rows. Clock/calendar/weather/battery/daily verse retain existing behavior. Quick Insight has 8–40-word, 3–30-second and 1–5-frequency sliders. Frequency 4 is Helpful; 5 offers context about named people and concepts. There is no fixed request interval. Only one request runs at a time, and Google quota backoff still applies. Main-display insights are suppressed while the menu or another shortcut app is active. Lookup HUD uses the dashboard view.

Listening starts manually each time the Hub launches. Keys are stored in Mentra phone-local storage, not an encrypted vault. Recent conversation and insight history stay in memory; text sent to Gemini is subject to Google's API terms and quotas. Static files contain no API key. No backend or running PC is needed for Gemini requests after installation.

Source changes: run `bun install` and `bun run build` inside source/ before regenerating hosting assets. Source edits alone do not change the prebuilt public folder.

Validation: TypeScript checks and 11 automated tests pass, including actual-HTML UI initialization, ring launch/return behavior, silent-response filtering, frequency migration and preserved battery/verse behavior. Live iPhone/G1 behavior and API access still require device testing.

## General live lookup in 0.4.1
Quick Insight now handles any public subject, not just weather or NFL. It first decides whether a normal insight is enough or whether a current/source-verified answer is needed. Only the latter runs a second request with Gemini's Google Search tool. Names, concepts, corrections, word limits, sensitivity, duplicate suppression and NO_INSIGHT keep working as before.

After updating, enable **Enable general web lookup when needed** in the Hub's Quick Insight section, enter a city/area for local questions and tap Save settings, then Start listening. General lookup is off by default to avoid silently enabling a paid tool. Google lists Google Search grounding as unavailable on the Gemini 3.5 Flash-Lite free API tier. Billing-enabled access is required for that model; usage and search fees can apply. The app never enables billing for you. Gemini 2.5 Flash-Lite may offer free grounding quota for accounts already eligible for that model, but model access is restricted for new projects. See https://ai.google.dev/gemini-api/docs/pricing and https://ai.google.dev/gemini-api/docs/generate-content/google-search for current terms.

Sources and Google's search suggestions appear below the phone preview. The glasses show the short answer. Search may take longer than a normal insight. If sources cannot verify a current answer, the app says it could not verify it. If API search is unavailable, the phone reports the access error; normal insights continue. Search does not access private accounts or every webpage, and no model can guarantee answers to everything. No ESPN-specific or other topic-limited integration is used.

## Update your existing mentra-hub deployment to 0.4.1
1. Extract this ZIP. Upload the contents of `personal-hub-render` to your existing GitHub repository root, replacing `public/`, README.md and render.yaml. Commit. Do not upload only the ZIP or add an extra outer folder. `source/` is optional for hosting and contains the editable Hub source.
2. Wait for the Render deployment to finish (use Deploy latest commit if automatic deploy is off).
3. Open https://mentra-hub.onrender.com/miniapp/miniapp.json and check `version: 0.4.1`.
4. In Mentra Developer settings, load https://mentra-hub.onrender.com/miniapp again to update the installed Personal Hub.
5. Open Personal Hub, scroll to Quick Insight, enter your Gemini key and tap Save settings. The separate Quick Insight app has a different storage namespace; its key does not automatically transfer to the Hub. Enter it once here. Never commit the key to GitHub or this package.
6. Try Display test and a typed sentence, then select Quick Insight from the ring menu (or tap Start listening on the phone). Pause stops Quick Insight and returns to the ring menu. Stop the separate Quick Insight app to avoid competing transcripts and displays.

Quick Insight is built into the Hub; no developer app-start privilege is needed for this option. Original Merge, Translation, Notes and Teleprompter shortcuts remain. Menu scrolls to fit five G1 text rows. Clock/calendar/weather/battery/daily verse retain existing behavior. Quick Insight has 8–40-word, 3–30-second and 1–5-frequency sliders. Frequency 4 is Helpful; 5 offers context about named people and concepts. There is no fixed request interval. Only one request runs at a time, and Google quota backoff still applies. Main-display insights are suppressed while the menu or another shortcut app is active. Lookup HUD uses the dashboard view.

Listening starts manually each time the Hub launches. Keys are stored in Mentra phone-local storage, not an encrypted vault. Recent conversation and insight history stay in memory; text sent to Gemini is subject to Google's API terms and quotas. Static files contain no API key. No backend or running PC is needed for Gemini requests after installation.

Source changes: run `bun install` and `bun run build` inside source/ before regenerating hosting assets. Source edits alone do not change the prebuilt public folder.

Validation: TypeScript checks and 17 automated tests pass, including actual-HTML UI initialization, ring launch/return behavior, silent-response filtering, frequency migration and preserved battery/verse behavior. Live iPhone/G1 behavior and API access still require device testing.


## 0.4.2 Local AI
Upload the public folder to the same GitHub repository layout used for your Render site. In Mentra Quick Insight, select Local AI on my PC, enter your tunnel HTTPS base address and the private key generated by bun run setup on your PC. Save and test. Keep Ollama, the API server and tunnel running. Temporary tunnel addresses must be updated after restart. Local AI web search is not yet connected. Gemini remains available with its separately saved key.


## 0.4.3 Local AI
Upload the public folder to the same GitHub repository layout used for your Render site. In Mentra Quick Insight, select Local AI on my PC, enter your tunnel HTTPS base address and the private key generated by bun run setup on your PC. Save and test. Keep Ollama, the API server and tunnel running. Temporary tunnel addresses must be updated after restart. Local AI web search is not yet connected. Gemini remains available with its separately saved key.


## 0.4.4 Local AI
Upload the public folder to the same GitHub repository layout used for your Render site. In Mentra Quick Insight, select Local AI on my PC, enter your tunnel HTTPS base address and the private key generated by bun run setup on your PC. Save and test. Keep Ollama, the API server and tunnel running. Temporary tunnel addresses must be updated after restart. Local AI web search is not yet connected. Gemini remains available with its separately saved key.
