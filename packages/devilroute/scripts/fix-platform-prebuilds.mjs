#!/usr/bin/env node
/**
 * DevilRoute — cross-platform native binary fix for the standalone `dist/` build.
 *
 * The published package's `dist/` is a Next.js standalone build compiled on
 * linux-x64; the bundled `dist/node_modules` therefore only carries linux-x64
 * (plus a few x64) native binaries. On macOS ARM / Windows, modules such as
 * better-sqlite3 boot fine (the DB is lazy-loaded) but crash the moment the
 * database is touched, because `dist/node_modules/<pkg>` has no binary for the
 * user's platform.
 *
 * The npm-installed ROOT `node_modules/` carries the correct binaries — npm
 * installed them for THIS machine. This script copies any missing platform
 * binary from root into the standalone dist directory. No rebuild and no build
 * tools are needed (this is exactly why the upstream postinstall exists; it
 * just predates the `prebuilds/` layout and misses a few modules).
 *
 * Fails open: only copies files that exist at the root, and never fails the
 * install.
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");

/** Native modules that ship per-platform binaries and are bundled in dist/. */
const NATIVE_MODULES = [
  "better-sqlite3",
  "keytar",
  "koffi",
  "wreq-js",
  "onnxruntime-node",
];

const platform = process.platform;
const arch = process.arch;

let copied = 0;

function copyIfMissing(from, to) {
  if (!existsSync(from) || existsSync(to)) return false;
  try {
    mkdirSync(dirname(to), { recursive: true });
    copyFileSync(from, to);
    return true;
  } catch (err) {
    console.warn(`  ⚠️  Could not copy ${from}: ${err.message}`);
    return false;
  }
}

for (const mod of NATIVE_MODULES) {
  const distDir = join(ROOT, "dist", "node_modules", mod);
  const rootDir = join(ROOT, "node_modules", mod);
  if (!existsSync(distDir) || !existsSync(rootDir)) continue;

  // 1) `prebuilds/` layout (better-sqlite3 >= 12, node-gyp-build style):
  //    prebuilds/<platform>-<arch>.node  (e.g. darwin-arm64.node)
  const distPre = join(distDir, "prebuilds");
  const rootPre = join(rootDir, "prebuilds");
  if (existsSync(rootPre)) {
    for (const prefix of [`${platform}-${arch}`, `${platform}${arch}`]) {
      for (const file of readdirSync(rootPre)) {
        if (file.startsWith(prefix) && file.endsWith(".node")) {
          if (copyIfMissing(join(rootPre, file), join(distPre, file))) copied++;
        }
      }
    }
  }

  // 2) `build/Release/*.node` layout (prebuild-install / node-gyp style)
  const distBuild = join(distDir, "build", "Release");
  const rootBuild = join(rootDir, "build", "Release");
  if (existsSync(rootBuild)) {
    for (const file of readdirSync(rootBuild)) {
      if (file.endsWith(".node")) {
        if (copyIfMissing(join(rootBuild, file), join(distBuild, file))) copied++;
      }
    }
  }

  // 3) platform-named .node files in the package root or a `rust/` subdir
  //    (wreq-js ships wreq-js.<platform>-<arch>.node under rust/)
  for (const sub of ["", "rust", "bin"]) {
    const distSub = join(distDir, sub);
    const rootSub = join(rootDir, sub);
    if (!existsSync(rootSub)) continue;
    for (const file of readdirSync(rootSub)) {
      if (!file.endsWith(".node")) continue;
      if (file.includes(platform) && file.includes(arch)) {
        if (copyIfMissing(join(rootSub, file), join(distSub, file))) copied++;
      }
    }
  }
}

if (copied > 0) {
  console.log(
    `  🔧 Copied ${copied} native binary(ies) into dist/node_modules for ${platform}-${arch}.`,
  );
} else {
  console.log("  ✅ Native binaries for this platform already present in dist/node_modules.");
}
