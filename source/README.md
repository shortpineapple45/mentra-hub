# Personal Hub 0.3.3

Install Merge, Translation, Notes and Teleprompter in Mentra first. This hub starts installed apps in the background while its phone screen stays open, so media controls remain attached. Pause stops the app selected by the hub and returns to the menu. Pause again selects an option. Next/previous navigate; in Notes they browse notes. Automatic play/resume never counts as a gesture. Volume remains phone volume.

## Windows installation

Extract this folder. In PowerShell inside it:

```powershell
bun install
$env:RING_LAN_IP = '192.168.1.121'
bun run dev
```

In Mentra: Settings → Developer settings → Mini App Development → Scan Mini App QR Code. Scan the NEW developer QR. Do not use the previous release QR. Keep PowerShell running and phone on the same LAN. Allow Bun through Windows Firewall on the private network if prompted. This uses Mentra's official developer server and needs no system zip executable. If your PC address changes, update RING_LAN_IP with the Ethernet/Wi-Fi IPv4 shown by Get-NetIPConfiguration.

Open Ring Shortcuts and press Enable ring / headphones once. Keep this miniapp's phone screen open; switching the phone UI to another miniapp can remove media controls. Translation language and Teleprompter script are configured on this screen using Apply launch settings. Hold on glasses returns to the menu; tap advances, double tap selects.

## Notifications

Install the existing Notify app from Mentra if available, then press Find and start installed Notify. The hub searches the actual installed apps rather than guessing an app ID and reports success/failure. The counter counts real notification events from Mentra; it is never fabricated. Notify handles its own popups. The hub does not stop Notify when returning from a shortcut.

The old community Notify app receives notifications from Mentra; it cannot capture iPhone notifications independently. Current upstream phone notification capture is Android-only, and iOS native notification support is declared for G2 rather than G1. If the count remains zero and Notify also shows nothing, this build cannot repair that missing host notification feed. A Mentra host update/support fix is needed. Test popups are not proof that phone notification delivery works.

## Limits and validation

Background app start/stop/actions are privileged on current Mentra. Developer-mode miniapps are allowed; ordinary release installations are not. Therefore this version deliberately uses developer installation and needs the PC available. It has not been verified on your installed iPhone host. If app controls are rejected, its UI shows the actual error. Merge is started normally; no unsupported Merge action is invented. Other apps must expose the published actions; missing actions are reported. Notes startup follows Notes' existing settings.

Source references: MentraOS mobile/src/miniapps/LocalMiniappRuntime.ts; mobile/modules/engine/src/facades/phoneNotifications.ts; mobile/src/services/PhoneNotificationsSync.ts; Mentra-Community/Notify. Dependencies include their license notices in licenses/.

Validation: npm-compatible node tests with mocked host, TypeScript checking, and Bun production build. These cover returning from an active app and media auto-resume suppression; hardware behavior still requires your device test.

Close menu is the first entry. Use Previous/Next to highlight it and Pause to select. Pause while closed reopens the menu. All five entries fit on G1 without a separate header.

## Combined Personal HUD

Personal HUD and ring controls share one miniapp and phone screen. Stop the old standalone Personal HUD and Ring Shortcuts before starting this version to avoid competing displays. This updates the Ring Shortcuts package in place. Install via the developer QR using the same instructions above. The HUD renders only to the dashboard/lookup view. Main-display notification popups are suppressed while the shortcut menu or a selected app is active; notification history remains on lookup. Glasses taps belong to shortcut controls; notification history has phone buttons. Combining apps does not repair missing iOS notification forwarding or guarantee background audio survival.

HUD settings, refresh, calendar, live clock, actual battery, location/weather and phone preview are included. The HUD requests calendar/location access. Weather requires internet and valid coordinates or host location. Existing standalone HUD settings are not imported; configure them in the combined screen.

0.3.3: Removed home notification controls/history and disabled HUD notification presentation. Teleprompter opens the actual installed app UI via Mentra deep link, without replacing its script. Switching foreground UI may interrupt ring audio; return to hub and enable controls again. Battery displays host-event age, becomes stale after two minutes, clears on disconnect, and Refresh renews its subscription. Renewing subscriptions does not force hardware polling and the host may replay cached data. No battery percentage is fabricated.

0.3.3: Last HUD row is a daily short King James Version Bible verse with reference. Seven verses rotate by local calendar date and work offline; battery reading is unchanged. Long lines may wrap/truncate within the G1 text layout. Notification history is disabled.

0.3.4 restores the exact 0.3.0 battery behavior: one host subscription, retain last reading on disconnect, compact percent/charging display, original 15-minute old indicator, and no resubscription on Refresh. Daily Bible verse remains.
