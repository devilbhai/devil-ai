#!/bin/bash
set -e

KEYCHAIN_PATH="${KEYCHAIN_PATH:-build.keychain}"
P12_PATH="${P12_PATH:-resources/devil-ai-apple.p12}"

# Passwords from environment — NEVER hardcode credentials in this script.
KEYCHAIN_PASS="${KEYCHAIN_PASS:-}"
P12_PASS="${P12_PASS:-$KEYCHAIN_PASS}"
if [ -z "$KEYCHAIN_PASS" ]; then
	echo "ERROR: KEYCHAIN_PASS env var is required (and P12_PASS if different from keychain pass)" >&2
	exit 1
fi

# Create new keychain
security create-keychain -p "$KEYCHAIN_PASS" $KEYCHAIN_PATH
security default-keychain -s $KEYCHAIN_PATH
security unlock-keychain -p "$KEYCHAIN_PASS" $KEYCHAIN_PATH
security set-keychain-settings -t 3600 -u $KEYCHAIN_PATH

# Import the p12
security import $P12_PATH -k $KEYCHAIN_PATH -P "$P12_PASS" -T /usr/bin/codesign -T /usr/bin/security -A

# Set partition list so codesign doesn't prompt
security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$KEYCHAIN_PASS" $KEYCHAIN_PATH

echo "Keychain ready at $KEYCHAIN_PATH"
