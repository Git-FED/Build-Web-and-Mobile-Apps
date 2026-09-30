#!/usr/bin/env bash
# web2apk — one-command project setup.
# Renames the placeholder app id/name across all native files, installs deps,
# and syncs Capacitor. Safe to re-run.
set -euo pipefail

cd "$(dirname "$0")/.."

NEW_ID="${APP_ID:-}"
NEW_NAME="${APP_NAME:-}"

if [[ -z "$NEW_ID" || -z "$NEW_NAME" ]]; then
  echo "Set APP_ID and APP_NAME, e.g.:"
  echo "  APP_ID=com.acme.shop APP_NAME='Acme Shop' scripts/setup.sh"
  exit 1
fi

OLD_ID="com.example.mywebapp"
OLD_NAME="My Web App"

echo "==> Renaming $OLD_ID → $NEW_ID"
echo "==> Renaming '$OLD_NAME' → '$NEW_NAME'"

# Android
sed -i "s|$OLD_ID|$NEW_ID|g" \
  android/app/build.gradle \
  android/app/src/main/AndroidManifest.xml \
  android/app/src/main/res/values/strings.xml \
  capacitor.config.json \
  ios/App/App/capacitor.config.json \
  ios/App/App/Info.plist

sed -i "s|$OLD_NAME|$NEW_NAME|g" \
  android/app/src/main/res/values/strings.xml \
  capacitor.config.json \
  ios/App/App/capacitor.config.json \
  ios/App/App/Info.plist \
  www/index.html \
  www/manifest.json

# Move the Java package directory if the id changed
OLD_DIR="android/app/src/main/java/$(echo "$OLD_ID" | tr '.' '/')"
NEW_DIR="android/app/src/main/java/$(echo "$NEW_ID" | tr '.' '/')"
if [[ -d "$OLD_DIR" && "$OLD_DIR" != "$NEW_DIR" ]]; then
  mkdir -p "$(dirname "$NEW_DIR")"
  mv "$OLD_DIR" "$NEW_DIR"
  sed -i "s|package $OLD_ID|package $NEW_ID|g" "$NEW_DIR/MainActivity.java"
fi

echo "==> Installing dependencies"
npm install

echo "==> Syncing Capacitor (android + ios)"
npx cap sync

echo ""
echo "✅ Done. Review the changes, then commit."
echo "   Build with: npm run build:apk   (or make build-apk)"
