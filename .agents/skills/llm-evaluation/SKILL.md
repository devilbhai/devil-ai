---
name: llm-evaluation
description: LLM evaluation and benchmarking. Covers metrics (BLEU, ROUGE, human eval), test datasets, evaluation pipelines, A/B testing, quality scoring.
---

# LLM Evaluation & Benchmarking

## When to Apply
- Evaluating model performance across tasks
- Comparing outputs between models or prompts
- Building automated quality scoring pipelines
- Running A/B tests between prompt versions
- Benchmarking latency, cost, and accuracy trade-offs

## Core Concepts
- **Metrics**: BLEU (translation similarity), ROUGE (summarization recall/precision), semantic similarity, factuality scoring
- **Human eval**: Likert scales, pairwise preference, expert rubric scoring
- **Automated eval**: LLM-as-judge (GPT-4 grading), reference-based metrics, style consistency checks
- **Datasets**: Gold-standard test cases, edge-case collections, regression suites

## Implementation

### Basic Eval Pipeline
```ts
interface EvalCase {
  input: string
  expected: string
  tags?: string[]
}

interface EvalResult {
  caseId: string
  output: string
  scores: Record<string, number>
  latencyMs: number
  tokenCount: number
}

async function runEval(cases: EvalCase[], model: string): Promise<EvalResult[]> {
  const results: EvalResult[] = []
  for (const c of cases) {
    const start = Date.now()
    const output = await generate(c.input, { model })
    results.push({
      caseId: c.input.slice(0, 32),
      output,
      scores: { exactMatch: c.expected === output ? 1 : 0 },
      latencyMs: Date.now() - start,
      tokenCount: countTokens(output),
    })
  }
  return results
}
```

### LLM-as-Judge Pattern
```ts
async function judgeScore(output: string, criteria: string): Promise<number> {
  const prompt = `Rate the following on a 1-5 scale for "${criteria}":\n\n${output}\n\nRespond with only a number.`
  const score = await generate(prompt, { model: "gpt-4" })
  return Number.parseInt(score.trim(), 10)
}
```

### A/B Test Runner
```ts
async function abTest(
  cases: EvalCase[],
  variantA: string,
  variantB: string,
): Promise<{ a: number; b: number; ties: number }> {
  let a = 0, b = 0, ties = 0
  for (const c of cases) {
    const [outA, outB] = await Promise.all([
      generate(c.input, { model: variantA }),
      generate(c.input, { model: variantB }),
    ])
    const winner = await judgeBoth(outA, outB, c.expected)
    if (winner === "a") a++
    else if (winner === "b") b++
    else ties++
  }
  return { a, b, ties }
}
```

## Best Practices
- Always include deterministic and stochastic eval paths
- Track cost and latency alongside quality metrics
- Version your test datasets and eval prompts
- Run evals in CI on every prompt change
- Use confidence intervals, not single-run averages
- Include adversarial and edge-case inputs
- Log full traces (input, output, scores) for debugging
