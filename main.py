import sys
from rich.console import Console
from rich.markdown import Markdown
from rich.panel import Panel
from agent import run_silicon_pulse, format_markdown_output
from cache import load_from_cache, save_to_cache
from engine_db import init_db, log_report_to_db, render_telemetry_history

console = Console()


def handle_db_command(cmd: str) -> bool:
    """
    Parses CLI database analytics commands starting with '/db'.
    Examples:
      /db                      -> Last 10 telemetry runs
      /db chip dimensity       -> Filter by chipset keyword
      /db cool 42.5            -> Filter by peak temp <= 42.5°C
      /db cool 42.5 dimensity  -> Combined filter: <= 42.5°C AND chipset matches 'dimensity'
    """
    parts = cmd.strip().split()
    if not parts or parts[0].lower() != "/db":
        return False

    if len(parts) == 1:
        render_telemetry_history(limit=10)
        return True

    sub = parts[1].lower()
    if sub == "chip" and len(parts) >= 3:
        chip_kw = " ".join(parts[2:])
        render_telemetry_history(chip_filter=chip_kw, limit=15)
        return True

    if sub == "cool" and len(parts) >= 3:
        try:
            max_t = float(parts[2])
            chip_kw = " ".join(parts[3:]) if len(parts) > 3 else None
            render_telemetry_history(chip_filter=chip_kw, max_temp=max_t, limit=15)
        except ValueError:
            console.print("[red]Usage: /db cool <max_temp_celsius> [optional_chipset_keyword][/red]")
        return True

    if sub == "top":
        min_idx = float(parts[2]) if len(parts) >= 3 else 0.0
        render_telemetry_history(min_index=min_idx, sort_by_index=True, limit=15)
        return True

    console.print(
        "[yellow]Available DB Commands:[/yellow]\n"
        "  • [bold]/db[/bold]                          (Show last 10 tested devices)\n"
        "  • [bold]/db chip <name>[/bold]              (e.g., /db chip dimensity)\n"
        "  • [bold]/db cool <temp> [chip][/bold]       (e.g., /db cool 42.5 dimensity)\n"
        "  • [bold]/db top [min_score][/bold]          (e.g., /db top 75)"
    )
    return True


def process_query(query: str, force_refresh: bool = False) -> None:
    """Executes the query (via cache or live agent), logs to SQLite, and exports Markdown + JSON."""
    try:
        report_data = None if force_refresh else load_from_cache(query)

        if report_data is None:
            report_data = run_silicon_pulse(query)
            if report_data.mode != "INVALID_QUERY":
                save_to_cache(query, report_data)

        # Log valid telemetry runs into normalized SQLite tables
        if report_data.mode != "INVALID_QUERY":
            log_report_to_db(report_data)

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
            "\n[dim]📄 Exported to 'latest_report.md', 'latest_report.json' & logged to 'pulsethrottle.db'[/dim]"
        )

    except KeyboardInterrupt:
        console.print("\n[yellow]⚠️ Search cancelled by user.[/yellow]")
    except Exception as e:
        console.print(f"\n[bold red]❌ Execution Error:[/bold red] {str(e)}")


def main():
    init_db()
    console.print(Panel.fit(
        "[bold cyan]⚡ PulseThrottle Telemetry Agent[/bold cyan]\n"
        "[dim]Autonomous Mobile Hardware & Gaming Performance Research Engine[/dim]\n"
        "[dim]Commands: 'exit' | '--refresh' | '/db' | '/db chip <soc>' | '/db cool <temp> [soc]'[/dim]"
    ))

    # Mode 1: Command-line arguments passed directly
    if len(sys.argv) > 1:
        raw_args = sys.argv[1:]
        if raw_args[0].lower() == "/db":
            handle_db_command(" ".join(raw_args))
            return

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
                "\n[bold green]PulseThrottle > Enter query, '/db', or 'exit':[/bold green] "
            ).strip()

            if not user_input:
                continue

            if user_input.lower() in ["exit", "quit", "q"]:
                console.print("[cyan]Shutting down PulseThrottle. Goodbye![/cyan]")
                break

            if user_input.lower().startswith("/db"):
                handle_db_command(user_input)
                continue

            force_refresh = "--refresh" in user_input
            query = user_input.replace("--refresh", "").strip()

            if not query:
                console.print("[yellow]Please specify a phone model alongside '--refresh'.[/yellow]")
                continue

            process_query(query, force_refresh=force_refresh)

        except KeyboardInterrupt:
            console.print("\n[cyan]Shutting down PulseThrottle. Goodbye![/cyan]")
            break


if __name__ == "__main__":
    main()