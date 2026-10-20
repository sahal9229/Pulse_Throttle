from typing import List, Optional, Literal
from pydantic import BaseModel, Field

class GameBenchmark(BaseModel):
    game_name: str = Field(
        description="Game title (e.g., BGMI / PUBG Mobile, Genshin Impact, COD Mobile)."
    )
    max_unlocked_setting: str = Field(
        description="Highest graphics/FPS setting officially unlocked (e.g., 'Smooth + 90 FPS', 'Smooth + Extreme 60 FPS')."
    )
    sustained_avg_fps: str = Field(
        description="Real-world average FPS maintained after 20-30 mins of play. State 'Unverified' if only marketing claims exist."
    )
    thermal_and_frame_drop_notes: str = Field(
        description="Notes on frame drops, jitter, or thermal throttling during gameplay."
    )

class DeviceTelemetry(BaseModel):
    device_name: str = Field(description="Official smartphone name.")
    soc_chipset: str = Field(
        description="Processor name, fabrication node (nm), and CPU core config."
    )
    gpu_and_storage: str = Field(
        description="GPU model, RAM type (LPDDR4X/5X), and storage type (UFS 2.2/3.1/4.0)."
    )
    wildlife_stability_pct: Optional[float] = Field(
        default=None,
        description="3DMark Wild Life Extreme Stress Test stability percentage (0-100). Null if not found."
    )
    peak_temp_celsius: Optional[float] = Field(
        default=None,
        description="Peak surface temperature in Celsius under sustained gaming load. Null if not found."
    )
    pwm_dimming_hz: str = Field(
        description="Display PWM dimming frequency in Hz (e.g., '720Hz', '2160Hz', or 'Not Reported')."
    )
    game_benchmarks: List[GameBenchmark] = Field(
        description="Breakdown of specific games requested by the user."
    )
    sources: List[str] = Field(
        description="Domains/publications where data was verified (e.g., GSMArena, NotebookCheck)."
    )

class SiliconPulseReport(BaseModel):
    """PulseThrottle hardware telemetry and comparison report schema."""
    mode: Literal["SINGLE_DEVICE", "DUAL_COMPARISON", "INVALID_QUERY"] = Field(
        description=(
            "Use SINGLE_DEVICE if analyzing one specific phone model, "
            "DUAL_COMPARISON if comparing two specific phone models, or "
            "INVALID_QUERY if the user did not name a real, specific smartphone model/SoC."
        )
    )
    target_workload: str = Field(
        description="The workload evaluated, or 'Invalid / Non-Specific Query' if mode is INVALID_QUERY."
    )
    primary_device: Optional[DeviceTelemetry] = Field(
        default=None,
        description="Main phone analyzed. MUST be null if mode is INVALID_QUERY."
    )
    secondary_device: Optional[DeviceTelemetry] = Field(
        default=None,
        description="Phone B. Populate ONLY if mode is DUAL_COMPARISON, otherwise leave null."
    )
    engineering_verdict: str = Field(
        description=(
            "Detailed hardware engineering verdict. If mode is INVALID_QUERY, explain why the query "
            "was rejected and give 2 examples of valid smartphone queries."
        )
    )

# Safe alias for backwards compatibility and renamed codebase usage
PulseThrottleReport = SiliconPulseReport


# Quick standalone test to verify Pydantic validation works
if __name__ == "__main__":
    sample_report = PulseThrottleReport(
        mode="SINGLE_DEVICE",
        target_workload="BGMI Sustained FPS & Thermals",
        primary_device=DeviceTelemetry(
            device_name="Motorola Edge 60 Pro",
            soc_chipset="MediaTek Dimensity 8350 Extreme (4nm)",
            gpu_and_storage="Mali-G615 MC6, LPDDR5X, UFS 4.0",
            wildlife_stability_pct=74.5,
            peak_temp_celsius=42.8,
            pwm_dimming_hz="720Hz",
            game_benchmarks=[
                GameBenchmark(
                    game_name="BGMI",
                    max_unlocked_setting="Smooth + 90 FPS",
                    sustained_avg_fps="86.4 FPS",
                    thermal_and_frame_drop_notes="Stable frame pacing with minor drops in hot-drops."
                )
            ],
            sources=["gsmarena.com"]
        ),
        engineering_verdict="Strong mid-high tier gaming performer with UFS 4.0 storage."
    )
    print("Schema validation passed successfully!")
    print(sample_report.model_dump_json(indent=2))