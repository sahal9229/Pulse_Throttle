import os
import re
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlparse
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from rich.console import Console

try:
    from duckduckgo_search import DDGS
except ImportError:
    DDGS = None

load_dotenv()
console = Console()

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}


def _fetch_clean_page_text(url: str, timeout: float = 4.0) -> str:
    """Downloads a webpage and strips HTML tags/scripts to extract clean spec & benchmark text."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=timeout)
        if resp.status_code != 200:
            return ""
        soup = BeautifulSoup(resp.text, "html.parser")
        for tag in soup(["script", "style", "nav", "footer", "header", "noscript", "svg"]):
            tag.decompose()
        text = soup.get_text(separator=" ", strip=True)
        text = re.sub(r"\s+", " ", text)
        return text[:2500]
    except Exception:
        return ""


def _search_duckduckgo_keyless(query: str, max_results: int = 4) -> str:
    """Executes keyless search via DuckDuckGo and enriches snippets with BeautifulSoup page text."""
    if DDGS is None:
        return ""

    try:
        with DDGS() as ddgs:
            ddg_results = list(ddgs.text(query, max_results=max_results))
    except Exception:
        return ""

    if not ddg_results:
        return ""

    # Fetch full text from top 2 benchmark/spec URLs concurrently for deeper regex extraction
    urls_to_scrape = [r.get("href", "") for r in ddg_results[:2] if r.get("href")]
    scraped_Wait = {}
    if urls_to_scrape:
        with ThreadPoolExecutor(max_workers=2) as ex:
            future_map = {ex.submit(_fetch_clean_page_text, u): u for u in urls_to_scrape}
            for fut, u in future_map.items():
                scraped_Wait[u] = fut.result()

    formatted_chunks = []
    for r in ddg_results:
        url = r.get("href", "")
        title = r.get("title", "")
        snippet = r.get("body", "")
        deep_text = scraped_Wait.get(url, "")
        combined_content = f"{snippet}\n{deep_text}".strip()[:1800]
        formatted_chunks.append(f"Source: {url}\nTitle: {title}\nContent: {combined_content}")

    return "\n\n---\n\n".join(formatted_chunks)


def _search_tavily_fallback(query: str, max_results: int = 4) -> str:
    """Optional fallback if TAVILY_API_KEY is present in .env and DuckDuckGo is rate-limited."""
    tavily_key = os.environ.get("TAVILY_API_KEY")
    if not tavily_key:
        return ""
    try:
        from tavily import TavilyClient
        client = TavilyClient(api_key=tavily_key)
        response = client.search(query=query, search_depth="advanced", max_results=max_results)
        results = [
            f"Source: {r.get('url')}\nTitle: {r.get('title')}\nContent: {str(r.get('content', ''))[:1500]}"
            for r in response.get("results", [])
        ]
        return "\n\n---\n\n".join(results)
    except Exception:
        return ""


def search_hardware_telemetry(query: str) -> str:
    """
    Primary keyless web scraper using DuckDuckGo + BeautifulSoup4.
    Automatically falls back to Tavily only if DuckDuckGo returns empty and TAVILY_API_KEY exists.
    """
    console.print(f"  [cyan]↳ Scraping telemetry (Keyless):[/cyan] [bold]{query}[/bold]")
    ddg_data = _search_duckduckgo_keyless(query, max_results=4)
    if ddg_data:
        return ddg_data

    tavily_data = _search_tavily_fallback(query, max_results=4)
    if tavily_data:
        return tavily_data

    return "No relevant benchmark data found."