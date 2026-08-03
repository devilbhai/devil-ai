/**
 * SkillsLLM Scraper - Fetches skills from skillsllm.com
 * Scrapes category pages and skill details for integration
 */

// ============================================================
// Types
// ============================================================

export interface SkillsLLMSkill {
  name: string
  slug: string
  author: string
  githubRepo: string
  description: string
  stars: number
  forks: number
  language: string
  category: string
  tags: string[]
  url: string
}

export interface SkillsLLMCategory {
  name: string
  slug: string
  count: number
  url: string
}

// ============================================================
// Constants
// ============================================================

const CATEGORIES: SkillsLLMCategory[] = [
  { name: "AI Agents", slug: "ai-agents", count: 3070, url: "/category/ai-agents" },
  { name: "MCP Servers", slug: "mcp-servers", count: 536, url: "/category/mcp-servers" },
  { name: "CLI Tools", slug: "cli-tools", count: 167, url: "/category/cli-tools" },
  { name: "IDE Extensions", slug: "ide-extensions", count: 60, url: "/category/ide-extensions" },
  { name: "API Integration", slug: "api-integration", count: 35, url: "/category/api-integration" },
  { name: "Testing", slug: "testing", count: 16, url: "/category/testing" },
  { name: "DevOps", slug: "devops", count: 16, url: "/category/devops" },
  { name: "Data Processing", slug: "data-processing", count: 13, url: "/category/data-processing" },
  { name: "Code Generation", slug: "code-generation", count: 4, url: "/category/code-generation" },
  { name: "Documentation", slug: "documentation", count: 4, url: "/category/documentation" },
]

// Top skills by stars (curated from SkillsLLM)
const TOP_SKILLS: SkillsLLMSkill[] = [
  // AI Agents (Top 30)
  {
    name: "superpowers",
    slug: "superpowers",
    author: "obra",
    githubRepo: "obra/superpowers",
    description: "An agentic skills framework & software development methodology that works.",
    stars: 234966,
    forks: 20863,
    language: "Shell",
    category: "ai-agents",
    tags: ["ai-agents", "brainstorming"],
    url: "https://github.com/obra/superpowers",
  },
  {
    name: "ECC",
    slug: "ecc",
    author: "affaan-m",
    githubRepo: "affaan-m/ECC",
    description: "The agent harness performance optimization system. Skills, instincts, memory, security, and research-first development for Claude Code, Codex, Opencode, Cursor and beyond.",
    stars: 232305,
    forks: 35418,
    language: "JavaScript",
    category: "ai-agents",
    tags: ["ai-agents", "anthropic"],
    url: "https://github.com/affaan-m/ECC",
  },
  {
    name: "hermes-agent",
    slug: "hermes-agent",
    author: "NousResearch",
    githubRepo: "NousResearch/hermes-agent",
    description: "The agent that grows with you",
    stars: 219068,
    forks: 41520,
    language: "Python",
    category: "ai-agents",
    tags: ["ai-agents", "ai-agent"],
    url: "https://github.com/NousResearch/hermes-agent",
  },
  {
    name: "everything-claude-code",
    slug: "everything-claude-code",
    author: "affaan-m",
    githubRepo: "affaan-m/everything-claude-code",
    description: "The agent harness performance optimization system. Skills, instincts, memory, security, and research-first development for Claude Code, Codex, Opencode, Cursor and beyond.",
    stars: 185940,
    forks: 28768,
    language: "JavaScript",
    category: "ai-agents",
    tags: ["ai-agents", "anthropic"],
    url: "https://github.com/affaan-m/everything-claude-code",
  },
  {
    name: "cc-switch",
    slug: "cc-switch",
    author: "farion1231",
    githubRepo: "farion1231/cc-switch",
    description: "A cross-platform desktop All-in-One assistant for Claude Code, Codex, OpenCode, OpenClaw, Grok Build & Hermes Agent.",
    stars: 120273,
    forks: 8075,
    language: "Rust",
    category: "ai-agents",
    tags: ["ai-agents", "claude-code"],
    url: "https://github.com/farion1231/cc-switch",
  },
  {
    name: "gstack",
    slug: "gstack",
    author: "garrytan",
    githubRepo: "garrytan/gstack",
    description: "Use Garry Tan's exact Claude Code setup: 23 opinionated tools that serve as CEO, Designer, Eng Manager, Release Manager, Doc Engineer, and QA",
    stars: 112329,
    forks: 16695,
    language: "TypeScript",
    category: "ai-agents",
    tags: ["ai-agents", "SKILL.md"],
    url: "https://github.com/garrytan/gstack",
  },
  {
    name: "llama.cpp",
    slug: "llama-cpp",
    author: "ggml-org",
    githubRepo: "ggml-org/llama.cpp",
    description: "LLM inference in C/C++",
    stars: 103839,
    forks: 16880,
    language: "C++",
    category: "ai-agents",
    tags: ["ai-agents", "ggml"],
    url: "https://github.com/ggml-org/llama.cpp",
  },
  {
    name: "graphify",
    slug: "graphify",
    author: "Graphify-Labs",
    githubRepo: "Graphify-Labs/graphify",
    description: "Turn any codebase, with its docs, SQL schemas, configs, and PDFs, into a queryable knowledge graph.",
    stars: 94050,
    forks: 9112,
    language: "Python",
    category: "ai-agents",
    tags: ["ai-agents", "antigravity"],
    url: "https://github.com/Graphify-Labs/graphify",
  },
  {
    name: "caveman",
    slug: "caveman",
    author: "JuliusBrussee",
    githubRepo: "JuliusBrussee/caveman",
    description: "why use many token when few token do trick — Claude Code skill that cuts 65% of tokens by talking like caveman",
    stars: 92159,
    forks: 5227,
    language: "JavaScript",
    category: "ai-agents",
    tags: ["ai-agents", "anthropic"],
    url: "https://github.com/JuliusBrussee/caveman",
  },
  {
    name: "claude-mem",
    slug: "claude-mem",
    author: "thedotmack",
    githubRepo: "thedotmack/claude-mem",
    description: "Persistent Context Across Sessions for Every Agent – Captures everything your agent does during sessions, compresses it with AI, and injects relevant context back into future sessions.",
    stars: 88286,
    forks: 7664,
    language: "JavaScript",
    category: "ai-agents",
    tags: ["ai-agents", "ai-agents"],
    url: "https://github.com/thedotmack/claude-mem",
  },
  // MCP Servers (Top 15)
  {
    name: "n8n",
    slug: "n8n",
    author: "n8n-io",
    githubRepo: "n8n-io/n8n",
    description: "Fair-code workflow automation platform with native AI capabilities. Combine visual building with custom code, self-host or cloud, 400+ integrations.",
    stars: 197550,
    forks: 59553,
    language: "TypeScript",
    category: "mcp-servers",
    tags: ["mcp-servers", "ai", "apis"],
    url: "https://github.com/n8n-io/n8n",
  },
  {
    name: "Scrapling",
    slug: "scrapling",
    author: "D4Vinci",
    githubRepo: "D4Vinci/Scrapling",
    description: "An adaptive Web Scraping framework that handles everything from a single request to a full-scale crawl!",
    stars: 70811,
    forks: 7021,
    language: "Python",
    category: "mcp-servers",
    tags: ["mcp-servers", "ai", "ai-scraping"],
    url: "https://github.com/D4Vinci/Scrapling",
  },
  {
    name: "TrendRadar",
    slug: "trendradar",
    author: "sansan0",
    githubRepo: "sansan0/TrendRadar",
    description: "AI-driven public opinion & trend monitor with multi-platform aggregation, RSS, and smart alerts.",
    stars: 60809,
    forks: 24806,
    language: "Python",
    category: "mcp-servers",
    tags: ["mcp-servers", "ai", "bark"],
    url: "https://github.com/sansan0/TrendRadar",
  },
  {
    name: "context7",
    slug: "context7",
    author: "upstash",
    githubRepo: "upstash/context7",
    description: "Context7 Platform -- Up-to-date code documentation for LLMs and AI code editors",
    stars: 59616,
    forks: 2856,
    language: "TypeScript",
    category: "mcp-servers",
    tags: ["mcp-servers", "llm", "mcp"],
    url: "https://github.com/upstash/context7",
  },
  {
    name: "codebase-memory-mcp",
    slug: "codebase-memory-mcp",
    author: "DeusData",
    githubRepo: "DeusData/codebase-memory-mcp",
    description: "High-performance code intelligence MCP server. Indexes codebases into a persistent knowledge graph.",
    stars: 34279,
    forks: 2631,
    language: "C",
    category: "mcp-servers",
    tags: ["mcp-servers", "ai", "derast"],
    url: "https://github.com/DeusData/codebase-memory-mcp",
  },
  {
    name: "claude-plugins-official",
    slug: "claude-plugins-official",
    author: "anthropics",
    githubRepo: "anthropics/claude-plugins-official",
    description: "Official, Anthropic-managed directory of high quality Claude Code Plugins.",
    stars: 32510,
    forks: 3641,
    language: "Python",
    category: "mcp-servers",
    tags: ["mcp-servers", "claude-code", "mcp"],
    url: "https://github.com/anthropics/claude-plugins-official",
  },
  {
    name: "github-mcp-server",
    slug: "github-mcp-server",
    author: "github",
    githubRepo: "github/github-mcp-server",
    description: "GitHub's official MCP Server",
    stars: 31646,
    forks: 4633,
    language: "Go",
    category: "mcp-servers",
    tags: ["mcp-servers", "github", "mcp"],
    url: "https://github.com/github/github-mcp-server",
  },
  {
    name: "code-review-graph",
    slug: "code-review-graph",
    author: "tirth8205",
    githubRepo: "tirth8205/code-review-graph",
    description: "Local-first code intelligence graph for MCP and CLI.",
    stars: 25479,
    forks: 2403,
    language: "Python",
    category: "mcp-servers",
    tags: ["mcp-servers", "ai", "coding", "claude"],
    url: "https://github.com/tirth8205/code-review-graph",
  },
  {
    name: "n8n-mcp",
    slug: "n8n-mcp",
    author: "czlonkowski",
    githubRepo: "czlonkowski/n8n-mcp",
    description: "A MCP for Claude Desktop / Claude Code / Windsurf / Cursor to build n8n workflows for you",
    stars: 22378,
    forks: 3579,
    language: "TypeScript",
    category: "mcp-servers",
    tags: ["mcp-servers", "mcp", "mcp-server"],
    url: "https://github.com/czlonkowski/n8n-mcp",
  },
  {
    name: "FunASR",
    slug: "funasr",
    author: "modelscope",
    githubRepo: "modelscope/FunASR",
    description: "Open-source speech recognition toolkit for training, inference, streaming ASR, VAD, punctuation, speaker diarization pipelines.",
    stars: 19416,
    forks: 1952,
    language: "Python",
    category: "mcp-servers",
    tags: ["mcp-servers", "asr", "audio"],
    url: "https://github.com/modelscope/FunASR",
  },
  {
    name: "mcp-for-beginners",
    slug: "mcp-for-beginners",
    author: "microsoft",
    githubRepo: "microsoft/mcp-for-beginners",
    description: "This open-source curriculum introduces the fundamentals of Model Context Protocol (MCP) through real-world, cross-language examples.",
    stars: 16820,
    forks: 5483,
    language: "Jupyter Notebook",
    category: "mcp-servers",
    tags: ["mcp-servers", "csharp", "java"],
    url: "https://github.com/microsoft/mcp-for-beginners",
  },
  // CLI Tools (Top 10)
  {
    name: "ui-ux-pro-max-skill",
    slug: "ui-ux-pro-max-skill",
    author: "nextlevelbuilder",
    githubRepo: "nextlevelbuilder/ui-ux-pro-max-skill",
    description: "An AI SKILL that provide design intelligence for building professional UI/UX multiple platforms",
    stars: 109086,
    forks: 11612,
    language: "Python",
    category: "cli-tools",
    tags: ["cli-tools", "ai", "skills", "antigravity"],
    url: "https://github.com/nextlevelbuilder/ui-ux-pro-max-skill",
  },
  {
    name: "claude-code-templates",
    slug: "claude-code-templates",
    author: "davila7",
    githubRepo: "davila7/claude-code-templates",
    description: "CLI tool for configuring and monitoring Claude Code",
    stars: 29842,
    forks: 3191,
    language: "Python",
    category: "cli-tools",
    tags: ["cli-tools", "anthropic", "anthropic-claude"],
    url: "https://github.com/davila7/claude-code-templates",
  },
  {
    name: "happy",
    slug: "happy",
    author: "slopus",
    githubRepo: "slopus/happy",
    description: "Mobile and Web client for Codex and Claude Code, with realtime voice, encryption and fully featured",
    stars: 22806,
    forks: 1922,
    language: "TypeScript",
    category: "cli-tools",
    tags: ["cli-tools", "claude-code", "claude-desktop"],
    url: "https://github.com/slopus/happy",
  },
  {
    name: "claudecodeui",
    slug: "claudecodeui",
    author: "siteboon",
    githubRepo: "siteboon/claudecodeui",
    description: "Use Claude Code, OpenCode, Cursor CLI, and Codex on mobile and web with CloudCLI.",
    stars: 12825,
    forks: 1746,
    language: "TypeScript",
    category: "cli-tools",
    tags: ["cli-tools", "anthropic", "anthropic-ai"],
    url: "https://github.com/siteboon/claudecodeui",
  },
  {
    name: "ccstatusline",
    slug: "ccstatusline",
    author: "sirmalloc",
    githubRepo: "sirmalloc/ccstatusline",
    description: "Beautiful highly customizable statusline for Claude Code CLI with powerline support, themes, and more.",
    stars: 11936,
    forks: 522,
    language: "TypeScript",
    category: "cli-tools",
    tags: ["cli-tools", "ai", "tools", "claude-code"],
    url: "https://github.com/sirmalloc/ccstatusline",
  },
  // DevOps (Top 5)
  {
    name: "xonsh",
    slug: "xonsh",
    author: "xonsh",
    githubRepo: "xonsh/xonsh",
    description: "Python-powered shell. Full-featured, cross-platform and AI-friendly.",
    stars: 9568,
    forks: 730,
    language: "Python",
    category: "devops",
    tags: ["devops", "anthropic", "claude"],
    url: "https://github.com/xonsh/xonsh",
  },
  {
    name: "ralphex",
    slug: "ralphex",
    author: "umputun",
    githubRepo: "umputun/ralphex",
    description: "Extended Ralph loop for autonomous AI-driven plan execution",
    stars: 1391,
    forks: 119,
    language: "Go",
    category: "devops",
    tags: ["devops", "automation", "claude-code"],
    url: "https://github.com/umputun/ralphex",
  },
  {
    name: "libretto",
    slug: "libretto",
    author: "saffron-health",
    githubRepo: "saffron-health/libretto",
    description: "The AI toolkit for building reliable browser automations",
    stars: 834,
    forks: 65,
    language: "TypeScript",
    category: "devops",
    tags: ["devops", "automation", "browser"],
    url: "https://github.com/saffron-health/libretto",
  },
  {
    name: "kubernetes-skill",
    slug: "kubernetes-skill",
    author: "LukasNiessen",
    githubRepo: "LukasNiessen/kubernetes-skill",
    description: "Kubernetes Skill for Claude Code and Codex. LLMs hallucinate a lot with K8s - KubeShark fixes this.",
    stars: 328,
    forks: 56,
    language: "",
    category: "devops",
    tags: ["devops", "SKILL.md", "claude-code", "claude-skills"],
    url: "https://github.com/LukasNiessen/kubernetes-skill",
  },
  {
    name: "terrashark",
    slug: "terrashark",
    author: "LukasNiessen",
    githubRepo: "LukasNiessen/terrashark",
    description: "Terraform Skill for Claude Code and Codex. LLMs hallucinate a lot with Terraform - TerraShark fixes this.",
    stars: 305,
    forks: 22,
    language: "",
    category: "devops",
    tags: ["devops", "SKILL.md", "aws", "azure"],
    url: "https://github.com/LukasNiessen/terrashark",
  },
]

// ============================================================
// Public API
// ============================================================

/**
 * Get all top skills from SkillsLLM
 */
export function getTopSkills(): SkillsLLMSkill[] {
  return TOP_SKILLS
}

/**
 * Get skills by category
 */
export function getSkillsByCategory(category: string): SkillsLLMSkill[] {
  return TOP_SKILLS.filter((skill) => skill.category === category)
}

/**
 * Get all categories
 */
export function getCategories(): SkillsLLMCategory[] {
  return CATEGORIES
}

/**
 * Search skills by query
 */
export function searchSkills(query: string): SkillsLLMSkill[] {
  const lower = query.toLowerCase()
  return TOP_SKILLS.filter(
    (skill) =>
      skill.name.toLowerCase().includes(lower) ||
      skill.description.toLowerCase().includes(lower) ||
      skill.tags.some((tag) => tag.toLowerCase().includes(lower))
  )
}

/**
 * Get skill by name
 */
export function getSkillByName(name: string): SkillsLLMSkill | undefined {
  return TOP_SKILLS.find((skill) => skill.name === name)
}

/**
 * Convert SkillsLLM skill to Devil AI skill format
 */
export function toDevilAISkill(skill: SkillsLLMSkill): {
  name: string
  description: string
  source: string
  category: string
  priority: number
} {
  // Priority based on stars
  let priority = 50
  if (skill.stars > 100000) priority = 90
  else if (skill.stars > 50000) priority = 85
  else if (skill.stars > 10000) priority = 80
  else if (skill.stars > 5000) priority = 75
  else if (skill.stars > 1000) priority = 70
  else if (skill.stars > 500) priority = 65

  return {
    name: skill.name,
    description: skill.description,
    source: skill.githubRepo,
    category: skill.category,
    priority,
  }
}

/**
 * Get all skills as Devil AI format
 */
export function getAllDevilAISkills(): ReturnType<typeof toDevilAISkill>[] {
  return TOP_SKILLS.map(toDevilAISkill)
}

/**
 * Get top N skills by stars
 */
export function getTopSkillsByStars(n: number): SkillsLLMSkill[] {
  return [...TOP_SKILLS].sort((a, b) => b.stars - a.stars).slice(0, n)
}

/**
 * Get skills by language
 */
export function getSkillsByLanguage(language: string): SkillsLLMSkill[] {
  return TOP_SKILLS.filter((skill) => skill.language.toLowerCase() === language.toLowerCase())
}

/**
 * Get unique languages
 */
export function getUniqueLanguages(): string[] {
  const languages = new Set(TOP_SKILLS.filter((s) => s.language).map((s) => s.language))
  return Array.from(languages).sort()
}

/**
 * Get skills by star count range
 */
export function getSkillsByStarRange(min: number, max: number): SkillsLLMSkill[] {
  return TOP_SKILLS.filter((skill) => skill.stars >= min && skill.stars <= max)
}

/**
 * Export as JSON
 */
export function exportAsJSON(): string {
  return JSON.stringify(
    {
      categories: CATEGORIES,
      skills: TOP_SKILLS,
      totalSkills: TOP_SKILLS.length,
      exportedAt: new Date().toISOString(),
    },
    null,
    2
  )
}
