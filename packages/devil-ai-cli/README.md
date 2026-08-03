# devil-ai-cli

AI-powered coding assistant via Telegram — CLI version of Devil AI.

Runs on any system (macOS, Linux, Windows), connects to Telegram, and executes coding tasks on your local machine.

## Install

```bash
# From npm (when published)
npm install -g devil-ai-cli

# From GitHub
npm install -g github:devilbhai/devil-ai-cli

# Local development
cd packages/devil-ai-cli && npm link
```

## Prerequisites

- **Node.js** >= 18
- **OpenCode** — `curl -fsSL https://opencode.ai/install | bash`
- **cloudflared** — for Telegram webhooks
  - macOS: `brew install cloudflare/cloudflare/cloudflared`
  - Linux: `curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared && chmod +x /usr/local/bin/cloudflared`
  - Windows: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/

## Setup

1. Create a Telegram bot via [@BotFather](https://t.me/BotFather)
2. Get your bot token
3. Configure: `devil-ai config --token YOUR_BOT_TOKEN`
4. Check dependencies: `devil-ai setup`

## Usage

```bash
# Start the assistant
devil-ai start

# Start with token inline
devil-ai start --token YOUR_BOT_TOKEN

# Check status
devil-ai status

# Stop
devil-ai stop
```

## How It Works

```
Telegram User → Telegram Bot API → Devil AI CLI → OpenCode Server (localhost:4101)
                                        ↓
                                   Local System
                             (files, commands, git, code)
```

1. CLI starts OpenCode server on localhost:4101
2. Creates a Cloudflare tunnel for Telegram webhooks
3. Receives messages from Telegram
4. Forwards them to OpenCode (AI coding agent)
5. OpenCode executes tasks on your local system
6. Responses are sent back via Telegram

## Commands

| Command | Description |
|---------|-------------|
| `devil-ai start` | Start OpenCode server + Telegram bot |
| `devil-ai stop` | Stop everything |
| `devil-ai status` | Show running status |
| `devil-ai config` | Configure settings |
| `devil-ai setup` | Check dependencies |

## Telegram Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Show welcome message |
| `/new` | Start a new conversation |
| `/sessions` | List active sessions |

## License

MIT
