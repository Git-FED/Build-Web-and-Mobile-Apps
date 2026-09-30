#!/usr/bin/env bash
# Build the iOS app for the simulator (no signing needed). macOS + Xcode only.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ "$(uname)" != "Darwin" ]]; then
  echo "❌ iOS builds require macOS with Xcode." >&2
  exit 1
fi

echo "==> Syncing iOS"
npx cap sync ios

echo "==> Building for iOS Simulator"
xcodebuild \
  -project ios/App/App.xcodeproj \
  -scheme App \
  -sdk iphonesimulator \
  -configuration Debug \
  -derivedDataPath build \
  CODE_SIGNING_ALLOWED=NO \
  build

echo "✅ build/Build/Products/Debug-iphonesimulator/App.app"
