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
