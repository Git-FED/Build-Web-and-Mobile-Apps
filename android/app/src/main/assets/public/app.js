/* web2apk — Capacitor plugin bridge.
 *
 * This file wires up the native plugins declared in package.json so the
 * bundled placeholder app feels like a real native shell. It no-ops
 * gracefully when run in a plain browser (no Capacitor runtime).
 *
 * Replace/extend this with your own app logic. See PLUGINS.md for every
 * plugin's API.
 */

const isCapacitor =
  typeof window !== 'undefined' &&
  !!window.Capacitor &&
  !!window.Capacitor.isNativePlatform &&
  window.Capacitor.isNativePlatform();

const log = (...a) => console.info('[web2apk]', ...a);
const warn = (...a) => console.warn('[web2apk]', ...a);

async function importPlugin(name) {
  if (!isCapacitor) return null;
  try {
    return (await window.Capacitor.registerPlugin)
      ? window.Capacitor.registerPlugin(name)
      : window.Capacitor.Plugins?.[name];
  } catch (e) {
    warn(`plugin "${name}" unavailable`, e);
    return null;
  }
}

/** Apply native chrome: status bar + splash + keyboard styling. */
async function applyNativeChrome() {
  if (!isCapacitor) return;

  const StatusBar = await importPlugin('StatusBar');
  const SplashScreen = await importPlugin('SplashScreen');
  const Keyboard = await importPlugin('Keyboard');

  try {
    if (StatusBar) {
      await StatusBar.setStyle({ style: 'DARK' });
      await StatusBar.setBackgroundColor({ color: '#0b1020' });
      await StatusBar.setOverlaysWebView({ overlay: false });
    }
  } catch (e) {
    warn('StatusBar setup failed', e);
  }

  try {
    if (SplashScreen) {
      // Hide the launch splash once the web view is interactive.
      await SplashScreen.hide();
    }
  } catch (e) {
    warn('SplashScreen hide failed', e);
  }

  try {
    if (Keyboard) {
      await Keyboard.setResizeMode({ mode: 'body' });
      await Keyboard.setStyle({ style: 'DARK' });
    }
  } catch (e) {
    warn('Keyboard setup failed', e);
  }
}

/** Watch network status and reflect it in the placeholder status card. */
async function wireNetwork() {
  const card = document.getElementById('status-card');
  const dot = document.getElementById('net-dot');
  const label = document.getElementById('net-label');
  if (!card || !dot || !label) return;

  const render = (status) => {
    const online = status && status.connected;
    dot.className = `dot ${online ? 'online' : 'offline'}`;
    label.textContent = online ? 'Online' : 'Offline — cached content available';
    card.hidden = false;
  };

  // Browser fallback using navigator.onLine + events.
  if (!isCapacitor) {
    render({ connected: navigator.onLine });
    window.addEventListener('online', () => render({ connected: true }));
    window.addEventListener('offline', () => render({ connected: false }));
    return;
  }

  const Network = await importPlugin('Network');
  if (!Network) return;
  try {
    render(await Network.getStatus());
    await Network.addListener('networkStatusChange', render);
  } catch (e) {
    warn('Network listener failed', e);
  }
}

/** Show platform info in the placeholder status card. */
async function showDeviceInfo() {
  const el = document.getElementById('platform-label');
  if (!el) return;
  if (!isCapacitor) {
    el.textContent = 'Web (browser)';
    return;
  }
  const Device = await importPlugin('Device');
  if (!Device) return;
  try {
    const info = await Device.getInfo();
    el.textContent = `${info.platform} ${info.osVersion}`;
  } catch (e) {
    warn('Device.getInfo failed', e);
  }
}

/** Hardware back button (Android) exits when at the web root. */
async function wireBackButton() {
  if (!isCapacitor) return;
  const App = await importPlugin('App');
  if (!App) return;
  try {
    await App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        history.back();
      } else {
        App.exitApp();
      }
    });
  } catch (e) {
    warn('backButton listener failed', e);
  }
}

/** App state logging + optional refresh on resume. */
async function wireAppState() {
  if (!isCapacitor) return;
  const App = await importPlugin('App');
  if (!App) return;
  try {
    await App.addListener('appStateChange', ({ isActive }) => {
      log('appStateChange', isActive ? 'active' : 'background');
    });
    await App.addListener('resume', () => log('app resumed'));
    await App.addListener('appUrlOpen', (data) => log('deep link opened', data?.url));
  } catch (e) {
    warn('App listeners failed', e);
  }
}

/** Lightweight haptic helper for tap feedback. */
async function haptic(type = 'light') {
  if (!isCapacitor) return;
  const Haptics = await importPlugin('Haptics');
  if (!Haptics) return;
  try {
    if (type === 'selection') await Haptics.selection();
    else await Haptics.impact({ style: type }); // light | medium | heavy
  } catch {
    /* ignore */
  }
}

/** Pull-to-refresh (Android WebView gesture). */
function wirePullToRefresh() {
  let startY = null;
  document.addEventListener(
    'touchstart',
    (e) => {
      if (window.scrollY <= 0) startY = e.touches[0].clientY;
    },
    { passive: true },
  );

  document.addEventListener(
    'touchmove',
    (e) => {
      if (startY === null) return;
      const pull = e.touches[0].clientY - startY;
      if (pull > 90) {
        haptic('medium');
        location.reload();
        startY = null;
      }
    },
    { passive: true },
  );

  document.addEventListener(
    'touchend',
    () => {
      startY = null;
    },
    { passive: true },
  );
}

/** Boot the bridge. */
async function boot() {
  log(isCapacitor ? 'running on a native platform' : 'running in a browser');
  await applyNativeChrome();
  await wireNetwork();
  await showDeviceInfo();
  await wireBackButton();
  await wireAppState();
  wirePullToRefresh();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

// Expose a tiny helper API for your app code to use.
window.web2apk = { haptic, isCapacitor };
