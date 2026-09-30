# web2apk \u2014 Makefile
# -----------------------------------------------------------------------------
# Convenience targets so you don't have to remember long npm/cap commands.
# Run `make help` to see all targets.
#
.PHONY: help install setup sync clean \
        build-web build-apk build-release build-bundle build-ios \
        assets assets-android assets-ios \
        lint lint-fix format test version release run-android run-ios

.DEFAULT_GOAL := help

# Color helpers
C_RESET = \033[0m
C_CYAN  = \033[36m
C_BOLD  = \033[1m

help: ## Show this help
	@echo ""
	@echo "$(C_BOLD)web2apk \u2014 available targets$(C_RESET)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(C_CYAN)%-18s$(C_RESET) %s\n", $$1, $$2}'
	@echo ""

install: ## Install npm dependencies
	npm install

setup: ## Rename placeholder appId/appName. Usage: make setup APP_ID=com.x.y APP_NAME="X"
	@test -n "$$APP_ID" && test -n "$$APP_NAME" || (echo "Usage: make setup APP_ID=com.acme.app APP_NAME='Acme'"; exit 1)
	./scripts/setup.sh

sync: ## Sync web assets to native projects
	npm run sync

sync-android: ## Sync web assets to Android only
	npm run sync:android

sync-ios: ## Sync web assets to iOS only
	npm run sync:ios

build-web: ## (No-op) Place built site in www/ or set server.url in capacitor.config.json
	@npm run build:web

build-apk: ## Build debug Android APKs
	./scripts/build-android.sh debug

build-release: ## Build release Android APKs (requires signing config)
	./scripts/build-android.sh release

build-bundle: ## Build release Android App Bundle (.aab for Play Store)
	./scripts/build-android.sh bundle

build-ios: ## Build iOS app for simulator (macOS only)
	./scripts/build-ios.sh

assets: ## Generate all icon + splash assets from resources/
	./scripts/generate-icons.sh

assets-android: ## Generate Android-only native assets
	npx @capacitor/assets generate --android

assets-ios: ## Generate iOS-only native assets
	npx @capacitor/assets generate --ios

lint: ## Run all linters (markdownlint + prettier --check)
	npm run lint

lint-fix: ## Auto-fix lint issues where possible
	npm run lint:fix

format: ## Format all files with Prettier
	npm run format

test: ## Validate project configuration
	npm test

version: ## Bump version. Usage: make version KIND=patch|minor|major
	@test -n "$$KIND" || (echo "Usage: make version KIND=patch"; exit 1)
	npm run version -- $$KIND

release: ## Create a tagged release. Usage: make release KIND=patch|minor|major
	@test -n "$$KIND" || (echo "Usage: make release KIND=patch"; exit 1)
	./scripts/release.sh $$KIND

run-android: ## Open project in Android Studio
	npm run open:android

run-ios: ## Open project in Xcode
	npm run open:ios

clean: ## Remove build outputs and Pods
	npm run clean
