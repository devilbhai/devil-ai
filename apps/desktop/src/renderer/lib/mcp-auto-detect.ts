/**
 * MCP Auto-Detect System
 * 
 * Automatically detects required MCP servers based on user prompts
 * and adds them to the project configuration.
 * 
 * @module mcp-auto-detect
 */

import { getAddedServers, addServer } from "../lib/mcp-storage"
import type { AwesomeMCPServer } from "../lib/awesome-mcp-servers"

export type { AwesomeMCPServer }

// ============================================================
// Types
// ============================================================

export interface MCPDetectionResult {
  /** Detected MCP servers to add */
  servers: AwesomeMCPServer[]
  /** Keywords that triggered detection */
  keywords: string[]
  /** Confidence score (0-1) */
  confidence: number
}

export interface MCProgressUpdate {
  /** Server being added */
  server: AwesomeMCPServer
  /** Status: detecting, adding, added, error */
  status: "detecting" | "adding" | "added" | "error"
  /** Error message if status is error */
  error?: string
}

// ============================================================
// Keyword to MCP Server Mapping
// ============================================================

const KEYWORD_MCP_MAP: Record<string, string[]> = {
  // GitHub
  "github": ["github/github-mcp-server"],
  "git": ["github/github-mcp-server"],
  "pull request": ["github/github-mcp-server"],
  "commit": ["github/github-mcp-server"],
  "repository": ["github/github-mcp-server"],
  
  // Database
  "database": ["modelcontextprotocol/server-postgres", "modelcontextprotocol/server-sqlite"],
  "postgres": ["modelcontextprotocol/server-postgres"],
  "postgresql": ["modelcontextprotocol/server-postgres"],
  "sqlite": ["modelcontextprotocol/server-sqlite"],
  "mysql": ["mysql/mcp-server-mysql"],
  "mongodb": ["mongodb/mongodb-mcp-server"],
  "redis": ["redis/mcp-redis"],
  "neo4j": ["neo4j/mcp-server-bolt"],
  "clickhouse": ["clickhouse/mcp-server-clickhouse"],
  "elasticsearch": ["elastic/mcp-server-elasticsearch"],
  "sql": ["modelcontextprotocol/server-postgres", "modelcontextprotocol/server-sqlite"],
  
  // Cloud
  "aws": ["awslabs/mcp"],
  "amazon web services": ["awslabs/mcp"],
  "google cloud": ["google-cloud-platform/mcp-server"],
  "gcp": ["google-cloud-platform/mcp-server"],
  "azure": ["azure/azure-mcp-server"],
  "cloudflare": ["cloudflare/mcp-server-cloudflare"],
  "vercel": ["vercel/mcp-vercel"],
  "netlify": ["netlify/mcp-netlify"],
  "digitalocean": ["digitalocean/mcp-digitalocean"],
  "heroku": ["heroku/mcp-heroku"],
  
  // File System
  "file": ["modelcontextprotocol/server-filesystem"],
  "filesystem": ["modelcontextprotocol/server-filesystem"],
  "read file": ["modelcontextprotocol/server-filesystem"],
  "write file": ["modelcontextprotocol/server-filesystem"],
  
  // Web
  "web": ["exa-labs/exa-mcp-server", "firecrawl/firecrawl-mcp-server"],
  "search": ["exa-labs/exa-mcp-server", "modelcontextprotocol/server-brave-search"],
  "exa": ["exa-labs/exa-mcp-server"],
  
  // Browser (Built-in Playwright browser - no external MCP needed)
  "browser": [],
  "puppeteer": [],
  "selenium": [],
  "playwright": [],
  "automate browser": [],
  
  // Communication
  "slack": ["modelcontextprotocol/server-slack"],
  "discord": ["modelcontextprotocol/server-slack"],
  "email": ["modelcontextprotocol/server-slack"],
  
  // Productivity
  "notion": ["modelcontextprotocol/server-notion"],
  "linear": ["modelcontextprotocol/server-linear"],
  "jira": ["modelcontextprotocol/server-linear"],
  "trello": ["modelcontextprotocol/server-notion"],
  "todo": ["modelcontextprotocol/server-notion"],
  "task": ["modelcontextprotocol/server-notion"],
  
  // Google
  "google drive": ["modelcontextprotocol/server-google-drive"],
  "gdrive": ["modelcontextprotocol/server-google-drive"],
  "google docs": ["modelcontextprotocol/server-google-drive"],
  "google sheets": ["modelcontextprotocol/server-google-drive"],
  "gsheet": ["modelcontextprotocol/server-google-drive"],
  "spreadsheet": ["modelcontextprotocol/server-google-drive"],
  "google calendar": ["modelcontextprotocol/server-google-drive"],
  "gcal": ["modelcontextprotocol/server-google-drive"],
  "google gmail": ["modelcontextprotocol/server-google-drive"],
  "gmail": ["modelcontextprotocol/server-google-drive"],
  "google contacts": ["modelcontextprotocol/server-google-drive"],
  "google tasks": ["modelcontextprotocol/server-google-drive"],
  "google photos": ["modelcontextprotocol/server-google-drive"],
  "google chat": ["modelcontextprotocol/server-google-drive"],
  "google analytics": ["modelcontextprotocol/server-google-drive"],
  "google search console": ["modelcontextprotocol/server-google-drive"],
  "youtube": ["modelcontextprotocol/server-google-drive"],
  "canva": ["canva-mcp/canva-mcp-server"],
  "design": ["canva-mcp/canva-mcp-server"],
  
  // Knowledge & Memory
  "memory": ["modelcontextprotocol/server-memory", "mem0ai/mem0"],
  "remember": ["modelcontextprotocol/server-memory", "mem0ai/mem0"],
  "context": ["upstash/context7"],
  "documentation": ["upstash/context7"],
  "mem0": ["mem0ai/mem0"],
  "vector database": ["chroma-core/chroma", "qdrant/qdrant"],
  "vector store": ["chroma-core/chroma", "qdrant/qdrant"],
  "embedding": ["chroma-core/chroma", "qdrant/qdrant"],
  "chroma": ["chroma-core/chroma"],
  "qdrant": ["qdrant/qdrant"],
  
  // Sandboxing / Safe Execution
  "sandbox": ["e2b-dev/E2B"],
  "sandboxing": ["e2b-dev/E2B"],
  "safe execution": ["e2b-dev/E2B"],
  "code interpreter": ["e2b-dev/E2B"],
  "e2b": ["e2b-dev/E2B"],
  "openhands": ["All-Hands-AI/OpenHands"],
  "open hands": ["All-Hands-AI/OpenHands"],
  "ai developer": ["All-Hands-AI/OpenHands"],
  
  // Observability
  "observability": ["langfuse/langfuse"],
  "monitoring": ["langfuse/langfuse"],
  "tracing": ["langfuse/langfuse"],
  "langfuse": ["langfuse/langfuse"],
  "llm monitoring": ["langfuse/langfuse"],
  "langsmith": ["langfuse/langfuse"],
  
  // RAG / Document Search
  "rag": ["deepset-ai/haystack"],
  "retrieval": ["deepset-ai/haystack"],
  "document search": ["deepset-ai/haystack"],
  "haystack": ["deepset-ai/haystack"],
  "nlp pipeline": ["deepset-ai/haystack"],
  "document qa": ["deepset-ai/haystack"],
  
  // Web Scraping
  "scrape": ["mendableai/firecrawl", "D4Vinci/Scrapling"],
  "scraping": ["mendableai/firecrawl", "D4Vinci/Scrapling"],
  "crawl": ["mendableai/firecrawl"],
  "firecrawl": ["mendableai/firecrawl"],
  "web crawl": ["mendableai/firecrawl"],
  "web extract": ["mendableai/firecrawl"],
  
  // Workflow
  "workflow": ["n8n-io/n8n", "czlonkowski/n8n-mcp"],
  "automation": ["n8n-io/n8n", "czlonkowski/n8n-mcp"],
  "n8n": ["n8n-io/n8n", "czlonkowski/n8n-mcp"],
  "zapier": ["n8n-io/n8n"],
  "ifttt": ["n8n-io/n8n"],
  
  // Finance
  "finance": ["JerBouma/FinanceToolkit"],
  "stock": ["JerBouma/FinanceToolkit"],
  "trading": ["JerBouma/FinanceToolkit"],
  "crypto": ["JerBouma/FinanceToolkit"],
  "bitcoin": ["JerBouma/FinanceToolkit"],
  
  // Audio
  "audio": ["modelscope/FunASR"],
  "speech": ["modelscope/FunASR"],
  "transcribe": ["modelscope/FunASR"],
  "voice": ["modelscope/FunASR"],
  "asr": ["modelscope/FunASR"],
  
  // Internet Access & Web Scraping (Agent Reach)
  "agent reach": ["Panniantong/agent-reach"],
  "agentreach": ["Panniantong/agent-reach"],
  "internet access": ["Panniantong/agent-reach"],
  "web scrape": ["Panniantong/agent-reach"],
  "web scraping": ["Panniantong/agent-reach"],
  "read article": ["Panniantong/agent-reach"],
  "read page": ["Panniantong/agent-reach"],
  "fetch url": ["Panniantong/agent-reach"],
  "read url": ["Panniantong/agent-reach"],
  "twitter": ["Panniantong/agent-reach"],
  "reddit": ["Panniantong/agent-reach"],
  "bilibili": ["Panniantong/agent-reach"],
  "xhs": ["Panniantong/agent-reach"],
  "rss": ["Panniantong/agent-reach"],
  "web search": ["Panniantong/agent-reach"],
  "search web": ["Panniantong/agent-reach"],
  "online search": ["Panniantong/agent-reach"],
  
  // Computer Use (Pi Computer Use)
  "computer use": ["injaneity/pi-computer-use"],
  "desktop control": ["injaneity/pi-computer-use"],
  "click button": ["injaneity/pi-computer-use"],
  "type text": ["injaneity/pi-computer-use"],
  "scroll window": ["injaneity/pi-computer-use"],
  "screenshot": ["injaneity/pi-computer-use"],
  "automate app": ["injaneity/pi-computer-use"],
  "gui automation": ["injaneity/pi-computer-use"],
  "desktop automation": ["injaneity/pi-computer-use"],
  "control app": ["injaneity/pi-computer-use"],
  
  // Social Media (XiaoHongShu MCP)
  "rednote": ["xpzouying/xiaohongshu-mcp"],
  "social media": ["xpzouying/xiaohongshu-mcp"],
  
  // Code Intelligence
  "code review": ["tirth8205/code-review-graph"],
  "code analysis": ["DeusData/codebase-memory-mcp"],
  "codebase": ["DeusData/codebase-memory-mcp"],
  
  // Web Server
  "nginx": ["0xJacky/nginx-ui"],
  "apache": ["0xJacky/nginx-ui"],
  "web server": ["0xJacky/nginx-ui"],
  
  // API
  "api": ["tadata-org/fastapi_mcp"],
  "fastapi": ["tadata-org/fastapi_mcp"],
  "rest api": ["tadata-org/fastapi_mcp"],
  "graphql": ["tadata-org/fastapi_mcp"],
  
  // Agent Frameworks
  "langgraph": ["langchain-ai/langgraph"],
  "lang chain": ["langchain-ai/langgraph"],
  "autogen": ["microsoft/autogen"],
  "auto gen": ["microsoft/autogen"],
  "crew ai": ["crewAIInc/crewAI"],
  "crewai": ["crewAIInc/crewAI"],
  "smolagents": ["huggingface/smolagents"],
  "smol agents": ["huggingface/smolagents"],
  "hugging face agents": ["huggingface/smolagents"],
  "langflow": ["langflow-ai/langflow"],
  "lang flow": ["langflow-ai/langflow"],
  "llama agents": ["run-llama/llama-agents"],
  "llamaindex": ["run-llama/llama-agents"],
  "multi agent": ["crewAIInc/crewAI"],
  "agent framework": ["langchain-ai/langgraph"],
  "agent system": ["microsoft/autogen"],
  
  // Claude Skills
  "claude skills": ["anthropics/skills"],
  "anthropic skills": ["anthropics/skills"],
  "openskills": ["numman-ali/openskills"],
  "open skills": ["numman-ali/openskills"],
  "skill loader": ["numman-ali/openskills"],
  "awesome skills": ["GetBindu/awesome-claude-code-and-skills"],
  "agent skills": ["meetrais/claude-agent-skills"],
  
  // MCP Servers
  "mcp server": ["modelcontextprotocol/servers"],
  "model context protocol": ["modelcontextprotocol/servers"],
  "mcp servers": ["modelcontextprotocol/servers"],
  "filesystem mcp": ["modelcontextprotocol/server-filesystem"],
  "postgres mcp": ["modelcontextprotocol/server-postgres"],
  "sqlite mcp": ["modelcontextprotocol/server-sqlite"],
  "memory mcp": ["modelcontextprotocol/server-memory"],
  "github mcp": ["modelcontextprotocol/server-github"],
  "slack mcp": ["modelcontextprotocol/server-slack"],
  "notion mcp": ["modelcontextprotocol/server-notion"],
  "linear mcp": ["modelcontextprotocol/server-linear"],
  "google drive mcp": ["modelcontextprotocol/server-google-drive"],
  "exa search": ["exa-labs/exa-mcp-server"],
  "mysql mcp": ["mysql/mcp-server-mysql"],
}

// ============================================================
// All Available MCP Servers (from awesome-mcp-servers.ts)
// ============================================================

const ALL_MCP_SERVERS: AwesomeMCPServer[] = [
  // SkillsLLM Top Servers
  { id: "n8n-io/n8n", name: "n8n", description: "Workflow automation platform", category: "Workflow Automation", github: "https://github.com/n8n-io/n8n", install: "docker pull n8nio/n8n", language: "typescript", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 197550 },
  { id: "D4Vinci/Scrapling", name: "Scrapling", description: "Adaptive web scraping framework", category: "Web Scraping", github: "https://github.com/D4Vinci/Scrapling", install: "pip install scrapling", language: "python", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 70811 },
  { id: "Panniantong/agent-reach", name: "Agent Reach", description: "Internet access for AI agents - Twitter, Reddit, YouTube, GitHub, Bilibili, XiaoHongShu", category: "Internet Access", github: "https://github.com/Panniantong/agent-reach", install: "pip install agent-reach", language: "python", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 60800 },
  { id: "injaneity/pi-computer-use", name: "Pi Computer Use", description: "Let Pi control your apps on MacOS & Windows - desktop automation", category: "Desktop Automation", github: "https://github.com/injaneity/pi-computer-use", install: "npm install -g pi && pi install npm:@injaneity/pi-computer-use", language: "typescript", scope: "local", os: ["mac", "windows"], source: "skillsllm", stars: 1600 },
  { id: "upstash/context7", name: "Context7", description: "Up-to-date code documentation for LLMs", category: "Documentation", github: "https://github.com/upstash/context7", install: "npx -y @upstash/context7-mcp", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 59616 },
  { id: "DeusData/codebase-memory-mcp", name: "Codebase Memory", description: "High-performance code intelligence", category: "Code Intelligence", github: "https://github.com/DeusData/codebase-memory-mcp", install: "brew install codebase-memory-mcp", language: "cpp", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 34279 },
  { id: "github/github-mcp-server", name: "GitHub MCP Server", description: "GitHub's official MCP Server", category: "Version Control", github: "https://github.com/github/github-mcp-server", install: "go install github.com/github/github-mcp-server@latest", language: "go", scope: "cloud", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 31646 },
  { id: "tirth8205/code-review-graph", name: "Code Review Graph", description: "Local-first code intelligence graph", category: "Code Intelligence", github: "https://github.com/tirth8205/code-review-graph", install: "pip install code-review-graph", language: "python", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 25479 },
  { id: "czlonkowski/n8n-mcp", name: "n8n MCP", description: "MCP for Claude to build n8n workflows", category: "Workflow Automation", github: "https://github.com/czlonkowski/n8n-mcp", install: "npx -y n8n-mcp", language: "typescript", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 22378 },
  { id: "modelscope/FunASR", name: "FunASR", description: "Open-source speech recognition toolkit", category: "Audio & Speech", github: "https://github.com/modelscope/FunASR", install: "pip install funasr", language: "python", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 19416 },
  { id: "xpzouying/xiaohongshu-mcp", name: "Xiaohongshu MCP", description: "MCP for xiaohongshu.com", category: "Social Media", github: "https://github.com/xpzouying/xiaohongshu-mcp", install: "go install github.com/xpzouying/xiaohongshu-mcp@latest", language: "go", scope: "cloud", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 14813 },
  { id: "tadata-org/fastapi_mcp", name: "FastAPI MCP", description: "Expose FastAPI endpoints as MCP tools", category: "API Development", github: "https://github.com/tadata-org/fastapi_mcp", install: "pip install fastapi-mcp", language: "python", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 11953 },
  { id: "0xJacky/nginx-ui", name: "Nginx UI", description: "WebUI for Nginx", category: "Web Servers", github: "https://github.com/0xJacky/nginx-ui", install: "docker pull 0xjacky/nginx-ui", language: "go", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 11332 },
  { id: "awslabs/mcp", name: "AWS MCP", description: "Open source MCP Servers for AWS", category: "Cloud Platforms", github: "https://github.com/awslabs/mcp", install: "pip install awslabs-mcp", language: "python", scope: "cloud", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 9488 },
  { id: "AgentDeskAI/browser-tools-mcp", name: "Browser Tools MCP", description: "Monitor browser logs from Cursor", category: "Browser Automation", github: "https://github.com/AgentDeskAI/browser-tools-mcp", install: "npx -y @anthropic-ai/browser-tools-mcp", language: "typescript", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 7272 },
  { id: "firecrawl/firecrawl-mcp-server", name: "Firecrawl MCP", description: "Web scraping and search for Claude", category: "Web Scraping", github: "https://github.com/firecrawl/firecrawl-mcp-server", install: "npx -y firecrawl-mcp-server", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 7025 },
  { id: "BrowserMCP/mcp", name: "Browser MCP", description: "Control your browser with AI", category: "Browser Automation", github: "https://github.com/BrowserMCP/mcp", install: "npx -y @anthropic-ai/browser-mcp", language: "typescript", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 6864 },
  { id: "JerBouma/FinanceToolkit", name: "FinanceToolkit", description: "Transparent and efficient financial analysis", category: "Finance", github: "https://github.com/JerBouma/FinanceToolkit", install: "pip install financetoolkit", language: "python", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 5145 },
  { id: "canva-mcp/canva-mcp-server", name: "Canva MCP", description: "Generate and manage Canva designs programmatically", category: "Design", github: "https://github.com/canva-mcp/canva-mcp-server", install: "npx -y @canva-mcp/canva-mcp-server", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 0 },
  
  // Agent Frameworks
  { id: "langchain-ai/langgraph", name: "LangGraph", description: "Build stateful, multi-actor applications with LLMs", category: "Agent Frameworks", github: "https://github.com/langchain-ai/langgraph", install: "pip install langgraph", language: "python", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 8500 },
  { id: "microsoft/autogen", name: "AutoGen", description: "Multi-agent conversation framework by Microsoft", category: "Agent Frameworks", github: "https://github.com/microsoft/autogen", install: "pip install autogen-agentchat", language: "python", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 38000 },
  { id: "crewAIInc/crewAI", name: "CrewAI", description: "Framework for orchestrating role-playing AI agents", category: "Agent Frameworks", github: "https://github.com/crewAIInc/crewAI", install: "pip install crewai", language: "python", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 25000 },
  { id: "huggingface/smolagents", name: "Smolagents", description: "Minimalist framework for AI agents by Hugging Face", category: "Agent Frameworks", github: "https://github.com/huggingface/smolagents", install: "pip install smolagents", language: "python", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 12000 },
  { id: "langflow-ai/langflow", name: "Langflow", description: "Visual framework for building multi-agent systems", category: "Agent Frameworks", github: "https://github.com/langflow-ai/langflow", install: "pip install langflow", language: "python", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 35000 },
  { id: "run-llama/llama-agents", name: "LlamaIndex Agents", description: "Production-ready multi-agent systems", category: "Agent Frameworks", github: "https://github.com/run-llama/llama-agents", install: "pip install llama-agents", language: "python", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 8000 },
  
  // Claude Skills
  { id: "anthropics/skills", name: "Anthropic Skills", description: "Official Anthropic skills repository", category: "Claude Skills", github: "https://github.com/anthropics/skills", install: "git clone https://github.com/anthropics/skills", language: "python", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 5000 },
  { id: "numman-ali/openskills", name: "OpenSkills", description: "Universal skill loader for AI agents", category: "Claude Skills", github: "https://github.com/numman-ali/openskills", install: "pip install openskills", language: "python", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 2000 },
  { id: "GetBindu/awesome-claude-code-and-skills", name: "Awesome Claude Skills", description: "Curated list of Claude Code skills", category: "Claude Skills", github: "https://github.com/GetBindu/awesome-claude-code-and-skills", install: "git clone https://github.com/GetBindu/awesome-claude-code-and-skills", language: "python", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 3000 },
  { id: "meetrais/claude-agent-skills", name: "Claude Agent Skills", description: "Claude skills examples with API usage", category: "Claude Skills", github: "https://github.com/meetrais/claude-agent-skills", install: "git clone https://github.com/meetrais/claude-agent-skills", language: "typescript", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 1500 },
  
  // Awesome MCP Servers
  { id: "modelcontextprotocol/server-filesystem", name: "Filesystem", description: "Local filesystem access", category: "File Systems", github: "https://github.com/modelcontextprotocol/servers", install: "npx -y @modelcontextprotocol/server-filesystem", language: "typescript", scope: "local", os: ["mac", "windows", "linux"], source: "awesome-mcp" },
  { id: "modelcontextprotocol/server-postgres", name: "PostgreSQL", description: "PostgreSQL database integration", category: "Databases", github: "https://github.com/modelcontextprotocol/servers", install: "npx -y @modelcontextprotocol/server-postgres", language: "typescript", scope: "local", os: ["mac", "windows", "linux"], source: "awesome-mcp" },
  { id: "modelcontextprotocol/server-sqlite", name: "SQLite", description: "SQLite database integration", category: "Databases", github: "https://github.com/modelcontextprotocol/servers", install: "npx -y @modelcontextprotocol/server-sqlite", language: "typescript", scope: "local", os: ["mac", "windows", "linux"], source: "awesome-mcp" },
  { id: "modelcontextprotocol/server-brave-search", name: "Brave Search", description: "Web search using Brave Search API", category: "Search & Data Extraction", github: "https://github.com/modelcontextprotocol/servers", install: "npx -y @modelcontextprotocol/server-brave-search", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"], source: "awesome-mcp" },
  { id: "modelcontextprotocol/server-puppeteer", name: "Puppeteer", description: "Browser automation using Puppeteer", category: "Browser Automation", github: "https://github.com/modelcontextprotocol/servers", install: "npx -y @modelcontextprotocol/server-puppeteer", language: "typescript", scope: "local", os: ["mac", "windows", "linux"], source: "awesome-mcp" },
  { id: "modelcontextprotocol/server-memory", name: "Memory", description: "Persistent memory for AI agents", category: "Knowledge & Memory", github: "https://github.com/modelcontextprotocol/servers", install: "npx -y @modelcontextprotocol/server-memory", language: "typescript", scope: "local", os: ["mac", "windows", "linux"], source: "awesome-mcp" },
  { id: "modelcontextprotocol/server-github", name: "GitHub", description: "GitHub API integration", category: "Version Control", github: "https://github.com/modelcontextprotocol/servers", install: "npx -y @modelcontextprotocol/server-github", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"], source: "awesome-mcp" },
  { id: "modelcontextprotocol/server-slack", name: "Slack", description: "Slack integration", category: "Communication", github: "https://github.com/modelcontextprotocol/servers", install: "npx -y @modelcontextprotocol/server-slack", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"], source: "awesome-mcp" },
  { id: "modelcontextprotocol/server-notion", name: "Notion", description: "Notion integration", category: "Workplace & Productivity", github: "https://github.com/modelcontextprotocol/servers", install: "npx -y @modelcontextprotocol/server-notion", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"], source: "awesome-mcp" },
  { id: "modelcontextprotocol/server-linear", name: "Linear", description: "Linear integration", category: "Workplace & Productivity", github: "https://github.com/modelcontextprotocol/servers", install: "npx -y @modelcontextprotocol/server-linear", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"], source: "awesome-mcp" },
  { id: "modelcontextprotocol/server-google-drive", name: "Google Drive", description: "Google Drive integration", category: "File Systems", github: "https://github.com/modelcontextprotocol/servers", install: "npx -y @modelcontextprotocol/server-gdrive", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"], source: "awesome-mcp" },
  { id: "exa-labs/exa-mcp-server", name: "Exa", description: "Search the web with Exa", category: "Search & Data Extraction", github: "https://github.com/exa-labs/exa-mcp-server", install: "npx -y exa-mcp-server", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"], source: "awesome-mcp" },
  { id: "mysql/mcp-server-mysql", name: "MySQL", description: "MySQL MCP server", category: "Databases", github: "https://github.com/mysql/mcp-server-mysql", install: "", language: "typescript", scope: "local", os: ["mac", "windows", "linux"], source: "awesome-mcp" },
  { id: "mongodb/mongodb-mcp-server", name: "MongoDB", description: "MongoDB MCP server", category: "Databases", github: "https://github.com/mongodb/mongodb-mcp-server", install: "npx -y @mongodb-js/mongodb-mcp-server", language: "typescript", scope: "local", os: ["mac", "windows", "linux"], source: "awesome-mcp" },
  { id: "redis/mcp-redis", name: "Redis", description: "Redis MCP server", category: "Databases", github: "https://github.com/redis/mcp-redis", install: "npx -y @redis/mcp", language: "typescript", scope: "local", os: ["mac", "windows", "linux"], source: "awesome-mcp" },
  { id: "neo4j/mcp-server-bolt", name: "Neo4j Bolt", description: "Neo4j graph database MCP server", category: "Databases", github: "https://github.com/neo4j/mcp-server-bolt", install: "uvx mcp-server-bolt", language: "python", scope: "local", os: ["mac", "windows", "linux"], source: "awesome-mcp" },
  { id: "clickhouse/mcp-server-clickhouse", name: "ClickHouse", description: "ClickHouse MCP server", category: "Databases", github: "https://github.com/clickhouse/mcp-server-clickhouse", install: "uvx mcp-server-clickhouse", language: "python", scope: "local", os: ["mac", "windows", "linux"], source: "awesome-mcp" },
  { id: "elastic/mcp-server-elasticsearch", name: "Elasticsearch", description: "Elasticsearch MCP server", category: "Databases", github: "https://github.com/elastic/mcp-server-elasticsearch", install: "uvx mcp-server-elasticsearch", language: "python", scope: "local", os: ["mac", "windows", "linux"], source: "awesome-mcp" },
  { id: "cloudflare/mcp-server-cloudflare", name: "Cloudflare", description: "Cloudflare MCP server", category: "Cloud Platforms", github: "https://github.com/cloudflare/mcp-server-cloudflare", install: "npx -y @cloudflare/mcp-server-cloudflare", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"], source: "awesome-mcp" },
  { id: "vercel/mcp-vercel", name: "Vercel", description: "Vercel MCP server", category: "Cloud Platforms", github: "https://github.com/vercel/mcp-vercel", install: "npx -y @vercel/mcp", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"], source: "awesome-mcp" },
  { id: "netlify/mcp-netlify", name: "Netlify", description: "Netlify MCP server", category: "Cloud Platforms", github: "https://github.com/netlify/mcp-netlify", install: "npx -y @netlify/mcp", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"], source: "awesome-mcp" },
  { id: "digitalocean/mcp-digitalocean", name: "DigitalOcean", description: "DigitalOcean MCP server", category: "Cloud Platforms", github: "https://github.com/digitalocean/mcp-digitalocean", install: "", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"], source: "awesome-mcp" },
  { id: "heroku/mcp-heroku", name: "Heroku", description: "Heroku MCP server", category: "Cloud Platforms", github: "https://github.com/heroku/mcp-heroku", install: "", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"], source: "awesome-mcp" },
  { id: "mem0ai/mem0", name: "Mem0", description: "Memory layer for AI agents", category: "Knowledge & Memory", github: "https://github.com/mem0ai/mem0", install: "pip install mem0ai", language: "python", scope: "cloud", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 25000 },
  
  // Memory
  { id: "chroma-core/chroma", name: "Chroma", description: "Open-source embedding database for AI applications", category: "Knowledge & Memory", github: "https://github.com/chroma-core/chroma", install: "pip install chromadb", language: "python", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 18000 },
  { id: "qdrant/qdrant", name: "Qdrant", description: "Vector similarity search engine for AI", category: "Knowledge & Memory", github: "https://github.com/qdrant/qdrant", install: "pip install qdrant-client", language: "python", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 22000 },
  
  // Sandboxing / Safe Execution
  { id: "e2b-dev/E2B", name: "E2B", description: "Cloud sandboxing for AI code execution", category: "Sandboxing", github: "https://github.com/e2b-dev/E2B", install: "pip install e2b-code-interpreter", language: "python", scope: "cloud", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 8000 },
  { id: "All-Hands-AI/OpenHands", name: "OpenHands", description: "AI-powered software development agent", category: "Sandboxing", github: "https://github.com/All-Hands-AI/OpenHands", install: "docker pull all-hands-ai/openhands", language: "python", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 45000 },
  
  // Observability
  { id: "langfuse/langfuse", name: "Langfuse", description: "Open-source LLM engineering platform", category: "Observability", github: "https://github.com/langfuse/langfuse", install: "pip install langfuse", language: "python", scope: "cloud", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 10000 },
  
  // RAG / Document Search
  { id: "deepset-ai/haystack", name: "Haystack", description: "Framework for building NLP and RAG pipelines", category: "RAG", github: "https://github.com/deepset-ai/haystack", install: "pip install haystack-ai", language: "python", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 18000 },
  
  // Web Scraping
  { id: "mendableai/firecrawl", name: "Firecrawl", description: "Web scraping and crawling for AI applications", category: "Web Scraping", github: "https://github.com/mendableai/firecrawl", install: "pip install firecrawl-py", language: "python", scope: "cloud", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 25000 },
]

// ============================================================
// Detection Functions
// ============================================================

/**
 * Detect required MCP servers from user prompt
 */
export function detectRequiredMCPs(prompt: string): MCPDetectionResult {
  const lowerPrompt = prompt.toLowerCase()
  const detectedServerIds = new Set<string>()
  const matchedKeywords: string[] = []

  // Check each keyword
  for (const [keyword, serverIds] of Object.entries(KEYWORD_MCP_MAP)) {
    if (lowerPrompt.includes(keyword)) {
      matchedKeywords.push(keyword)
      for (const serverId of serverIds) {
        detectedServerIds.add(serverId)
      }
    }
  }

  // Find matching servers
  const detectedServers = ALL_MCP_SERVERS.filter((server) =>
    detectedServerIds.has(server.id)
  )

  // Calculate confidence based on keyword matches
  const confidence = Math.min(matchedKeywords.length / 3, 1)

  return {
    servers: detectedServers,
    keywords: matchedKeywords,
    confidence,
  }
}

/**
 * Check if server is already added
 */
export function isServerAlreadyAdded(serverId: string): boolean {
  const added = getAddedServers()
  return added.some((s) => s.id === serverId)
}

/**
 * Auto-add required MCP servers
 * Returns list of servers that were actually added
 */
export function autoAddRequiredMCPs(prompt: string): AwesomeMCPServer[] {
  const detection = detectRequiredMCPs(prompt)
  const addedServers: AwesomeMCPServer[] = []

  for (const server of detection.servers) {
    if (!isServerAlreadyAdded(server.id)) {
      const added = addServer(server)
      if (added) {
        addedServers.push(server)
      }
    }
  }

  return addedServers
}

/**
 * Get detection result with progress tracking
 */
export async function detectAndAddWithProgress(
  prompt: string,
  onProgress: (update: MCProgressUpdate) => void
): Promise<AwesomeMCPServer[]> {
  const detection = detectRequiredMCPs(prompt)
  const addedServers: AwesomeMCPServer[] = []

  for (const server of detection.servers) {
    // Notify: detecting
    onProgress({ server, status: "detecting" })

    // Check if already added
    if (isServerAlreadyAdded(server.id)) {
      onProgress({ server, status: "added" })
      continue
    }

    // Notify: adding
    onProgress({ server, status: "adding" })

    try {
      const added = addServer(server)
      if (added) {
        addedServers.push(server)
        onProgress({ server, status: "added" })
      }
    } catch (err) {
      onProgress({
        server,
        status: "error",
        error: err instanceof Error ? err.message : "Failed to add server",
      })
    }
  }

  return addedServers
}

/**
 * Get all available MCP servers
 */
export function getAllMCPServers(): AwesomeMCPServer[] {
  return ALL_MCP_SERVERS
}

/**
 * Get server by ID
 */
export function getServerById(id: string): AwesomeMCPServer | undefined {
  return ALL_MCP_SERVERS.find((s) => s.id === id)
}
