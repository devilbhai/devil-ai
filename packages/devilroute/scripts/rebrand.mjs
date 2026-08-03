#!/usr/bin/env node
/**
 * DevilRoute rebrander.
 *
 * Turns an extracted prebuilt omniroute npm package into devilroute by
 * replacing the brand across every text file:
 *
 *   omniroute  -> devilroute      (data dir ~/.omniroute, CLI name, config keys)
 *   OmniRoute  -> DevilRoute      (display brand)
 *   OMNIROUTE  -> DEVILROUTE      (env var OMNIROUTE_API_KEY, etc.)
 *
 * The `@omniroute/*` internal scoped packages are PRESERVED - the code imports
 * them by that exact name and the alias resolver maps them to the bundled
 * `@omniroute/` directory. Renaming those would break resolution.
 *
 * Binary files, source maps, and the bundled third-party `dist/node_modules`
 * are skipped.
 *
 * Usage: node rebrand.mjs <package-dir>
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const root = process.argv[2]
if (!root) {
  console.error("Usage: node rebrand.mjs <package-dir>")
  process.exit(1)
}

// Extensions that are safe to rewrite as UTF-8 text.
const TEXT_RE = /\.(?:mjs|js|jsx|cjs|ts|tsx|json|md|txt|sh|yml|yaml|html|css|env|example|sql|py|toml|lock)$/i
// Binary / generated artifacts that must never be rewritten.
const SKIP_RE = /\.(?:map|png|jpe?g|gif|ico|woff2?|ttf|otf|eot|svg|node|sqlite|db|sqlite3|dll|dylib|so|exe|bin|wasm|gz|zip)$/i

/** Sentinel for scoped package names - cannot collide with the brand tokens. */
const SCOPE_SENTINEL = "__OMNI_SCOPE_SENTINEL__"

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules") continue // bundled deps (dist/node_modules too)
    if (entry.name === ".git") continue
    const p = join(dir, entry.name)
    if (entry.isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}

const files = walk(root)
let rebranded = 0
let clean = 0

for (const file of files) {
  if (SKIP_RE.test(file)) continue
  if (!TEXT_RE.test(file)) continue

  let s
  try {
    s = readFileSync(file, "utf8")
  } catch {
    continue
  }
  // Gate must cover every case the replacements rewrite below. The common
  // lowercase/caps forms are obvious; the mixed-case `OmniRoute` (capital R)
  // is easy to miss — e.g. `openOmniRouteDb` — and skipping it leaves a file
  // half-rebranded against its (rebranded) importers.
  if (!/[Oo]mniroute|OmniRoute|OMNIROUTE/.test(s)) continue

  const out = s
    .replace(/@omniroute/g, SCOPE_SENTINEL) // protect scoped packages
    .replace(/omniroute/g, "devilroute")
    .replace(/OmniRoute/g, "DevilRoute")
    .replace(/OMNIROUTE/g, "DEVILROUTE")
    .replaceAll(SCOPE_SENTINEL, "@omniroute")

  if (out !== s) {
    writeFileSync(file, out)
    rebranded++
  } else {
    clean++
  }
}

console.log(`Rebranded ${rebranded} files (${clean} already clean)`)
