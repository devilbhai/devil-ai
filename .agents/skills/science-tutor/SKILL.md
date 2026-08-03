---
name: science-tutor
description: Science education. Concept explanation, experiment design, visualization.
---

# Science Tutor

## When to Apply

- When building science education features
- When implementing concept explanation or visualization tools
- When creating experiment design or simulation features
- When working with physics, chemistry, biology, or earth sciences

## Core Concepts

- **Concept Explanation**: Break down complex scientific concepts into digestible parts
- **Experiment Design**: Create, simulate, and analyze scientific experiments
- **Visualization**: Interactive diagrams, animations, and simulations
- **Scientific Method**: Hypothesis, experiment, observation, conclusion
- **Cross-Concept Linking**: Connect related concepts across disciplines

## Implementation

```ts
// Science concept
interface ScienceConcept {
  id: string
  name: string
  subject: "physics" | "chemistry" | "biology" | "earth_science"
  level: "elementary" | "middle_school" | "high_school" | "college"
  description: string
  prerequisites: string[] // concept IDs
  relatedConcepts: string[]
  visualizations: Visualization[]
  experiments: Experiment[]
}

// Visualization
interface Visualization {
  type: "diagram" | "animation" | "interactive" | "3d_model"
  title: string
  description: string
  assetUrl: string
  interactions?: {
    type: "drag" | "click" | "slider" | "toggle"
    parameter: string
    range?: [number, number]
  }[]
}

// Experiment
interface Experiment {
  id: string
  title: string
  hypothesis: string
  materials: string[]
  procedure: string[]
  variables: {
    independent: string
    dependent: string
    controlled: string[]
  }
  expectedOutcome: string
  safetyNotes?: string[]
}

// Experiment result
interface ExperimentResult {
  experimentId: string
  data: { trial: number; values: Record<string, number> }[]
  analysis: string
  conclusion: string
  graphs: GraphData[]
}
```

```ts
// Explain concept with analogies
function explainConcept(
  concept: ScienceConcept,
  studentLevel: string
): Explanation {
  const complexity = mapToComplexity(studentLevel)
  const analogies = getAnalogies(concept.id, complexity)
  const visual = concept.visualizations.find((v) => v.type === "interactive") ?? concept.visualizations[0]
  
  return {
    conceptId: concept.id,
    explanation: generateExplanation(concept, complexity),
    analogies,
    visual,
    keyTerms: extractKeyTerms(concept),
    practiceQuestions: generateQuestions(concept, complexity),
  }
}

// Simulate experiment
async function simulateExperiment(experiment: Experiment): Promise<ExperimentResult> {
  const data = []
  for (let trial = 1; trial <= 5; trial++) {
    const values = await runTrial(experiment, trial)
    data.push({ trial, values })
  }
  const analysis = analyzeData(data, experiment.variables)
  return { experimentId: experiment.id, data, analysis, conclusion: drawConclusion(analysis), graphs: generateGraphs(data) }
}
```

## Best Practices

- Use real-world analogies to make abstract concepts concrete
- Provide interactive visualizations for hands-on learning
- Include safety notes for all physical experiments
- Link concepts across subjects for interdisciplinary understanding
- Offer multiple difficulty levels for the same concept
- Connect theory to real-world applications and current research
- Support both qualitative and quantitative explanations
- Encourage hypothesis formation before revealing answers
