# Documentation index

| Document | What it covers |
|----------|----------------|
| [README.md](../README.md) | Overview, quick start, features, links to everything. |
| [CONFIGURATION.md](../CONFIGURATION.md) | Every `capacitor.config.json` option and native sync points. |
| [PLUGINS.md](../PLUGINS.md) | All 18 plugins with JS usage examples; how to add more. |
| [PUBLISHING.md](../PUBLISHING.md) | Step-by-step Play Store & App Store publishing. |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | How the wrapper, WebView, plugins, and CI fit together. |
| [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) | Common issues and fixes. |
| [CHANGELOG.md](../CHANGELOG.md) | Version history (Keep a Changelog). |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | How to contribute, code style, PR process. |
| [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) | Community standards. |

## Build pipeline diagram

```text
 push/PR to main ───────────────► build.yml
                                   │
                                   ├─ validate (config + structure)
                                   │
                                   ├─ Android (matrix)
                                   │   ├─ debug   → app-debug-apks (5 APKs)
                                   │   ├─ release → app-release-apks (5 APKs)
                                   │   └─ bundle  → app-release-aab (1 AAB)
                                   │
                                   └─ iOS sim → app-ios-simulator (.app)

 push tag v* ───────────────────► release.yml
                                   ├─ decode keystore secret
                                   ├─ build signed release APKs + AAB
                                   └─ create GitHub Release (artifacts + notes)

 PR ────────────────────────────► lint.yml
                                   ├─ Prettier check
                                   ├─ markdownlint
                                   ├─ JSON syntax check
                                   └─ config validation

 weekly ────────────────────────► dependabot
                                   ├─ npm (Capacitor + tooling)
                                   ├─ github-actions
                                   └─ gradle
```
