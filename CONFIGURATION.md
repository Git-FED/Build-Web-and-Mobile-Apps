# Configuration reference

`capacitor.config.json` is the single source of truth for your app. This
document covers every option it understands, plus the related native files
that must stay in sync.

## The root object

```json
{
  "appId": "com.example.mywebapp",
  "appName": "My Web App",
  "webDir": "www",
  "bundledWebRuntime": false,
  "androidScheme": "https",
  "iosScheme": "capacitor",
  "loggingBehavior": "debug",
  "errorReporting": true,
  "server": { ... },
  "plugins": { ... }
}
```

### Top-level fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `appId` | string | — | **Required.** Reverse-domain unique identifier, e.g. `com.yourcompany.appname`. Must match the Android `applicationId`/`namespace` and the iOS bundle id. |
| `appName` | string | — | **Required.** Human-readable name shown under the app icon and in the app switcher. |
| `webDir` | string | `www` | Directory (relative to the project root) containing the web files to bundle. |
| `bundledWebRuntime` | boolean | `false` | Legacy Capacitor 2 option. Leave `false` for Capacitor 3+. |
| `androidScheme` | string | `https` | Scheme used to serve bundled files on Android (`https` or `http`). `https` is recommended. |
| `iosScheme` | string | `capacitor` | Scheme used to serve bundled files on iOS (`capacitor` or `http`). |
| `loggingBehavior` | string | `debug` | One of `debug`, `production`, `none`. Controls native console log verbosity. |
| `errorReporting` | boolean | `true` | When `true`, the native bridge surfaces uncaught JS errors to the system log. |

### `server`

Controls how the WebView loads content.

```json
"server": {
  "androidScheme": "https",
  "iosScheme": "capacitor",
  "cleartext": false,
  "url": "https://your-website.com"
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `url` | string | — | **Optional.** If set, the app loads this live website instead of the bundled `www/` files. Great for sites that already work well on mobile. |
| `androidScheme` | string | `https` | Overrides the top-level scheme for Android. |
| `iosScheme` | string | `capacitor` | Overrides the top-level scheme for iOS. |
| `cleartext` | boolean | `false` | Allow plain HTTP traffic. Only set `true` if you must load an `http://` site (e.g. local dev). |

### `plugins`

Per-plugin configuration blocks. Only plugins you've installed and synced
read these. The defaults shipped here:

#### `SplashScreen`

```json
"SplashScreen": {
  "launchShowDuration": 2000,
  "launchAutoHide": true,
  "backgroundColor": "#0b1020",
  "androidSplashResourceName": "splash",
  "androidScaleType": "CENTER_CROP",
  "showSpinner": false,
  "iosSpinnerStyle": "small",
  "splashFullScreen": true,
  "splashImmersive": true,
  "fadeOutDuration": 400
}
```

`launchShowDuration` is how long the native splash stays before the JS calls
`SplashScreen.hide()` (or it auto-hides). `backgroundColor` should match
your splash image background for a seamless transition.

#### `StatusBar`

```json
"StatusBar": {
  "style": "DARK",
  "backgroundColor": "#0b1020",
  "overlaysWebView": false,
  "iosAnimation": true
}
```

`style` is `DARK` (light icons on dark) or `LIGHT` (dark icons on light) on
iOS; on Android it sets the background color. `overlaysWebView: false` means
the WebView starts below the status bar — recommended for predictable layout.

#### `Keyboard`

```json
"Keyboard": {
  "resize": "body",
  "style": "DARK",
  "resizeOnFullScreen": true
}
```

`resize` controls how the app reacts to the keyboard: `body` (resize the
page), `native` (resize the WebView), `ionic` (for Ionic apps), or `none`.

#### `CapacitorHttp`

```json
"CapacitorHttp": {
  "enabled": true
}
```

When enabled, `fetch`/`XHR` are routed through the native HTTP stack,
**bypassing CORS** and using native cookies/certificates. Useful when your
web code hits APIs that don't send CORS headers.

---

## Keeping native files in sync

When you change `appId` / `appName`, these files must also be updated:

| File | What to change |
|------|----------------|
| `android/app/build.gradle` | `applicationId`, `namespace` |
| `android/app/src/main/AndroidManifest.xml` | `<data android:scheme>` deep-link scheme |
| `android/app/src/main/res/values/strings.xml` | `app_name`, `title_activity_main`, `package_name`, `custom_url_scheme` |
| `android/app/src/main/java/com/example/mywebapp/MainActivity.java` | package declaration + directory path |
| `ios/App/App/Info.plist` | `CFBundleDisplayName`, the `CFBundleURLSchemes` scheme |
| `ios/App/App/capacitor.config.json` | `appId`, `appName` |
| `ios/App/App.xcodeproj/project.pbxproj` | `PRODUCT_BUNDLE_IDENTIFIER` |

The helper script `scripts/setup.sh` automates the common renames.
