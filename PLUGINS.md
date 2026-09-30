# Plugins

web2apk ships with **18 official Capacitor plugins** pre-installed and
configured. The JS bridge in `www/app.js` already initializes the core ones
(status bar, splash, keyboard, network, app lifecycle, back button,
haptics). For your own app code, import and call them like any npm module.

All examples assume you're running inside the Capacitor native shell. In a
plain browser the calls no-op gracefully (see `www/app.js` for the pattern).

---

## Core UI plugins

### `@capacitor/status-bar`

Control the status bar appearance and whether it overlays the WebView.

```js
import { StatusBar, Style } from '@capacitor/status-bar';

await StatusBar.setStyle({ style: Style.Dark });
await StatusBar.setBackgroundColor({ color: '#0b1020' });
await StatusBar.setOverlaysWebView({ overlay: false });
await StatusBar.show();
await StatusBar.hide();
```

### `@capacitor/splash-screen`

Programmatically show/hide the launch splash.

```js
import { SplashScreen } from '@capacitor/splash-screen';
await SplashScreen.show({ autoHide: true, showDuration: 1000 });
await SplashScreen.hide();
```

### `@capacitor/keyboard`

Keyboard appearance and resize behaviour. (iOS only; Android uses windowSoftInputMode.)

```js
import { Keyboard } from '@capacitor/keyboard';
await Keyboard.setResizeMode({ mode: 'body' });
await Keyboard.setStyle({ style: 'DARK' });
Keyboard.addListener('keyboardWillShow', (info) => console.log(info.keyboardHeight));
```

### `@capacitor/haptics`

Native tactile feedback.

```js
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
await Haptics.impact({ style: ImpactStyle.Medium });
await Haptics.notification({ type: NotificationType.Success });
await Haptics.selection();
await Haptics.vibrate({ duration: 200 });
```

---

## App & lifecycle

### `@capacitor/app`

App state, back button, URL opens, app info.

```js
import { App } from '@capacitor/app';
App.addListener('backButton', ({ canGoBack }) => {
  if (canGoBack) history.back(); else App.exitApp();
});
App.addListener('appStateChange', ({ isActive }) => console.log(isActive));
App.addListener('appUrlOpen', ({ url }) => console.log('Deep link:', url));
const info = await App.getInfo();      // { id, name, build, version }
await App.minimizeApp();
```

### `@capacitor/device`

Device hardware/OS info.

```js
import { Device } from '@capacitor/device';
const info = await Device.getInfo();
// { platform, osVersion, model, manufacturer, isVirtual, ... }
const battery = await Device.getBatteryInfo();
const lang = await Device.getLanguageCode();
```

---

## Networking & storage

### `@capacitor/network`

Online/offline status and changes.

```js
import { Network } from '@capacitor/network';
const status = await Network.getStatus();      // { connected, connectionType }
Network.addListener('networkStatusChange', (s) => console.log(s));
```

### `@capacitor/preferences`

Persistent key/value storage (wraps SharedPreferences / NSUserDefaults).

```js
import { Preferences } from '@capacitor/preferences';
await Preferences.set({ key: 'theme', value: 'dark' });
const { value } = await Preferences.get({ key: 'theme' });
await Preferences.remove({ key: 'theme' });
await Preferences.clear();
```

### `@capacitor/filesystem`

Read/write files in sandboxed directories.

```js
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
await Filesystem.writeFile({
  path: 'notes.txt', data: 'Hello', directory: Directory.Documents, encoding: Encoding.UTF8,
});
const res = await Filesystem.readFile({ path: 'notes.txt', directory: Directory.Documents });
```

---

## Media & sensors

### `@capacitor/camera`

Take a photo or pick from the gallery.

```js
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
const photo = await Camera.getPhoto({
  quality: 90,
  resultType: CameraResultType.Uri,
  source: CameraSource.Prompt,   // let user choose camera or gallery
});
// photo.webPath can be used in an <img src>
```

### `@capacitor/geolocation`

Device location.

```js
import { Geolocation } from '@capacitor/geolocation';
const pos = await Geolocation.getCurrentPosition();
const watch = await Geolocation.watchPosition({}, (p) => console.log(p));
// await Geolocation.clearWatch({ id: watch });
```

---

## Notifications

### `@capacitor/local-notifications`

Schedule notifications without a server.

```js
import { LocalNotifications } from '@capacitor/local-notifications';
await LocalNotifications.requestPermissions();
await LocalNotifications.schedule({
  notifications: [{
    id: 1, title: 'Reminder', body: 'Time to go!',
    schedule: { at: new Date(Date.now() + 60_000) },
  }],
});
```

### `@capacitor/push-notifications`

Remote push via Firebase (Android) / APNs (iOS).

```js
import { PushNotifications, Token } from '@capacitor/push-notifications';
await PushNotifications.requestPermissions();
await PushNotifications.register();
PushNotifications.addListener('registration', ({ value }) => console.log('token', value));
PushNotifications.addListener('pushNotificationReceived', (n) => console.log(n));
```

> **Setup:** drop `google-services.json` into `android/app/` and
> `GoogleService-Info.plist` into `ios/App/App/` (both git-ignored). See the
> [Capacitor push guide](https://capacitorjs.com/docs/apis/push-notifications).

---

## Sharing & utilities

### `@capacitor/share`

Native share sheet.

```js
import { Share } from '@capacitor/share';
await Share.share({ title: 'Look', text: 'Cool app', url: 'https://example.com', dialogTitle: 'Share via' });
```

### `@capacitor/browser`

In-app browser for external links (keeps users in your app).

```js
import { Browser } from '@capacitor/browser';
await Browser.open({ url: 'https://capacitorjs.com' });
await Browser.close();
```

### `@capacitor/toast`

Native toast messages.

```js
import { Toast } from '@capacitor/toast';
await Toast.show({ text: 'Saved!', duration: 'short' });
```

### `@capacitor/clipboard`

Read/write the system clipboard.

```js
import { Clipboard } from '@capacitor/clipboard';
await Clipboard.write({ string: 'copied text' });
const { value } = await Clipboard.read();
```

---

## Adding a new plugin

1. `npm install @capacitor/<plugin>`
2. `npm run sync` (copies the plugin into `android/` and `ios/`)
3. If it needs config, add a block under `plugins` in `capacitor.config.json`
4. Add native permissions + usage strings:
   - Android: `android/app/src/main/AndroidManifest.xml`
   - iOS: `ios/App/App/Info.plist` (a `NS<Feature>UsageDescription` key)
5. Document it in this file and call it from your app code.

---

## Notes

- Plugins that need a native dependency (e.g. Firebase) may require adding a
  config file (`google-services.json` / `GoogleService-Info.plist`) and
  running `pod install` in `ios/App` on macOS.
- The `registerPlugin(name)` helper in `www/app.js` is the framework-agnostic
  way to grab a plugin instance without a bundler. With a bundler, prefer
  the named imports shown above.
