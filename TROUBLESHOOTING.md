# Troubleshooting

Common issues and how to fix them.

## Android

### Blank screen / my website doesn't load

- Confirm `server.url` is correct and uses `https://`.
- Open Chrome on your computer, navigate to `chrome://inspect`, and inspect
  the WebView console for errors.
- If your site sets a strict **Content-Security-Policy**, make sure it
  allows the Capacitor scheme / your origin.
- For a local dev server over HTTP, set `server.cleartext: true` in
  `capacitor.config.json` (not for production).

### "App not installed" / "Install blocked"

- Enable **Install unknown apps** for the app you used to open the APK
  (Files, Chrome, etc.) in Settings → Apps.
- Make sure the APK's architecture matches your device (use the `universal`
  APK if unsure).
- A debug-signed APK can't overwrite a release-signed one (or vice versa)
  with the same package — uninstall the old one first.

### Release APK rejected by Google Play

- Play requires an **AAB**, not an APK, for new apps. Use the
  `app-release-aab` artifact (or `npm run build:bundle`).
- The default release build is **debug-signed**. Set up a real keystore and
  the `KEYSTORE_*` secrets (see
  [README → Signing](README.md#-signing-for-production-play-store)).

### Build fails in CI with "SDK licence not accepted"

- The `android-actions/setup-android@v3` action accepts licences
  automatically. If it fails, ensure no `local.properties` is committed
  (it's git-ignored) and that `ANDROID_SDK_ROOT` isn't being overridden.

### `minifyEnabled` stripped something it shouldn't

- Add keep rules in `android/app/proguard-rules.pro` for any reflected model
  classes. The shipped rules already preserve Capacitor's JS bridge.

## iOS

### Build fails with "module 'Capacitor' not found"

- Run `npx cap sync ios`, then (on macOS) `cd ios/App && pod install`.
- Open `App.xcworkspace` (not `App.xcodeproj`) in Xcode.

### Missing usage description strings

- Apple requires an `NS<Feature>UsageDescription` for any permission. They're
  set in `ios/App/App/Info.plist` already; edit the text to match your app's
  actual purpose or App Review will reject it.

### "No profiles for … were found"

- You're building for a device without signing. Enroll in the Apple
  Developer Program, set a Team in Xcode → Signing & Capabilities, and let
  Xcode auto-manage signing. The CI simulator build needs none of this.

### Splash shows then white flash

- Set `plugins.SplashScreen.backgroundColor` to match your splash image, and
  ensure `launchShowDuration` covers the WebView load. `app.js` calls
  `SplashScreen.hide()` once the DOM is ready.

## Web / PWA

### Service worker not updating

- Bump `VERSION` in `www/sw.js`; the activate handler purges old caches.
  In development, use Chrome DevTools → Application → Service Workers →
  "Update on reload".

### Icons look wrong when "installed"

- Make sure `manifest.json` references the maskable variants
  (`icon-maskable-192.png`, `icon-maskable-512.png`) with
  `"purpose": "maskable"`. They're included by default.

### `app.js` errors "plugin unavailable"

- That's expected in a plain browser — the bridge no-ops. It only means
  something inside a native shell. Make sure you ran `npx cap sync` after
  adding a plugin.

## General

### How do I change the app id / name everywhere?

- Run `scripts/setup.sh` — it rewrites the placeholder
  `com.example.mywebapp` / "My Web App" across Android and iOS files. Then
  `npx cap sync`.

### `npm ci` fails

- Keep `package-lock.json` committed: `npm ci` requires it. If it is out of
  sync with `package.json`, run `npm install` and commit both files. Ensure
  you're using Node 22 (`nvm use`) and can reach the npm registry.

### Still stuck?

- Open an issue with the workflow run link, the exact error, and the
  `capacitor.config.json` (redact secrets).
