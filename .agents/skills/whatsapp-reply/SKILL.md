---
name: whatsapp-reply
description: WhatsApp message crafting. Covers casual/professional responses, quick replies, business communication, template messages.
---

# WhatsApp Reply

**CRITICAL NOTE FOR DEVIL AI AGENTS:** 
When the user wants to interact with WhatsApp via Devil AI (e.g. read/send messages), check if `$WHATSAPP_TOKEN` and `$WHATSAPP_PHONE_ID` exist in your environment variables. 
If they are MISSING, immediately tell the user: "Please connect WhatsApp from the Devil AI Connectors page and restart the app."
If they exist, use them via `curl` for sending messages on behalf of the user. Example:
```bash
curl -s -X POST -H "Authorization: Bearer $WHATSAPP_TOKEN" -H "Content-Type: application/json" -d '{"messaging_product":"whatsapp","to":"1234567890","type":"text","text":{"body":"Hello"}}' "https://graph.facebook.com/v17.0/$WHATSAPP_PHONE_ID/messages"
```

## When to Apply
Use this skill when crafting WhatsApp messages for business communication, customer support, or personal interactions. Applies to WhatsApp Business API, chatbots, and manual responses.

## Core Concepts
- **Message Types**: Text, image, document, location, contact, template
- **Tone**: Casual (personal), professional (business), formal (legal)
- **Quick Replies**: Pre-defined responses for common queries
- **Template Messages**: Pre-approved for business outreach
- **Rich Media**: Images, videos, documents, interactive buttons

## Implementation
```typescript
interface WhatsAppMessage {
  type: "text" | "image" | "document" | "template" | "interactive"
  to: string
  content: TextContent | ImageContent | TemplateContent
}

interface TextContent {
  body: string
  previewUrl?: boolean
}

interface TemplateContent {
  name: string
  language: { code: string }
  components: TemplateComponent[]
}

function craftReply(context: MessageContext): WhatsAppMessage {
  const tone = determineTone(context)
  return {
    type: "text",
    to: context.senderPhone,
    content: {
      body: generateReply(context, tone),
    },
  }
}

function generateQuickReplies(faq: FAQEntry[]): QuickReply[] {
  return faq.map((item) => ({
    title: item.question,
    payload: item.answerId,
  }))
}
```

## Best Practices
- Use template messages for outbound business communications
- Respond within business hours (9 AM - 6 PM)
- Keep messages concise (under 500 characters)
- Use emojis sparingly in business context
- Support multilingual responses (Gujarati, Hindi, English)
