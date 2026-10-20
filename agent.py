from typing import Tuple
from rich.console import Console
from rich.markdown import Markdown
from schemas import SiliconPulseReport, DeviceTelemetry
from client_manager import ResilientAgentClient
from scoring import enrich_report_with_scores

console = Console()
MODEL_ID = "gemini-3.8-flash"

resilient_client = ResilientAgentClient()


def run_silicon_pulse(user_query: str) -> SiliconPulseReport:
    """Runs autonomous hardware research and computes quantitative PulseThrottle Index scores."""
    system_instructions = (
        "You are PulseThrottle, a Senior Mobile Hardware & Gaming Telemetry Engineer. "
        "Analyze the provided web search telemetry to populate the report. "
        "CRITICAL REGIONAL RULE: Whenever BGMI or Indian gaming workloads are mentioned, "
        "you MUST report the exact Indian retail variant SoC (e.g., MediaTek Dimensity 7400 for Motorola Edge 60 Fusion). "
        "Extract exact integers for `antutu_v10_score`, `geekbench_6_single`, and `geekbench_6_multi` when present in the search results. "
        "Find UFS storage tier, 3DMark Wild Life Extreme stability %, peak temperature in °C, PWM dimming Hz, and sustained FPS. "
        "Leave `pulse_throttle_index` and `score_breakdown` null (they are computed post-extraction by the scoring engine). "
        "Never fabricate numbers. If a metric is missing after searching, leave it null or state Unverified."
    )

    console.print("\n[bold yellow]⚡ Executing Autonomous Hardware Telemetry Search...[/bold yellow]")
    raw_report = resilient_client.run_chat_with_fallback(
        model_id=MODEL_ID,
        system_instructions=system_instructions,
        user_query=user_query,
    )
    return enrich_report_with_scores(raw_report)


def _fmt_benchmarks(d: DeviceTelemetry) -> Tuple[str, str, str]:
    antutu = f"{d.antutu_v10_score:,}" if d.antutu_v10_score else "Not Reported"
    if d.geekbench_6_single and d.geekbench_6_multi:
        gb6 = f"{d.geekbench_6_single:,} (Single) / {d.geekbench_6_multi:,} (Multi)"
    elif d.geekbench_6_multi:
        gb6 = f"{d.geekbench_6_multi:,} (Multi)"
    else:
        gb6 = "Not Reported"
    pti = f"**{d.pulse_throttle_index} / 100** ({d.score_breakdown})" if d.pulse_throttle_index is not None else "N/A"
    return antutu, gb6, pti


def format_markdown_output(report: SiliconPulseReport) -> str:
    if report.mode == "INVALID_QUERY" or report.primary_device is None:
        return f"""# ⚠️ Invalid Hardware Telemetry Query
**Status:** {report.target_workload}

{report.engineering_verdict}
"""

    # Ensure cached reports loaded from disk also have their scores computed
    if report.primary_device.pulse_throttle_index is None:
        enrich_report_with_scores(report)

    p1 = report.primary_device
    s1 = f"{p1.wildlife_stability_pct}%" if p1.wildlife_stability_pct is not None else "Not Reported"
    t1 = f"{p1.peak_temp_celsius}°C" if p1.peak_temp_celsius is not None else "Not Reported"
    antutu1, gb1, pti1 = _fmt_benchmarks(p1)

    if report.mode == "SINGLE_DEVICE" or report.secondary_device is None:
        games_rows = "\n".join([
            f"| **{g.game_name}** | {g.max_unlocked_setting} | {g.sustained_avg_fps} | {g.thermal_and_frame_drop_notes} |"
            for g in p1.game_benchmarks
        ])
        return f"""# 🔬 PulseThrottle Telemetry Report: {p1.device_name}
**Target Evaluation:** {report.target_workload}  
🏆 **PulseThrottle Index:** {pti1}

### 1. Hardware, Synthetic Benchmarks & Thermal Architecture
* **SoC / Chipset:** {p1.soc_chipset}
* **GPU, RAM & Storage:** {p1.gpu_and_storage}
* **AnTuTu v10 Score:** {antutu1}
* **Geekbench 6 Score:** {gb1}
* **3DMark Stress Stability:** {s1}
* **Peak Surface Temp:** {t1}
* **Display PWM Dimming:** {p1.pwm_dimming_hz}

### 2. Real-World Gaming FPS Breakdown
| Game | Max Unlocked Setting | Sustained Avg FPS | Frame Drops & Thermal Notes |
| :--- | :--- | :--- | :--- |
{games_rows}

### 3. Engineering Verdict
{report.engineering_verdict}

*Verified Sources: {", ".join(p1.sources)}*
"""

    p2 = report.secondary_device
    s2 = f"{p2.wildlife_stability_pct}%" if p2.wildlife_stability_pct is not None else "Not Reported"
    t2 = f"{p2.peak_temp_celsius}°C" if p2.peak_temp_celsius is not None else "Not Reported"
    antutu2, gb2, _ = _fmt_benchmarks(p2)
    p1_games = "; ".join([f"{g.game_name}: {g.sustained_avg_fps}" for g in p1.game_benchmarks])
    p2_games = "; ".join([f"{g.game_name}: {g.sustained_avg_fps}" for g in p2.game_benchmarks])

    return f"""# ⚡ PulseThrottle Head-to-Head: {p1.device_name} vs. {p2.device_name}
**Target Evaluation:** {report.target_workload}

| Telemetry Metric | {p1.device_name} | {p2.device_name} |
| :--- | :--- | :--- |
| 🏆 **PulseThrottle Index** | **{p1.pulse_throttle_index} / 100** | **{p2.pulse_throttle_index} / 100** |
| **Index Breakdown** | {p1.score_breakdown} | {p2.score_breakdown} |
| **SoC / Chipset** | {p1.soc_chipset} | {p2.soc_chipset} |
| **GPU, RAM & Storage** | {p1.gpu_and_storage} | {p2.gpu_and_storage} |
| **AnTuTu v10 Score** | {antutu1} | {antutu2} |
| **Geekbench 6 Score** | {gb1} | {gb2} |
| **3DMark Stability** | {s1} | {s2} |
| **Peak Gaming Temp** | {t1} | {t2} |
| **PWM Dimming** | {p1.pwm_dimming_hz} | {p2.pwm_dimming_hz} |
| **Gaming Summary** | {p1_games} | {p2_games} |

### 🎯 Engineering Verdict
{report.engineering_verdict}
"""