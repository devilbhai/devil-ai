---
name: python-automation
description: Python automation and scripting. Covers file operations, web scraping, API calls, data processing, scheduled tasks, Selenium, requests, BeautifulSoup, pandas.
---

# Python Automation

## When to Apply
Use this skill when working with Python automation and scripting projects. Apply when:
- Building or maintaining automation scripts
- Performing web scraping with BeautifulSoup, Scrapy, or Selenium
- Making API calls with requests, httpx, or aiohttp
- Processing data with pandas, openpyxl, or csv modules
- Scheduling tasks with cron, APScheduler, or Celery
- Automating file system operations
- Building CLI tools with argparse, click, or typer
- Working with Excel, CSV, JSON, or XML data files
- Implementing error handling and retry logic in scripts
- Writing scripts for DevOps, CI/CD, or system administration

## Core Patterns

### File Operations
- Use `pathlib.Path` over `os.path` for modern path handling
- Use `with` statements for all file I/O to ensure proper cleanup
- Use `shutil` for high-level file operations (copy, move, archive)
- Handle `FileNotFoundError` and `PermissionError` explicitly
- Use `glob.glob()` or `Path.glob()` for pattern-based file discovery
- Use `tempfile` module for temporary files — never hardcode `/tmp` paths
- Prefer `encoding='utf-8'` in `open()` to avoid platform-dependent encoding issues

### Web Scraping
- Always check `robots.txt` before scraping
- Use `requests.Session()` for connection pooling and cookie persistence
- Use `BeautifulSoup` for HTML parsing with `lxml` parser for speed
- Respect rate limits: add `time.sleep()` between requests
- Set proper `User-Agent` headers to identify your scraper
- Use `try/except` with retries for network resilience
- Use Selenium only when JavaScript rendering is required
- Consider `httpx.AsyncClient` for concurrent scraping
- Use `response.raise_for_status()` to catch HTTP errors early

### API Calls
- Use `requests` for synchronous, `httpx` or `aiohttp` for async
- Use `response.raise_for_status()` after every request
- Implement exponential backoff with `tenacity` or manual retry logic
- Use `response.json()` for JSON parsing, handle `JSONDecodeError`
- Set timeouts on all requests: `requests.get(url, timeout=10)`
- Use environment variables for API keys — never hardcode secrets
- Use `requests.Session()` for multiple requests to the same API
- Validate response data with Pydantic models for type safety

### Data Processing with Pandas
- Use `pd.read_csv()`, `pd.read_excel()`, `pd.read_json()` for data ingestion
- Chain operations methodically: `df.groupby().agg().reset_index()`
- Use `df.pipe()` for reusable transformation pipelines
- Handle missing values explicitly: `dropna()`, `fillna()`, `interpolate()`
- Use `apply()` sparingly — prefer vectorized operations for performance
- Write results with `to_csv(index=False)` or `to_excel()` for clean output
- Use `df.copy()` when modifying data to avoid SettingWithCopyWarning
- Use `pd.merge()` over `join()` for explicit join semantics

### Scheduled Tasks
- Use `schedule` library for simple in-process scheduling
- Use `APScheduler` for more complex job scheduling
- Use system cron for persistent, always-on scheduling
- Use `Celery` with Redis/RabbitMQ for distributed task queues
- Implement idempotent tasks — safely re-run without side effects
- Log task execution with timestamps for debugging
- Handle task failures with retry logic and dead-letter queues

### CLI Tools
- Use `typer` or `click` for structured CLI applications
- Use `argparse` for stdlib-only solutions
- Add `--verbose` / `--quiet` flags for log control
- Use `colorama` or `rich` for colored terminal output
- Validate CLI arguments early with clear error messages
- Use `subprocess.run()` with `check=True` for shell commands
- Use `sys.exit()` with meaningful exit codes

## Code Examples

### Web Scraper with Retry Logic
```python
import requests
from bs4 import BeautifulSoup
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def fetch_page(url: str) -> BeautifulSoup:
    headers = {
        'User-Agent': 'Mozilla/5.0 (compatible; MyBot/1.0)',
    }
    response = requests.get(url, headers=headers, timeout=15)
    response.raise_for_status()
    return BeautifulSoup(response.text, 'lxml')

def scrape_product_links(landing_url: str) -> list[dict]:
    soup = fetch_page(landing_url)
    products = []

    for card in soup.select('.product-card'):
        title = card.select_one('.title').text.strip()
        price = card.select_one('.price').text.strip()
        link = card.select_one('a')['href']
        products.append({'title': title, 'price': price, 'link': link})

    return products
```

### Pandas Data Pipeline
```python
import pandas as pd
from pathlib import Path

def process_sales_data(input_path: Path, output_path: Path) -> pd.DataFrame:
    df = pd.read_csv(input_path, encoding='utf-8')

    # Clean
    df = df.dropna(subset=['amount', 'date'])
    df['date'] = pd.to_datetime(df['date'])
    df['amount'] = pd.to_numeric(df['amount'], errors='coerce')

    # Transform
    summary = (
        df.groupby([df['date'].dt.to_period('M'), 'region'])
        .agg(
            total_sales=('amount', 'sum'),
            avg_sale=('amount', 'mean'),
            transaction_count=('amount', 'count'),
        )
        .reset_index()
    )

    summary['date'] = summary['date'].astype(str)

    # Output
    output_path.parent.mkdir(parents=True, exist_ok=True)
    summary.to_csv(output_path, index=False)

    return summary
```

### Async API Client
```python
import asyncio
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

class APIClient:
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url
        self.headers = {'Authorization': f'Bearer {api_key}'}

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=30))
    async def get(self, path: str, params: dict | None = None) -> dict:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.get(
                f'{self.base_url}{path}',
                headers=self.headers,
                params=params,
            )
            response.raise_for_status()
            return response.json()

    async def fetch_all(self, paths: list[str]) -> list[dict]:
        tasks = [self.get(path) for path in paths]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        return [r for r in results if not isinstance(r, Exception)]

async def main():
    client = APIClient('https://api.example.com', 'key-123')
    data = await client.fetch_all(['/users', '/posts', '/comments'])
    print(f'Fetched {len(data)} responses')

if __name__ == '__main__':
    asyncio.run(main())
```

### File Organization Script
```python
import shutil
from pathlib import Path

FILE_TYPES = {
    'Images': {'.jpg', '.jpeg', '.png', '.gif', '.webp'},
    'Documents': {'.pdf', '.docx', '.txt', '.xlsx'},
    'Code': {'.py', '.js', '.ts', '.go', '.rs'},
    'Archives': {'.zip', '.tar', '.gz', '.7z'},
}

def organize_directory(source: Path, destination: Path) -> dict[str, int]:
    counts = {}

    for file in source.iterdir():
        if file.is_dir():
            continue

        category = 'Other'
        for cat, extensions in FILE_TYPES.items():
            if file.suffix.lower() in extensions:
                category = cat
                break

        target_dir = destination / category
        target_dir.mkdir(parents=True, exist_ok=True)

        target = target_dir / file.name
        if target.exists():
            target = target.with_stem(f'{file.stem}_{id(file)}')

        shutil.move(str(file), str(target))
        counts[category] = counts.get(category, 0) + 1

    return counts
```

## Best Practices
- Always use `pathlib.Path` for file paths — never string concatenation
- Use `with` statements for all file I/O and network connections
- Set timeouts on all HTTP requests — never rely on defaults
- Use environment variables for secrets and API keys
- Add retry logic with exponential backoff for network operations
- Handle exceptions explicitly — don't let scripts fail silently
- Use logging instead of `print()` for production scripts
- Validate input data before processing — check for missing values and types
- Write output to a fixed directory — avoid scattering files
- Use virtual environments for dependency isolation
- Add `--dry-run` flags to destructive scripts for safety
- Document script purpose and usage in docstrings or `--help`
- Test scripts with sample data before running on production
