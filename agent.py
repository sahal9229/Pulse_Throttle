from rich.console import Console
from rich.markdown import Markdown
from schemas import SiliconPulseReport
from client_manager import ResilientAgentClient

console = Console()
MODEL_ID = "gemini-3.8-flash"

# Initialize the multi-key failover client
resilient_client = ResilientAgentClient()


def run_silicon_pulse(user_query: str) -> SiliconPulseReport:
    """Runs autonomous hardware research with automatic API key failover."""
    system_instructions = (
        "You are PulseThrottle, a Senior Mobile Hardware & Gaming Telemetry Engineer. "
        "Use `search_hardware_telemetry` efficiently: make AT MOST 2 to 3 comprehensive searches total "
        "(e.g., 1 combined search per phone covering SoC chipset, UFS storage, 3DMark stability %, peak temp °C, PWM Hz, and BGMI FPS). "
        "Find the exact commercial SoC model without combining variants with slashes. "
        "Never fabricate numbers. If a metric is missing after searching, leave it null or note as unverified."
    )

    console.print("\n[bold yellow]⚡ Executing Autonomous Hardware Telemetry Search...[/bold yellow]")
    return resilient_client.run_chat_with_fallback(
        model_id=MODEL_ID,
        system_instructions=system_instructions,
        user_query=user_query,
    )


# Safe alias for backwards compatibility and renamed codebase usage
run_pulse_throttle = run_silicon_pulse


def format_markdown_output(report: SiliconPulseReport) -> str:
    if report.mode == "INVALID_QUERY" or report.primary_device is None:
        return f"""# ⚠️ Invalid Hardware Telemetry Query
**Status:** {report.target_workload}

{report.engineering_verdict}
"""

    p1 = report.primary_device
    s1 = f"{p1.wildlife_stability_pct}%" if p1.wildlife_stability_pct is not None else "Not Reported"
    t1 = f"{p1.peak_temp_celsius}°C" if p1.peak_temp_celsius is not None else "Not Reported"

    if report.mode == "SINGLE_DEVICE" or report.secondary_device is None:
        games_rows = "\n".join([
            f"| **{g.game_name}** | {g.max_unlocked_setting} | {g.sustained_avg_fps} | {g.thermal_and_frame_drop_notes} |"
            for g in p1.game_benchmarks
        ])
        return f"""# 🔬 PulseThrottle Telemetry Report: {p1.device_name}
**Target Evaluation:** {report.target_workload}

### 1. Hardware & Thermal Architecture
* **SoC / Chipset:** {p1.soc_chipset}
* **GPU, RAM & Storage:** {p1.gpu_and_storage}
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
    p1_games = "; ".join([f"{g.game_name}: {g.sustained_avg_fps}" for g in p1.game_benchmarks])
    p2_games = "; ".join([f"{g.game_name}: {g.sustained_avg_fps}" for g in p2.game_benchmarks])

    return f"""# ⚡ PulseThrottle Head-to-Head: {p1.device_name} vs. {p2.device_name}
**Target Evaluation:** {report.target_workload}

| Telemetry Metric | {p1.device_name} | {p2.device_name} |
| :--- | :--- | :--- |
| **SoC / Chipset** | {p1.soc_chipset} | {p2.soc_chipset} |
| **GPU, RAM & Storage** | {p1.gpu_and_storage} | {p2.gpu_and_storage} |
| **3DMark Stability** | {s1} | {s2} |
| **Peak Gaming Temp** | {t1} | {t2} |
| **PWM Dimming** | {p1.pwm_dimming_hz} | {p2.pwm_dimming_hz} |
| **Gaming Summary** | {p1_games} | {p2_games} |

### 🎯 Engineering Verdict
{report.engineering_verdict}
"""


if __name__ == "__main__":
    test_query = "How does the Motorola Edge 60 Pro perform in BGMI, what FPS does it unlock, and how are its thermals and PWM dimming?"
    report_obj = run_silicon_pulse(test_query)
    md_text = format_markdown_output(report_obj)
    console.print(Markdown(md_text))