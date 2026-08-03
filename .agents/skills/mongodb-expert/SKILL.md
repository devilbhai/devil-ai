---
name: mongodb-expert
description: MongoDB development. Document design, aggregation pipeline, indexing, sharding.
---

# MongoDB Expert

## When to Apply
Use this skill when designing, building, or optimizing MongoDB applications, including document modeling, aggregation pipelines, indexing strategies, and sharded cluster operations.

## Core Concepts
- **Document Design**: Embedding vs referencing, schema validation, data modeling patterns, bucket pattern
- **CRUD Operations**: Insert/update patterns, bulk operations, upserts, findAndModify, transactions
- **Aggregation Pipeline**: Pipeline stages, $lookup, $unwind, $group, $facet, performance optimization
- **Indexing**: Single field, compound, multikey, text, geospatial, TTL, partial indexes, index projections
- **Sharding**: Shard key selection, zone sharding, balancer, chunk splits, cross-shard queries
- **Replica Sets**: Read preference, write concern, election priority, hidden members, delayed replicas
- **Change Streams**: Real-time data processing, resume tokens, pipeline filtering, event handling

## Implementation
```javascript
// Schema validation with Mongoose
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  profile: {
    avatar: String,
    bio: { type: String, maxlength: 500 }
  },
  tags: [{ type: String, index: true }],
  createdAt: { type: Date, default: Date.now, immutable: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

userSchema.index({ email: 1 }, { unique: true })
userSchema.index({ 'profile.bio': 'text', name: 'text' })
userSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 })

// Aggregation pipeline for analytics
const monthlyStats = await Order.aggregate([
  { $match: { createdAt: { $gte: startOfMonth } } },
  { $lookup: {
      from: 'users',
      localField: 'userId',
      foreignField: '_id',
      as: 'user'
  }},
  { $unwind: '$user' },
  { $group: {
      _id: { month: { $month: '$createdAt' }, category: '$category' },
      totalRevenue: { $sum: '$amount' },
      orderCount: { $sum: 1 },
      avgOrderValue: { $avg: '$amount' },
      uniqueUsers: { $addToSet: '$userId' }
  }},
  { $addFields: {
      uniqueUserCount: { $size: '$uniqueUsers' }
  }},
  { $sort: { totalRevenue: -1 } },
  { $facet: {
      topCategories: [{ $limit: 10 }],
      summary: [{ $group: {
          _id: null,
          totalRevenue: { $sum: '$totalRevenue' },
          totalOrders: { $sum: '$orderCount' }
      }}]
  }}
])

// Change stream for real-time updates
const changeStream = Order.watch([], {
  fullDocument: 'updateLookup',
  resumeAfter: resumeToken
})

changeStream.on('change', async (change) => {
  switch (change.operationType) {
    case 'insert':
      await notifyNewOrder(change.fullDocument)
      break
    case 'update':
      if (change.fullDocument.status === 'completed') {
        await updateAnalytics(change.fullDocument)
      }
      break
  }
})

// Bulk operations with ordered writes
const bulkOps = users.map(user => ({
  updateOne: {
    filter: { email: user.email },
    update: { $setOnInsert: user },
    upsert: true
  }
}))

await User.bulkWrite(bulkOps, { ordered: false })

// Transaction across collections
const session = await mongoose.startSession()
try {
  await session.withTransaction(async () => {
    const order = await Order.create([{ ...orderData }], { session })
    await Inventory.updateOne(
      { productId: orderData.productId },
      { $inc: { stock: -orderData.quantity } },
      { session }
    )
    await Account.updateOne(
      { userId: orderData.userId },
      { $inc: { balance: -orderData.total } },
      { session }
    )
  })
} finally {
  await session.endSession()
}
```

## Best Practices
- Design documents around query patterns, not normalization rules
- Use the bucket pattern for time-series data to limit document growth
- Create compound indexes with equality fields first, then sort, then range
- Use `explain('executionStats')` to verify index usage and scan ratios
- Set appropriate writeConcern: { w: 'majority' } for critical writes
- Use change streams instead of polling for real-time features
- Shard keys should be monotonically increasing (likeObjectId) or hashed for even distribution
- Use `$lookup` sparingly — prefer denormalization for frequently joined data
