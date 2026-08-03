#!/usr/bin/env bash
#
# DevilRoute converter.
#
# Produces a publish-ready `devilroute` package directory from the published
# PREBUILT omniroute npm tarball. No source build is needed - omniroute ships
# as a self-contained package (`dist/` + `bin/omniroute.mjs` + bundled
# `@omniroute/` internals), so conversion is: download -> extract -> rebrand
# -> install deps -> verify it boots -> ready to publish.
#
# Requirements: node >= 22.22, npm, network.
#
# Usage:
#   bash scripts/convert.sh            # omniroute@3.8.49 (latest tested)
#   bash scripts/convert.sh 3.8.49     # pin a version
#
# Output:
#   ${TMPDIR}/devilroute-convert/devilroute/         (publish-ready package dir)
#   ${TMPDIR}/devilroute-convert/devilroute-*.tgz    (npm pack output)

set -euo pipefail

OMNIROUTE_VERSION="${1:-3.8.49}"
DEVILROUTE_VERSION="${2:-${OMNIROUTE_VERSION}}"
WORK="${TMPDIR:-/tmp}/devilroute-convert"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

mkdir -p "$WORK"
cd "$WORK"

echo "==> [1/6] Downloading prebuilt omniroute@${OMNIROUTE_VERSION}"
echo "    (large: ~174MB tarball / ~830MB unpacked - this can take a while)"
npm pack "omniroute@${OMNIROUTE_VERSION}" --silent
TARBALL="$(ls omniroute-*.tgz | head -1)"

echo "==> [2/6] Extracting ${TARBALL}"
rm -rf devilroute package
tar -xzf "$TARBALL"
mv package devilroute

echo "==> [3/6] Rebranding omniroute -> devilroute"
node "${SCRIPT_DIR}/rebrand.mjs" "$WORK/devilroute"

echo "==> [4/6] Pinning name/version, stripping dev-only lifecycle scripts"
node -e "const fs=require('node:fs'); const p=JSON.parse(fs.readFileSync('$WORK/devilroute/package.json','utf8')); p.name='devilroute'; p.version='${DEVILROUTE_VERSION}';
// 'prepare' runs husky (a dev-only git-hooks tool) which fails when devDeps are
// omitted and would also break 'npm publish'. 'prepublishOnly' would rebuild the
// prebuilt artifact from source, which this prebuilt tarball must NOT do.
delete p.scripts.prepare; delete p.scripts.prepublishOnly;
// npm 11+ gates native-module install scripts. Allow the ones that must run
// (node-gyp rebuild / binary fetch) so user-platform binaries replace the
// bundled linux-x64 ones in dist/. Makes a plain 'npm install -g devilroute'
// work without extra flags, not just the app installer's --allow-scripts.
const allowScripts={}; for (const n of ['better-sqlite3','esbuild','@swc/core','fsevents','keytar','koffi','onnxruntime-node','protobufjs','tls-client-node','@parcel/watcher','core-js']) allowScripts[n]=true; p.allowScripts=allowScripts;
// Chain our cross-platform prebuild fixer after the upstream postinstall.
p.scripts.postinstall='node scripts/build/postinstall.mjs && node scripts/build/fix-platform-prebuilds.mjs';
// npm pack only ships paths listed in `files` — ensure our fixer is included.
if (!Array.isArray(p.files)) p.files=[];
if (!p.files.includes('scripts/build/fix-platform-prebuilds.mjs')) p.files.push('scripts/build/fix-platform-prebuilds.mjs');
fs.writeFileSync('$WORK/devilroute/package.json', JSON.stringify(p,null,2)+'\n')"

echo "==> [4b/6] Installing cross-platform native prebuild fixer"
cp "${SCRIPT_DIR}/fix-platform-prebuilds.mjs" "$WORK/devilroute/scripts/build/fix-platform-prebuilds.mjs"

echo "==> [4c/6] Renaming CLI entry (bin/omniroute.mjs -> bin/devilroute.mjs)"
# The content rebrand rewrites package.json#bin to point at bin/devilroute.mjs
# but does not rename files. Rename the CLI entry so the published bin resolves.
if [ -f "$WORK/devilroute/bin/omniroute.mjs" ]; then
  mv "$WORK/devilroute/bin/omniroute.mjs" "$WORK/devilroute/bin/devilroute.mjs"
fi
# Dist route chunks reference "omnirouteCatchAll" internally and are
# self-consistent inside the compiled build — leave them alone.

echo "==> [5/6] Installing runtime dependencies"
echo "    (--legacy-peer-deps: upstream CLI tooling has peer-dep conflicts;"
echo "     the allowScripts field baked into package.json in step 4 covers the"
echo "     native-module build scripts npm 11+ would otherwise gate; the CLI"
echo "     --allow-scripts flag is rejected for project-scoped installs)"
cd "$WORK/devilroute"
npm install --omit=dev --legacy-peer-deps --no-audit --no-fund

echo "==> [6/6] Verifying devilroute boots and serves /v1/models"
VERIFY_PORT="${DEVILROUTE_VERIFY_PORT:-20199}"
nohup node bin/devilroute.mjs serve --port "$VERIFY_PORT" > serve-verify.log 2>&1 &
VERIFY_PID=$!
HEALTHY=0
for _ in $(seq 1 40); do
  if curl -fsS "http://127.0.0.1:${VERIFY_PORT}/v1/models" >/dev/null 2>&1; then
    HEALTHY=1
    break
  fi
  sleep 1
done
kill "$VERIFY_PID" 2>/dev/null || true
wait "$VERIFY_PID" 2>/dev/null || true

if [ "$HEALTHY" != "1" ]; then
  echo "!! devilroute did not respond on /v1/models. Log tail:" >&2
  tail -30 serve-verify.log >&2
  exit 1
fi

echo "==> Packaging"
cd "$WORK"
npm pack "$WORK/devilroute" --silent >/dev/null

echo ""
echo "============================================================"
echo "  DevilRoute conversion complete!"
echo ""
echo "  Package dir:  $WORK/devilroute"
echo "  Tarball:      $WORK/$(ls devilroute-*.tgz | head -1)"
echo ""
echo "  Next step: publish once to npm (run by the maintainer):"
echo "      bash packages/devilroute/scripts/publish.sh"
echo ""
echo "  The app installs: npm install -g --legacy-peer-deps devilroute"
echo "  (falls back to omniroute until devilroute is published)"
echo "============================================================"
