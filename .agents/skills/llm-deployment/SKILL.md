---
name: llm-deployment
description: Deploy LLMs to production - model serving, API design, scaling, monitoring, cost optimization.
---

# LLM Deployment

## When to Apply
Use this skill for deploying language models, building inference APIs, optimizing model serving, or managing production LLM systems.

## Core Concepts
- Model serving (vLLM, TGI, Triton)
- API design and rate limiting
- Batch inference
- Streaming responses
- Caching strategies
- Cost optimization
- Monitoring and observability

## Best Practices
- Use batching for throughput
- Implement streaming for UX
- Cache common prompts
- Monitor latency and costs
- Implement retry logic
- Use async processing
- Set up health checks

## vLLM Deployment
```python
from vllm import LLM, SamplingParams

# Initialize
llm = LLM(model="meta-llama/Llama-2-7b-chat-hf")

# Generate
params = SamplingParams(temperature=0.7, max_tokens=512)
outputs = llm.generate(prompts, params)
```

## API Design
```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse

app = FastAPI()

@app.post("/chat")
async def chat(request: ChatRequest):
    # Stream response
    async def generate():
        async for chunk in llm.stream(request.messages):
            yield f"data: {json.dumps(chunk)}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")
```

## Caching Strategy
```python
from functools import lru_cache
import hashlib

@lru_cache(maxsize=1000)
def cached_generate(prompt_hash, params):
    return llm.generate(prompt, params)

def generate(prompt, params):
    prompt_hash = hashlib.md5(prompt.encode()).hexdigest()
    return cached_generate(prompt_hash, params)
```

## Monitoring
- Track latency (P50, P95, P99)
- Monitor throughput (tokens/second)
- Log errors and retries
- Track costs per request
- Monitor model drift
- Set up alerts

## Cost Optimization
- Use appropriate model size
- Implement prompt caching
- Use batch processing
- Optimize max_tokens
- Monitor and set budgets
- Use spot instances for training
