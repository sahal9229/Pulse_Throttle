import os
from dotenv import load_dotenv
from tavily import TavilyClient
from rich.console import Console

load_dotenv()
console = Console()

tavily_api_key = os.environ.get("TAVILY_API_KEY")
if not tavily_api_key:
    raise ValueError("Missing TAVILY_API_KEY in .env file!")

tavily_client = TavilyClient(api_key=tavily_api_key)


def search_hardware_telemetry(query: str) -> str:
    """
    Fast web search for smartphone benchmarks, SoC specs, 3DMark stability,
    peak temperatures, and PWM dimming Hz.
    """
    console.print(f"  [cyan]↳ Searching web:[/cyan] [bold]{query}[/bold]")
    try:
        response = tavily_client.search(
            query=query,
            search_depth="advanced",  # Needed to pull full benchmark tables from NanoReview/GSMArena
            max_results=4,
        )
        results = [
            f"Source: {r.get('url')}\nTitle: {r.get('title')}\nContent: {str(r.get('content', ''))[:1500]}"
            for r in response.get("results", [])
        ]
        return "\n\n---\n\n".join(results) if results else "No relevant benchmark data found."
    except Exception as e:
        return f"Search error: {str(e)}"