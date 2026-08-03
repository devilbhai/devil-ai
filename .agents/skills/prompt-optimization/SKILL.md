---
name: prompt-optimization
description: Prompt engineering optimization - chain-of-thought, few-shot, meta-prompting, evaluation.
---

# Prompt Optimization

## When to Apply
Use this skill for optimizing prompts, improving AI output quality, implementing prompt patterns, or building prompt libraries.

## Core Concepts
- Chain-of-thought (CoT)
- Few-shot learning
- Tree-of-thought
- Self-consistency
- Meta-prompting
- Prompt chaining
- Constitutional AI

## Best Practices
- Be specific and clear
- Provide examples when possible
- Use structured output formats
- Test with edge cases
- Version control prompts
- Evaluate systematically
- Use prompt templates

## Prompt Patterns
```python
# Chain-of-Thought
cot_prompt = """
Question: {question}

Let's think step by step:
1. First, I need to identify...
2. Then, I should consider...
3. Finally, I can conclude...

Answer: """

# Few-Shot
few_shot_prompt = """
Examples:
Input: "The cat sat on the mat"
Sentiment: Positive

Input: "The product is terrible"
Sentiment: Negative

Input: {text}
Sentiment: """
```

## Evaluation Framework
```python
def evaluate_prompt(prompt, test_cases, metrics):
    results = []
    for test in test_cases:
        output = llm.generate(prompt.format(**test.input))
        scores = {
            "accuracy": check_accuracy(output, test.expected),
            "relevance": check_relevance(output, test.expected),
            "coherence": check_coherence(output),
        }
        results.append(scores)
    return aggregate_results(results)
```

## Meta-Prompting
```python
meta_prompt = """
I need to create a prompt for the following task:
Task: {task_description}

Requirements:
- Clear instructions
- Expected output format
- Edge cases to handle

Generate an optimized prompt:
"""
```

## Prompt Chaining
```python
# Step 1: Extract information
extraction_prompt = "Extract key facts from: {text}"

# Step 2: Analyze
analysis_prompt = "Analyze these facts: {extracted_facts}"

# Step 3: Generate
generation_prompt = "Based on this analysis: {analysis}"
```
