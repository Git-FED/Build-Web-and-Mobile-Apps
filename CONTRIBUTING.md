# Contributing to web2apk

First off, thank you for considering contributing to **web2apk**! 🎉 This document covers everything you need to know to get your first change merged.

## Quick start

```bash
# 1. Fork & clone
git clone https://github.com/<your-username>/Build-Mobile-Apps-Android-iOS.git
cd Build-Mobile-Apps-Android-iOS

# 2. Use the right Node version
nvm use          # reads .nvmrc (Node 22)

# 3. Install deps
npm install

# 4. Validate your config
npm test         # runs scripts/validate-config.mjs
```

## Ways to contribute

- **Report bugs** by opening an issue with the bug report template.
- **Suggest features** via a feature-request issue.
- **Improve docs** — typos, clarifications, and new guides are always welcome.
- **Add plugins** — see `PLUGINS.md` for the pattern.
- **Fix bugs / implement features** via pull requests.

## Pull request workflow

1. Create a branch: `git checkout -b feat/my-awesome-change`
2. Make your changes, keeping commits focused.
3. Run the quality gates:

   ```bash
   npm run lint         # markdown + prettier checks
   npm test             # config + structure validation
   ```

4. Commit using a [conventional commit](https://www.conventionalcommits.org/) message:
   - `feat: add push notification plugin`
   - `fix: correct splash background on iOS dark mode`
   - `docs: expand publishing guide`
   - `chore: bump capacitor to 8.6`
5. Push and open a PR against `main`. Fill in the PR template.
6. Ensure CI passes (lint, config validation, Android build smoke-test).

## Code style

- **Web assets** (`www/`): Prettier defaults, 2-space indent, single quotes in JS.
- **Markdown**: wrap long lines naturally; keep lists consistent.
- **JSON**: 2-space indent, no trailing commas (except where a generator emits them).
- **Android/Gradle**: tab indent for `.gradle` files (see `.editorconfig`).
- **Swift**: follow Swift Format / Xcode defaults.

## Project structure

See `ARCHITECTURE.md` for a full map. The short version:

```text
capacitor.config.json   # single source of app config (appId, name, plugins)
www/                    # web assets (your site or a bundled PWA)
android/                # native Android shell
ios/                    # native iOS shell
.github/workflows/      # CI/CD: build, release, lint
scripts/                # helper shell + node scripts
resources/              # source icon & splash images for @capacitor/assets
docs/                   # long-form documentation
```

## Adding a Capacitor plugin

1. Install it: `npm install @capacitor/<plugin>`
2. Sync: `npm run sync`
3. If the plugin needs config, add a block under `plugins` in `capacitor.config.json`.
4. Document it in `PLUGINS.md`.
5. If it needs native permissions, update `AndroidManifest.xml` and `Info.plist` with usage strings.

## Releasing

Releases are automated via `.github/workflows/release.yml`. Maintainers push a tag `vX.Y.Z` and CI builds, signs (when secrets are present), and publishes a GitHub Release with artifacts. See `CHANGELOG.md` for the version history.

## Code of Conduct

By participating you agree to abide by the [Code of Conduct](CODE_OF_CONDUCT.md). Be kind, be patient, and assume good intent.
