# Personal Hub 0.5.4

Upload the contents of personal-hub-render to your existing GitHub repository root, replacing the existing public folder, render.yaml and optional source folder. Commit the changes and wait for Render to finish its deployment. Static publish directory is ./public; build command is true.

Install/update in Mentra with https://mentra-hub.onrender.com/miniapp. Both the host page and app visibly show version 0.5.4. If Mentra shows an older version, use its miniapp update/reload option or rescan after deployment.

Menu: Close menu, Quick Insight, Translation, Notes. Quick Insight replaces Merge. The phone interface no longer includes Controls, App setup, Device test, Personal HUD, Make it yours, or Connection & data sections. The existing lookup HUD continues in the background using saved preferences.

Quick Insight is exclusively private PC AI. Save the current desktop HTTPS address and private key. Press Check PC connection. Typed Test insight works even without selecting Quick Insight; glasses popups are held while other apps/menu are open. Selecting Quick Insight subscribes to speech, and leaving stops that subscription. There is no separate Start listening button. The phone shows speech event count, PC request count, last speech, raw PC reply and connection failures.

Speech transcription still uses Mentra's transcription service; this update does not replace the glasses connection or speech capture platform. Your PC receives the system prompt and transcribed text and generates insights with Ollama. Live web search is not connected.

The desktop launcher opens a live prompt console automatically on Start, and has an Open prompt console button. Logs clear every 10 minutes. Stop the old launcher/server/tunnel before running the new version. Paste the newly generated tunnel address in Mentra.

Validation: TypeScript, production build and 18 Hub tests passed. Native Windows desktop process control requires testing on your PC.

0.5.4: Check PC connection and typed Test insight automatically save the currently entered address/key first. Blank key retains the saved PC key.

0.5.4: Full answers are preserved, longer answers page using host text layout when available. Replies superseded by newer final utterances are discarded. New frames replace old insight frames; NO_INSIGHT clears old insight text. Request IDs and host display acceptance are shown in diagnostics.
