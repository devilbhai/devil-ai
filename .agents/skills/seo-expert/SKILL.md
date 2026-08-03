---
name: seo-expert
description: SEO optimization. Keyword research, on-page SEO, technical SEO, content optimization.
---

# SEO Expert

## When to Apply
Use this skill when optimizing websites for search engines, including keyword research, on-page optimization, technical SEO, content strategy, and performance monitoring.

## Core Concepts
- **Keyword Research**: Search volume analysis, keyword difficulty, long-tail keywords, intent matching
- **On-Page SEO**: Title tags, meta descriptions, header hierarchy, internal linking, image optimization
- **Technical SEO**: Site speed, mobile-friendliness, crawlability, indexability, structured data, XML sitemaps
- **Content Optimization**: Content gaps, E-E-A-T signals, semantic relevance, topic clusters
- **Link Building**: Backlink analysis, broken link building, guest posting, digital PR
- **Local SEO**: Google Business Profile, NAP consistency, local citations, reviews management
- **Analytics**: Google Search Console, ranking tracking, organic traffic analysis, conversion tracking

## Implementation
```python
from typing import Dict, List, Optional
from dataclasses import dataclass
import json
import re

@dataclass
class Keyword:
    term: str
    volume: int
    difficulty: float
    cpc: float
    intent: str
    current_rank: Optional[int] = None

class SEOOptimizer:
    def __init__(self, site_url: str):
        self.site_url = site_url

    def analyze_page(self, url: str, html: str) -> Dict:
        analysis = {
            "url": url,
            "title": self._extract_title(html),
            "meta_description": self._extract_meta_description(html),
            "h1_tags": self._extract_h1(html),
            "h2_tags": self._extract_h2(html),
            "word_count": self._count_words(html),
            "images": self._analyze_images(html),
            "internal_links": self._count_internal_links(html, url),
            "external_links": self._count_external_links(html),
            "structured_data": self._extract_structured_data(html),
            "issues": []
        }

        if not analysis["title"]:
            analysis["issues"].append({"severity": "high", "issue": "Missing title tag"})
        elif len(analysis["title"]) > 60:
            analysis["issues"].append({"severity": "medium", "issue": "Title too long"})

        if not analysis["meta_description"]:
            analysis["issues"].append({"severity": "high", "issue": "Missing meta description"})
        elif len(analysis["meta_description"]) > 160:
            analysis["issues"].append({"severity": "medium", "issue": "Meta description too long"})

        if not analysis["h1_tags"]:
            analysis["issues"].append({"severity": "high", "issue": "Missing H1 tag"})

        if analysis["word_count"] < 300:
            analysis["issues"].append({"severity": "medium", "issue": "Thin content"})

        return analysis

    def _extract_title(self, html: str) -> str:
        match = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE | re.DOTALL)
        return match.group(1).strip() if match else ""

    def _extract_meta_description(self, html: str) -> str:
        match = re.search(r'<meta\s+name="description"\s+content="(.*?)"', html, re.IGNORECASE)
        return match.group(1).strip() if match else ""

    def _extract_h1(self, html: str) -> List[str]:
        return re.findall(r'<h1[^>]*>(.*?)</h1>', html, re.IGNORECASE | re.DOTALL)

    def _extract_h2(self, html: str) -> List[str]:
        return re.findall(r'<h2[^>]*>(.*?)</h2>', html, re.IGNORECASE | re.DOTALL)

    def _count_words(self, html: str) -> int:
        text = re.sub(r'<[^>]+>', ' ', html)
        text = re.sub(r'\s+', ' ', text)
        return len(text.split())

    def _analyze_images(self, html: str) -> Dict:
        images = re.findall(r'<img\s+([^>]+)>', html, re.IGNORECASE)
        with_alt = sum(1 for img in images if 'alt=' in img)
        return {"total": len(images), "with_alt": with_alt, "missing_alt": len(images) - with_alt}

    def _count_internal_links(self, html: str, current_url: str) -> int:
        links = re.findall(r'href="(.*?)"', html)
        return sum(1 for link in links if link.startswith('/') or self.site_url in link)

    def _count_external_links(self, html: str) -> int:
        links = re.findall(r'href="(.*?)"', html)
        return sum(1 for link in links if link.startswith('http') and self.site_url not in link)

    def _extract_structured_data(self, html: str) -> List[Dict]:
        ld_json = re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', html, re.DOTALL)
        schemas = []
        for item in ld_json:
            try:
                data = json.loads(item)
                schemas.append({"type": data.get("@type", "Unknown"), "valid": True})
            except json.JSONDecodeError:
                schemas.append({"type": "invalid", "valid": False})
        return schemas

    def optimize_content(self, content: str, target_keyword: str) -> Dict:
        keyword_count = content.lower().count(target_keyword.lower())
        word_count = len(content.split())
        keyword_density = (keyword_count / word_count) * 100 if word_count > 0 else 0

        has_keyword_in_title = target_keyword.lower() in content[:100].lower()

        suggestions = []
        if keyword_density < 1:
            suggestions.append("Increase keyword usage naturally")
        if keyword_density > 3:
            suggestions.append("Reduce keyword stuffing")
        if not has_keyword_in_title:
            suggestions.append("Include keyword in title/intro")

        return {
            "keyword": target_keyword,
            "keyword_count": keyword_count,
            "word_count": word_count,
            "keyword_density": round(keyword_density, 2),
            "in_title": has_keyword_in_title,
            "suggestions": suggestions
        }

    def generate_sitemap(self, pages: List[Dict]) -> str:
        urls = []
        for page in pages:
            url_entry = f"""  <url>
    <loc>{page['url']}</loc>
    <lastmod>{page.get('lastmod', '2026-07-05')}</lastmod>
    <changefreq>{page.get('changefreq', 'weekly')}</changefreq>
    <priority>{page.get('priority', '0.5')}</priority>
  </url>"""
            urls.append(url_entry)

        return f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{chr(10).join(urls)}
</urlset>"""

    def generate_robots_txt(self, disallow: List[str] = None) -> str:
        rules = disallow or ["/admin/", "/api/", "/private/"]
        disallow_lines = '\n'.join([f"Disallow: {rule}" for rule in rules])
        return f"""User-agent: *
{disallow_lines}

Sitemap: {self.site_url}/sitemap.xml"""
```

## Best Practices
- Research keywords using tools like Ahrefs, SEMrush, or Google Keyword Planner
- Target long-tail keywords with lower competition and higher intent
- Optimize title tags (under 60 chars) and meta descriptions (under 160 chars)
- Use semantic HTML with proper heading hierarchy (H1 > H2 > H3)
- Implement structured data (JSON-LD) for rich snippets
- Ensure mobile-first responsive design
- Optimize Core Web Vitals (LCP, FID, CLS)
- Create topic clusters with pillar pages and supporting content
