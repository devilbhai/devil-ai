---
name: agribee-whatsapp
description: WhatsApp order processing. Covers order intake via WhatsApp, automated replies, order confirmation, payment reminders, delivery updates.
---

# AgriBee WhatsApp Orders

## When to Apply
Use this skill when processing orders through WhatsApp, sending automated confirmations, or managing WhatsApp-based customer interactions. Applies to WhatsApp Business API integrations and chatbot flows.

## Core Concepts
- **Order Flow**: Message → Parse → Confirm → Payment → Dispatch → Delivery
- **Message Templates**: Pre-approved templates for order confirmation, payment, delivery
- **Automation**: Keyword detection, menu navigation, quick replies
- **Payments**: UPI links, bank transfer confirmation, COD management
- **Notifications**: Order status updates, delivery alerts, promotional messages

## Implementation
```typescript
interface WhatsAppOrder {
  id: string
  customerPhone: string
  customerName: string
  items: OrderItem[]
  totalAmount: number
  status: "received" | "confirmed" | "paid" | "dispatched" | "delivered"
  channel: "whatsapp"
  messages: WhatsAppMessage[]
}

// Order parsing from natural language
function parseOrderFromMessage(message: string): Partial<WhatsAppOrder> {
  // Extract product names, quantities from free text
  // Handle Gujarati/Hindi/English mixed messages
  // Return structured order data
}

// Template message sending
async function sendOrderConfirmation(order: WhatsAppOrder): Promise<void> {
  const template = buildTemplate("order_confirmation", {
    orderId: order.id,
    items: order.items,
    total: order.totalAmount,
  })
  await whatsappClient.sendTemplate(order.customerPhone, template)
}
```

## Best Practices
- Use pre-approved WhatsApp message templates for business communications
- Support multilingual messages (Gujarati, Hindi, English)
- Implement order confirmation within 5 minutes of receipt
- Send delivery updates proactively
- Handle payment reminders with appropriate frequency (not spammy)
