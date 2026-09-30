#!/usr/bin/env bash
# Build Android APKs (debug or release) locally.
set -euo pipefail
cd "$(dirname "$0")/.."

VARIANT="${1:-debug}"

echo "==> Syncing Android"
npx cap sync android
chmod +x android/gradlew

case "$VARIANT" in
  debug)
    echo "==> Building debug APKs"
    ( cd android && ./gradlew assembleDebug --stacktrace )
    echo "✅ android/app/build/outputs/apk/debug/*.apk"
    ;;
  release)
    echo "==> Building release APKs"
    ( cd android && ./gradlew assembleRelease --stacktrace )
    echo "✅ android/app/build/outputs/apk/release/*.apk"
    ;;
  bundle)
    echo "==> Building release AAB"
    ( cd android && ./gradlew bundleRelease --stacktrace )
    echo "✅ android/app/build/outputs/bundle/release/*.aab"
    ;;
  *)
    echo "Usage: $0 [debug|release|bundle]"; exit 1 ;;
esac
