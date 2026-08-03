---
name: chatbot-builder
description: Chatbot development - conversation design, NLP integration, multi-platform deployment.
---

# Chatbot Builder

## When to Apply
Use this skill for building chatbots, designing conversations, or integrating NLP.

## Core Concepts
- Conversation design
- Intent recognition
- Entity extraction
- Dialog management
- Multi-platform deployment
- Analytics and improvement

## Best Practices
- Design natural conversations
- Handle edge cases gracefully
- Provide fallback options
- Learn from interactions
- Maintain context
- Test thoroughly

## Dialog Flow
```python
class Chatbot:
    def __init__(self):
        self.intents = {
            "greeting": self.handle_greeting,
            "order_status": self.handle_order_status,
            "return_policy": self.handle_return_policy,
            "fallback": self.handle_fallback
        }
    
    def process_message(self, message):
        intent = self.classify_intent(message)
        entities = self.extract_entities(message)
        
        handler = self.intents.get(intent, self.intents["fallback"])
        return handler(message, entities)
    
    def handle_greeting(self, message, entities):
        return "Hello! How can I help you today?"
    
    def handle_order_status(self, message, entities):
        order_id = entities.get("order_id")
        if order_id:
            status = self.lookup_order(order_id)
            return f"Your order {order_id} is {status}"
        return "Please provide your order ID."
```

## Intent Classification
```python
from transformers import pipeline

classifier = pipeline("zero-shot-classification")

def classify_intent(message):
    candidate_labels = [
        "greeting",
        "order_status",
        "return_policy",
        "complaint",
        "general_question"
    ]
    
    result = classifier(message, candidate_labels)
    return result["labels"][0]
```

## Multi-Platform Deployment
```python
class MultiPlatformBot:
    def __init__(self):
        self.platforms = {
            "web": WebAdapter(),
            "whatsapp": WhatsAppAdapter(),
            "slack": SlackAdapter()
        }
    
    def handle_message(self, platform, message):
        response = self.process_message(message)
        self.platforms[platform].send(response)
```

## Analytics
```python
def track_conversation(user_id, message, response, intent):
    analytics.log({
        "user_id": user_id,
        "message": message,
        "response": response,
        "intent": intent,
        "timestamp": datetime.now(),
        "satisfaction": None  # Collected later
    })
```
