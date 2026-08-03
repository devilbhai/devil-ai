---
name: agent-builder
description: Build custom AI agents - tool use, memory, planning, multi-agent systems, agent frameworks.
---

# Agent Builder

## When to Apply
Use this skill for building AI agents, implementing tool use, designing agent architectures, or creating multi-agent systems.

## Core Concepts
- ReAct pattern (Reasoning + Acting)
- Tool use and function calling
- Memory (short-term, long-term)
- Planning and goal decomposition
- Multi-agent orchestration
- Agent frameworks (LangGraph, CrewAI, AutoGen)

## Best Practices
- Start simple, add complexity gradually
- Define clear tool schemas
- Implement proper error handling
- Add human-in-the-loop for critical actions
- Log agent decisions
- Test agent edge cases
- Implement rate limiting

## Agent Pattern
```python
from langgraph.graph import StateGraph

def agent(state):
    """Main agent node"""
    messages = state["messages"]
    last_message = messages[-1]
    
    # Decide action
    if needs_tool(last_message):
        tool_call = decide_tool(last_message)
        return {"tool": tool_call}
    else:
        return {"response": generate_response(messages)}

def tool_executor(state):
    """Execute tool calls"""
    tool = state["tool"]
    result = execute_tool(tool)
    return {"messages": [ToolMessage(content=result)]}
```

## Tool Definition
```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "search_web",
            "description": "Search the web for information",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query"}
                },
                "required": ["query"]
            }
        }
    }
]
```

## Memory Implementation
```python
class AgentMemory:
    def __init__(self):
        self.short_term = []  # Current conversation
        self.long_term = VectorStore()  # Persisted knowledge
    
    def add(self, message):
        self.short_term.append(message)
        if len(self.short_term) > 100:
            self.compress_and_store()
    
    def retrieve(self, query, k=5):
        return self.long_term.search(query, k=k)
```

## Multi-Agent Systems
- Supervisor pattern
- Debate/critique pattern
- Hierarchical decomposition
- Specialized agents (researcher, coder, reviewer)
