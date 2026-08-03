# Devil AI Agent Bridge

This package provides the Devil AI autonomous agent capabilities for the Devil AI desktop app.

## Key Feature: No Separate API Key Needed!

Aiden Bridge uses the **existing OpenCode server providers** that are already configured in Devil AI. No need to set up separate API keys or configurations.

## Installation

This package is automatically installed as part of the Devil AI monorepo.

## Usage

```typescript
import { DevilAIAgent } from '@devil-ai/agent-bridge'

const devilAI = new DevilAIAgent({
  workDir: '/path/to/workspace'
})

await devilAI.initialize()

// Execute a task - automatically uses configured providers
const task = await devilAI.executeTask('Organize all PDF files in Downloads folder')
console.log(task.result)
```

## Identity

```typescript
const identity = devilAI.getIdentity()
console.log(identity.name) // "Devil AI"
console.log(identity.description) // "Autonomous AI agent built by the Devil AI team"
```

## How It Works

1. **Auto-Detection**: Bridge automatically detects running OpenCode server
2. **Provider Reuse**: Uses same providers configured in Devil AI settings
3. **Seamless Integration**: No additional configuration required

## Features

- **Autonomous Task Execution**: Execute complex tasks using Devil AI's 76 skills and 121 tools
- **Provider Reuse**: Automatically uses existing OpenCode server providers
- **Local-First**: Data stays on your machine, only prompts are sent to providers
- **Memory System**: Persistent memory across sessions
- **Browser Control**: Automate browser interactions
- **File Management**: Organize, search, and manipulate files
- **Devil AI Identity**: "Hey Devil AI" wake word support

## Integration with Devil AI

The Devil AI Agent is integrated into the Devil AI desktop app's main process. It provides:

1. **AI Agent Capabilities**: Autonomous task execution
2. **Skill System**: Access to 76 pre-built skills
3. **Tool Integration**: 121 built-in tools for various operations
4. **Provider Management**: Uses existing OpenCode server providers
5. **Wake Word**: "Hey Devil AI" triggers agent response

## Configuration

**No separate configuration needed!**

Aiden Bridge automatically uses:
- Providers configured in Devil AI settings
- API keys stored in OpenCode server
- Model selections from Devil AI app

If you want to override, you can set:
- `AIDEN_PROVIDER`: Override provider (optional)
- `AIDEN_MODEL`: Override model (optional)

## License

MIT
