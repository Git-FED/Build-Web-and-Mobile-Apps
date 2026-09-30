#!/usr/bin/env bash
# release.sh
# -----------------------------------------------------------------------------
# Local helper to create a versioned, tagged release.
#
#   ./scripts/release.sh patch      # 2.0.0 -> 2.0.1
#   ./scripts/release.sh minor      # 2.0.0 -> 2.1.0
#   ./scripts/release.sh major      # 2.0.0 -> 3.0.0
#
# It will:
#   1. Bump the version (scripts/version-bump.mjs)
#   2. Run config validation (npm test)
#   3. Stage, commit, tag, and push (push requires a clean git remote)
#
# Pushing the tag triggers .github/workflows/release.yml which builds signed
# APKs + AAB and creates a GitHub Release.
set -euo pipefail
cd "$(dirname "$0")/.."

KIND="${1:-}"
if [[ -z "$KIND" ]]; then
  echo "Usage: $0 [patch|minor|major]"
  exit 1
fi

if [[ -n "$(git status --porcelain --untracked-files=no 2>/dev/null || true)" ]]; then
  echo "\u274c  Working tree is not clean. Commit or stash first." >&2
  git status --short
  exit 1
fi

echo "==> Bumping version ($KIND)"
npm run version -- "$KIND"
NEW_TAG="v$(node -p "require('./package.json').version")"
echo "==> New version tag: $NEW_TAG"

echo "==> Validating configuration"
npm test

echo "==> Committing version bump"
git add package.json capacitor.config.json android/app/build.gradle
git commit -m "chore(release): ${NEW_TAG}"

echo "==> Creating tag ${NEW_TAG}"
git tag -a "$NEW_TAG" -m "Release ${NEW_TAG}"

echo ""
echo "Next: push to trigger the release workflow:"
echo "  git push origin main && git push origin ${NEW_TAG}"
echo ""
read -r -p "Push now? [y/N] " yn
if [[ "$yn" =~ ^[Yy]$ ]]; then
  git push origin main
  git push origin "$NEW_TAG"
  echo "\u2705  Pushed. Watch the Actions tab for signed artifacts."
else
  echo "Skipped push. Run the commands above when ready."
fi
