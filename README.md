# web2app.studio

Turn a live website URL into a launch-ready app shell for **Android, iOS, Windows, macOS, Linux, and the web/PWA**.

The repository includes a browser-first builder in `www/`. It validates a public URL, derives a safe reverse-domain app ID, previews the target site, remembers recent projects locally, and exports configuration JSON for each platform family.

## Use the builder

```bash
npm install
npx serve www
```

Open the local address, enter a public HTTPS URL, choose the app name and targets, then select **Generate app config**. The builder downloads:

- `*-capacitor.json` — live URL configuration for the Android and iOS Capacitor shells.
- `*-desktop.json` — Electron start URL and desktop targets.
- `*-manifest.json` — installable web/PWA metadata.

The builder is intentionally backend-free: projects are stored in the browser's local storage, and the generated files never leave the device.

## Build from the generated configuration

### Mobile (Capacitor)

Copy the generated Capacitor values into `capacitor.config.json`, then run:

```bash
npm install
npx cap sync android ios
npm run build:apk
```

Android debug APKs are produced by the included Gradle project. iOS device/App Store builds require macOS, Xcode, signing, and an Apple Developer account.

### Desktop (Electron)

The Electron shell loads a live URL when launched with either `WEB2APP_URL` or `--url=`:

```bash
WEB2APP_URL=https://yourwebsite.com npm run dist -- --linux
npm run dist -- --win
npm run dist -- --mac
```

### Web / PWA

The existing service worker and manifest make `www/` installable as a PWA. Cloudflare Pages is configured as the production static host. The Pages build copies `www/` into `dist/`, writes safe response headers, and can be deployed with the committed `wrangler.toml`. The live target URL is configured in the exported manifest; the builder itself remains available as the configuration dashboard.

### Cloudflare deployment

This repository is configured for the existing **Cloudflare Workers Build** named `fed-shell-universal-fleet-build`. It builds the static site into `dist/`, then the Worker serves those assets.

For the current Cloudflare Workers Build settings use:

- **Build command:** `npm run build`
- **Deploy command:** `npm run deploy` (or the existing `npx wrangler deploy`)
- **Root directory:** `/`
- **Node version:** `22.23.2`

The Worker configuration is in `wrangler.toml`; its entry point is `worker/index.js` and its static assets directory is `dist/`.

If you create a separate Cloudflare Pages project instead, use `wrangler.pages.toml`, build with `npm run build`, publish `dist`, and leave the deploy command empty.

## CI outputs

`.github/workflows/build.yml` builds:

- Android debug and release APKs for all configured architectures.
- An iOS Simulator app.
- Windows, macOS, and Linux Electron installers.

Production store distribution still requires the platform's own signing and review process. Android release artifacts are debug-signed by default; configure a real keystore before Play Store submission.

## Project structure

```text
www/                       URL-to-app builder and PWA shell
electron/main.cjs           Desktop URL loader
android/                    Capacitor Android project
ios/                        Capacitor iOS project
capacitor.config.json       Native shell configuration
.github/workflows/build.yml Cross-platform CI
scripts/test.mjs            Repository smoke tests
```


<img width="807" height="450" alt="1780084581" src="https://github.com/user-attachments/assets/df2d911b-3b04-4bad-a9f2-b436779f89d2" />

# web2apk — turn a website into an installable Android APK 

<a href='https://ko-fi.com/YOUR_USERNAME' target='_blank'>
    <img height='36' style='border:0px;height:36px;' src='https://ko-fi.com/img/githubbutton_sm.svg' border='0' alt='Buy Me a Coffee at ko-fi.com' />
</a>

This repo wraps a website in a native Android shell (using [Capacitor](https://capacitorjs.com))
and builds it into APKs automatically with GitHub Actions — no local Android Studio needed.

Every build produces **5 APKs**, so it works on every Android device/architecture:
- `app-arm64-v8a` — modern 64-bit phones (most phones since ~2019)
- `app-armeabi-v7a` — older 32-bit phones
- `app-x86` / `app-x86_64` — emulators / some tablets & Chromebooks
- `app-universal` — works on all of the above, just a bit larger

## 1. Point it at your website

Open `capacitor.config.json` and either:

**A) Load your live website (simplest)** — add a `server.url`:
```json
{
  "appId": "com.example.mywebapp",
  "appName": "My Web App",
  "webDir": "www",
  "server": {
    "url": "https://your-website.com",
    "androidScheme": "https"
  }
}
```

**B) Bundle static files offline** — delete everything in `www/` and put your built
website's files there instead (the `index.html`, `css/`, `js/`, etc.), and remove
`server.url` if present. The app will work without an internet connection.

Also update `appId` (a unique reverse-domain ID, e.g. `com.yourcompany.appname`) and
`appName` (the name shown under the icon).

## 2. Push to GitHub

Create a repo and push this whole folder to it. The workflow at
`.github/workflows/build.yml` runs automatically on every push to `main`.

## 3. Get your APK

Go to your repo's **Actions** tab → click the latest run → scroll to **Artifacts** →
download `app-debug-apks` (easiest to just install and test) or `app-release-apks`.
Unzip it, pick the APK matching the device (or the universal one), transfer it to
your phone, and install it (you'll need to allow "install from unknown sources" once).

You can also trigger a build manually anytime from the Actions tab → **Build APK (all
devices)** → **Run workflow**.

## Signing for production (Play Store)

The release APKs in this workflow are signed with the Android **debug key**, so they
install fine for testing but Google Play will reject them. To publish for real:

1. Generate a keystore: `keytool -genkey -v -keystore release.keystore -alias my-key -keyalg RSA -keysize 2048 -validity 10000`
2. Add it as a GitHub Actions secret (base64-encode the file) along with the store/key passwords.
3. In `android/app/build.gradle`, add a real `signingConfigs.release` block using those secrets and reference it from `buildTypes.release.signingConfig` instead of `signingConfigs.debug`.
4. Update `build.yml` to decode the keystore secret into a file before the release build step.

Happy to wire this up for you if/when you have a keystore ready.

## App icon & splash screen

Capacitor uses default placeholder icons. To customize:
```
npm install @capacitor/assets --save-dev
npx capacitor-assets generate
```
(after placing your `icon.png` / `splash.png` source images per the
[@capacitor/assets docs](https://github.com/ionic-team/capacitor-assets)).

## Project structure
```
capacitor.config.json     # points the app at your website (or bundled files)
www/                      # bundled web files (only used if server.url is not set)
android/                  # native Android project (generated, safe to regenerate via `npx cap add android`)
.github/workflows/build.yml   # CI: builds APKs for every architecture on every push
```
