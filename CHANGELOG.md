# Changelog

All notable changes to **web2apk** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] — 2025-08-25

A ground-up upgrade of the original web-to-APK wrapper. The project is now a
full cross-platform mobile-app factory (Android + iOS), plugin-rich,
PWA-ready, offline-capable, and fully automated via GitHub Actions.

### Added

#### Web layer (PWA + offline)

- Full PWA `www/index.html` with theme color, viewport, Apple touch icons,
  manifest link, and Open Graph / Twitter card meta tags.
- `manifest.json` with name, short name, icons, theme/background colors,
  display mode (`standalone`), orientation, scope, start URL, and app
  shortcuts.
- Service worker (`sw.js`) with a cache-first strategy for the shell and a
  network-first strategy for navigations, plus an offline fallback page.
- `offline.html` fallback shown when the device is offline.
- `app.js` — Capacitor plugin bridge (status bar, splash, haptics, network,
  app lifecycle, back-button handling, pull-to-refresh, deep-link listener).
- `styles.css` — system-font stack, safe-area insets, dark-mode awareness,
  and a styled offline page.
- `robots.txt`, `humans.txt`, `browserconfig.xml`, and an OG image asset.

#### Capacitor plugins (18 added)

- `@capacitor/status-bar` — themed status bar that does not overlay WebView.
- `@capacitor/splash-screen` — configurable launch splash with fade-out.
- `@capacitor/haptics` — native haptic feedback.
- `@capacitor/app` — lifecycle, back button, app state, URL open.
- `@capacitor/keyboard` — keyboard resize & style.
- `@capacitor/preferences` — key/value persistent storage.
- `@capacitor/network` — online/offline detection + listener.
- `@capacitor/geolocation` — device location.
- `@capacitor/camera` — photo capture / gallery.
- `@capacitor/file-system` — local file read/write.
- `@capacitor/share` — native share sheet.
- `@capacitor/push-notifications` — remote push.
- `@capacitor/local-notifications` — scheduled local notifications.
- `@capacitor/device` — device info (model, OS, version).
- `@capacitor/browser` — in-app browser for external links.
- `@capacitor/toast` — native toast messages.
- `@capacitor/clipboard` — clipboard read/write.
- `CapacitorHttp` — native HTTP bypassing CORS when enabled.

#### Android native upgrades

- Hardened `AndroidManifest.xml`: explicit permissions (internet, network
  state, camera, geolocation, vibration, notifications), `FileProvider`,
  deep-link intent filters, backup rules, data extraction rules, and a
  network security config.
- `network_security_config.xml` — HTTPS enforced, optional cleartext toggle.
- `backup_rules.xml` + `data_extraction_rules.xml` for scoped backup.
- Upgraded `MainActivity.java` with plugin registration and lifecycle hooks.
- Upgraded `build.gradle`: dynamic versionCode/versionName from env vars,
  release signing config driven by GitHub secrets, R8/minify enabled for
  release, App Bundle (`bundleRelease`) support, and ABI splits retained.
- Performance `gradle.properties` flags (parallel, caching, daemon, KGP).
- Real `proguard-rules.pro` keep rules for WebView JS interfaces & WebView.
- New `colors.xml`, themed `styles.xml`, and adaptive icon XML.
- Proper splash + adaptive icon resources.

#### iOS native upgrades

- Upgraded `Info.plist`: permission usage strings (camera, location,
  notifications), `ATS` allows arbitrary loads for bundled apps, URL scheme,
  status bar hidden-on-launch, full orientation support, and launch-screen
  config.
- Upgraded `AppDelegate.swift` with plugin registration and push-notification
  wiring.
- Upgraded `SceneDelegate.swift` with deep-link (`openURLContexts`) handling.
- `capacitor.config.json` (iOS) with the full `packageClassList`.
- `Podfile` with all plugin pods and deployment targets.

#### CI/CD (GitHub Actions)

- `build.yml` — matrix build: Android debug APKs (per-ABI + universal),
  release APKs/AAB, and iOS simulator build. Gradle + npm caching,
  permissions hardened to `contents: read`.
- `release.yml` — triggered by `v*` tags; decodes a signing keystore from
  secrets, builds signed release APK + AAB, and creates a GitHub Release
  with artifacts and an auto-generated changelog.
- `lint.yml` — markdown lint, Prettier check, JSON validation, and config
  validation on every PR.
- `dependabot.yml` — weekly updates for npm, GitHub Actions, and Gradle.
- Signed-release support via `KEYSTORE_BASE64` / `KEYSTORE_PASSWORD` /
  `KEY_ALIAS` / `KEY_PASSWORD` secrets.

#### Documentation

- Rewritten `README.md` (features, quickstart, full config, plugin list,
  CI, signing, Play Store + App Store publishing, troubleshooting, FAQ).
- `CONFIGURATION.md` — every `capacitor.config.json` option documented.
- `PUBLISHING.md` — step-by-step Play Store & App Store guides.
- `PLUGINS.md` — every included plugin with JS usage examples.
- `ARCHITECTURE.md` — how the wrapper, WebView, plugins, and CI fit together.
- `TROUBLESHOOTING.md` — common issues and fixes.
- `docs/` folder with diagrams (ASCII) of the build pipeline.

#### Tooling & scripts

- `scripts/setup.sh` — one-command bootstrap.
- `scripts/build-android.sh`, `scripts/build-ios.sh` — convenience builders.
- `scripts/generate-icons.sh` — runs `@capacitor/assets` from source images.
- `scripts/version-bump.mjs` — bumps `package.json`, Android, and iOS versions
  consistently.
- `scripts/validate-config.mjs` — validates `capacitor.config.json` schema,
  checks required files, and verifies `appId`/`appName` are not placeholders.
- `scripts/release.sh` — tags and pushes a release (local convenience).
- `Makefile` with `make` targets for every common action.
- `.vscode/` — recommended extensions, settings, and tasks.
- `.prettierrc`, `.prettierignore`, `.markdownlint.jsonc` for formatting.
- `resources/` source icon & splash images for `@capacitor/assets`.

### Changed

- Bumped project version `1.0.0` → `2.0.0`.
- `package.json` now declares `engines.node >=20`, full metadata, funding,
  and a comprehensive `scripts` block.
- `.gitignore` expanded to cover Pods, generated assets, keystores, and
  editor cruft.
- `.nvmrc` pinned to Node 22.
- `capacitor.config.json` restructured with `iosScheme`, `loggingBehavior`,
  `errorReporting`, and a `plugins` block.

### Security

- Release signing keys are never committed; signing is driven by GitHub
  Actions secrets only.
- `google-services.json` / `GoogleService-Info.plist` are git-ignored.
- Network security config enforces HTTPS by default.

## [1.0.0] — initial release

- Basic Capacitor wrapper that bundles a website or loads a live `server.url`.
- GitHub Actions workflow building per-ABI debug + release APKs (debug-signed).
- iOS simulator build job.
- Placeholder `www/index.html`, default icon & splash.
- Minimal README with quickstart and signing notes.
