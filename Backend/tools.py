import os
import re
import warnings
from concurrent.futures import ThreadPoolExecutor
from typing import Optional, Tuple
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from rich.console import Console

warnings.filterwarnings("ignore", category=RuntimeWarning)

try:
    from ddgs import DDGS
except ImportError:
    try:
        from duckduckgo_search import DDGS
    except ImportError:
        DDGS = None

load_dotenv()
console = Console()

# ── Supabase connection for canonical name resolution ────────────────────────
_SUPABASE_PROJECT_ID = os.getenv("SUPABASE_PROJECT_ID", "dkwkzoztkyklztqzmhis")
_SUPABASE_DB_PASSWORD = os.getenv("SUPABASE_DB_PASSWORD", "")
_SUPABASE_HOST = os.getenv("SUPABASE_HOST", "aws-0-ap-southeast-1.pooler.supabase.com")
_SUPABASE_PORT = int(os.getenv("SUPABASE_PORT", "6543"))


HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}


def _fetch_clean_page_text(url: str, timeout: float = 4.5) -> str:
    """Downloads a webpage and strips HTML tags/scripts to extract clean spec & benchmark text."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=timeout)
        if resp.status_code != 200:
            return ""
        soup = BeautifulSoup(resp.text, "html.parser")
        for tag in soup(["script", "style", "nav", "footer", "header", "noscript", "svg"]):
            tag.decompose()
        text = soup.get_text(separator=" ", strip=True)
        return re.sub(r"\s+", " ", text)[:3000]
    except Exception:
        return ""


def _search_duckduckgo_keyless(query: str, max_results: int = 4) -> str:
    """Executes keyless search via DDGS and enriches snippets with BeautifulSoup page text."""
    if DDGS is None:
        return ""

    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            with DDGS() as ddgs:
                ddg_results = list(ddgs.text(query, max_results=max_results))
    except Exception:
        return ""

    if not ddg_results:
        return ""

    urls_to_scrape = [r.get("href", "") for r in ddg_results[:3] if r.get("href")]
    scraped_map = {}
    if urls_to_scrape:
        with ThreadPoolExecutor(max_workers=3) as ex:
            future_map = {ex.submit(_fetch_clean_page_text, u): u for u in urls_to_scrape}
            for fut, u in future_map.items():
                scraped_map[u] = fut.result()

    formatted_chunks = []
    for r in ddg_results:
        url = r.get("href", "")
        title = r.get("title", "")
        snippet = r.get("body", "")
        deep_text = scraped_map.get(url, "")
        combined_content = f"{snippet}\n{deep_text}".strip()[:2200]
        formatted_chunks.append(f"Source: {url}\nTitle: {title}\nContent: {combined_content}")

    return "\n\n---\n\n".join(formatted_chunks)


def _search_tavily_fallback(query: str, max_results: int = 4) -> str:
    """Optional fallback if TAVILY_API_KEY is present in .env."""
    tavily_key = os.environ.get("TAVILY_API_KEY")
    if not tavily_key:
        return ""
    try:
        from tavily import TavilyClient
        client = TavilyClient(api_key=tavily_key)
        response = client.search(query=query, search_depth="advanced", max_results=max_results)
        results = [
            f"Source: {r.get('url')}\nTitle: {r.get('title')}\nContent: {str(r.get('content', ''))[:1800]}"
            for r in response.get("results", [])
        ]
        return "\n\n---\n\n".join(results)
    except Exception:
        return ""


def resolve_canonical_name(raw_name: str) -> Optional[str]:
    """
    Looks up `raw_name` against the Supabase `devices_catalog` and returns the
    verified canonical phone name (e.g. "iphone 7" → "iPhone 7").
    Falls back to None if Supabase is unavailable or the name is not found.
    """
    if not _SUPABASE_DB_PASSWORD:
        return None
    try:
        import psycopg2
        conn = psycopg2.connect(
            host=_SUPABASE_HOST,
            port=_SUPABASE_PORT,
            user=f"postgres.{_SUPABASE_PROJECT_ID}",
            password=_SUPABASE_DB_PASSWORD,
            database="postgres",
            connect_timeout=3,
        )
        with conn.cursor() as cur:
            like_q = f"%{raw_name}%"
            cur.execute(
                """
                SELECT canonical_name FROM devices_catalog
                WHERE canonical_name ILIKE %s OR brand ILIKE %s OR series ILIKE %s
                ORDER BY
                    CASE
                        WHEN LOWER(canonical_name) = LOWER(%s) THEN 1
                        WHEN LOWER(canonical_name) LIKE LOWER(%s) THEN 2
                        ELSE 3
                    END,
                    release_year DESC
                LIMIT 1;
                """,
                (like_q, like_q, like_q, raw_name, f"{raw_name}%"),
            )
            row = cur.fetchone()
        conn.close()
        if row:
            return row[0]
    except Exception:
        pass
    return None


def build_exact_key_queries(
    canonical_name: str, game_search_str: str = "BGMI gaming"
) -> Tuple[str, str]:
    """
    Builds two precision search query strings that wrap `canonical_name` in
    double quotes to force search engines to match the exact device name,
    dramatically reducing false positives from similar-named phones.

    Returns:
        (benchmark_query, gaming_query)
    """
    quoted = f'"{canonical_name}"'
    benchmark_q = f"{quoted} AnTuTu Geekbench 3DMark Wild Life UFS specs"
    gaming_q    = f"{quoted} {game_search_str} FPS 3DMark Wild Life Extreme stability temp"
    return benchmark_q, gaming_q


def search_hardware_telemetry(query: str) -> str:
    """
    Hybrid web scraper: runs keyless DDGS + BeautifulSoup first, and merges/falls back
    to Tavily if keyless results lack benchmark depth.
    """
    console.print(f"  [cyan]↳ Scraping telemetry (Keyless):[/cyan] [bold]{query}[/bold]")
    ddg_data = _search_duckduckgo_keyless(query, max_results=4)

    # If DDGS gets blocked or misses benchmark numbers, supplement with Tavily if key is available
    if len(ddg_data) < 400 or ("antutu" in query.lower() and "antutu" not in ddg_data.lower()):
        tavily_data = _search_tavily_fallback(query, max_results=3)
        if tavily_data:
            return f"{ddg_data}\n\n---\n\n{tavily_data}".strip()

    return ddg_data if ddg_data else "No relevant benchmark data found."