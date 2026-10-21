from concurrent.futures import ThreadPoolExecutor
import re
import os
import json
from typing import Tuple, Optional
from dotenv import load_dotenv
from openai import OpenAI
from rich.console import Console
from schemas import SiliconPulseReport
from tools import search_hardware_telemetry
from regex_parser import parse_device_from_text, build_deterministic_verdict
from scoring import enrich_report_with_scores

load_dotenv()
console = Console()

KNOWN_HARDWARE_KEYWORDS = {
    "moto", "motorola", "edge", "samsung", "galaxy", "s23", "s24", "s25", "iphone", "apple",
    "xiaomi", "redmi", "poco", "oneplus", "nord", "iqoo", "vivo", "oppo", "realme", "gt",
    "nothing", "pixel", "google", "asus", "rog", "infinix", "tecno", "lava", "sony", "xperia",
    "honor", "huawei", "nubia", "redmagic", "lenovo", "legion", "snapdragon", "dimensity",
    "exynos", "bionic", "tensor", "helio", "unisoc"
}


def is_specific_hardware_query(query: str) -> bool:
    words = set(re.findall(r"[a-z0-9]+", query.lower()))
    if words.intersection(KNOWN_HARDWARE_KEYWORDS):
        return True
    if re.search(r"\b([a-z]{1,3}\d{1,3}|\d{1,2}\s*(pro|ultra|plus|max|fe|fusion|neo|gt))\b", query.lower()):
        return True
    return False


class ResilientAgentClient:
    def __init__(self):
        self.openrouter_key = os.environ.get("OPENROUTER_API_KEY")

    def _scrape_and_preparse(
        self, user_query: str
    ) -> Tuple[SiliconPulseReport, str]:
        """
        Stage 1 & 2: Scrapes telemetry in parallel with concise queries and populates
        the preset deterministically using bounded regex (`regex_parser.py`).
        """
        vs_split = re.split(r"\b(?:vs\.?|versus)\b", user_query, flags=re.IGNORECASE)
        clean_pattern = r"(?i)\b(compare|how|does|the|perform|in|for|sustained|gaming|bgmi|genshin|pwm|dimming|90fps|60fps|120fps|and|with|what|are|its|thermals|performance)\b"

        if len(vs_split) == 2:
            phone_a = re.sub(clean_pattern, "", vs_split[0]).strip() or vs_split[0].strip()
            phone_b = re.sub(clean_pattern, "", vs_split[1]).strip() or vs_split[1].strip()

            queries = [
                f"{phone_a} AnTuTu v10 Geekbench 6 UFS specs",
                f"{phone_a} 3DMark Wild Life stability temp BGMI FPS",
                f"{phone_b} AnTuTu v10 Geekbench 6 UFS specs",
                f"{phone_b} 3DMark Wild Life stability temp BGMI FPS",
            ]
            with ThreadPoolExecutor(max_workers=4) as executor:
                results = list(executor.map(search_hardware_telemetry, queries))

            text_a = f"{results[0]}\n\n{results[1]}"
            text_b = f"{results[2]}\n\n{results[3]}"

            dev_a = parse_device_from_text(phone_a, text_a)
            dev_b = parse_device_from_text(phone_b, text_b)

            preset = SiliconPulseReport(
                mode="DUAL_COMPARISON",
                target_workload=user_query,
                primary_device=dev_a,
                secondary_device=dev_b,
                engineering_verdict="",
            )
            enrich_report_with_scores(preset)
            preset.engineering_verdict = build_deterministic_verdict("DUAL_COMPARISON", dev_a, dev_b)

            raw_summary = (
                f"=== DEVICE A ({phone_a}) ===\n{text_a[:2500]}\n\n"
                f"=== DEVICE B ({phone_b}) ===\n{text_b[:2500]}"
            )
            return preset, raw_summary

        else:
            phone = re.sub(clean_pattern, "", user_query).strip() or user_query.strip()
            queries = [
                f"{phone} AnTuTu v10 Geekbench 6 UFS specs",
                f"{phone} 3DMark Wild Life stability temp BGMI FPS",
            ]
            with ThreadPoolExecutor(max_workers=2) as executor:
                results = list(executor.map(search_hardware_telemetry, queries))

            text_single = f"{results[0]}\n\n{results[1]}"
            dev_1 = parse_device_from_text(phone, text_single)

            preset = SiliconPulseReport(
                mode="SINGLE_DEVICE",
                target_workload=user_query,
                primary_device=dev_1,
                secondary_device=None,
                engineering_verdict="",
            )
            enrich_report_with_scores(preset)
            preset.engineering_verdict = build_deterministic_verdict("SINGLE_DEVICE", dev_1, None)

            return preset, text_single[:3500]

    def run_chat_with_fallback(
        self, model_id: str, system_instructions: str, user_query: str
    ) -> SiliconPulseReport:
        # Step 0: Instant Zero-Token Input Guardrail
        if not is_specific_hardware_query(user_query):
            return SiliconPulseReport(
                mode="INVALID_QUERY",
                target_workload="Rejected by Input Guardrail",
                primary_device=None,
                secondary_device=None,
                engineering_verdict=(
                    f"Query Rejected: '{user_query}' does not specify a recognizable smartphone model or SoC chipset. "
                    "PulseThrottle requires at least one concrete device model to pull hardware telemetry.\n\n"
                    "Try queries like:\n"
                    "• 'Motorola Edge 60 Fusion BGMI FPS and thermals'\n"
                    "• 'Compare Poco F6 vs iQOO Neo 9 Pro for sustained 90fps gaming and PWM dimming'"
                ),
            )

        # Stage 1 & 2: Keyless Web Scrape + Deterministic Regex Preset Extraction
        console.print("  [green]⚙️ Building deterministic hardware preset via Regex Engine...[/green]")
        regex_preset, raw_snippets = self._scrape_and_preparse(user_query)

        if self.openrouter_key:
            try:
                console.print("  [magenta]✨ Polishing gaming telemetry & verdict via OpenRouter...[/magenta]")
                return self._run_openrouter_polish(system_instructions, regex_preset, raw_snippets)
            except Exception as e:
                console.print(
                    f"[yellow]⚠️ OpenRouter unavailable ({str(e)}). Using 100% Keyless Deterministic Preset![/yellow]"
                )

        # Populate deterministic verdict only when falling back or running keyless
        regex_preset.engineering_verdict = build_deterministic_verdict(
            regex_preset.mode, regex_preset.primary_device, regex_preset.secondary_device
        )
        return regex_preset

    def _run_openrouter_polish(
        self, system_instructions: str, preset: SiliconPulseReport, raw_snippets: str
    ) -> SiliconPulseReport:
        """
        Sends the regex pre-filled preset to OpenRouter so the LLM only fills missing nulls,
        normalizes BGMI FPS strings, and writes a crisp Engineering Verdict.
        Protects verified regex numbers from being overwritten with nulls.
        """
        schema_json = json.dumps(SiliconPulseReport.model_json_schema(), indent=2)
        preset_json = preset.model_dump_json(indent=2)

        or_client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=self.openrouter_key,
            timeout=18.0,
        )

        or_prompt = (
            f"Pre-Extracted Deterministic Preset JSON (DO NOT delete verified numbers):\n{preset_json}\n\n"
            f"Raw Web Telemetry Snippets:\n{raw_snippets}\n\n"
            "INSTRUCTIONS:\n"
            "1. Keep all non-null numbers already extracted in the Preset JSON unless the snippet shows a clearer verified figure.\n"
            "2. Fill in any null/missing benchmark fields (AnTuTu v10, Geekbench 6, 3DMark stability %, Peak Temp °C, PWM Hz, BGMI FPS) if present in the snippets.\n"
            "3. Write a concise, technical 4-sentence `engineering_verdict` comparing the hardware and gaming capability.\n"
            f"4. Return ONLY valid JSON matching this schema:\n{schema_json}"
        )

        completion = or_client.chat.completions.create(
            model="google/gemini-2.5-flash",
            messages=[
                {"role": "system", "content": system_instructions},
                {"role": "user", "content": or_prompt},
            ],
            response_format={"type": "json_object"},
            max_tokens=1500,
            temperature=0.0,
        )
        if not completion or not getattr(completion, "choices", None):
            raise ValueError("Empty choices returned from OpenRouter.")

        content = completion.choices[0].message.content
        if not content:
            raise ValueError("Empty message content from OpenRouter.")

        polished = SiliconPulseReport.model_validate_json(content)

        self._preserve_regex_metrics(preset.primary_device, polished.primary_device)
        if preset.secondary_device and polished.secondary_device:
            self._preserve_regex_metrics(preset.secondary_device, polished.secondary_device)

        polished = enrich_report_with_scores(polished)
        if polished.mode == "DUAL_COMPARISON" and polished.primary_device and polished.secondary_device:
            p1, p2 = polished.primary_device, polished.secondary_device
            diff = round(abs((p1.pulse_throttle_index or 0) - (p2.pulse_throttle_index or 0)), 1)
            lead = p1 if (p1.pulse_throttle_index or 0) >= (p2.pulse_throttle_index or 0) else p2
            trail = p2 if lead == p1 else p1
            header = (
                f"**{lead.device_name}** leads with a PulseThrottle Index of "
                f"**{lead.pulse_throttle_index}/100** vs **{trail.device_name}** at "
                f"**{trail.pulse_throttle_index}/100** (+{diff} pts). "
            )
            # Strip any stale score sentence from the LLM and prepend the exact calculated header
            cleaned_verdict = re.sub(r"^[^.]*PulseThrottle Index[^.]*\.\s*", "", polished.engineering_verdict)
            polished.engineering_verdict = header + cleaned_verdict
        return polished

    @staticmethod
    def _preserve_regex_metrics(regex_dev, llm_dev) -> None:
        if not regex_dev or not llm_dev:
            return
        for field in [
            "antutu_v10_score",
            "geekbench_6_single",
            "geekbench_6_multi",
            "wildlife_stability_pct",
            "peak_temp_celsius",
        ]:
            if getattr(llm_dev, field) is None and getattr(regex_dev, field) is not None:
                setattr(llm_dev, field, getattr(regex_dev, field))
        if llm_dev.pwm_dimming_hz in ("Not Reported", "Unverified", "") and regex_dev.pwm_dimming_hz != "Not Reported":
            llm_dev.pwm_dimming_hz = regex_dev.pwm_dimming_hz