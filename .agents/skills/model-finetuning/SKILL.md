---
name: model-finetuning
description: Fine-tuning LLMs - data preparation, training configs, evaluation, deployment of custom models.
---

# Model Fine-tuning

## When to Apply
Use this skill for fine-tuning language models, preparing training data, optimizing hyperparameters, or evaluating model performance.

## Core Concepts
- Supervised fine-tuning (SFT)
- RLHF and DPO
- LoRA and QLoRA
- Data formatting and quality
- Training hyperparameters
- Evaluation metrics
- Model deployment

## Best Practices
- Start with high-quality data
- Use representative evaluation sets
- Monitor for overfitting
- Start with small epochs
- Use learning rate scheduling
- Evaluate on held-out data
- Version control models and data

## Data Preparation
```python
# Format for instruction tuning
training_data = [
    {
        "instruction": "Summarize the following text:",
        "input": "Long text here...",
        "output": "Concise summary here."
    }
]
```

## LoRA Configuration
```python
from peft import LoraConfig

lora_config = LoraConfig(
    r=16,  # rank
    lora_alpha=32,
    target_modules=["q_proj", "v_proj"],
    lora_dropout=0.05,
    task_type="CAUSAL_LM"
)
```

## Training Config
```python
training_args = TrainingArguments(
    output_dir="./results",
    num_train_epochs=3,
    per_device_train_batch_size=4,
    learning_rate=2e-4,
    weight_decay=0.01,
    evaluation_strategy="steps",
    eval_steps=100,
    save_steps=500,
    logging_steps=10,
)
```

## Evaluation
- Perplexity on held-out set
- Human evaluation for quality
- BLEU/ROUGE for text generation
- Task-specific benchmarks
- Safety and bias evaluation
