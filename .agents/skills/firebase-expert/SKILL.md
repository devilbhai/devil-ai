---
name: firebase-expert
description: Firebase platform. Firestore, Authentication, Cloud Functions, Hosting, Security Rules.
---

# Firebase Expert

## When to Apply
Use this skill when building or maintaining Firebase applications, including Firestore data modeling, authentication flows, Cloud Functions, hosting, and security rules.

## Core Concepts
- **Firestore**: Document/collection modeling, queries, real-time listeners, transactions, batched writes, denormalization
- **Authentication**: Email/password, OAuth providers, custom claims, session management, multi-factor auth
- **Cloud Functions**: v2 functions, triggers (Firestore, Auth, HTTP, Pub/Sub), lifecycle events, cold starts
- **Security Rules**: Rule syntax, match blocks, request validation, data validation, recursive rules
- **Hosting**: Single-page app config, rewrites, redirects, edge functions, preview channels
- **Cloud Messaging**: Push notifications, topic messaging, notification composition
- **Analytics & Performance**: Custom events, traces, crashlytics integration
- **Storage**: File uploads, security rules, image transformations, download URLs

## Implementation
```javascript
// Firestore data model with subcollections
const userRef = db.collection('users').doc(userId)

// Create user with subcollection
await userRef.set({
  name: 'John Doe',
  email: 'john@example.com',
  role: 'premium',
  createdAt: FieldValue.serverTimestamp()
})

// Query with composite filters
const query = db.collection('orders')
  .where('userId', '==', userId)
  .where('status', 'in', ['pending', 'processing'])
  .orderBy('createdAt', 'desc')
  .limit(25)

// Real-time listener with error handling
const unsubscribe = onSnapshot(query, (snapshot) => {
  const orders = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
  updateUI(orders)
}, (error) => {
  console.error('Firestore listener error:', error)
})

// Transaction for atomic updates
await runTransaction(db, async (transaction) => {
  const userDoc = await transaction.get(userRef)
  const currentBalance = userDoc.data().balance

  if (currentBalance < amount) {
    throw new Error('Insufficient balance')
  }

  transaction.update(userRef, {
    balance: FieldValue.increment(-amount)
  })

  const orderRef = db.collection('orders').doc()
  transaction.set(orderRef, {
    userId,
    amount,
    status: 'completed',
    createdAt: FieldValue.serverTimestamp()
  })
})

// Cloud Function v2 with triggers
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { onRequest } from 'firebase-functions/v2/https'

export const onOrderCreated = onDocumentCreated(
  'orders/{orderId}',
  async (event) => {
    const order = event.data.data()
    await sendConfirmationEmail(order.userEmail, order)
  }
)

export const api = onRequest({ cors: true }, async (req, res) => {
  const auth = getAuth()
  const token = req.headers.authorization?.split('Bearer ')[1]
  const decoded = await auth.verifyIdToken(token)
  res.json({ uid: decoded.uid })
})

// Security Rules
rules_version = '2'
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, update: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null;
    }

    match /orders/{orderId} {
      allow read: if request.auth != null &&
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null &&
        request.resource.data.keys().hasAll(['userId', 'amount', 'status']) &&
        request.resource.data.amount > 0;
    }
  }
}

// Hosting config (firebase.json)
{
  "hosting": {
    "public": "dist",
    "rewrites": [
      { "source": "/api/**", "function": "api" },
      { "source": "**", "destination": "/index.html" }
    ],
    "headers": [
      {
        "source": "**",
        "headers": [
          { "key": "X-Content-Type-Options", "value": "nosniff" },
          { "key": "X-Frame-Options", "value": "DENY" }
        ]
      }
    ]
  }
}
```

## Best Practices
- Denormalize data to minimize read operations — duplicate data over joins
- Use `FieldValue.serverTimestamp()` for consistent timestamps across clients
- Implement offline persistence for mobile applications
- Write granular security rules that validate both request and resource data
- Use Cloud Functions v2 for better performance and simpler configuration
- Batch writes for operations that must succeed or fail atomically
- Index composite queries explicitly — Firestore doesn't auto-create them
- Monitor costs with Firebase pricing dashboard and set budget alerts
