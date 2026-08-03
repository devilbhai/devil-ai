---
name: multi-agent
description: Multi-agent orchestration patterns. Covers agent communication, task delegation, supervisor patterns, swarm intelligence, agent specialization, workflow coordination.
---

# Multi-Agent Orchestration Patterns

## When to Apply

- Building systems where multiple AI agents collaborate on complex tasks
- Designing agent communication protocols (message passing, shared state, blackboard)
- Implementing supervisor patterns that delegate to specialized sub-agents
- Coordinating parallel agent workflows with dependency graphs
- Building swarm-based systems with decentralized decision-making
- Routing tasks to the most appropriate agent based on capability matching
- Handling agent failures, retries, and graceful degradation in multi-agent pipelines

## Core Patterns

### Agent Definition

```typescript
interface Agent {
  id: string
  name: string
  role: string
  capabilities: string[]
  systemPrompt: string
  tools: Tool[]
  model: string
}

interface AgentMessage {
  id: string
  from: string
  to: string
  type: "task" | "result" | "feedback" | "error"
  content: string
  metadata: {
    timestamp: number
    priority: number
    taskId?: string
  }
}
```

### Supervisor Pattern

```typescript
class Supervisor {
  private agents: Map<string, Agent>
  private taskQueue: Task[]

  constructor(agents: Agent[]) {
    this.agents = new Map(agents.map((a) => [a.id, a]))
  }

  async execute(task: Task): Promise<TaskResult> {
    // Route task to best-matching agent
    const agent = this.routeTask(task)
    if (!agent) {
      return { error: "No agent available for this task" }
    }

    // Decompose complex tasks
    if (task.complexity === "high") {
      const subtasks = await this.decompose(task)
      const results = await Promise.all(subtasks.map((st) => this.execute(st)))
      return this.aggregate(results)
    }

    // Execute with the selected agent
    const result = await this.runAgent(agent, task)

    // Validate and provide feedback
    if (!this.validate(result, task)) {
      return this.retryOrEscalate(agent, task, result)
    }

    return result
  }

  private routeTask(task: Task): Agent | null {
    // Score agents by capability match
    let bestAgent: Agent | null = null
    let bestScore = 0

    for (const agent of this.agents.values()) {
      const score = this.computeMatchScore(agent, task)
      if (score > bestScore) {
        bestScore = score
        bestAgent = agent
      }
    }

    return bestScore > 0.5 ? bestAgent : null
  }

  private computeMatchScore(agent: Agent, task: Task): number {
    const matches = task.requiredCapabilities.filter((c) =>
      agent.capabilities.includes(c)
    ).length
    return matches / task.requiredCapabilities.length
  }
}
```

### Agent Communication Bus

```typescript
class AgentBus {
  private handlers = new Map<string, ((msg: AgentMessage) => void)[]>()
  private messageLog: AgentMessage[] = []

  subscribe(agentId: string, handler: (msg: AgentMessage) => void) {
    const handlers = this.handlers.get(agentId) ?? []
    handlers.push(handler)
    this.handlers.set(agentId, handlers)
  }

  async publish(message: AgentMessage) {
    this.messageLog.push(message)
    const handlers = this.handlers.get(message.to) ?? []
    await Promise.all(handlers.map((h) => h(message)))
  }

  async broadcast(message: Omit<AgentMessage, "to">, agentIds: string[]) {
    for (const agentId of agentIds) {
      await this.publish({ ...message, to: agentId })
    }
  }
}
```

### Workflow Coordinator (DAG-based)

```typescript
interface WorkflowStep {
  id: string
  agentId: string
  task: Task
  dependencies: string[] // IDs of steps that must complete first
}

class WorkflowCoordinator {
  async execute(workflow: WorkflowStep[]): Promise<Map<string, TaskResult>> {
    const results = new Map<string, TaskResult>()
    const completed = new Set<string>()

    while (completed.size < workflow.length) {
      // Find steps whose dependencies are satisfied
      const ready = workflow.filter(
        (step) =>
          !completed.has(step.id) &&
          step.dependencies.every((dep) => completed.has(dep))
      )

      if (ready.length === 0) {
        throw new Error("Circular dependency detected in workflow")
      }

      // Execute ready steps in parallel
      const stepResults = await Promise.allSettled(
        ready.map(async (step) => {
          const agent = this.getAgent(step.agentId)
          const context = this.buildContext(step, results)
          const result = await this.runAgent(agent, step.task, context)
          return { id: step.id, result }
        })
      )

      for (const result of stepResults) {
        if (result.status === "fulfilled") {
          results.set(result.value.id, result.value.result)
          completed.add(result.value.id)
        } else {
          throw new Error(`Workflow step failed: ${result.reason}`)
        }
      }
    }

    return results
  }
}
```

### Task Decomposition

```typescript
async function decomposeTask(task: Task, supervisor: Agent): Promise<Task[]> {
  const decompositionPrompt = `
    Break down this task into smaller sub-tasks:
    Task: ${task.description}
    Required capabilities: ${task.requiredCapabilities.join(", ")}

    Return a JSON array of sub-tasks, each with:
    - description: what needs to be done
    - requiredCapabilities: what the agent needs
    - dependencies: IDs of sub-tasks that must complete first
  `

  const response = await supervisor.llm(decompositionPrompt)
  return JSON.parse(response)
}
```

## Configuration

### Agent Registry

```json
{
  "agents": [
    {
      "id": "researcher",
      "name": "Research Agent",
      "role": "Information gathering and analysis",
      "capabilities": ["web_search", "document_analysis", "summarization"],
      "model": "claude-sonnet-4-20250514",
      "maxConcurrent": 3
    },
    {
      "id": "coder",
      "name": "Coding Agent",
      "role": "Code generation and debugging",
      "capabilities": ["code_generation", "code_review", "debugging"],
      "model": "claude-sonnet-4-20250514",
      "maxConcurrent": 1
    },
    {
      "id": "reviewer",
      "name": "Review Agent",
      "role": "Quality assurance and validation",
      "capabilities": ["testing", "validation", "feedback"],
      "model": "claude-sonnet-4-20250514",
      "maxConcurrent": 2
    }
  ],
  "workflow": {
    "maxRetries": 3,
    "timeout": 300000,
    "failureMode": "fallback"
  }
}
```

### Communication Protocols

```typescript
// Shared state via blackboard pattern
interface Blackboard {
  state: Record<string, unknown>
  read(key: string): unknown
  write(key: string, value: unknown): void
  subscribe(key: string, callback: (value: unknown) => void): void
}

// Message passing via bus
const bus = new AgentBus()
bus.subscribe("coder", async (msg) => {
  if (msg.type === "task") {
    const result = await codeAgent.execute(msg.content)
    await bus.publish({
      id: crypto.randomUUID(),
      from: "coder",
      to: "reviewer",
      type: "task",
      content: result,
      metadata: { timestamp: Date.now(), priority: 1, taskId: msg.metadata.taskId },
    })
  }
})
```

## Best Practices

- Start with a supervisor pattern for most multi-agent systems — it's the simplest to debug
- Use capability matching to route tasks, not random assignment
- Implement timeouts and fallbacks for every agent call to prevent cascading failures
- Log all inter-agent messages with timestamps for debugging and replay
- Decompose complex tasks before routing — keep individual agent scope narrow
- Use shared state (blackboard) for loosely coupled agents; message passing for tightly coupled workflows
- Run independent agent tasks in parallel; serialize dependent steps via DAG coordination
- Validate agent outputs before passing to downstream agents to catch hallucinations early
- Set concurrency limits per agent to prevent resource exhaustion
- Test multi-agent systems with deterministic inputs first, then add non-deterministic edge cases
