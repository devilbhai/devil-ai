# DevilRoute

Local AI gateway for **Devil AI** — a rebranded fork of [OmniRoute](https://github.com/diegosouzapw/OmniRoute).

DevilRoute runs entirely on the user's machine at `http://127.0.0.1:20128` and exposes
an OpenAI-compatible `/v1/*` API plus a local web console at `http://127.0.0.1:20128/login`.
No traffic leaves the machine; requests route through the `opencode` provider network.

```
Devil AI app ──▶ http://127.0.0.1:20128/v1 (DevilRoute) ──▶ opencode provider network
```

## How this package is produced

OmniRoute publishes a **prebuilt** npm tarball (`dist/` + CLI + bundled internals, ~174MB
tarball / ~830MB unpacked). This package is that same prebuilt artifact rebranded —
no source build, so conversion is identical on macOS, Windows, and Linux.

`packages/devilroute/scripts/`:

| Script | Purpose |
| --- | --- |
| `rebrand.mjs` | Replaces `omniroute`→`devilroute`, `OmniRoute`→`DevilRoute`, `OMNIROUTE`→`DEVILROUTE` across all text files. Preserves the `@omniroute/*` internal scoped packages (the code imports them by that exact name). |
| `convert.sh` | Downloads the prebuilt `omniroute` tarball → extracts → rebrands → installs deps → verifies `devilroute serve` boots and `/v1/models` responds → `npm pack`. |
| `publish.sh` | Publishes the converted directory to npm (one-time, maintainer run). |

## Build & publish

```bash
# 1. Convert (produces a publish-ready dir under $TMPDIR)
bash packages/devilroute/scripts/convert.sh          # omniroute@3.8.49
bash packages/devilroute/scripts/convert.sh 3.8.49   # pin a version

# 2. Publish once (maintainer; npm login required)
bash packages/devilroute/scripts/publish.sh
```

Until `devilroute` exists on npm, the app falls back to installing `omniroute`.

## Install on a user machine

The Devil AI app does this automatically (onboarding step + auto-start on launch):

```bash
npm install -g --legacy-peer-deps devilroute   # or: omniroute (fallback)
devilroute serve --port 20128
```

- `--legacy-peer-deps` is required — the upstream CLI tooling has peer-dependency
  conflicts that fail a strict npm resolution.
- Health check: `curl http://127.0.0.1:20128/v1/models`
- Web console: `http://127.0.0.1:20128/login`

## Troubleshooting

- **"Cannot find package 'update-notifier'"** — runtime deps weren't installed.
  Run `npm install -g --legacy-peer-deps devilroute` again.
- **Port 20128 in use** — either DevilRoute is already running (the app health-checks
  first and won't double-spawn), or another process owns the port. The app never kills
  unknown processes.
- **`/login` shows the old brand** — cosmetic only; re-run `convert.sh` + publish after
  an upstream version bump.
