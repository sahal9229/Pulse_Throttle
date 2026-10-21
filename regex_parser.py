import re
from urllib.parse import urlparse
from typing import List, Optional, Tuple
from schemas import DeviceTelemetry, GameBenchmark, SiliconPulseReport
from scoring import enrich_report_with_scores

# Known regional hardware overrides for Indian retail variants
REGIONAL_INDIA_OVERRIDES = {
    "edge 60 fusion": {
        "soc": "MediaTek Dimensity 7400 (4nm TSMC, 4x 2.6 GHz Cortex-A78 + 4x 2.0 GHz Cortex-A55)",
        "gpu_storage": "ARM Mali-G615 MC2, LPDDR4X RAM, UFS 2.2",
    },
    "edge 60 pro": {
        "soc": "MediaTek Dimensity 8350 Extreme (4nm TSMC, 1x 3.35 GHz + 3x 3.20 GHz Cortex-A715 + 4x 2.20 GHz Cortex-A510)",
        "gpu_storage": "ARM Mali-G615 MC6, LPDDR5X RAM, UFS 4.0",
    },
}


def extract_sources(raw_text: str) -> List[str]:
    """Extracts unique domain names from scraped Source URLs."""
    urls = re.findall(r"Source:\s*(https?://[^\s]+)", raw_text)
    domains = []
    for u in urls:
        host = urlparse(u).netloc.replace("www.", "")
        if host and host not in domains:
            domains.append(host)
    return domains[:5] if domains else ["GSMArena", "NanoReview"]


def extract_soc(raw_text: str, device_name: str) -> str:
    """Extracts SoC chipset name and node size using bounded regex patterns."""
    name_lower = device_name.lower()
    for key, override in REGIONAL_INDIA_OVERRIDES.items():
        if key in name_lower:
            return override["soc"]

    patterns = [
        r"((?:Qualcomm\s+)?Snapdragon\s+\d+\s*(?:s?\s*Gen\s*\d+|Elite|Plus|\+)?(?:\s*\(\d+\s*nm\))?)",
        r"((?:MediaTek\s+)?Dimensity\s+\d{4}(?:\s*(?:Ultra|Extreme|Pro|Plus|Max))?(?:\s*\(\d+\s*nm\))?)",
        r"((?:Apple\s+)?A1[5-9]\s*(?:Pro|Bionic)?(?:\s*\(\d+\s*nm\))?)",
        r"((?:Samsung\s+)?Exynos\s+\d{4}(?:\s*\(\d+\s*nm\))?)",
        r"((?:Google\s+)?Tensor\s+G[2-5](?:\s*\(\d+\s*nm\))?)",
    ]
    for pat in patterns:
        match = re.search(pat, raw_text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
    return "Unverified SoC Architecture"


def extract_gpu_and_storage(raw_text: str, device_name: str) -> str:
    """Deterministically extracts GPU model, RAM tier, and UFS storage version."""
    name_lower = device_name.lower()
    for key, override in REGIONAL_INDIA_OVERRIDES.items():
        if key in name_lower:
            return override["gpu_storage"]

    gpu_match = re.search(
        r"\b(Adreno\s*\d{3}[a-zA-Z]*|Mali-G\d+\s*(?:MC\d+|MP\d+)?|Immortalis-G\d+\s*(?:MC\d+)?|Xclipse\s*\d{3}|Apple\s*GPU(?:\s*\(\d+-core\))?)\b",
        raw_text,
        re.IGNORECASE,
    )
    ram_match = re.search(r"\b(LPDDR[45][X]?)\b", raw_text, re.IGNORECASE)
    ufs_match = re.search(r"\b(UFS\s*[234]\.[012]|NVMe|eMMC\s*5\.1)\b", raw_text, re.IGNORECASE)

    parts = []
    if gpu_match:
        parts.append(gpu_match.group(1).strip())
    if ram_match:
        parts.append(f"{ram_match.group(1).upper()} RAM")
    if ufs_match:
        parts.append(ufs_match.group(1).upper())

    return ", ".join(parts) if parts else "Standard GPU / Unverified UFS Tier"


def extract_antutu(raw_text: str) -> Optional[int]:
    """Context-window bounded regex for AnTuTu v10 (strictly 150,000 to 3,500,000)."""
    for match in re.finditer(r"antutu[^\n\.]{0,80}?(\d[\d,]{5,8})", raw_text, re.IGNORECASE):
        digits = match.group(1).replace(",", "")
        if digits.isdigit():
            val = int(digits)
            if 150_000 <= val <= 3_500_000:
                return val
    return None


def extract_geekbench(raw_text: str) -> Tuple[Optional[int], Optional[int]]:
    """Extracts Geekbench 6 Single-Core [400..3800] and Multi-Core [1000..12000]."""
    single_val, multi_val = None, None

    # Look for explicit Single / Multi labels near numbers
    s_match = re.search(r"(?:single[- ]core|geekbench\s*6?\s*single)[^\d]{0,35}(\d[\d,]{2,4})", raw_text, re.IGNORECASE)
    m_match = re.search(r"(?:multi[- ]core|geekbench\s*6?\s*multi)[^\d]{0,35}(\d[\d,]{3,5})", raw_text, re.IGNORECASE)

    if s_match:
        v = int(s_match.group(1).replace(",", ""))
        if 400 <= v <= 3800:
            single_val = v
    if m_match:
        v = int(m_match.group(1).replace(",", ""))
        if 1000 <= v <= 12000:
            multi_val = v

    # Fallback: look inside a 100-char window after "Geekbench"
    if not (single_val and multi_val):
        for gb_win in re.finditer(r"geekbench[^\n]{0,100}", raw_text, re.IGNORECASE):
            nums = [int(n.replace(",", "")) for n in re.findall(r"\b\d[\d,]{2,4}\b", gb_win.group(0))]
            valid_singles = [n for n in nums if 450 <= n <= 3500]
            valid_multis = [n for n in nums if 1200 <= n <= 11000]
            if valid_singles and valid_multis:
                s_cand = min(valid_singles)
                m_cand = max(valid_multis)
                if m_cand > s_cand * 1.4:
                    single_val = single_val or s_cand
                    multi_val = multi_val or m_cand
                    break

    return single_val, multi_val


def extract_wildlife_stability(raw_text: str) -> Optional[float]:
    """Extracts 3DMark Wild Life stability percentage [40.0% - 99.9%]."""
    patterns = [
        r"(?:stability|wild\s*life)[^\n\.]{0,70}?(\d{2}(?:\.\d)?)\s*%",
        r"(\d{2}(?:\.\d)?)\s*%\s*(?:stability|wild\s*life)",
    ]
    for pat in patterns:
        for m in re.finditer(pat, raw_text, re.IGNORECASE):
            val = float(m.group(1))
            if 40.0 <= val <= 99.9:
                return val
    return None


def extract_peak_temp(raw_text: str) -> Optional[float]:
    """Extracts peak surface temperature in Celsius strictly bounded to [35.0°C - 55.0°C]."""
    for m in re.finditer(r"\b(3[5-9]|4[0-9]|5[0-5])(?:\.(\d))?\s*°?\s*C\b", raw_text):
        whole = m.group(1)
        dec = m.group(2) or "0"
        val = float(f"{whole}.{dec}")
        if 35.0 <= val <= 55.0:
            return val
    return None


def extract_pwm_dimming(raw_text: str) -> str:
    """Extracts PWM dimming frequency (e.g., 720Hz, 2160Hz, 3840Hz) or DC Dimming."""
    pwm_match = re.search(r"\b(\d{3,4})\s*Hz\s*PWM|\bPWM\s*(?:dimming)?[^\d]{0,25}(\d{3,4})\s*Hz", raw_text, re.IGNORECASE)
    if pwm_match:
        hz = pwm_match.group(1) or pwm_match.group(2)
        return f"{hz}Hz"
    if re.search(r"\bdc\s*dimming\b", raw_text, re.IGNORECASE):
        return "DC Dimming / Flicker-Free"
    return "Not Reported"


def extract_bgmi_benchmark(raw_text: str, soc: str) -> GameBenchmark:
    """Extracts real-world BGMI/gaming FPS or builds an architecture-informed baseline."""
    fps_matches = re.findall(r"(\d{2,3}(?:\s*[-–to]+\s*\d{2,3})?)\s*fps", raw_text, re.IGNORECASE)
    valid_fps = []
    for f in fps_matches:
        nums = [int(n) for n in re.findall(r"\d+", f) if 30 <= int(n) <= 120]
        if nums:
            valid_fps.append((f.strip(), max(nums)))

    if valid_fps:
        max_cap = max(v[1] for v in valid_fps)
        unlocked_str = f"Smooth + {max_cap} FPS" if max_cap in (60, 90, 120) else f"Up to {max_cap} FPS"
        # Look for range like "57-60" or sustained numbers
        ranges = [v[0] for v in valid_fps if "-" in v[0] or "to" in v[0]]
        sustained_str = f"{ranges[0]} FPS" if ranges else f"{valid_fps[0][0]} FPS"
        return GameBenchmark(
            game_name="BGMI / PUBG Mobile",
            max_unlocked_setting=unlocked_str,
            sustained_avg_fps=sustained_str,
            thermal_and_frame_drop_notes="Extracted from web gaming telemetry snippets.",
        )

    return GameBenchmark(
        game_name="BGMI / PUBG Mobile",
        max_unlocked_setting="Smooth + 60/90 FPS",
        sustained_avg_fps="Unverified",
        thermal_and_frame_drop_notes=f"Direct BGMI frame-rate logs not found in snippet; performance governed by {soc}.",
    )


def parse_device_from_text(device_name: str, raw_text: str) -> DeviceTelemetry:
    """Builds a complete DeviceTelemetry preset purely from regex & heuristics (0 API tokens)."""
    soc = extract_soc(raw_text, device_name)
    gpu_storage = extract_gpu_and_storage(raw_text, device_name)
    antutu = extract_antutu(raw_text)
    gb_s, gb_m = extract_geekbench(raw_text)
    stability = extract_wildlife_stability(raw_text)
    temp = extract_peak_temp(raw_text)
    pwm = extract_pwm_dimming(raw_text)
    bgmi = extract_bgmi_benchmark(raw_text, soc)
    sources = extract_sources(raw_text)

    return DeviceTelemetry(
        device_name=device_name.strip(),
        soc_chipset=soc,
        gpu_and_storage=gpu_storage,
        antutu_v10_score=antutu,
        geekbench_6_single=gb_s,
        geekbench_6_multi=gb_m,
        wildlife_stability_pct=stability,
        peak_temp_celsius=temp,
        pwm_dimming_hz=pwm,
        game_benchmarks=[bgmi],
        sources=sources,
    )


def build_deterministic_verdict(
    mode: str, p1: DeviceTelemetry, p2: Optional[DeviceTelemetry] = None
) -> str:
    """Generates a deterministic, data-driven engineering verdict when running keyless/offline."""
    if mode == "SINGLE_DEVICE" or p2 is None:
        antutu_str = f"{p1.antutu_v10_score:,}" if p1.antutu_v10_score else "unverified synthetic"
        return (
            f"{p1.device_name} achieves a PulseThrottle Index of {p1.pulse_throttle_index}/100 "
            f"({p1.score_breakdown}). Powered by {p1.soc_chipset} paired with {p1.gpu_and_storage} "
            f"({antutu_str} AnTuTu v10), it is well-suited for sustained mobile workloads."
        )

    winner = p1 if (p1.pulse_throttle_index or 0) >= (p2.pulse_throttle_index or 0) else p2
    loser = p2 if winner == p1 else p1
    diff = round(abs((p1.pulse_throttle_index or 0) - (p2.pulse_throttle_index or 0)), 1)

    return (
        f"**{winner.device_name}** leads this head-to-head comparison with a PulseThrottle Index of "
        f"**{winner.pulse_throttle_index}/100** vs **{loser.device_name}** at **{loser.pulse_throttle_index}/100** "
        f"(+{diff} point advantage). Equipped with {winner.soc_chipset} and {winner.gpu_and_storage}, "
        f"{winner.device_name} delivers stronger compute throughput and superior memory bandwidth under sustained gaming loads."
    )
