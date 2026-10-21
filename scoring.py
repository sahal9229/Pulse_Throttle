import re
from typing import Optional, Tuple
from schemas import DeviceTelemetry, SiliconPulseReport


def _extract_fps_numbers(text: str) -> Optional[float]:
    """Extracts average numeric FPS from strings like '57-60 FPS' (-> 58.5) or '90 FPS' (-> 90.0)."""
    if not text or "unverified" in text.lower():
        return None

    range_match = re.search(r"(\d+(?:\.\d+)?)\s*[-–to]+\s*(\d+(?:\.\d+)?)", text)
    if range_match:
        low, high = float(range_match.group(1)), float(range_match.group(2))
        if 15 <= low <= 165 and 15 <= high <= 165:
            return (low + high) / 2.0

    fps_match = re.search(r"(\d+(?:\.\d+)?)\s*fps", text, re.IGNORECASE)
    if fps_match:
        val = float(fps_match.group(1))
        if 15 <= val <= 165:
            return val

    nums = [float(n) for n in re.findall(r"\d+(?:\.\d+)?", text) if 20 <= float(n) <= 165]
    return nums[-1] if nums else None


def _compute_tss(device: DeviceTelemetry) -> float:
    """
    1. Thermal Stability Score (TSS) [0 - 100]:
    Formula: Stability% * (1 - (PeakTemp - 35) / 50)
    """
    stab = device.wildlife_stability_pct if device.wildlife_stability_pct is not None else 82.0
    temp = device.peak_temp_celsius if device.peak_temp_celsius is not None else 42.0

    stab = max(0.0, min(100.0, stab))
    thermal_penalty = max(0.0, (temp - 35.0) / 50.0)
    tss = stab * (1.0 - thermal_penalty)
    return round(max(0.0, min(100.0, tss)), 1)


def _compute_compute_score(device: DeviceTelemetry) -> float:
    """
    3. Normalized Compute Score [0 - 100]:
    Formula: (AnTuTu v10 / 1,500,000) * 100 (capped at 100)
    """
    if device.antutu_v10_score and device.antutu_v10_score > 50000:
        score = (device.antutu_v10_score / 1_500_000.0) * 100.0
        return round(min(100.0, max(10.0, score)), 1)

    if device.geekbench_6_multi and device.geekbench_6_multi > 500:
        score = (device.geekbench_6_multi / 6500.0) * 100.0
        return round(min(100.0, max(10.0, score)), 1)

    # Heuristic fallback based on SoC tier if synthetic scores are missing
    soc_upper = device.soc_chipset.upper()
    if any(k in soc_upper for k in ["8 ELITE", "8 GEN 3", "9400", "9300", "A18", "A17"]):
        return 95.0
    if any(k in soc_upper for k in ["8350", "8300", "8 GEN 2", "8S GEN 3", "7+ GEN 3"]):
        return 85.0
    if any(k in soc_upper for k in ["7400", "7300", "7200", "7 GEN 3", "6 GEN 1"]):
        return 45.0
    return 55.0


def _compute_fpe(device: DeviceTelemetry, tss: float, compute_score: float) -> float:
    """
    2. FPS Pacing Efficiency (FPE) [0 - 100]:
    Combines frame-pacing stability (sustained / max_unlocked) with a tier multiplier
    so sustaining 86 FPS (90 FPS mode) scores higher than sustaining 58 FPS (60 FPS cap).
    """
    scores = []
    for g in device.game_benchmarks:
        max_fps = _extract_fps_numbers(g.max_unlocked_setting)
        sustained_fps = _extract_fps_numbers(g.sustained_avg_fps)
        if sustained_fps:
            denom = max_fps if (max_fps and max_fps >= sustained_fps) else (90.0 if sustained_fps > 62 else 60.0)
            pacing_ratio = min(1.0, sustained_fps / denom)
            # Tier factor: 90/120 FPS capable gets 1.0x; 60 FPS capped gets 0.85x ceiling
            tier_factor = 1.0 if denom >= 90.0 or sustained_fps > 65.0 else 0.85
            scores.append(pacing_ratio * tier_factor * 100.0)

    if scores:
        return round(sum(scores) / len(scores), 1)

    estimated_fpe = (0.60 * compute_score) + (0.40 * tss)
    return round(max(30.0, min(88.0, estimated_fpe)), 1)


def _compute_storage_score(device: DeviceTelemetry) -> float:
    """
    4. Storage Speed Tier Multiplier [0 - 100]:
    UFS 4.0 = 100 | UFS 3.1 = 80 | UFS 2.2 = 60
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
    """Calculates the weighted PulseThrottle Index (0-100) and Markdown-safe breakdown."""
    tss = _compute_tss(device)
    comp = _compute_compute_score(device)
    fpe = _compute_fpe(device, tss=tss, compute_score=comp)
    stor = _compute_storage_score(device)

    pti = (0.30 * tss) + (0.30 * fpe) + (0.25 * comp) + (0.15 * stor)
    pti_rounded = round(pti, 1)

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
