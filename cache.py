import json
import hashlib
from pathlib import Path
from rich.console import Console
from schemas import SiliconPulseReport

console = Console()
CACHE_FILE = Path("telemetry_cache.json")


def get_query_hash(query: str) -> str:
    """Normalizes the query string and creates a unique hash key for caching."""
    normalized = " ".join(query.lower().split())
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()[:16]


def load_from_cache(query: str) -> SiliconPulseReport | None:
    """Checks if this exact query was already researched and saved locally."""
    if not CACHE_FILE.exists():
        return None
    try:
        cache_data = json.loads(CACHE_FILE.read_text(encoding="utf-8"))
        q_hash = get_query_hash(query)
        if q_hash in cache_data:
            console.print(
                "[bold cyan]⚡ Cache Hit! Loaded verified telemetry from local storage (0 API tokens used).[/bold cyan]"
            )
            return SiliconPulseReport.model_validate(cache_data[q_hash])
    except Exception:
        return None
    return None


def save_to_cache(query: str, report: SiliconPulseReport) -> None:
    """Saves the validated Pydantic report into local cache."""
    cache_data = {}
    if CACHE_FILE.exists():
        try:
            cache_data = json.loads(CACHE_FILE.read_text(encoding="utf-8"))
        except Exception:
            cache_data = {}

    q_hash = get_query_hash(query)
    cache_data[q_hash] = report.model_dump()
    CACHE_FILE.write_text(json.dumps(cache_data, indent=2), encoding="utf-8")