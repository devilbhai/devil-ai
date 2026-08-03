---
name: gmail-assistant
description: Gmail connector integration. Email reading, writing, drafting, and inbox management.
---

# Gmail Assistant

## When to Apply
Use this skill when the user asks you to interact with their Gmail account, such as reading emails, writing emails, sending emails, drafting, or checking the inbox.

## CRITICAL: Authentication Check
Before attempting to interact with Gmail, you MUST check if the user is connected by checking for the `GOOGLE_ACCESS_TOKEN` environment variable.

1. Run the `env` command (or check process.env) to see if `GOOGLE_ACCESS_TOKEN` is set.
2. **If it is NOT set**, DO NOT attempt to search for credentials, run random curl commands, or hallucinate APIs. Instead, explicitly tell the user:
   "It looks like Gmail is not connected. Please go to **Settings -> Connectors** and connect your Google/Gmail account first, then let me know once it's done."
3. **If it IS set**, proceed with using standard API endpoints or MCP tools designed for Gmail operations, passing the token for authentication as required.

## API Usage
When interacting with Gmail, always ensure you respect the user's instructions.
- Only send emails if explicitly told to do so. Otherwise, draft them.
- When reading emails, prioritize unread messages unless the user specifies otherwise.
