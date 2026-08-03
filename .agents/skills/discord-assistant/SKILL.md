---
name: discord-assistant
description: Discord bot development. Bot API, slash commands, embeds, moderation.
---

# Discord Assistant

**CRITICAL NOTE FOR DEVIL AI AGENTS:** 
When the user wants to interact with Discord via Devil AI (e.g. read/send messages), check if `$DISCORD_BOT_TOKEN` exists in your environment variables. 
If it is MISSING, immediately tell the user: "Please connect Discord from the Devil AI Connectors page and restart the app."
If it exists, use it via `curl` for reading/sending messages on behalf of the user. Example:
\`\`\`bash
curl -s -H "Authorization: Bot $DISCORD_BOT_TOKEN" "https://discord.com/api/v10/users/@me"
\`\`\`

## When to Apply
Use this skill when building Discord bots, creating slash commands, designing embeds, or implementing moderation features.

## Core Concepts
- Discord.js or direct API: message, interaction, guild management
- Slash commands: /command with options and subcommands
- Embeds: rich formatted messages with fields, colors, thumbnails
- Permissions: role-based access control
- Rate limits: 50 requests per second per bucket

## Implementation

```typescript
interface DiscordBotConfig {
  token: string
  clientId: string
  guildId?: string // for dev server
}

interface EmbedMessage {
  title: string
  description: string
  color: number
  fields?: { name: string; value: string; inline?: boolean }[]
  footer?: { text: string }
  timestamp?: string
}

function createEmbed(data: EmbedMessage): object {
  return {
    embeds: [{
      title: data.title,
      description: data.description,
      color: data.color,
      fields: data.fields,
      footer: data.footer,
      timestamp: data.timestamp ?? new Date().toISOString(),
    }],
  }
}

async function registerCommands(
  config: DiscordBotConfig,
  commands: SlashCommand[]
): Promise<void> {
  const url = config.guildId
    ? `https://discord.com/api/v10/applications/${config.clientId}/guilds/${config.guildId}/commands`
    : `https://discord.com/api/v10/applications/${config.clientId}/commands`

  await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bot ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands.map(cmd => ({
      name: cmd.name,
      description: cmd.description,
      options: cmd.options,
    }))),
  })
}
```

## Best Practices
- Use slash commands over message commands
- Respond to interactions within 3 seconds (use deferred responses)
- Implement cooldowns to prevent spam
- Use embeds for rich content
- Store persistent data in a database
- Handle rate limits with retry logic
- Test commands in a private guild first
