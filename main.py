import sys
from rich.console import Console
from rich.markdown import Markdown
from rich.panel import Panel
from agent import run_silicon_pulse, format_markdown_output
from cache import load_from_cache, save_to_cache

console = Console()


def process_query(query: str, force_refresh: bool = False) -> None:
    """Executes the query (via cache or live agent) and exports Markdown + JSON."""
    try:
        report_data = None if force_refresh else load_from_cache(query)

        if report_data is None:
            report_data = run_silicon_pulse(query)
            if report_data.mode != "INVALID_QUERY":
                save_to_cache(query, report_data)

        markdown_report = format_markdown_output(report_data)

        console.print("\n")
        console.print(Markdown(markdown_report))

        # 1. Save human-readable Markdown report
        with open("latest_report.md", "w", encoding="utf-8") as f:
            f.write(markdown_report)

        # 2. Save machine-readable structured JSON report
        with open("latest_report.json", "w", encoding="utf-8") as f:
            f.write(report_data.model_dump_json(indent=2))

        console.print(
            "\n[dim]📄 Exported to 'latest_report.md' and 'latest_report.json'[/dim]"
        )

    except KeyboardInterrupt:
        console.print("\n[yellow]⚠️ Search cancelled by user.[/yellow]")
    except Exception as e:
        console.print(f"\n[bold red]❌ Execution Error:[/bold red] {str(e)}")


def main():
    console.print(Panel.fit(
        "[bold cyan]⚡ PulseThrottle Telemetry Agent[/bold cyan]\n"
        "[dim]Autonomous Mobile Hardware & Gaming Performance Research Engine[/dim]\n"
        "[dim]Commands: Type 'exit' to quit | Add '--refresh' to bypass local cache[/dim]"
    ))

    # Mode 1: Command-line arguments passed directly
    if len(sys.argv) > 1:
        raw_args = sys.argv[1:]
        force_refresh = "--refresh" in raw_args
        clean_args = [arg for arg in raw_args if arg != "--refresh"]
        query = " ".join(clean_args).strip()

        if query:
            process_query(query, force_refresh=force_refresh)
        else:
            console.print("[red]Error: Query cannot be empty.[/red]")
        return

    # Mode 2: Interactive continuous session (REPL Loop)
    while True:
        try:
            user_input = console.input(
                "\n[bold green]PulseThrottle > Enter phone or comparison query (or 'exit'):[/bold green] "
            ).strip()

            if not user_input:
                continue

            if user_input.lower() in ["exit", "quit", "q"]:
                console.print("[cyan]Shutting down PulseThrottle. Goodbye![/cyan]")
                break

            force_refresh = "--refresh" in user_input
            query = user_input.replace("--refresh", "").strip()

            process_query(query, force_refresh=force_refresh)

        except KeyboardInterrupt:
            console.print("\n[cyan]Shutting down PulseThrottle. Goodbye![/cyan]")
            break


if __name__ == "__main__":
    main()