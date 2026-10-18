import os
from dotenv import load_dotenv
from tavily import TavilyClient
from rich.console import Console

# Load API keys from .env
load_dotenv()
console = Console()

# Initialize Tavily client
tavily_api_key = os.environ.get("TAVILY_API_KEY")
if not tavily_api_key:
    raise ValueError("Missing TAVILY_API_KEY in .env file!")

tavily_client = TavilyClient(api_key=tavily_api_key)

def search_hardware_telemetry(query: str) -> str:
    """
    Searches the web for real-world smartphone benchmarks, BGMI/Genshin FPS tests,
    3DMark Wild Life Extreme stability, peak temperatures, and PWM dimming Hz.
    
    Args:
        query: Specific technical hardware query to search for.
    """
    console.print(f"  [cyan]↳ Searching web:[/cyan] [bold]{query}[/bold]")
    try:
        response = tavily_client.search(
            query=query,
            search_depth="advanced",
            max_results=4,
        )
        results = [
            f"Source: {r.get('url')}\nTitle: {r.get('title')}\nContent: {r.get('content')}"
            for r in response.get("results", [])
        ]
        return "\n\n---\n\n".join(results) if results else "No relevant benchmark data found."
    except Exception as e:
        return f"Search error: {str(e)}"


# Quick standalone test to verify your Tavily key works
if __name__ == "__main__":
    console.print("[bold yellow]Testing live hardware search tool...[/bold yellow]")
    sample_output = search_hardware_telemetry("Motorola Edge 60 Pro specs processor gaming")
    console.print("\n[bold green]Search Success! Sample scraped data:[/bold green]")
    console.print(sample_output[:800] + "\n...[truncated]...")