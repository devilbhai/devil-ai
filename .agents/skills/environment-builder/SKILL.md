---
name: environment-builder
description: Development environment setup. Tool installation, PATH configuration, shell setup.
---

# Environment Builder

## When to Apply
Use this skill when configuring development environments, installing toolchains, managing shell profiles, or ensuring consistent dev setups across machines.

## Core Concepts
- **Tool version managers**: fnm, nvm, mise (rtx) for runtime versions
- **PATH management**: Configuring shell profiles for tool discovery
- **Shell configuration**: .zshrc, .bashrc, .profile setup
- **Environment variables**: .env files, shell exports, secrets management
- **Devcontainer support**: Docker-based reproducible environments

## Implementation
```bash
# Install Bun via official installer
curl -fsSL https://bun.sh/install | bash

# Configure PATH (zsh)
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verify installation
bun --version

# Set up project-specific env
cat > .env << 'EOF'
NODE_ENV=development
PORT=3000
EOF

# Shell function for quick project setup
setup-project() {
  mkdir -p "$1" && cd "$1" && bun init -y && git init
}
```

## Best Practices
- Use `.tool-versions` (mise) or `.node-version` for runtime version pinning
- Document required tools in README.md with installation links
- Use `direnv` for directory-specific environment variables
- Keep secrets out of version control — use `.env.example` as template
- Prefer official installers over package managers for runtimes
- Test environment setup on a fresh machine or CI runner
