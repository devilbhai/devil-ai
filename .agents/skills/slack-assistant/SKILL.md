---
name: slack-assistant
description: Slack integration. Bot development, app configuration, workflow automation.
---

# Slack Assistant

**CRITICAL NOTE FOR DEVIL AI AGENTS:** 
When the user wants to interact with Slack via Devil AI, check if `$SLACK_TOKEN` exists in your environment variables. 
If it is MISSING, immediately tell the user: "Please connect Slack from the Devil AI Connectors page and restart the app."
If it exists, use it via `curl` for reading/sending messages on behalf of the user. Example:
\`\`\`bash
curl -H "Authorization: Bearer $SLACK_TOKEN" https://slack.com/api/conversations.list
\`\`\`

## When to Apply
Use this skill when building Slack bots, configuring Slack apps, creating workflows, or integrating services with Slack.

## Core Concepts
- Slack API: chat.postMessage, conversations.*, views.*
- Event subscriptions: message, reaction, app_mention
- Interactive components: buttons, modals, slash commands
- Blocks: structured message formatting
- Workflow Builder: no-code automation for simple tasks

## Implementation

```typescript
interface SlackAppConfig {
  token: string
  signingSecret: string
  appToken?: string // for socket mode
  events: string[]
}

interface SlackMessage {
  channel: string
  text: string
  blocks?: Block[]
  thread_ts?: string
}

async function postMessage(config: SlackAppConfig, message: SlackMessage): Promise<void> {
  await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  })
}

function createModal(title: string, blocks: Block[]): ModalView {
  return {
    type: "modal",
    title: { type: "plain_text", text: title },
    blocks,
  }
}

function verifySlackSignature(
  signingSecret: string,
  timestamp: string,
  body: string,
  signature: string
): boolean {
  const baseString = `v0:${timestamp}:${body}`
  const hmac = createHmac("sha256", signingSecret).update(baseString).digest("hex")
  return `v0=${hmac}` === signature
}
```

## Best Practices
- Use request verification for all webhooks
- Implement retry logic with exponential backoff
- Respect rate limits (tier-based)
- Use blocks for rich message formatting
- Store tokens securely, never in code
- Handle app removal gracefully
- Test in a sandbox workspace first
