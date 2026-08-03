# Agent Reach - Internet Access Skill

## Overview
Agent Reach gives AI agents internet access to read & search Twitter, Reddit, YouTube, GitHub, Bilibili, XiaoHongShu and more - one CLI, zero API fees.

## When to Use
- User asks to search the web, read social media, or fetch online content
- User wants to check YouTube videos, Reddit posts, Twitter/X posts
- User needs to scrape or read any website
- User wants RSS feed monitoring
- User asks about trending topics on social media

## Installation Check
Before using, verify Agent Reach is installed:
```bash
which agent-reach || echo "NOT_INSTALLED"
```

If not installed, run:
```bash
python3 -m venv ~/.agent-reach-venv
source ~/.agent-reach-venv/bin/activate
pip install https://github.com/Panniantong/agent-reach/archive/main.zip
agent-reach install --env=auto
```

## Available Commands

### Health Check
```bash
agent-reach doctor
```

### Read Any Web Page
```bash
curl -s "https://r.jina.ai/URL"
```

### YouTube
```bash
# Get video info and subtitles
yt-dlp --dump-json "URL"
yt-dlp --write-sub --sub-lang en "URL"
```

### Twitter/X
```bash
# Search tweets (requires cookies)
twitter search "query" -n 10

# Read a tweet
twitter status TWEET_ID
```

### Reddit
```bash
# Search (requires login via OpenCLI)
opencli reddit search "query" -f yaml

# Read a post
opencli reddit read POST_ID
```

### GitHub
```bash
# View repo
gh repo view owner/repo

# Search repos
gh search repos "query"
```

### Bilibili
```bash
# Search videos
bili search "query" --type video

# Get video details
bili info VIDEO_ID
```

### RSS Feeds
```python
import feedparser
feed = feedparser.parse("RSS_URL")
for entry in feed.entries:
    print(entry.title, entry.link)
```

### Web Search (Exa)
```bash
mcporter call 'exa.web_search_exa(query="search terms", num_results=5)'
```

## Platform Status

| Platform | Status | Backend |
|----------|--------|---------|
| Web | ✅ Zero-config | Jina Reader |
| YouTube | ✅ Zero-config | yt-dlp |
| GitHub | ✅ Zero-config | gh CLI |
| RSS | ✅ Zero-config | feedparser |
| Twitter/X | ⚠️ Needs cookies | twitter-cli |
| Reddit | ⚠️ Needs login | OpenCLI |
| Bilibili | ✅ Zero-config | bili-cli |
| XiaoHongShu | ⚠️ Needs cookies | OpenCLI |

## Cookie Configuration

For platforms requiring login:
```bash
# Twitter cookies
agent-reach configure twitter-cookies "PASTED_STRING"

# XHS cookies
agent-reach configure xhs-cookies "key1=val1; key2=val2"
```

## Troubleshooting

Run diagnostics:
```bash
agent-reach doctor
```

This shows which channels are working and which need configuration.

## Example Usage Prompts

- "Search Twitter for latest AI news"
- "Read this YouTube video summary: [URL]"
- "What's trending on Reddit right now?"
- "Check GitHub issues for this repo"
- "Search the web for best React practices"
- "Read this article: [URL]"
- "Monitor this RSS feed for updates"
