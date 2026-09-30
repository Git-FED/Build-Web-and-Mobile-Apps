#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const requiredFiles = [
  'package.json',
  'package-lock.json',
  'electron/main.cjs',
  'scripts/run-gradle.mjs',
  'electron-builder.yml',
  '.github/workflows/build.yml',
  'www/index.html',
  'capacitor.config.json',
  'wrangler.toml',
  'wrangler.pages.toml',
  'worker/index.js',
  'scripts/build-pages.mjs',
  'cloudflare-pages-build.sh',
];

for (const relativePath of requiredFiles) {
  if (!existsSync(join(root, relativePath))) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
}

const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
if (packageJson.main !== 'electron/main.cjs') throw new Error('package main must point to Electron entrypoint');
if (packageJson.scripts?.dist !== 'electron-builder') throw new Error('dist script must use electron-builder');
if (!packageJson.scripts?.['build:apk']?.includes('run-gradle.mjs')) throw new Error('Android build must use cross-platform Gradle launcher');
if (!packageJson.devDependencies?.electron) throw new Error('electron devDependency is missing');
if (!packageJson.devDependencies?.['electron-builder']) throw new Error('electron-builder devDependency is missing');
if (packageJson.scripts?.['build:pages'] !== 'sh cloudflare-pages-build.sh') throw new Error('Cloudflare Pages build script is missing');
if (packageJson.engines?.node !== '>=22.23.0 <23') throw new Error('Node engine range must match the pinned Cloudflare Node 22 release');

const wrangler = readFileSync(join(root, 'wrangler.toml'), 'utf8');
if (!wrangler.includes('main = "worker/index.js"') || !wrangler.includes('directory = "./dist"')) throw new Error('Cloudflare Worker static-assets config is incomplete');
const pagesWrangler = readFileSync(join(root, 'wrangler.pages.toml'), 'utf8');
if (!pagesWrangler.includes('pages_build_output_dir = "./dist"')) throw new Error('Cloudflare Pages output directory must be ./dist');

const workflow = readFileSync(join(root, '.github/workflows/build.yml'), 'utf8');
if (!workflow.includes('build-desktop')) throw new Error('Workflow is missing the desktop build job');
if (!workflow.includes('target: win') || !workflow.includes('target: mac') || !workflow.includes('target: linux')) {
  throw new Error('Workflow is missing one or more desktop matrix targets');
}
if (!workflow.includes('npm run dist -- --${{ matrix.target }}')) {
  throw new Error('Workflow is missing the Electron build command');
}

for (const relativePath of ['index.html', 'www/index.html', 'README.md']) {
  const content = readFileSync(join(root, relativePath), 'utf8');
  const forbidden = String.fromCharCode(112, 111, 107, 101, 106, 117, 109, 112, 101, 114);
  if (content.toLowerCase().includes(forbidden)) throw new Error(`Unwanted reference remains in ${relativePath}`);
}

console.log(`Smoke tests passed (${requiredFiles.length} required files, desktop CI targets, and Cloudflare Pages config verified).`);
