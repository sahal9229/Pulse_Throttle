import sys
from rich.console import Console
from rich.markdown import Markdown
from rich.panel import Panel
from agent import run_silicon_pulse, format_markdown_output
from engine_db import (
    init_db,
    log_report_to_db,
    load_report_from_db,
    render_telemetry_history,
)

console = Console()


def process_query(query: str, force_refresh: bool = False) -> None:
    try:
        report_data = None if force_refresh else load_report_from_db(query)

        if report_data is None:
            report_data = run_silicon_pulse(query)
            if report_data.mode != "INVALID_QUERY":
                log_report_to_db(report_data)

        markdown_report = format_markdown_output(report_data)

        console.print("\n")
        console.print(Markdown(markdown_report))

        with open("latest_report.md", "w", encoding="utf-8") as f:
            f.write(markdown_report)

        with open("latest_report.json", "w", encoding="utf-8") as f:
            f.write(report_data.model_dump_json(indent=2))

        console.print(
            "\n[dim]📄 Exported to 'latest_report.md', 'latest_report.json' & synced with 'pulsethrottle.db'[/dim]"
        )

    except KeyboardInterrupt:
        console.print("\n[yellow]⚠️ Search cancelled by user.[/yellow]")
    except Exception as e:
        console.print(f"\n[bold red]❌ Execution Error:[/bold red] {str(e)}")


def handle_db_command(cmd: str) -> bool:
    parts = cmd.strip().split()
    if not parts or parts[0].lower() != "/db":
        return False

    if len(parts) == 1:
        render_telemetry_history(limit=10)
        return True

    sub = parts[1].lower()
    if sub == "chip" and len(parts) >= 3:
        chip_query = " ".join(parts[2:])
        render_telemetry_history(chip_filter=chip_query, limit=15)
        return True

    if sub == "cool" and len(parts) >= 3:
        try:
            max_t = float(parts[2])
            chip_q = " ".join(parts[3:]) if len(parts) >= 4 else None
            render_telemetry_history(chip_filter=chip_q, max_temp=max_t, limit=15)
        except ValueError:
            console.print("[red]Usage: /db cool <max_temp_celsius> [optional_chipset][/red]")
        return True

    if sub == "top":
        try:
            min_idx = float(parts[2]) if len(parts) >= 3 else 0.0
            render_telemetry_history(min_index=min_idx, sort_by_index=True, limit=15)
        except ValueError:
            console.print("[red]Usage: /db top [optional_min_index][/red]")
        return True

    console.print(
        "[yellow]DB Commands:[/yellow] `/db` | `/db top [min_score]` | `/db chip <name>` | `/db cool <temp> [chip]`"
    )
    return True


def main() -> None:
    init_db()
    console.print(
        Panel.fit(
            "[bold cyan]⚡ PulseThrottle — Mobile Hardware & Gaming Telemetry Engine[/bold cyan]\n"
            "[dim]Commands: Type any phone/comparison query | '/db' | '/db top' | 'exit'[/dim]",
            border_style="cyan",
        )
    )

    if len(sys.argv) > 1:
        raw_arg = " ".join(sys.argv[1:])
        force_refresh = "--refresh" in raw_arg
        clean_q = raw_arg.replace("--refresh", "").strip()
        if not handle_db_command(clean_q):
            process_query(clean_q, force_refresh=force_refresh)
        return

    while True:
        try:
            user_input = console.input(
                "\n[bold cyan]PulseThrottle >[/bold cyan] Enter query, '/db', or 'exit': "
            ).strip()
            if not user_input:
                continue
            if user_input.lower() in ("exit", "quit", "q"):
                console.print("[bold green]Exiting PulseThrottle. Goodbye![/bold green]")
                break

            force_refresh = "--refresh" in user_input
            clean_query = user_input.replace("--refresh", "").strip()

            if handle_db_command(clean_query):
                continue

            process_query(clean_query, force_refresh=force_refresh)

        except (KeyboardInterrupt, EOFError):
            console.print("\n[bold green]Exiting PulseThrottle. Goodbye![/bold green]")
            break


if __name__ == "__main__":
    main()