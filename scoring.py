import re
from typing import Optional, Tuple
from schemas import DeviceTelemetry, SiliconPulseReport


def _extract_fps_numbers(text: str) -> Optional[float]:
    """
    Extracts numeric FPS from strings like '58-60 FPS' (-> 59.0),
    'Smooth + 90 FPS' (-> 90.0), or '86.4 FPS' (-> 86.4).
    """
    if not text or "unverified" in text.lower():
        return None

    # Check for range first, e.g., "58-60" or "55 - 60"
    range_match = re.search(r"(\d+(?:\.\d+)?)\s*[-–to]+\s*(\d+(?:\.\d+)?)", text)
    if range_match:
        low, high = float(range_match.group(1)), float(range_match.group(2))
        if 15 <= low <= 165 and 15 <= high <= 165:
            return (low + high) / 2.0

    # Look for number right before 'fps'
    fps_match = re.search(r"(\d+(?:\.\d+)?)\s*fps", text, re.IGNORECASE)
    if fps_match:
        val = float(fps_match.group(1))
        if 15 <= val <= 165:
            return val

    # Fallback: any valid frame rate number in the string
    nums = [float(n) for n in re.findall(r"\d+(?:\.\d+)?", text) if 20 <= float(n) <= 165]
    return nums[-1] if nums else None


def _compute_tss(device: DeviceTelemetry) -> float:
    """
    1. Thermal Stability Score (TSS) [0 - 100]:
    Formula: Stability% * (1 - (PeakTemp - 35) / 50)
    Includes sensible fallbacks if only stability or only temperature was reported.
    """
    stab = device.wildlife_stability_pct if device.wildlife_stability_pct is not None else 82.0
    temp = device.peak_temp_celsius if device.peak_temp_celsius is not None else 42.0

    # Clamp stability to [0, 100] and temp penalty to a reasonable range
    stab = max(0.0, min(100.0, stab))
    thermal_penalty = max(0.0, (temp - 35.0) / 50.0)
    tss = stab * (1.0 - thermal_penalty)
    return round(max(0.0, min(100.0, tss)), 1)


def _compute_fpe(device: DeviceTelemetry) -> float:
    """
    2. FPS Pacing Efficiency (FPE) [0 - 100]:
    Formula: (Sustained Avg FPS / Max Unlocked FPS) * 100
    """
    ratios = []
    for g in device.game_benchmarks:
        max_fps = _extract_fps_numbers(g.max_unlocked_setting)
        sustained_fps = _extract_fps_numbers(g.sustained_avg_fps)
        if max_fps and sustained_fps and max_fps > 0:
            ratio = min(1.0, sustained_fps / max_fps)
            ratios.append(ratio * 100.0)

    if ratios:
        return round(sum(ratios) / len(ratios), 1)
    return 85.0  # Neutral baseline when real-world FPS numbers are unverified


def _compute_compute_score(device: DeviceTelemetry) -> float:
    """
    3. Normalized Compute Score [0 - 100]:
    Formula: (AnTuTu v10 / 1,500,000) * 100 (capped at 100)
    Falls back to Geekbench 6 Multi-Core (/ 6500) if AnTuTu is missing.
    """
    if device.antutu_v10_score and device.antutu_v10_score > 50000:
        score = (device.antutu_v10_score / 1_500_000.0) * 100.0
        return round(min(100.0, max(10.0, score)), 1)

    if device.geekbench_6_multi and device.geekbench_6_multi > 500:
        score = (device.geekbench_6_multi / 6500.0) * 100.0
        return round(min(100.0, max(10.0, score)), 1)

    return 60.0  # Mid-range fallback if neither benchmark was found


def _compute_storage_score(device: DeviceTelemetry) -> float:
    """
    4. Storage Speed Tier Multiplier [0 - 100]:
    UFS 4.0 = 100 | UFS 3.1 = 80 | UFS 2.2 = 60 | NVMe = 100
    """
    text = device.gpu_and_storage.upper()
    if "UFS 4.0" in text or "UFS 4.1" in text or "NVME" in text:
        return 100.0
    if "UFS 3.1" in text or "UFS 3.0" in text:
        return 80.0
    if "UFS 2.2" in text or "UFS 2.1" in text:
        return 60.0
    if "EMMC" in text:
        return 35.0
    return 70.0


def score_device(device: DeviceTelemetry) -> Tuple[float, str]:
    """
    Calculates the weighted PulseThrottle Index (0-100):
      30% Thermal Stability Score (TSS)
      30% FPS Pacing Efficiency (FPE)
      25% Normalized Compute Score (AnTuTu v10 / Geekbench 6)
      15% Storage Speed Tier Multiplier
    """
    tss = _compute_tss(device)
    fpe = _compute_fpe(device)
    comp = _compute_compute_score(device)
    stor = _compute_storage_score(device)

    pti = (0.30 * tss) + (0.30 * fpe) + (0.25 * comp) + (0.15 * stor)
    pti_rounded = round(pti, 1)

    # Use '•' instead of '|' so Markdown tables never break!
    breakdown = f"TSS: {tss} • FPE: {fpe}% • Compute: {comp} • Storage: {int(stor)}"
    return pti_rounded, breakdown


def enrich_report_with_scores(report: SiliconPulseReport) -> SiliconPulseReport:
    """Populates `pulse_throttle_index` and `score_breakdown` on validated devices."""
    if report.mode == "INVALID_QUERY" or report.primary_device is None:
        return report

    pti1, b1 = score_device(report.primary_device)
    report.primary_device.pulse_throttle_index = pti1
    report.primary_device.score_breakdown = b1

    if report.mode == "DUAL_COMPARISON" and report.secondary_device is not None:
        pti2, b2 = score_device(report.secondary_device)
        report.secondary_device.pulse_throttle_index = pti2
        report.secondary_device.score_breakdown = b2

    return report
