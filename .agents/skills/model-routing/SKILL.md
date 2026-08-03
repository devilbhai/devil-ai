---
name: model-routing
description: Model routing across providers (OpenRouter, Ollama, OpenAI, Anthropic). Covers cost optimization, latency routing, fallback strategies, model selection, load balancing.
---

# Model Routing Across Providers

## When to Apply
- Routing requests across multiple LLM providers
- Optimizing for cost, latency, or quality
- Implementing fallback chains when a provider is unavailable
- Load balancing across rate-limited providers
- Selecting models per task complexity

## Core Concepts
- **Provider abstraction**: Uniform interface for OpenAI, Anthropic, Ollama, OpenRouter
- **Cost routing**: Route simple tasks to cheap models, complex to expensive
- **Latency routing**: Prefer faster providers for time-sensitive requests
- **Fallback chains**: Provider A fails -> Provider B -> Provider C
- **Load balancing**: Round-robin or weighted distribution

## Implementation

### Provider Router
```ts
interface Provider {
  id: string
  priority: number
  costPer1k: number
  avgLatencyMs: number
  maxRpm: number
  currentRpm: number
  healthy: boolean
}

function selectProvider(providers: Provider[], task: "simple" | "complex"): Provider {
  const healthy = providers.filter((p) => p.healthy && p.currentRpm < p.maxRpm)
  if (task === "simple") {
    return healthy.sort((a, b) => a.costPer1k - b.costPer1k)[0]
  }
  return healthy.sort((a, b) => b.priority - a.priority)[0]
}
```

### Fallback Chain
```ts
async function withFallback(
  prompt: string,
  chain: Array<{ provider: string; model: string }>,
): Promise<string> {
  for (const { provider, model } of chain) {
    try {
      return await callProvider(provider, model, prompt)
    } catch (err) {
      console.warn(`[${provider}] failed, trying next...`)
    }
  }
  throw new Error("All providers exhausted")
}
```

### Cost-Aware Router
```ts
function routeByCost(complexity: number, budget: number): string {
  if (complexity < 0.3 && budget < 0.01) return "gpt-4o-mini"
  if (complexity < 0.6 && budget < 0.05) return "claude-3-haiku"
  if (complexity < 0.8) return "gpt-4o"
  return "claude-3-opus"
}
```

## Best Practices
- Monitor provider health with circuit breakers
- Cache responses for identical prompts (hash the prompt)
- Set per-provider rate limiters, not global ones
- Log routing decisions for cost analysis
- Use streaming for latency-sensitive routes
- Tag requests with `route:cost` or `route:quality` for observability
- Test fallback chains regularly to catch dead providers
