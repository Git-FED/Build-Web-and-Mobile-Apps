#!/usr/bin/env node
/**
 * validate-config.mjs
 * -----------------------------------------------------------------------------
 * Zero-dependency configuration validator for the web2apk project.
 *
 * Verifies:
 *   1. capacitor.config.json  — JSON validity + required fields + appId format
 *   2. www/manifest.json      — PWA manifest well-formedness (name, icons)
 *   3. package.json           — scripts referenced by tooling exist
 *   4. AndroidManifest.xml    — present & parseable, contains MainActivity
 *   5. Info.plist             — present & contains required usage strings
 *
 * Exits non-zero on any failure so CI gates correctly.
 *
 * Run:  npm test   (or)  node scripts/validate-config.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
let errors = 0;
let warnings = 0;

const log = {
  ok: (m) => console.log(`  \u2705  ${m}`),
  warn: (m) => { console.warn(`  \u26a0\ufe0f  ${m}`); warnings++; },
  err: (m) => { console.error(`  \u274c  ${m}`); errors++; },
};

function readJSON(rel) {
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) { log.err(`${rel} not found`); return null; }
  try {
    return JSON.parse(readFileSync(abs, 'utf8'));
  } catch (e) {
    log.err(`${rel} is invalid JSON: ${e.message}`);
    return null;
  }
}

function readText(rel) {
  const abs = join(ROOT, rel);
  if (!existsSync(abs)) { log.err(`${rel} not found`); return null; }
  return readFileSync(abs, 'utf8');
}

/* -------------------------------------------------------------------------- */
/* 1. capacitor.config.json                                                   */
/* -------------------------------------------------------------------------- */
function validateCapacitorConfig() {
  console.log('\n\u2699\ufe0f  Capacitor config');
  const cfg = readJSON('capacitor.config.json');
  if (!cfg) return;

  const appId = cfg.appId;
  if (!appId) {
    log.err('missing "appId"');
  } else if (!/^([a-z][a-z0-9_]*)(\.[a-z0-9_]+)+$/i.test(appId)) {
    log.err(`invalid appId "${appId}" — must be reverse-DNS, e.g. com.acme.shop`);
  } else if (appId === 'com.example.mywebapp') {
    log.warn(`appId is still the placeholder "${appId}" — run scripts/setup.sh to rename`);
  } else {
    log.ok(`appId = ${appId}`);
  }

  if (!cfg.appName) {
    log.err('missing "appName"');
  } else if (cfg.appName === 'My Web App') {
    log.warn('appName is still the placeholder "My Web App"');
  } else {
    log.ok(`appName = ${cfg.appName}`);
  }

  if (!cfg.webDir) { log.err('missing "webDir"'); }
  else if (cfg.webDir !== 'www') { log.warn(`webDir is "${cfg.webDir}" (expected "www")`); }
  else { log.ok(`webDir = ${cfg.webDir}`); }

  if (cfg.server && cfg.server.url) {
    try { new URL(cfg.server.url); log.ok(`server.url = ${cfg.server.url}`); }
    catch { log.err(`server.url "${cfg.server.url}" is not a valid URL`); }
  }

  if (!cfg.plugins) log.warn('no "plugins" block configured');
  else log.ok(`plugins block present (${Object.keys(cfg.plugins).length} entries)`);
}

/* -------------------------------------------------------------------------- */
/* 2. www/manifest.json                                                       */
/* -------------------------------------------------------------------------- */
function validateManifest() {
  console.log('\n\u2699\ufe0f  PWA manifest');
  const m = readJSON('www/manifest.json');
  if (!m) return;

  if (!m.name) { log.err('manifest missing "name"'); }
  else log.ok(`name = ${m.name}`);

  if (!m.short_name) log.warn('manifest missing "short_name"');
  else log.ok(`short_name = ${m.short_name}`);

  if (!Array.isArray(m.icons) || m.icons.length === 0) {
    log.err('manifest has no "icons"');
  } else {
    const has512 = m.icons.some((i) => i.sizes === '512x512');
    const has192 = m.icons.some((i) => i.sizes === '192x192');
    if (!has512) log.err('manifest missing a 512x512 icon');
    if (!has192) log.err('manifest missing a 192x192 icon');
    if (has512 && has192) log.ok(`icons ok (${m.icons.length} entries)`);
  }

  if (m.display && m.display !== 'standalone') {
    log.warn(`display is "${m.display}" (recommended: standalone)`);
  } else { log.ok(`display = ${m.display || '(default)'}`); }

  if (!m.start_url) log.warn('manifest missing "start_url"');
  if (!m.theme_color) log.warn('manifest missing "theme_color"');
}

/* -------------------------------------------------------------------------- */
/* 3. package.json scripts                                                    */
/* -------------------------------------------------------------------------- */
function validatePackageScripts() {
  console.log('\n⚙️  package.json scripts');
  const pkg = readJSON('package.json');
  if (!pkg) return;

  const lock = readJSON('package-lock.json');
  if (lock) {
    if (!Number.isInteger(lock.lockfileVersion) || lock.lockfileVersion < 1) {
      log.err('package-lock.json has an unsupported lockfileVersion');
    } else if (lock.name && lock.name !== pkg.name) {
      log.err(`package-lock.json name "${lock.name}" does not match package.json name "${pkg.name}"`);
    } else if (lock.version && lock.version !== pkg.version) {
      log.err(`package-lock.json version "${lock.version}" does not match package.json version "${pkg.version}"`);
    } else {
      log.ok(`package-lock.json present (lockfile v${lock.lockfileVersion})`);
    }
  }

  const required = ['sync', 'build:apk', 'build:release', 'build:bundle', 'lint', 'test', 'assets'];
  for (const s of required) {
    if (!pkg.scripts || !pkg.scripts[s]) {
      log.err(`missing script "${s}"`);
    } else {
      log.ok(`script "${s}" present`);
    }
  }

  // Verify referenced script files exist
  const scriptFiles = ['scripts/validate-config.mjs', 'scripts/version-bump.mjs'];
  for (const f of scriptFiles) {
    if (!existsSync(join(ROOT, f))) log.err(`referenced file ${f} missing`);
    else log.ok(`${f} exists`);
  }
}

/* -------------------------------------------------------------------------- */
/* 4. AndroidManifest.xml                                                     */
/* -------------------------------------------------------------------------- */
function validateAndroidManifest() {
  console.log('\n\u2699\ufe0f  AndroidManifest.xml');
  const xml = readText('android/app/src/main/AndroidManifest.xml');
  if (!xml) return;

  if (!xml.includes('MainActivity')) { log.err('no MainActivity declaration'); }
  else log.ok('MainActivity declared');

  if (!xml.includes('android.permission.INTERNET')) log.warn('INTERNET permission missing');
  else log.ok('INTERNET permission present');

  if (xml.includes('android:allowBackup')) log.ok('allowBackup configured');
  else log.warn('allowBackup not explicitly set');

  if (xml.includes('android:networkSecurityConfig')) log.ok('networkSecurityConfig referenced');
  else log.warn('networkSecurityConfig not referenced');
}

/* -------------------------------------------------------------------------- */
/* 5. Info.plist                                                              */
/* -------------------------------------------------------------------------- */
function validateInfoPlist() {
  console.log('\n\u2699\ufe0f  iOS Info.plist');
  const xml = readText('ios/App/App/Info.plist');
  if (!xml) return;

  const requiredKeys = [
    'CFBundleIdentifier',
    'CFBundleDisplayName',
    'NSCameraUsageDescription',
    'NSLocationWhenInUseUsageDescription',
    'NSPhotoLibraryUsageDescription',
  ];
  for (const k of requiredKeys) {
    if (!xml.includes(k)) log.err(`missing ${k}`);
    else log.ok(`${k} present`);
  }
}

/* -------------------------------------------------------------------------- */
/* Main                                                                       */
/* -------------------------------------------------------------------------- */
console.log('\n\ud83d\udd27  web2apk configuration validator\n' + '='.repeat(50));

validateCapacitorConfig();
validateManifest();
validatePackageScripts();
validateAndroidManifest();
validateInfoPlist();

console.log('\n' + '='.repeat(50));
console.log(`  Result: ${errors} error(s), ${warnings} warning(s)\n`);

if (errors > 0) {
  console.error('\u274c  Validation FAILED \u2014 fix the errors above before committing.\n');
  process.exit(1);
}
if (warnings > 0) {
  console.warn('\u26a0\ufe0f  Validation passed with warnings. Review them when convenient.\n');
}
console.log('\u2705  All checks passed.\n');
process.exit(0);
