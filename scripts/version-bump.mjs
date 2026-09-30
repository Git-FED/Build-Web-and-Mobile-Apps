#!/usr/bin/env node
/**
 * version-bump.mjs
 * -----------------------------------------------------------------------------
 * Bumps the project version everywhere it matters and keeps SemVer consistent:
 *
 *   - package.json                 .version
 *   - capacitor.config.json        .appVersion (in Android/ios section)
 *   - android/app/build.gradle     versionCode / versionName
 *
 * Usage:
 *   npm run version -- patch        # 1.2.3 -> 1.2.4
 *   npm run version -- minor        # 1.2.3 -> 1.3.0
 *   npm run version -- major        # 1.2.3 -> 2.0.0
 *   npm run version -- 3.5.0        # explicit version
 *
 * versionCode is derived as  major*10000 + minor*100 + patch  (per Android
 * guidance) so that every published build is monotonically greater.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const bump = process.argv[2];

if (!bump) {
  console.error('Usage: npm run version -- [patch|minor|major|x.y.z]');
  process.exit(1);
}

function readJSON(rel) {
  return JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
}
function writeJSON(rel, obj) {
  writeFileSync(join(ROOT, rel), JSON.stringify(obj, null, 2) + '\n');
}

// ---- Read current version ----
const pkg = readJSON('package.json');
const current = pkg.version.split('.').map(Number);
let [major, minor, patch] = current;

if (bump === 'patch') patch += 1;
else if (bump === 'minor') { minor += 1; patch = 0; }
else if (bump === 'major') { major += 1; minor = 0; patch = 0; }
else {
  const parts = bump.split('.').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    console.error(`Invalid version "${bump}". Use patch|minor|major|x.y.z`);
    process.exit(1);
  }
  [major, minor, patch] = parts;
}

const newVersion = `${major}.${minor}.${patch}`;
const versionCode = major * 10000 + minor * 100 + patch;

console.log(`Bumping version:  ${pkg.version}  \u2192  ${newVersion}  (versionCode ${versionCode})`);

// ---- package.json ----
pkg.version = newVersion;
writeJSON('package.json', pkg);

// ---- capacitor.config.json ----
const cap = readJSON('capacitor.config.json');
if (cap.android) cap.android.versionCode = versionCode.toString();
else cap.android = { versionCode: versionCode.toString() };
if (cap.ios) cap.ios.buildNumber = versionCode.toString();
else cap.ios = { buildNumber: versionCode.toString() };
writeJSON('capacitor.config.json', cap);

// ---- android/app/build.gradle ----
const gradlePath = join(ROOT, 'android/app/build.gradle');
let gradle = readFileSync(gradlePath, 'utf8');
gradle = gradle.replace(
  /(\s+)def\s+versionCodeVal\s*=\s*\(System\.getenv\('VERSION_CODE'\)\s*\?\?\s*"\d+"\)\.toInteger\(\)/,
  `$1def versionCodeVal = (System.getenv('VERSION_CODE') ?? "${versionCode}").toInteger()`,
);
gradle = gradle.replace(
  /(\s+)def\s+versionNameVal\s*=\s*System\.getenv\('VERSION_NAME'\)\s*\?\?\s*"[^"]*"/,
  `$1def versionNameVal = System.getenv('VERSION_NAME') ?? "${newVersion}"`,
);
writeFileSync(gradlePath, gradle);

console.log('\n\u2705 Version bumped successfully.');
console.log('   Updated: package.json, capacitor.config.json, android/app/build.gradle');
console.log('\nNext steps:');
console.log('   git add -A && git commit -m "chore(release): v' + newVersion + '"');
console.log('   git tag v' + newVersion + ' && git push --tags');
console.log('   (the release.yml workflow will build & publish signed artifacts)');
