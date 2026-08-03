/**
 * Awesome MCP Servers Integration
 * 
 * Browse 3000+ MCP servers from punkpeye/awesome-mcp-servers + SkillsLLM
 * Sources: 
 *   - https://github.com/punkpeye/awesome-mcp-servers
 *   - https://skillsllm.com/category/mcp-servers
 * 
 * @module awesome-mcp-servers
 */

// ============================================================
// Types
// ============================================================

export interface AwesomeMCPServer {
 id: string
 name: string
 description: string
 category: string
 github: string
 install: string
 language: "typescript" | "python" | "go" | "rust" | "csharp" | "java" | "cpp" | "ruby" | "unknown"
 scope: "cloud" | "local" | "embedded" | "unknown"
 os: ("mac" | "windows" | "linux")[]
 source?: "awesome-mcp" | "skillsllm"
 stars?: number
}

export interface AwesomeMCPData {
 servers: AwesomeMCPServer[]
 categories: string[]
}

// ============================================================
// Embedded server data (top 100 most popular)
// Full list loaded from JSON at runtime
// ============================================================

const TOP_SERVERS: AwesomeMCPServer[] = [
 // SkillsLLM Top MCP Servers (by stars)
 { id: "n8n-io/n8n", name: "n8n", description: "Workflow automation platform with AI capabilities", category: "Workflow Automation", github: "https://github.com/n8n-io/n8n", install: "docker pull n8nio/n8n", language: "typescript", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 197550 },
 { id: "D4Vinci/Scrapling", name: "Scrapling", description: "Adaptive web scraping framework", category: "Web Scraping", github: "https://github.com/D4Vinci/Scrapling", install: "pip install scrapling", language: "python", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 70811 },
 { id: "sansan0/TrendRadar", name: "TrendRadar", description: "AI-driven trend monitor with alerts", category: "Monitoring", github: "https://github.com/sansan0/TrendRadar", install: "docker pull sansan0/trendradar", language: "python", scope: "cloud", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 60809 },
 { id: "upstash/context7", name: "Context7", description: "Up-to-date code documentation for LLMs", category: "Documentation", github: "https://github.com/upstash/context7", install: "npx -y @upstash/context7-mcp", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 59616 },
 { id: "DeusData/codebase-memory-mcp", name: "Codebase Memory", description: "High-performance code intelligence MCP server", category: "Code Intelligence", github: "https://github.com/DeusData/codebase-memory-mcp", install: "brew install codebase-memory-mcp", language: "cpp", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 34279 },
 { id: "anthropics/claude-plugins-official", name: "Claude Plugins Official", description: "Official Anthropic Claude Code Plugins", category: "Coding Agents", github: "https://github.com/anthropics/claude-plugins-official", install: "", language: "python", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 32510 },
 { id: "github/github-mcp-server", name: "GitHub MCP Server", description: "GitHub's official MCP Server", category: "Version Control", github: "https://github.com/github/github-mcp-server", install: "go install github.com/github/github-mcp-server@latest", language: "go", scope: "cloud", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 31646 },
 { id: "tirth8205/code-review-graph", name: "Code Review Graph", description: "Local-first code intelligence graph for MCP", category: "Code Intelligence", github: "https://github.com/tirth8205/code-review-graph", install: "pip install code-review-graph", language: "python", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 25479 },
 { id: "czlonkowski/n8n-mcp", name: "n8n MCP", description: "MCP for Claude to build n8n workflows", category: "Workflow Automation", github: "https://github.com/czlonkowski/n8n-mcp", install: "npx -y n8n-mcp", language: "typescript", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 22378 },
 { id: "modelscope/FunASR", name: "FunASR", description: "Open-source speech recognition toolkit", category: "Audio & Speech", github: "https://github.com/modelscope/FunASR", install: "pip install funasr", language: "python", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 19416 },
 { id: "microsoft/mcp-for-beginners", name: "MCP for Beginners", description: "MCP fundamentals curriculum", category: "Education", github: "https://github.com/microsoft/mcp-for-beginners", install: "", language: "python", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 16820 },
 { id: "xpzouying/xiaohongshu-mcp", name: "Xiaohongshu MCP", description: "MCP for xiaohongshu.com", category: "Social Media", github: "https://github.com/xpzouying/xiaohongshu-mcp", install: "go install github.com/xpzouying/xiaohongshu-mcp@latest", language: "go", scope: "cloud", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 14813 },
 { id: "yusufkaraaslan/Skill_Seekers", name: "Skill Seekers", description: "Convert docs/GitHub/PDFs into Claude AI skills", category: "Developer Tools", github: "https://github.com/yusufkaraaslan/Skill_Seekers", install: "pip install skill-seekers", language: "python", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 14531 },
 { id: "tadata-org/fastapi_mcp", name: "FastAPI MCP", description: "Expose FastAPI endpoints as MCP tools", category: "API Development", github: "https://github.com/tadata-org/fastapi_mcp", install: "pip install fastapi-mcp", language: "python", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 11953 },
 { id: "0xJacky/nginx-ui", name: "Nginx UI", description: "WebUI for Nginx", category: "Web Servers", github: "https://github.com/0xJacky/nginx-ui", install: "docker pull 0xjacky/nginx-ui", language: "go", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 11332 },
 { id: "awslabs/mcp", name: "AWS MCP", description: "Open source MCP Servers for AWS", category: "Cloud Platforms", github: "https://github.com/awslabs/mcp", install: "pip install awslabs-mcp", language: "python", scope: "cloud", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 9488 },
 { id: "AgentDeskAI/browser-tools-mcp", name: "Browser Tools MCP", description: "Monitor browser logs from Cursor", category: "Browser Automation", github: "https://github.com/AgentDeskAI/browser-tools-mcp", install: "npx -y @anthropic-ai/browser-tools-mcp", language: "typescript", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 7272 },
 { id: "firecrawl/firecrawl-mcp-server", name: "Firecrawl MCP", description: "Web scraping and search for Claude", category: "Web Scraping", github: "https://github.com/firecrawl/firecrawl-mcp-server", install: "npx -y firecrawl-mcp-server", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 7025 },
 { id: "BrowserMCP/mcp", name: "Browser MCP", description: "Control your browser with AI", category: "Browser Automation", github: "https://github.com/BrowserMCP/mcp", install: "npx -y @anthropic-ai/browser-mcp", language: "typescript", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 6864 },
 { id: "maximhq/bifrost", name: "Bifrost", description: "Fastest enterprise AI gateway", category: "AI Gateway", github: "https://github.com/maximhq/bifrost", install: "go install github.com/maximhq/bifrost@latest", language: "go", scope: "cloud", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 6710 },
 { id: "JerBouma/FinanceToolkit", name: "FinanceToolkit", description: "Transparent and efficient financial analysis", category: "Finance", github: "https://github.com/JerBouma/FinanceToolkit", install: "pip install financetoolkit", language: "python", scope: "local", os: ["mac", "windows", "linux"], source: "skillsllm", stars: 5145 },
 { id: "diegosouzapw/OmniRoute", name: "DevilRoute", description: "Free MIT AI gateway with 400+ providers and MCP support", category: "AI Gateway", github: "https://github.com/diegosouzapw/OmniRoute", install: "npx -y omniroute", language: "typescript", scope: "local", os: ["mac", "windows", "linux"], source: "awesome-mcp", stars: 35300 },
 // Awesome MCP Servers (top servers)
 { id: "anthropics/claude-code", name: "Claude Code", description: "Agentic coding tool", category: "Coding Agents", github: "https://github.com/anthropics/claude-code", install: "npm install -g @anthropic-ai/claude-code", language: "typescript", scope: "local", os: ["mac", "windows", "linux"], source: "awesome-mcp" },
 { id: "modelcontextprotocol/servers", name: "MCP Official Servers", description: "Reference MCP server implementations", category: "Developer Tools", github: "https://github.com/modelcontextprotocol/servers", install: "npx -y @modelcontextprotocol/server-filesystem", language: "typescript", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "browserbase/stagehand", name: "Stagehand", description: "Browser automation using Stagehand", category: "Browser Automation", github: "https://github.com/browserbase/stagehand", install: "npx -y @browserbasehq/mcp-browserbase", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "anthropics/claude-desktop", name: "Claude Desktop", description: "Desktop app with MCP support", category: "Coding Agents", github: "https://github.com/anthropics/claude-desktop", install: "", language: "unknown", scope: "local", os: ["mac", "windows"] },
 { id: "upstash/context7-mcp", name: "Context7", description: "Up-to-date documentation for LLMs", category: "Developer Tools", github: "https://github.com/upstash/context7-mcp", install: "npx -y @upstash/context7-mcp", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "exa-labs/exa-mcp-server", name: "Exa", description: "Search the web with Exa", category: "Search & Data Extraction", github: "https://github.com/exa-labs/exa-mcp-server", install: "npx -y exa-mcp-server", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "modelcontextprotocol/server-filesystem", name: "Filesystem", description: "Local filesystem access", category: "File Systems", github: "https://github.com/modelcontextprotocol/servers", install: "npx -y @modelcontextprotocol/server-filesystem", language: "typescript", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "modelcontextprotocol/server-sqlite", name: "SQLite", description: "SQLite database integration", category: "Databases", github: "https://github.com/modelcontextprotocol/servers", install: "npx -y @modelcontextprotocol/server-sqlite", language: "typescript", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "modelcontextprotocol/server-postgres", name: "PostgreSQL", description: "PostgreSQL database integration", category: "Databases", github: "https://github.com/modelcontextprotocol/servers", install: "npx -y @modelcontextprotocol/server-postgres", language: "typescript", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "modelcontextprotocol/server-fetch", name: "Fetch", description: "HTTP fetch for web requests", category: "Developer Tools", github: "https://github.com/modelcontextprotocol/servers", install: "npx -y @modelcontextprotocol/server-fetch", language: "typescript", scope: "local", os: ["mac", "windows", "linux"] },
  { id: "modelcontextprotocol/server-brave-search", name: "Brave Search", description: "Web search using Brave Search API", category: "Search & Data Extraction", github: "https://github.com/modelcontextprotocol/servers", install: "npx -y @modelcontextprotocol/server-brave-search", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"] },
  { id: "modelcontextprotocol/server-puppeteer", name: "Puppeteer (Deprecated - Use Built-in Browser)", description: "DEPRECATED: Devil AI has a built-in Playwright browser. Use the Browser panel instead.", category: "Browser Automation", github: "https://github.com/modelcontextprotocol/servers", install: "", language: "typescript", scope: "local", os: ["mac", "windows", "linux"] },
  { id: "modelcontextprotocol/server-memory", name: "Memory", description: "Persistent memory for AI agents", category: "Knowledge & Memory", github: "https://github.com/modelcontextprotocol/servers", install: "npx -y @modelcontextprotocol/server-memory", language: "typescript", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "modelcontextprotocol/server-github", name: "GitHub", description: "GitHub API integration", category: "Version Control", github: "https://github.com/modelcontextprotocol/servers", install: "npx -y @modelcontextprotocol/server-github", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "modelcontextprotocol/server-gitlab", name: "GitLab", description: "GitLab API integration", category: "Version Control", github: "https://github.com/modelcontextprotocol/servers", install: "npx -y @modelcontextprotocol/server-gitlab", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "modelcontextprotocol/server-google-drive", name: "Google Drive", description: "Google Drive integration", category: "File Systems", github: "https://github.com/modelcontextprotocol/servers", install: "npx -y @modelcontextprotocol/server-gdrive", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "modelcontextprotocol/server-slack", name: "Slack", description: "Slack integration", category: "Communication", github: "https://github.com/modelcontextprotocol/servers", install: "npx -y @modelcontextprotocol/server-slack", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "modelcontextprotocol/server-notion", name: "Notion", description: "Notion integration", category: "Workplace & Productivity", github: "https://github.com/modelcontextprotocol/servers", install: "npx -y @modelcontextprotocol/server-notion", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "modelcontextprotocol/server-linear", name: "Linear", description: "Linear integration", category: "Workplace & Productivity", github: "https://github.com/modelcontextprotocol/servers", install: "npx -y @modelcontextprotocol/server-linear", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "modelcontextprotocol/server-sequential-thinking", name: "Sequential Thinking", description: "Step-by-step reasoning", category: "Knowledge & Memory", github: "https://github.com/modelcontextprotocol/servers", install: "npx -y @modelcontextprotocol/server-sequential-thinking", language: "typescript", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "jlowin/fastmcp", name: "FastMCP", description: "Python MCP server framework", category: "Developer Tools", github: "https://github.com/jlowin/fastmcp", install: "pip install fastmcp", language: "python", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "punkpeye/awesome-mcp-servers", name: "Awesome MCP Servers", description: "Curated list of MCP servers", category: "Developer Tools", github: "https://github.com/punkpeye/awesome-mcp-servers", install: "", language: "unknown", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "glama.ai/mcp/servers", name: "Glama MCP Directory", description: "Web directory of MCP servers", category: "Developer Tools", github: "https://glama.ai/mcp/servers", install: "", language: "unknown", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "smithery-ai/smithery", name: "Smithery", description: "MCP server registry and deployment", category: "Developer Tools", github: "https://github.com/smithery-ai/smithery", install: "npx -y @smithery/cli", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "metatool-ai/metatool-app", name: "MetaMCP", description: "Unified middleware MCP server with GUI", category: "Developer Tools", github: "https://github.com/metatool-ai/metatool-app", install: "npx -y metatool-app", language: "typescript", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "wong2/awesome-mcp-servers-list", name: "MCP Servers List", description: "Another curated list", category: "Developer Tools", github: "https://github.com/wong2/awesome-mcp-servers-list", install: "", language: "unknown", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "anthropics/claude-code-action", name: "Claude Code Action", description: "GitHub Action for Claude Code", category: "Developer Tools", github: "https://github.com/anthropics/claude-code-action", install: "", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "block/goose", name: "Goose", description: "AI agent that extends developer workflows", category: "Coding Agents", github: "https://github.com/block/goose", install: "", language: "rust", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "cline/cline", name: "Cline", description: "AI coding assistant in VS Code", category: "Coding Agents", github: "https://github.com/cline/cline", install: "", language: "typescript", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "continuedev/continued", name: "Continue", description: "AI code assistant in VS Code and JetBrains", category: "Coding Agents", github: "https://github.com/continuedev/continued", install: "", language: "typescript", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "mintlify/mint", name: "Mintlify", description: "AI-powered documentation", category: "Developer Tools", github: "https://github.com/mintlify/mint", install: "npm install -g mintlify", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "getzep/zep", name: "Zep", description: "Memory for AI assistants", category: "Knowledge & Memory", github: "https://github.com/getzep/zep", install: "", language: "go", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "supermemory/supermemory", name: "Supermemory", description: "Memory engine for AI apps", category: "Knowledge & Memory", github: "https://github.com/supermemory/supermemory", install: "", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "mem0ai/mem0", name: "Mem0", description: "Memory layer for AI agents", category: "Knowledge & Memory", github: "https://github.com/mem0ai/mem0", install: "pip install mem0ai", language: "python", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "qdrant/qdrant-mcp", name: "Qdrant", description: "Vector search engine MCP server", category: "Databases", github: "https://github.com/qdrant/qdrant-mcp", install: "npx -y @qdrant/mcp-server", language: "typescript", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "weaviate/mcp-server", name: "Weaviate", description: "Vector database MCP server", category: "Databases", github: "https://github.com/weaviate/mcp-server", install: "", language: "typescript", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "chroma-core/chroma-mcp", name: "Chroma", description: "AI-native open-source embedding database", category: "Databases", github: "https://github.com/chroma-core/chroma-mcp", install: "", language: "python", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "supabase/mcp-server-supabase", name: "Supabase", description: "Supabase MCP server", category: "Databases", github: "https://github.com/supabase/mcp-server-supabase", install: "npx -y @supabase/mcp-server-supabase", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "prisma/mcp-server-prisma", name: "Prisma", description: "Prisma MCP server", category: "Databases", github: "https://github.com/prisma/mcp-server-prisma", install: "npx -y @prisma/mcp-server", language: "typescript", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "dbos-inc/dbos-mcp", name: "DBOS", description: "Database operations MCP server", category: "Databases", github: "https://github.com/dbos-inc/dbos-mcp", install: "", language: "python", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "mysql/mcp-server-mysql", name: "MySQL", description: "MySQL MCP server", category: "Databases", github: "https://github.com/mysql/mcp-server-mysql", install: "", language: "typescript", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "mongodb/mongodb-mcp-server", name: "MongoDB", description: "MongoDB MCP server", category: "Databases", github: "https://github.com/mongodb/mongodb-mcp-server", install: "npx -y @mongodb-js/mongodb-mcp-server", language: "typescript", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "neo4j/mcp-server-bolt", name: "Neo4j Bolt", description: "Neo4j graph database MCP server", category: "Databases", github: "https://github.com/neo4j/mcp-server-bolt", install: "uvx mcp-server-bolt", language: "python", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "clickhouse/mcp-server-clickhouse", name: "ClickHouse", description: "ClickHouse MCP server", category: "Databases", github: "https://github.com/clickhouse/mcp-server-clickhouse", install: "uvx mcp-server-clickhouse", language: "python", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "redis/mcp-redis", name: "Redis", description: "Redis MCP server", category: "Databases", github: "https://github.com/redis/mcp-redis", install: "npx -y @redis/mcp", language: "typescript", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "elastic/mcp-server-elasticsearch", name: "Elasticsearch", description: "Elasticsearch MCP server", category: "Databases", github: "https://github.com/elastic/mcp-server-elasticsearch", install: "uvx mcp-server-elasticsearch", language: "python", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "cloudflare/mcp-server-cloudflare", name: "Cloudflare", description: "Cloudflare MCP server", category: "Cloud Platforms", github: "https://github.com/cloudflare/mcp-server-cloudflare", install: "npx -y @cloudflare/mcp-server-cloudflare", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "aws/mcp-server", name: "AWS", description: "AWS MCP server", category: "Cloud Platforms", github: "https://github.com/awslabs/mcp-servers", install: "npx -y @aws/mcp-server", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "google-cloud-platform/mcp-server", name: "Google Cloud", description: "Google Cloud MCP server", category: "Cloud Platforms", github: "https://github.com/GoogleCloudPlatform/mcp-servers", install: "", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "azure/azure-mcp-server", name: "Azure", description: "Azure MCP server", category: "Cloud Platforms", github: "https://github.com/Azure/azure-mcp-server", install: "", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "vercel/mcp-vercel", name: "Vercel", description: "Vercel MCP server", category: "Cloud Platforms", github: "https://github.com/vercel/mcp-vercel", install: "npx -y @vercel/mcp", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "netlify/mcp-netlify", name: "Netlify", description: "Netlify MCP server", category: "Cloud Platforms", github: "https://github.com/netlify/mcp-netlify", install: "npx -y @netlify/mcp", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "fly-apps/mcp-fly", name: "Fly.io", description: "Fly.io MCP server", category: "Cloud Platforms", github: "https://github.com/fly-apps/mcp-fly", install: "", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "digitalocean/mcp-digitalocean", name: "DigitalOcean", description: "DigitalOcean MCP server", category: "Cloud Platforms", github: "https://github.com/digitalocean/mcp-digitalocean", install: "", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "heroku/mcp-heroku", name: "Heroku", description: "Heroku MCP server", category: "Cloud Platforms", github: "https://github.com/heroku/mcp-heroku", install: "", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "render/mcp-render", name: "Render", description: "Render MCP server", category: "Cloud Platforms", github: "https://github.com/render/mcp-render", install: "", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "railway/mcp-railway", name: "Railway", description: "Railway MCP server", category: "Cloud Platforms", github: "https://github.com/railway/mcp-railway", install: "", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "anthropics/mcp-server-filesystem", name: "Anthropic Filesystem", description: "Anthropic's filesystem server", category: "File Systems", github: "https://github.com/anthropics/mcp-server-filesystem", install: "npx -y @anthropic-ai/mcp-server-filesystem", language: "typescript", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "isaac-levine/forage", name: "Forage", description: "Self-improving tool discovery for AI agents", category: "Developer Tools", github: "https://github.com/isaac-levine/forage", install: "npx -y @isaac-levine/forage", language: "typescript", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "tadas-github/a2asearch-mcp", name: "A2A Search", description: "Search 4,800+ MCP servers", category: "Developer Tools", github: "https://github.com/tadas-github/a2asearch-mcp", install: "npx -y a2asearch-mcp", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "skillselion/skillselion-mcp", name: "Skillselion", description: "Search community-vetted Claude Code skills", category: "Developer Tools", github: "https://github.com/skillselion/skillselion-mcp", install: "npx -y skillselion-mcp", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "adw0rd/awesome-mcp-tools-mcp", name: "Awesome MCP Tools", description: "Search awesome-mcp.tools catalog", category: "Developer Tools", github: "https://github.com/adw0rd/awesome-mcp-tools-mcp", install: "npx -y awesome-mcp-tools-mcp", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "aidevelopers2/remoteopenclaw-mcp", name: "Remote OpenClaw", description: "Search 13,870+ MCP servers", category: "Developer Tools", github: "https://github.com/aidevelopers2/remoteopenclaw-mcp", install: "npx -y remoteopenclaw", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "K-Dense-AI/claude-skills-mcp", name: "Claude Skills", description: "Search Claude Agent Skills", category: "Developer Tools", github: "https://github.com/K-Dense-AI/claude-skills-mcp", install: "", language: "python", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "malamutemayhem/unclick", name: "Unclick", description: "450+ callable endpoints across 60+ integrations", category: "Developer Tools", github: "https://github.com/malamutemayhem/unclick", install: "npx -y @unclick/mcp-server", language: "typescript", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "markgatcha/universal-mcp-toolkit", name: "Universal MCP Toolkit", description: "Universal MCP aggregator", category: "Developer Tools", github: "https://github.com/Markgatcha/universal-mcp-toolkit", install: "", language: "typescript", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "VeriTeknik/pluggedin-mcp-proxy", name: "Pluggedin Proxy", description: "Combine multiple MCP servers", category: "Developer Tools", github: "https://github.com/VeriTeknik/pluggedin-mcp-proxy", install: "", language: "typescript", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "tigranbs/mcgravity", name: "MCGravity", description: "Proxy for composing MCP servers", category: "Developer Tools", github: "https://github.com/tigranbs/mcgravity", install: "", language: "typescript", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "sitbon/magg", name: "Magg", description: "Meta-MCP server for autonomous discovery", category: "Developer Tools", github: "https://github.com/sitbon/magg", install: "", language: "python", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "duaraghav8/MCPJungle", name: "MCPJungle", description: "Self-hosted MCP Server registry", category: "Developer Tools", github: "https://github.com/duaraghav8/MCPJungle", install: "", language: "go", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "julien040/anyquery", name: "Anyquery", description: "Query 40+ apps with SQL", category: "Databases", github: "https://github.com/julien040/anyquery", install: "", language: "go", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "PipedreamHQ/pipedream", name: "Pipedream", description: "Connect with 2,500 APIs", category: "Developer Tools", github: "https://github.com/PipedreamHQ/pipedream", install: "", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "profullstack/mcp-server", name: "Profullstack MCP", description: "20+ developer utilities", category: "Developer Tools", github: "https://github.com/profullstack/mcp-server", install: "", language: "typescript", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "depwire/depwire", name: "Depwire", description: "Dependency graph for AI coding", category: "Developer Tools", github: "https://github.com/depwire/depwire", install: "", language: "typescript", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "gzoonet/cortex", name: "Cortex", description: "Local-first knowledge graph", category: "Knowledge & Memory", github: "https://github.com/gzoonet/cortex", install: "", language: "typescript", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "opentabs-dev/opentabs", name: "OpenTabs", description: "Plugin-based MCP server + Chrome extension", category: "Browser Automation", github: "https://github.com/opentabs-dev/opentabs", install: "", language: "typescript", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "hamflx/imagen3-mcp", name: "Imagen3", description: "Image generation using Google Imagen 3.0", category: "Art & Culture", github: "https://github.com/hamflx/imagen3-mcp", install: "", language: "typescript", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "SureScaleAI/openai-gpt-image-mcp", name: "GPT Image", description: "OpenAI GPT image generation", category: "Art & Culture", github: "https://github.com/SureScaleAI/openai-gpt-image-mcp", install: "", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "merterbak/Grok-MCP", name: "Grok MCP", description: "xAI's Grok API integration", category: "AI", github: "https://github.com/merterbak/Grok-MCP", install: "", language: "python", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "arikusi/deepseek-mcp-server", name: "DeepSeek", description: "DeepSeek AI integration", category: "AI", github: "https://github.com/arikusi/deepseek-mcp-server", install: "", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "jaspertvdm/mcp-server-gemini-bridge", name: "Gemini Bridge", description: "Bridge to Google Gemini API", category: "AI", github: "https://github.com/jaspertvdm/mcp-server-gemini-bridge", install: "", language: "python", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "jaspertvdm/mcp-server-openai-bridge", name: "OpenAI Bridge", description: "Bridge to OpenAI API", category: "AI", github: "https://github.com/jaspertvdm/mcp-server-openai-bridge", install: "", language: "python", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "jaspertvdm/mcp-server-ollama-bridge", name: "Ollama Bridge", description: "Bridge to local Ollama LLM server", category: "AI", github: "https://github.com/jaspertvdm/mcp-server-ollama-bridge", install: "", language: "python", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "sxhxliang/mcp-access-point", name: "MCP Access Point", description: "Turn web service into MCP server", category: "Developer Tools", github: "https://github.com/sxhxliang/mcp-access-point", install: "", language: "typescript", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "wegotdocs/open-mcp", name: "Open MCP", description: "Turn web API into MCP server", category: "Developer Tools", github: "https://github.com/wegotdocs/open-mcp", install: "", language: "typescript", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "AskViato/mcp-servers", name: "Viato MCP", description: "Turn API into MCP server", category: "Developer Tools", github: "https://github.com/AskViato/mcp-servers", install: "", language: "typescript", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "WayStation-ai/mcp", name: "WayStation", description: "Connect Claude Desktop to apps", category: "Developer Tools", github: "https://github.com/waystation-ai/mcp", install: "", language: "typescript", scope: "cloud", os: ["mac", "windows"] },
 { id: "1mcp-app/agent", name: "1MCP Agent", description: "Unified MCP server aggregating multiple servers", category: "Aggregators", github: "https://github.com/1mcp-app/agent", install: "", language: "typescript", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "tsouth89/toolport", name: "Toolport", description: "Local gateway for all MCP servers", category: "Aggregators", github: "https://github.com/tsouth89/toolport", install: "", language: "rust", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "MikkoParkkola/mcp-gateway", name: "MCP Gateway", description: "Universal MCP gateway", category: "Aggregators", github: "https://github.com/MikkoParkkola/mcp-gateway", install: "", language: "go", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "ViperJuice/mcp-gateway", name: "ViperJuice Gateway", description: "Meta-server for minimal tool bloat", category: "Aggregators", github: "https://github.com/ViperJuice/mcp-gateway", install: "", language: "python", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "TheLunarCompany/lunar", name: "Lunar MCPX", description: "Production-ready MCP gateway", category: "Aggregators", github: "https://github.com/TheLunarCompany/lunar", install: "", language: "typescript", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "rupinder2/mcp-orchestrator", name: "MCP Orchestrator", description: "Central hub aggregating tools", category: "Aggregators", github: "https://github.com/rupinder2/mcp-orchestrator", install: "", language: "python", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "smart-mcp-proxy/mcpproxy-go", name: "MCPProxy Go", description: "Local MCP proxy with BM25 filtering", category: "Aggregators", github: "https://github.com/smart-mcp-proxy/mcpproxy-go", install: "", language: "go", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "Rendeverance/toolfunnel", name: "ToolFunnel", description: "Zero-dependency MCP gateway", category: "Aggregators", github: "https://github.com/Rendeverance/toolfunnel", install: "", language: "typescript", scope: "local", os: ["mac", "windows", "linux"] },
 { id: "AskViato/api-hub", name: "API Hub", description: "49 MCP tools with persistent memory", category: "Aggregators", github: "https://github.com/scotia1973-bot/api-hub", install: "pip install gadgethumans-api-hub-mcp", language: "python", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "tadas-github/a2asearch-mcp", name: "A2A Search MCP", description: "Search 4,800+ MCP servers", category: "Aggregators", github: "https://github.com/tadas-github/a2asearch-mcp", install: "npx -y a2asearch-mcp", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"] },
 { id: "adw0rd/awesome-mcp-tools-mcp", name: "Awesome MCP Tools Bridge", description: "CLI + stdio bridge for awesome-mcp.tools", category: "Aggregators", github: "https://github.com/adw0rd/awesome-mcp-tools-mcp", install: "npx -y awesome-mcp-tools-mcp", language: "typescript", scope: "cloud", os: ["mac", "windows", "linux"] },
]

// ============================================================
// Local Storage Cache
// ============================================================

const CACHE_KEY = "devil-ai-awesome-mcp-servers"
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

interface CacheEntry {
 data: AwesomeMCPData
 timestamp: number
}

function getCachedData(): AwesomeMCPData | null {
 try {
  const raw = localStorage.getItem(CACHE_KEY)
  if (!raw) return null
  const entry: CacheEntry = JSON.parse(raw)
  if (Date.now() - entry.timestamp > CACHE_DURATION_MS) {
   localStorage.removeItem(CACHE_KEY)
   return null
  }
  return entry.data
 } catch {
  return null
 }
}

function setCachedData(data: AwesomeMCPData): void {
 try {
  const entry: CacheEntry = { data, timestamp: Date.now() }
  localStorage.setItem(CACHE_KEY, JSON.stringify(entry))
 } catch {
  // Storage full, ignore
 }
}

// ============================================================
// Fetch & Parse from GitHub
// ============================================================

/**
 * Fetch servers from awesome-mcp-servers JSON
 * Falls back to embedded list on error
 */
export async function fetchAwesomeServers(): Promise<AwesomeMCPData> {
 // Check cache first
 const cached = getCachedData()
 if (cached) return cached

 try {
  // Try to load from local JSON file (bundled with app)
  const response = await fetch("./awesome-servers.json")
  if (response.ok) {
   const data: AwesomeMCPData = await response.json()
   setCachedData(data)
   return data
  }
 } catch {
  // Fall through to embedded list
 }

 // Return embedded servers
 const data: AwesomeMCPData = {
  servers: TOP_SERVERS,
  categories: [...new Set(TOP_SERVERS.map((s) => s.category))].sort(),
 }
 return data
}

// ============================================================
// Search & Filter
// ============================================================

/**
 * Search servers by query
 */
export function searchServers(servers: AwesomeMCPServer[], query: string): AwesomeMCPServer[] {
 if (!query.trim()) return servers

 const q = query.toLowerCase()
 return servers.filter(
  (s) =>
   s.name.toLowerCase().includes(q) ||
   s.description.toLowerCase().includes(q) ||
   s.category.toLowerCase().includes(q) ||
   s.id.toLowerCase().includes(q)
 )
}

/**
 * Filter servers by category
 */
export function filterByCategory(servers: AwesomeMCPServer[], category: string): AwesomeMCPServer[] {
 if (!category || category === "All") return servers
 return servers.filter((s) => s.category === category)
}

/**
 * Filter servers by language
 */
export function filterByLanguage(servers: AwesomeMCPServer[], language: string): AwesomeMCPServer[] {
 if (!language || language === "All") return servers
 return servers.filter((s) => s.language === language)
}

/**
 * Filter servers by scope
 */
export function filterByScope(servers: AwesomeMCPServer[], scope: string): AwesomeMCPServer[] {
 if (!scope || scope === "All") return servers
 return servers.filter((s) => s.scope === scope)
}

/**
 * Get server statistics
 */
export function getStats(servers: AwesomeMCPServer[]): {
 total: number
 categories: number
 languages: Record<string, number>
 scopes: Record<string, number>
} {
 const languages: Record<string, number> = {}
 const scopes: Record<string, number> = {}

 for (const server of servers) {
  languages[server.language] = (languages[server.language] || 0) + 1
  scopes[server.scope] = (scopes[server.scope] || 0) + 1
 }

 return {
  total: servers.length,
  categories: new Set(servers.map((s) => s.category)).size,
  languages,
  scopes,
 }
}
