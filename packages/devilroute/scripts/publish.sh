#!/usr/bin/env bash
#
# DevilRoute publisher (one-time, run by the maintainer).
#
# Publishes the converted devilroute package directory to the public npm
# registry. Run convert.sh first (it produces the publish-ready directory),
# then publish here.
#
# Usage:
#   bash scripts/publish.sh            # publish the latest converted dir
#
# Requirements:
#   - npm login already done for the account that owns "devilroute"
#   - convert.sh must have been run first (creates ${TMPDIR}/devilroute-convert/devilroute)

set -euo pipefail

WORK="${TMPDIR:-/tmp}/devilroute-convert/devilroute"

if [ ! -d "$WORK" ]; then
  echo "!! Converted package dir not found at: $WORK"
  echo "   Run convert.sh first:  bash packages/devilroute/scripts/convert.sh"
  exit 1
fi

echo "==> Publishing devilroute from $WORK"
echo "    Version: $(node -p "require('$WORK/package.json').version")"
echo ""

# Sanity check: make sure we're not accidentally publishing the un-renamed upstream
NAME="$(node -p "require('$WORK/package.json').name")"
if [ "$NAME" != "devilroute" ]; then
  echo "!! package.json name is '$NAME', expected 'devilroute'. Aborting."
  exit 1
fi

cd "$WORK"

# --dry-run first so the maintainer can review the full file list
echo "==> Dry run (review what will be published):"
npm publish --dry-run

echo ""
read -r -p "Publish for real? [y/N] " CONFIRM
if [ "${CONFIRM:-}" != "y" ] && [ "${CONFIRM:-}" != "Y" ]; then
  echo "Aborted."
  exit 0
fi

echo "==> Publishing..."
npm publish --access public
echo ""
echo "✓ devilroute published!"
echo "  Install check: npm install -g --legacy-peer-deps devilroute"
