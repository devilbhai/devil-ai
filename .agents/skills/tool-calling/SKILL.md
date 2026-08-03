---
name: tool-calling
description: AI tool calling and function calling. Covers tool definitions, parameter schemas, error handling, parallel tool calls, tool result parsing, streaming tool calls.
---

# AI Tool Calling & Function Calling

## When to Apply

- Defining tools for LLM function calling (OpenAI, Anthropic, Gemini tool use)
- Writing JSON Schema parameter definitions for tool parameters
- Handling tool call errors gracefully without crashing agent loops
- Implementing parallel tool execution for independent operations
- Parsing and validating tool call results from streaming responses
- Building tool routers that dispatch calls to the correct handler
- Debugging tool call failures (schema mismatches, timeouts, partial responses)

## Core Patterns

### Tool Definition (OpenAI Format)

```typescript
const tools = [
  {
    type: "function" as const,
    function: {
      name: "read_file",
      description: "Read the contents of a file at the given path",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "Absolute file path to read",
          },
        },
        required: ["path"],
      },
    },
  },
]
```

### Tool Definition (Anthropic Format)

```typescript
const tools = [
  {
    name: "read_file",
    description: "Read the contents of a file at the given path",
    input_schema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Absolute file path to read",
        },
      },
      required: ["path"],
    },
  },
]
```

### Tool Router

```typescript
type ToolHandler = (args: Record<string, unknown>) => Promise<string>

const toolHandlers: Record<string, ToolHandler> = {
  read_file: async ({ path }) => {
    const content = await fs.readFile(path as string, "utf-8")
    return content
  },
  write_file: async ({ path, content }) => {
    await fs.writeFile(path as string, content as string, "utf-8")
    return `Successfully wrote to ${path}`
  },
  search: async ({ query }) => {
    const results = await searchFiles(query as string)
    return JSON.stringify(results)
  },
}

async function executeToolCall(name: string, args: Record<string, unknown>): Promise<string> {
  const handler = toolHandlers[name]
  if (!handler) return JSON.stringify({ error: `Unknown tool: ${name}` })

  try {
    return await handler(args)
  } catch (err) {
    return JSON.stringify({
      error: err instanceof Error ? err.message : "Unknown error",
      tool: name,
    })
  }
}
```

### Parallel Tool Calls

```typescript
async function handleToolCalls(toolCalls: ToolCall[]): Promise<ToolResult[]> {
  // Group by independence — tools with no shared side effects run in parallel
  const independent = toolCalls.filter((tc) => !hasSideEffects(tc.function.name))
  const dependent = toolCalls.filter((tc) => hasSideEffects(tc.function.name))

  const results: ToolResult[] = []

  // Parallel execution for read-only tools
  const parallelResults = await Promise.allSettled(
    independent.map(async (tc) => ({
      id: tc.id,
      content: await executeToolCall(tc.function.name, JSON.parse(tc.function.arguments)),
    }))
  )

  for (const result of parallelResults) {
    if (result.status === "fulfilled") {
      results.push(result.value)
    } else {
      results.push({ id: "unknown", content: JSON.stringify({ error: "Tool execution failed" }) })
    }
  }

  // Sequential execution for write tools
  for (const tc of dependent) {
    results.push({
      id: tc.id,
      content: await executeToolCall(tc.function.name, JSON.parse(tc.function.arguments)),
    })
  }

  return results
}

function hasSideEffects(toolName: string): boolean {
  return ["write_file", "delete_file", "execute_command"].includes(toolName)
}
```

### Streaming Tool Calls

```typescript
async function* handleStreamingToolCalls(stream: AsyncIterable<StreamChunk>) {
  const toolCallBuffers = new Map<number, { name: string; arguments: string }>()

  for await (const chunk of stream) {
    if (chunk.type === "tool_call_start") {
      toolCallBuffers.set(chunk.index, { name: "", arguments: "" })
    } else if (chunk.type === "tool_call_delta") {
      const buffer = toolCallBuffers.get(chunk.index)!
      if (chunk.function_name) buffer.name = chunk.function_name
      if (chunk.function_arguments) buffer.arguments += chunk.function_arguments
    } else if (chunk.type === "tool_call_end") {
      const buffer = toolCallBuffers.get(chunk.index)!
      const result = await executeToolCall(buffer.name, JSON.parse(buffer.arguments))
      yield { id: chunk.index, name: buffer.name, result }
      toolCallBuffers.delete(chunk.index)
    }
  }
}
```

### Tool Result Validation

```typescript
function validateToolResult(result: string, expectedSchema: z.ZodSchema): {
  valid: boolean
  data?: unknown
  error?: string
} {
  try {
    const parsed = JSON.parse(result)
    const validated = expectedSchema.safeParse(parsed)
    if (validated.success) {
      return { valid: true, data: validated.data }
    }
    return { valid: false, error: validated.error.message }
  } catch {
    return { valid: false, error: "Invalid JSON in tool result" }
  }
}
```

## Configuration

### Tool Retry Strategy

```typescript
async function executeWithRetry(
  toolName: string,
  args: Record<string, unknown>,
  maxRetries = 3
): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = await executeToolCall(toolName, args)
    const parsed = JSON.parse(result)
    if (!parsed.error) return result
    if (attempt < maxRetries - 1) {
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt))
    }
  }
  return JSON.stringify({ error: `Tool ${toolName} failed after ${maxRetries} attempts` })
}
```

### Tool Permission Gating

```typescript
const toolPermissions: Record<string, "allow" | "ask" | "deny"> = {
  read_file: "allow",
  write_file: "ask",
  execute_command: "ask",
  delete_file: "deny",
}

function checkPermission(toolName: string): "allow" | "ask" | "deny" {
  return toolPermissions[toolName] ?? "ask"
}
```

## Best Practices

- Always return structured JSON from tools — avoid raw text that requires LLM parsing
- Use `hasError: true` for graceful failures instead of throwing exceptions
- Implement retry with exponential backoff for transient failures (network, rate limits)
- Run independent tool calls in parallel for throughput; serialize writes to prevent races
- Validate tool arguments against Zod schemas before execution
- Log tool calls with args, duration, and result size for debugging and cost tracking
- Set timeouts on tool execution to prevent infinite hangs (default 30s)
- Keep tool descriptions under 200 tokens — LLMs use them for routing, not instruction following
- Separate read-only tools from side-effect tools for permission and execution strategy
- Use streaming to handle incremental tool results (e.g., large file reads)
