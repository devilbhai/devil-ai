---
name: telegram-assistant
description: Telegram bot development. Bot API, webhook handling, inline keyboards, group management.
---

# Telegram Assistant

## CRITICAL: Before Doing Anything

1. First run: `echo "TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN"` to check if token exists.
2. **If token is EMPTY or missing**: Tell the user:
   > "Telegram token nahi mila. Kripya Devil AI Settings → Connectors page pe jaake Telegram connect karo. Uske baad app ko poori tarah band karke dobara start karo (bun run dev stop karke restart karo)."
   Then STOP. Do not attempt anything else.
3. **If token IS set**: Proceed with the tasks below using that token directly.

---

## Reading Messages (getUpdates)

To fetch the latest messages sent to the bot:

```bash
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?limit=20&offset=-20"
```

Parse the result JSON to extract:
- `result[].message.chat.id` → chat_id (needed to reply)
- `result[].message.from.first_name` → sender name
- `result[].message.text` → message text
- `result[].message.date` → Unix timestamp

**Show these in a readable summary for the user.**

---

## Sending a Message

To send a reply to a specific chat:

```bash
curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": CHAT_ID_HERE,
    "text": "YOUR MESSAGE HERE",
    "parse_mode": "Markdown"
  }'
```

Replace `CHAT_ID_HERE` with the actual chat ID from getUpdates.

---

## Bot Info Check

To verify the bot token is valid:

```bash
curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe"
```

If this returns `{"ok":false,...}`, the token is invalid. Tell the user to re-enter the correct token in Connectors.

---

## Common Workflows

### User asks "Telegram pe koi message aaya?"
1. Run getUpdates curl command
2. Parse and display messages in human-readable Hindi/English format
3. Ask user: "Kya aap kisi message ka reply chahte hain?"

### User asks to "reply karo" or "yeh message bhejo"
1. Get chat_id from recent getUpdates (if not already known)
2. Run sendMessage curl with the chat_id and user's message text
3. Confirm: "Message bhej diya! ✅"

### User asks "bot ka naam kya hai / bot sahi chal raha hai?"
1. Run getMe
2. Show bot username and name

---

## Important Notes

- `getUpdates` returns messages from last 24 hours by default (up to 100).
- If messages are empty (`result: []`), tell user: "Abhi tak koi message nahi aaya bot pe."
- **NEVER** use `TELEGRAM_BOT_TOKEN` as a literal string — always use the env variable `$TELEGRAM_BOT_TOKEN` in curl commands so the shell substitutes the real value.
- Telegram Bot API is stateless — the bot does NOT auto-reply. Devil AI acts as the brain and sends replies on command.
