# Publishing guide

This guide walks you through publishing your app to the **Google Play Store**
and the **Apple App Store**. Before either, make sure you've:

1. Set a unique `appId` and `appName` (and updated all the native files — see
   [CONFIGURATION.md](CONFIGURATION.md)).
2. Generated custom icons & splash (`npm run assets`).
3. Set up a real signing keystore for Android (see
   [README → Signing](README.md#-signing-for-production-play-store)).

---

## Google Play Store

### 1. Create a Google Play Developer account

Go to <https://play.google.com/console> and enroll (one-time $25 fee).
Complete identity verification.

### 2. Create your app

In the Play Console → **Create app**. Fill in the app name, default
language, and whether it's an app or game. Accept the declarations.

### 3. Set up your app (dashboard checklist)

Play shows a "Set up your app" checklist. Complete at least:

- **App access** — declare if your app has login (provide demo credentials).
- **Ads** — declare whether your app contains ads.
- **Content rating** — fill the rating questionnaire (get an IARC rating).
- **Target audience** — select age groups.
- **News app / Data safety / Government apps / Financial features** — as
  applicable.
- **Privacy policy** — provide a hosted privacy policy URL (required).

### 4. Upload the signed AAB

Use the release AAB produced by `release.yml` (or `npm run build:bundle`
locally with signing secrets set).

Play Console → your app → **Production** → **Create release**. Upload the
`.aab`. Review the release notes, then **Review release**.

> Play now requires **Android App Bundles** (`.aab`) for new apps, not APKs.
> The `app-release-aab` artifact from CI is exactly this.

### 5. Store listing

**Main store listing**: app name, short & full descriptions, app icon
(512×512 PNG), feature graphic (1024×500 PNG), phone screenshots (min 2),
and category/tags. **Store Listing experiments** let you A/B test.

### 6. Roll out

After review (Play checks for policy/technical issues), click **Start
rollout to Production**. It can take a few hours to a few days for the first
review. Subsequent updates are usually faster.

---

## Apple App Store

> iOS requires macOS, Xcode, and an Apple Developer Program membership
> ($99/year). The CI `build-ios-simulator` job only builds for the simulator;
> a device/App Store build must be done (or signed) on macOS with proper
> provisioning.

### 1. Enroll in the Apple Developer Program

<https://developer.apple.com/programs/>. Complete identity verification.

### 2. Create an App ID & provisioning profile

In <https://developer.apple.com/account>:

- **Certificates, Identifiers & Profiles** → **Identifiers** → register an
  App ID matching your `appId` bundle id (e.g. `com.yourcompany.appname`).
  Enable the capabilities you need (Push Notifications, etc.).
- **Certificates** → create a **Distribution Certificate** (App Store & Ad
  Hoc).
- **Profiles** → create an **App Store** provisioning profile using the App
  ID + distribution certificate. Download it.

### 3. Configure signing in Xcode

```bash
npm run open:ios        # opens Xcode
```

In Xcode → select the **App** target → **Signing & Capabilities**:

- Team: your developer account.
- Bundle Identifier: your `appId`.
- Xcode auto-manages signing with the profile from step 2.

### 4. Archive & upload

- Select device target **Any iOS Device (arm64)** (not a simulator).
- **Product → Archive**. This produces an `.xcarchive`.
- In the Organizer window → **Distribute App → App Store Connect → Upload**.
- Xcode validates and uploads the build.

### 5. App Store Connect

<https://appstoreconnect.apple.com>:

- **My Apps → + → New App**. Set name, primary language, bundle id, SKU.
- **App Information**: category, privacy policy URL, age rating.
- **Screenshots**: per device size (iPhone 6.7", 6.5", 5.5", iPad 12.9").
- **App Review Information**: demo credentials if login-gated.
- Select the uploaded build under **TestFlight** or **App Store** tab.
- **Submit for Review**.

First review typically takes 24–48 hours. Address any rejection reasons in
**Resolution Center** and resubmit.

---

## Tips

- **Staged rollout (Play):** start production rollout at e.g. 10% and ramp up
  to catch issues early.
- **TestFlight (iOS):** distribute pre-release builds to internal/external
  testers before going live.
- **Versioning:** use `scripts/version-bump.mjs <major|minor|patch>` to bump
  `package.json`, Android `versionCode`/`versionName`, and iOS
  `MARKETING_VERSION`/`CURRENT_PROJECT_VERSION` consistently, then tag and
  push to trigger `release.yml`.
