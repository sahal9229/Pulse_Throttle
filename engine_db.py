import sqlite3
import json
import re
from contextlib import closing
from pathlib import Path
from typing import Optional, List
from rich.console import Console
from rich.table import Table
from schemas import SiliconPulseReport, DeviceTelemetry, GameBenchmark
from scoring import enrich_report_with_scores
from regex_parser import build_deterministic_verdict

console = Console()
DB_PATH = Path("pulsethrottle.db")


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db() -> None:
    """Initializes relational tables, migrates columns, and purges stale duplicate runs."""
    with closing(get_connection()) as conn:
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
                antutu_v10_score INTEGER,
                geekbench_6_single INTEGER,
                geekbench_6_multi INTEGER,
                wildlife_stability_pct REAL,
                peak_temp_celsius REAL,
                pulse_throttle_index REAL,
                score_breakdown TEXT,
                game_benchmarks_json TEXT NOT NULL,
                sources_json TEXT NOT NULL,
                recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
            );
            """
        )
        existing_cols = {
            row["name"] for row in conn.execute("PRAGMA table_info(telemetry_runs);").fetchall()
        }
        migrations = [
            ("antutu_v10_score", "INTEGER"),
            ("geekbench_6_single", "INTEGER"),
            ("geekbench_6_multi", "INTEGER"),
            ("pulse_throttle_index", "REAL"),
            ("score_breakdown", "TEXT"),
        ]
        for col_name, col_type in migrations:
            if col_name not in existing_cols:
                conn.execute(f"ALTER TABLE telemetry_runs ADD COLUMN {col_name} {col_type};")

        # Automatically deduplicate historical runs: keep only the single best/latest row per device_id
        conn.execute(
            """
            DELETE FROM telemetry_runs
            WHERE id NOT IN (
                SELECT id FROM (
                    SELECT id, ROW_NUMBER() OVER (
                        PARTITION BY device_id
                        ORDER BY (antutu_v10_score IS NOT NULL) DESC,
                                 pulse_throttle_index DESC,
                                 recorded_at DESC
                    ) AS rn
                    FROM telemetry_runs
                ) WHERE rn = 1
            );
            """
        )

        conn.executescript(
            """
            CREATE INDEX IF NOT EXISTS idx_devices_soc ON devices(soc_chipset);
            CREATE INDEX IF NOT EXISTS idx_runs_temp ON telemetry_runs(peak_temp_celsius);
            CREATE INDEX IF NOT EXISTS idx_runs_pti ON telemetry_runs(pulse_throttle_index);
            """
        )
        conn.commit()


def _extract_query_device_names(user_query: str) -> List[str]:
    """Splits a user query into 1 or 2 clean target smartphone names for DB lookup."""
    vs_split = re.split(r"\b(?:vs\.?|versus)\b", user_query, flags=re.IGNORECASE)
    clean_pattern = (
        r"(?i)\b(compare|how|does|the|perform|in|for|sustained|gaming|bgmi|genshin|"
        r"pwm|dimming|90fps|60fps|120fps|and|with|what|are|its|thermals|performance|fps|test)\b"
    )
    names = []
    for part in vs_split[:2]:
        cleaned = re.sub(clean_pattern, "", part)
        cleaned = re.sub(r"\s+", " ", cleaned).strip(" ,.-?!")
        if cleaned:
            names.append(cleaned)
    return names


def _fetch_device_from_db(conn: sqlite3.Connection, name_query: str) -> Optional[DeviceTelemetry]:
    """Looks up a device in SQLite by flexible name matching and reconstructs DeviceTelemetry."""
    if not name_query or len(name_query) < 3:
        return None

    row = conn.execute(
        """
        SELECT 
            d.device_name, d.soc_chipset, d.gpu_and_storage, d.pwm_dimming_hz,
            r.antutu_v10_score, r.geekbench_6_single, r.geekbench_6_multi,
            r.wildlife_stability_pct, r.peak_temp_celsius, r.pulse_throttle_index,
            r.score_breakdown, r.game_benchmarks_json, r.sources_json
        FROM devices d
        JOIN telemetry_runs r ON r.device_id = d.id
        WHERE LOWER(d.device_name) LIKE ?
           OR ? LIKE '%' || LOWER(d.device_name) || '%'
        ORDER BY (r.antutu_v10_score IS NOT NULL) DESC, r.pulse_throttle_index DESC, r.recorded_at DESC
        LIMIT 1;
        """,
        (f"%{name_query.lower()}%", name_query.lower()),
    ).fetchone()

    if not row or row["antutu_v10_score"] is None:
        return None

    games = [GameBenchmark(**g) for g in json.loads(row["game_benchmarks_json"])]
    sources = json.loads(row["sources_json"])

    return DeviceTelemetry(
        device_name=row["device_name"],
        soc_chipset=row["soc_chipset"],
        gpu_and_storage=row["gpu_and_storage"],
        antutu_v10_score=row["antutu_v10_score"],
        geekbench_6_single=row["geekbench_6_single"],
        geekbench_6_multi=row["geekbench_6_multi"],
        wildlife_stability_pct=row["wildlife_stability_pct"],
        peak_temp_celsius=row["peak_temp_celsius"],
        pwm_dimming_hz=row["pwm_dimming_hz"],
        pulse_throttle_index=row["pulse_throttle_index"],
        score_breakdown=row["score_breakdown"],
        game_benchmarks=games,
        sources=sources,
    )


def load_report_from_db(user_query: str) -> Optional[SiliconPulseReport]:
    """
    Checks if the requested phone(s) already exist in `pulsethrottle.db`.
    If found, builds and returns the report directly from SQLite without scraping again!
    """
    init_db()
    target_names = _extract_query_device_names(user_query)
    if not target_names:
        return None

    with closing(get_connection()) as conn:
        if len(target_names) == 2:
            dev_a = _fetch_device_from_db(conn, target_names[0])
            dev_b = _fetch_device_from_db(conn, target_names[1])
            if dev_a and dev_b:
                console.print(
                    f"\n[bold green]🗄️ SQLite DB Hit![/bold green] [dim]Loaded '{dev_a.device_name}' vs '{dev_b.device_name}' directly from pulsethrottle.db (0 web calls).[/dim]"
                )
                report = SiliconPulseReport(
                    mode="DUAL_COMPARISON",
                    target_workload=user_query,
                    primary_device=dev_a,
                    secondary_device=dev_b,
                    engineering_verdict="",
                )
                enrich_report_with_scores(report)
                report.engineering_verdict = build_deterministic_verdict("DUAL_COMPARISON", dev_a, dev_b)
                return report

        elif len(target_names) == 1:
            dev_1 = _fetch_device_from_db(conn, target_names[0])
            if dev_1:
                console.print(
                    f"\n[bold green]🗄️ SQLite DB Hit![/bold green] [dim]Loaded '{dev_1.device_name}' directly from pulsethrottle.db (0 web calls).[/dim]"
                )
                report = SiliconPulseReport(
                    mode="SINGLE_DEVICE",
                    target_workload=user_query,
                    primary_device=dev_1,
                    secondary_device=None,
                    engineering_verdict="",
                )
                enrich_report_with_scores(report)
                report.engineering_verdict = build_deterministic_verdict("SINGLE_DEVICE", dev_1, None)
                return report

    return None


def _store_single_device(
    conn: sqlite3.Connection, device: DeviceTelemetry, workload: str
) -> None:
    """Upserts device and replaces its latest telemetry run so duplicates never pile up."""
    cursor = conn.cursor()

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

    cursor.execute(
        "SELECT id FROM devices WHERE device_name = ?;", (device.device_name.strip(),)
    )
    device_id = cursor.fetchone()["id"]

    # Remove older run for this device_id before inserting the newly refreshed run
    cursor.execute("DELETE FROM telemetry_runs WHERE device_id = ?;", (device_id,))

    games_json = json.dumps([g.model_dump() for g in device.game_benchmarks])
    sources_json = json.dumps(device.sources)

    cursor.execute(
        """
        INSERT INTO telemetry_runs (
            device_id, target_workload, antutu_v10_score, geekbench_6_single,
            geekbench_6_multi, wildlife_stability_pct, peak_temp_celsius,
            pulse_throttle_index, score_breakdown, game_benchmarks_json, sources_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """,
        (
            device_id,
            workload,
            device.antutu_v10_score,
            device.geekbench_6_single,
            device.geekbench_6_multi,
            device.wildlife_stability_pct,
            device.peak_temp_celsius,
            device.pulse_throttle_index,
            device.score_breakdown,
            games_json,
            sources_json,
        ),
    )


def log_report_to_db(report: SiliconPulseReport) -> None:
    if report.mode == "INVALID_QUERY" or report.primary_device is None:
        return

    enrich_report_with_scores(report)
    init_db()
    with closing(get_connection()) as conn:
        _store_single_device(conn, report.primary_device, report.target_workload)
        if report.mode == "DUAL_COMPARISON" and report.secondary_device is not None:
            _store_single_device(conn, report.secondary_device, report.target_workload)
        conn.commit()


def render_telemetry_history(
    chip_filter: Optional[str] = None,
    max_temp: Optional[float] = None,
    min_index: Optional[float] = None,
    sort_by_index: bool = False,
    limit: int = 10,
) -> None:
    """Queries normalized SQLite tables (deduplicated per device) and prints a Rich table."""
    init_db()
    query = """
        SELECT 
            d.device_name,
            d.soc_chipset,
            r.pulse_throttle_index,
            r.antutu_v10_score,
            r.geekbench_6_single,
            r.geekbench_6_multi,
            r.wildlife_stability_pct,
            r.peak_temp_celsius,
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

    if min_index is not None:
        query += " AND r.pulse_throttle_index IS NOT NULL AND r.pulse_throttle_index >= ?"
        params.append(min_index)

    if sort_by_index or min_index is not None:
        query += " ORDER BY r.pulse_throttle_index DESC, r.recorded_at DESC LIMIT ?;"
    else:
        query += " ORDER BY r.recorded_at DESC LIMIT ?;"
    params.append(limit)

    with closing(get_connection()) as conn:
        rows = conn.execute(query, params).fetchall()

    if not rows:
        console.print("[yellow]⚠️ No matching telemetry runs found in SQLite database.[/yellow]")
        return

    title = "🏆 PulseThrottle Hardware Leaderboard & Time-Series DB"
    table = Table(title=title, show_lines=True)
    table.add_column("Device", style="bold cyan")
    table.add_column("PulseThrottle Index", justify="center", style="bold bright_green")
    table.add_column("SoC / Chipset", style="white")
    table.add_column("AnTuTu v10", justify="right", style="yellow")
    table.add_column("Geekbench 6 (S/M)", justify="right", style="cyan")
    table.add_column("3DMark Stab.", justify="right", style="green")
    table.add_column("Peak Temp", justify="right", style="magenta")
    table.add_column("Sustained FPS", style="white")

    for row in rows:
        pti = f"{row['pulse_throttle_index']}/100" if row["pulse_throttle_index"] is not None else "N/A"
        antutu = f"{row['antutu_v10_score']:,}" if row["antutu_v10_score"] else "N/A"
        if row["geekbench_6_single"] and row["geekbench_6_multi"]:
            gb = f"{row['geekbench_6_single']}/{row['geekbench_6_multi']}"
        elif row["geekbench_6_multi"]:
            gb = f"-/{row['geekbench_6_multi']}"
        else:
            gb = "N/A"
        stab = f"{row['wildlife_stability_pct']}%" if row["wildlife_stability_pct"] is not None else "N/A"
        temp = f"{row['peak_temp_celsius']}°C" if row["peak_temp_celsius"] is not None else "N/A"
        games = json.loads(row["game_benchmarks_json"])
        fps_summary = "; ".join([f"{g['game_name']}: {g['sustained_avg_fps']}" for g in games]) or "N/A"

        table.add_row(
            row["device_name"],
            pti,
            row["soc_chipset"],
            antutu,
            gb,
            stab,
            temp,
            fps_summary,
        )

    console.print("\n")
    console.print(table)
