---
name: mcp-development
description: MCP (Model Context Protocol) server development. Covers tool definitions, resource providers, prompt templates, transport layers, authentication, testing MCP servers.
---

# MCP (Model Context Protocol) Server Development

## When to Apply

- Building custom MCP servers that expose tools, resources, or prompts to AI agents
- Defining tool schemas with JSON Schema parameters and return types
- Implementing resource providers for file-like or database-like data access
- Creating prompt templates that agents can invoke for structured workflows
- Choosing between stdio, SSE, or streamable HTTP transports
- Adding authentication and authorization to MCP endpoints
- Writing integration tests for MCP server implementations

## Core Patterns

### Tool Definition

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

const server = new McpServer({ name: "my-server", version: "1.0.0" })

server.tool(
  "search_files",
  "Search for files matching a pattern",
  {
    pattern: z.string().describe("Glob pattern to match"),
    directory: z.string().optional().describe("Directory to search in"),
  },
  async ({ pattern, directory }) => {
    const results = await searchFiles(pattern, directory)
    return {
      content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
    }
  }
)
```

### Resource Provider

```typescript
server.resource(
  "config",
  "config://app",
  async (uri) => {
    const config = await loadConfig()
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(config),
        },
      ],
    }
  }
)
```

### Prompt Template

```typescript
server.prompt(
  "review_code",
  "Code review prompt for a given file",
  {
    file_path: z.string().describe("Path to the file to review"),
    focus: z.enum(["security", "performance", "readability"]).optional(),
  },
  ({ file_path, focus }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Review ${file_path}${focus ? ` focusing on ${focus}` : ""}. Provide specific actionable feedback.`,
        },
      },
    ],
  })
)
```

### Transport: stdio

```typescript
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"

const transport = new StdioServerTransport()
await server.connect(transport)
```

### Transport: SSE

```typescript
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js"
import express from "express"

const app = express()
app.get("/sse", async (req, res) => {
  const transport = new SSEServerTransport("/messages", res)
  await server.connect(transport)
})
app.post("/messages", async (req, res) => {
  await transport.handlePostMessage(req, res)
})
```

## Configuration

### MCP Server Manifest (mcp.json)

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "API_KEY": "${API_KEY}"
      }
    }
  }
}
```

### Permission Rules

```json
{
  "permissions": {
    "tools": {
      "search_files": "allow",
      "write_file": "ask"
    },
    "resources": {
      "config://app": "allow"
    }
  }
}
```

## Best Practices

- Use Zod for all parameter schemas — it validates input and generates JSON Schema automatically
- Return structured content (text, image, or embedded resource) from tool handlers
- Keep tool descriptions concise but specific — agents use them for routing decisions
- Validate all inputs at the schema level; reject invalid calls early
- Use `isError: true` in tool responses for graceful error handling instead of throwing
- Implement proper cleanup in server shutdown handlers
- Test MCP servers with `@modelcontextprotocol/sdk` client library in integration tests
- Use stdio for local CLI integrations, SSE/streamable HTTP for remote deployments
- Version your tools carefully — breaking schema changes can break downstream agents
- Document tool side effects clearly in descriptions (e.g., "This deletes a file")
