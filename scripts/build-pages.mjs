#!/usr/bin/env node
/**
 * Build the browser-first builder for Cloudflare Pages.
 *
 * The application is intentionally dependency-free at runtime. This build copies
 * the committed www/ site into an isolated dist/ directory and emits the static
 * response headers used by the Pages deployment.
 */
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const source = join(root, 'www');
const output = join(root, 'dist');

if (!existsSync(join(source, 'index.html'))) {
  throw new Error('Cloudflare Pages source is missing www/index.html');
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await cp(source, output, { recursive: true });
await writeFile(join(output, '_headers'), `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n\n/assets/*\n  Cache-Control: public, max-age=3600\n`);
console.log(`Cloudflare Pages build ready: ${output}`);
