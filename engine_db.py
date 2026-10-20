import sqlite3
import json
from pathlib import Path
from typing import Optional
from rich.console import Console
from rich.table import Table
from schemas import SiliconPulseReport, DeviceTelemetry

console = Console()
DB_PATH = Path("pulsethrottle.db")


def get_connection() -> sqlite3.Connection:
    """Creates a thread-safe SQLite connection with dictionary-style row access."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db() -> None:
    """Initializes normalized relational tables and indexes for fast querying."""
    with get_connection() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS devices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_name TEXT UNIQUE NOT NULL,
                soc_chipset TEXT NOT NULL,
                gpu_and_storage TEXT NOT NULL,
                pwm_dimming_hz TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS telemetry_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id INTEGER NOT NULL,
                target_workload TEXT NOT NULL,
                wildlife_stability_pct REAL,
                peak_temp_celsius REAL,
                game_benchmarks_json TEXT NOT NULL,
                sources_json TEXT NOT NULL,
                recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_devices_soc ON devices(soc_chipset);
            CREATE INDEX IF NOT EXISTS idx_runs_temp ON telemetry_runs(peak_temp_celsius);
            CREATE INDEX IF NOT EXISTS idx_runs_stability ON telemetry_runs(wildlife_stability_pct);
            """
        )


def _store_single_device(
    conn: sqlite3.Connection, device: DeviceTelemetry, workload: str
) -> None:
    """Upserts the device profile and appends a new time-series telemetry run."""
    cursor = conn.cursor()

    # 1. Upsert into parent `devices` table
    cursor.execute(
        """
        INSERT INTO devices (device_name, soc_chipset, gpu_and_storage, pwm_dimming_hz, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(device_name) DO UPDATE SET
            soc_chipset = excluded.soc_chipset,
            gpu_and_storage = excluded.gpu_and_storage,
            pwm_dimming_hz = excluded.pwm_dimming_hz,
            updated_at = CURRENT_TIMESTAMP;
        """,
        (
            device.device_name.strip(),
            device.soc_chipset,
            device.gpu_and_storage,
            device.pwm_dimming_hz,
        ),
    )

    # Fetch the foreign key `device_id`
    cursor.execute(
        "SELECT id FROM devices WHERE device_name = ?;", (device.device_name.strip(),)
    )
    device_id = cursor.fetchone()["id"]

    # 2. Insert new time-series record into `telemetry_runs`
    games_json = json.dumps([g.model_dump() for g in device.game_benchmarks])
    sources_json = json.dumps(device.sources)

    cursor.execute(
        """
        INSERT INTO telemetry_runs (
            device_id, target_workload, wildlife_stability_pct,
            peak_temp_celsius, game_benchmarks_json, sources_json
        ) VALUES (?, ?, ?, ?, ?, ?);
        """,
        (
            device_id,
            workload,
            device.wildlife_stability_pct,
            device.peak_temp_celsius,
            games_json,
            sources_json,
        ),
    )


def log_report_to_db(report: SiliconPulseReport) -> None:
    """Logs primary (and optional secondary) devices from a validated report into SQLite."""
    if report.mode == "INVALID_QUERY" or report.primary_device is None:
        return

    init_db()
    with get_connection() as conn:
        _store_single_device(conn, report.primary_device, report.target_workload)
        if report.mode == "DUAL_COMPARISON" and report.secondary_device is not None:
            _store_single_device(conn, report.secondary_device, report.target_workload)
        conn.commit()


def render_telemetry_history(
    chip_filter: Optional[str] = None,
    max_temp: Optional[float] = None,
    limit: int = 10,
) -> None:
    """Queries normalized SQLite tables and prints a Rich analytics table."""
    init_db()
    query = """
        SELECT 
            d.device_name,
            d.soc_chipset,
            r.wildlife_stability_pct,
            r.peak_temp_celsius,
            d.pwm_dimming_hz,
            r.game_benchmarks_json,
            r.recorded_at
        FROM telemetry_runs r
        JOIN devices d ON r.device_id = d.id
        WHERE 1=1
    """
    params: list = []

    if chip_filter:
        query += " AND LOWER(d.soc_chipset) LIKE ?"
        params.append(f"%{chip_filter.lower()}%")

    if max_temp is not None:
        query += " AND r.peak_temp_celsius IS NOT NULL AND r.peak_temp_celsius <= ?"
        params.append(max_temp)

    query += " ORDER BY r.recorded_at DESC LIMIT ?;"
    params.append(limit)

    with get_connection() as conn:
        rows = conn.execute(query, params).fetchall()

    if not rows:
        console.print("[yellow]⚠️ No matching telemetry runs found in SQLite database.[/yellow]")
        return

    title = "📊 PulseThrottle SQLite Time-Series Telemetry Database"
    if chip_filter or max_temp:
        filters = []
        if chip_filter:
            filters.append(f"Chipset ~ '{chip_filter}'")
        if max_temp is not None:
            filters.append(f"Peak Temp <= {max_temp}°C")
        title += f" ({', '.join(filters)})"

    table = Table(title=title, show_lines=True)
    table.add_column("Timestamp (UTC)", style="dim", width=19)
    table.add_column("Device", style="bold cyan")
    table.add_column("SoC / Chipset", style="white")
    table.add_column("3DMark Stability", justify="right", style="green")
    table.add_column("Peak Temp", justify="right", style="magenta")
    table.add_column("Sustained FPS Summary", style="yellow")

    for row in rows:
        stab = f"{row['wildlife_stability_pct']}%" if row["wildlife_stability_pct"] is not None else "N/A"
        temp = f"{row['peak_temp_celsius']}°C" if row["peak_temp_celsius"] is not None else "N/A"
        games = json.loads(row["game_benchmarks_json"])
        fps_summary = "; ".join([f"{g['game_name']}: {g['sustained_avg_fps']}" for g in games]) or "N/A"

        table.add_row(
            row["recorded_at"],
            row["device_name"],
            row["soc_chipset"],
            stab,
            temp,
            fps_summary,
        )

    console.print("\n")
    console.print(table)
