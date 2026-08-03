---
name: memory-management
description: AI agent memory systems. Covers short-term/long-term memory, memory retrieval, memory consolidation, conversation history, context windows, memory persistence.
---

# AI Agent Memory Management

## When to Apply

- Building memory systems for AI agents that need to remember across sessions
- Implementing short-term (conversation buffer) vs long-term (persistent) memory separation
- Designing memory retrieval strategies (recency, relevance, importance scoring)
- Consolidating conversation history into persistent knowledge
- Managing context window limits with summarization or sliding window techniques
- Persisting agent memory to databases, files, or key-value stores
- Implementing memory decay, forgetting, or prioritization over time

## Core Patterns

### Memory Types

```typescript
interface Memory {
  id: string
  type: "short_term" | "long_term" | "episodic" | "semantic"
  content: string
  metadata: {
    timestamp: number
    importance: number // 0-1
    accessCount: number
    lastAccessed: number
    source: string
  }
  embedding?: number[]
}
```

### Short-Term Memory (Conversation Buffer)

```typescript
class ConversationBuffer {
  private messages: Memory[] = []
  private maxTokens: number

  constructor(maxTokens = 4000) {
    this.maxTokens = maxTokens
  }

  add(message: Memory) {
    this.messages.push(message)
    this.prune()
  }

  private prune() {
    while (this.estimateTokens() > this.maxTokens && this.messages.length > 1) {
      // Move evicted messages to long-term memory
      const evicted = this.messages.shift()!
      longTermStore.save(evicted)
    }
  }

  private estimateTokens(): number {
    return this.messages.reduce((sum, m) => sum + Math.ceil(m.content.length / 4), 0)
  }

  getRecent(k = 10): Memory[] {
    return this.messages.slice(-k)
  }
}
```

### Long-Term Memory (Vector Store)

```typescript
class LongTermMemory {
  private vectorStore: VectorStore
  private db: Database

  async save(memory: Memory) {
    memory.type = "long_term"
    if (!memory.embedding) {
      memory.embedding = await embed(memory.content)
    }
    await this.vectorStore.upsert(memory.id, memory.embedding, memory)
    await this.db.insert("memories", memory)
  }

  async retrieve(query: string, limit = 10): Promise<Memory[]> {
    const queryEmbedding = await embed(query)
    const results = await this.vectorStore.search(queryEmbedding, limit)
    // Boost by importance and recency
    return results
      .map((r) => ({
        ...r,
        score: r.similarity * 0.6 + r.metadata.importance * 0.2 + this.recencyScore(r) * 0.2,
      }))
      .sort((a, b) => b.score - a.score)
  }

  private recencyScore(memory: Memory): number {
    const age = Date.now() - memory.metadata.timestamp
    return Math.exp(-age / (24 * 60 * 60 * 1000)) // Decay over 24h
  }
}
```

### Memory Consolidation

```typescript
async function consolidateConversation(buffer: ConversationBuffer, longTerm: LongTermMemory) {
  const messages = buffer.getAll()
  // Extract key facts and decisions
  const facts = await extractFacts(messages)
  // Summarize the conversation
  const summary = await summarize(messages)

  for (const fact of facts) {
    await longTerm.save({
      id: crypto.randomUUID(),
      type: "semantic",
      content: fact,
      metadata: {
        timestamp: Date.now(),
        importance: fact.important ? 0.9 : 0.5,
        accessCount: 0,
        lastAccessed: Date.now(),
        source: "consolidation",
      },
    })
  }

  await longTerm.save({
    id: crypto.randomUUID(),
    type: "episodic",
    content: summary,
    metadata: {
      timestamp: Date.now(),
      importance: 0.7,
      accessCount: 0,
      lastAccessed: Date.now(),
      source: "conversation_summary",
    },
  })
}
```

### Context Window Management

```typescript
function buildContext(
  systemPrompt: string,
  recentMessages: Memory[],
  retrievedMemories: Memory[],
  maxContextTokens: number
): string {
  let context = systemPrompt
  let budget = maxContextTokens - estimateTokens(systemPrompt)

  // Add most relevant memories first
  for (const mem of retrievedMemories) {
    const tokens = estimateTokens(mem.content)
    if (tokens < budget) {
      context += `\n[Memory]: ${mem.content}`
      budget -= tokens
    }
  }

  // Add recent conversation
  for (const msg of recentMessages.reverse()) {
    const tokens = estimateTokens(msg.content)
    if (tokens < budget) {
      context = `${msg.content}\n${context}` // Prepend (most recent first)
      budget -= tokens
    }
  }

  return context
}
```

## Configuration

### Memory Storage Layout

```
~/.local/share/agent-memory/
├── short-term/          # In-memory, ephemeral
├── long-term/
│   ├── memories.db      # SQLite with FTS5
│   ├── embeddings/      # Vector store files
│   └── summaries/       # Consolidated conversation logs
└── config.json          # Memory settings
```

### Memory Config

```json
{
  "shortTerm": {
    "maxTokens": 4000,
    "consolidationThreshold": 3000
  },
  "longTerm": {
    "maxMemories": 100000,
    "importanceThreshold": 0.3,
    "decayRate": 0.95
  },
  "retrieval": {
    "topK": 10,
    "weights": {
      "relevance": 0.6,
      "importance": 0.2,
      "recency": 0.2
    }
  }
}
```

## Best Practices

- Separate short-term (conversation buffer) and long-term (persistent) memory with clear consolidation triggers
- Score memories by importance, relevance, and recency — never rely on a single factor
- Use exponential decay for memory relevance to naturally age out old information
- Consolidate after every N messages or when the buffer exceeds token limits
- Store metadata (timestamp, source, importance) alongside every memory for retrieval scoring
- Use vector similarity for semantic retrieval; combine with keyword search for exact matches
- Limit context window usage with summarization — don't just truncate
- Persist memory to disk (SQLite + vector store) for cross-session continuity
- Implement forgetting thresholds to prevent memory bloat in long-running agents
- Test memory retrieval quality by measuring answer accuracy with and without memory context
