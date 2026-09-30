#!/usr/bin/env node
import { chmodSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const androidDir = join(root, 'android');
const isWindows = process.platform === 'win32';
const wrapper = join(androidDir, isWindows ? 'gradlew.bat' : 'gradlew');

if (!existsSync(wrapper)) throw new Error(`Gradle wrapper not found: ${wrapper}`);
if (!isWindows) chmodSync(wrapper, 0o755);

const result = spawnSync(wrapper, process.argv.slice(2), {
  cwd: androidDir,
  stdio: 'inherit',
  shell: isWindows,
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
