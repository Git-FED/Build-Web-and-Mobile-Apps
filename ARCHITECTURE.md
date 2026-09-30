# Architecture

This document explains how the pieces of web2apk fit together, from your
website to a published app.

## High-level data flow

```text
┌────────────────────────────────────────────────────────────────────────┐
│                          Your website                                  │
│  (either a live URL via server.url, OR built static files in www/)     │
└───────────────────────────┬────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     capacitor.config.json                              │
│   appId · appName · webDir · server.url · plugins                      │
└───────────────────────────┬────────────────────────────────────────────┘
                            │  npx cap sync
                            │  (copies www/ into native projects, wires plugins)
          ┌─────────────────┴─────────────────┐
          ▼                                   ▼
┌─────────────────────┐               ┌─────────────────────┐
│      android/        │               │        ios/          │
│  Capacitor bridge    │               │  Capacitor bridge    │
│  + 18 plugins        │               │  + 18 plugins        │
│  + WebView           │               │  + WKWebView         │
└──────────┬───────────┘               └──────────┬───────────┘
           │ Gradle                                │ xcodebuild
           │ assembleDebug/Release/Bundle          │ (simulator/device)
           ▼                                       ▼
   .apk (per ABI + universal)              .app (simulator)
   .aab (Play bundle)                      .ipa (device, signed)
           │                                       │
           └───────────────────┬───────────────────┘
                               ▼
                  ┌────────────────────────┐
                  │   GitHub Actions CI    │
                  │  build / release / lint│
                  └────────────┬───────────┘
                               ▼
              Artifacts (PR) / GitHub Release (tag)
                               ▼
                 Play Store (AAB) / App Store (IPA)
```

## The Capacitor runtime model

Capacitor is a cross-platform native runtime that lets web apps access
native device features. At runtime:

1. The native app starts and shows the **splash screen** (configured in
   `capacitor.config.json` → `plugins.SplashScreen`).
2. A native **WebView** (`android.webkit.WebView` on Android, `WKWebView` on
   iOS) loads the bundled `www/` files — or, if `server.url` is set, your
   live website.
3. A **JavaScript bridge** (`window.Capacitor`) is injected into the WebView.
   Each plugin registers itself, so calling e.g. `StatusBar.setStyle(...)`
   from JS sends a message over the bridge to native code, which performs
   the action and resolves the returned Promise.
4. `www/app.js` runs on load and uses that bridge to set up the status bar,
   hide the splash, listen for network changes, handle the back button, and
   wire deep links.

## Web layer responsibilities

| File | Role |
|------|------|
| `index.html` | PWA shell / placeholder; loads CSS, registers the service worker, boots `app.js`. |
| `manifest.json` | PWA manifest — name, icons, theme, display mode, shortcuts. Lets the app be "installed" to the home screen in a browser too. |
| `sw.js` | Service worker. Precaches the app shell, network-first navigations with offline fallback, stale-while-revalidate for other assets. |
| `offline.html` | Shown by the service worker when a navigation fails and nothing is cached. |
| `app.js` | Capacitor plugin bridge + UX niceties (status bar, splash, network status card, back button, pull-to-refresh, haptics). |
| `styles.css` | Default dark/light theme with safe-area insets. |

## Native layer responsibilities

### Android

- `AndroidManifest.xml` declares the `MainActivity`, permissions (internet,
  location, camera, notifications, vibration), the `FileProvider` for
  sharing files, and deep-link intent filters.
- `MainActivity.java` extends `BridgeActivity`; plugins are registered via
  `capacitor.build.gradle` (generated from `capacitor.settings.gradle`).
- `build.gradle` handles versioning, ABI splits, release signing (env-driven
  with debug fallback), and R8/minify for release.
- `network_security_config.xml` enforces HTTPS; `backup_rules.xml` /
  `data_extraction_rules.xml` scope cloud backups.

### iOS

- `Info.plist` declares permission usage strings (required by App Review),
  ATS, the custom URL scheme, orientations, and launch screen.
- `AppDelegate.swift` / `SceneDelegate.swift` set up the
  `CAPBridgeViewController` and forward deep links and push callbacks.
- `capacitor.config.json` (iOS) lists the `packageClassList` of plugins.
- `Podfile` pulls the plugin pods from `node_modules`.

## CI/CD pipeline

| Workflow | Trigger | Output |
|----------|---------|--------|
| `build.yml` | push/PR to `main`, manual | validate → matrix Android (debug/release/bundle APKs+AAB) + iOS sim `.app`, as artifacts |
| `release.yml` | tag `v*` | signed release APKs + AAB, published as a GitHub Release with changelog |
| `lint.yml` | push/PR to `main` | Prettier, markdownlint, JSON validity, config validation |

Caches (Gradle, npm) speed up rebuilds; `permissions: contents: read`
follows least-privilege; `concurrency` cancels superseded runs.

## Decisions & trade-offs

- **Capacitor (not Cordova)** — modern, maintained, first-class TypeScript
  plugins, simpler native projects.
- **Per-ABI APKs + universal** — smaller downloads for real devices while a
  universal APK covers edge cases; an AAB is produced for Play Store.
- **Service worker by default** — gives bundled apps instant offline
  support; harmless for `server.url` apps (the SW only caches same-origin
  shell assets).
- **Debug-signed releases by default** — keeps the workflow zero-config; real
  signing is opt-in via secrets.
