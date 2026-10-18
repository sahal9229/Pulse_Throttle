import os
import re
import json
from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.genai.errors import ClientError
from openai import OpenAI
from rich.console import Console
from schemas import SiliconPulseReport
from tools import search_hardware_telemetry

load_dotenv()
console = Console()

# Known smartphone brands, series, and chip keywords
KNOWN_HARDWARE_KEYWORDS = {
    "moto", "motorola", "edge", "samsung", "galaxy", "s23", "s24", "s25", "iphone", "apple",
    "xiaomi", "redmi", "poco", "oneplus", "nord", "iqoo", "vivo", "oppo", "realme", "gt",
    "nothing", "pixel", "google", "asus", "rog", "infinix", "tecno", "lava", "sony", "xperia",
    "honor", "huawei", "nubia", "redmagic", "lenovo", "legion", "snapdragon", "dimensity",
    "exynos", "bionic", "tensor", "helio", "unisoc"
}

def is_specific_hardware_query(query: str) -> bool:
    """
    Fast 0-token guardrail: Checks if the query mentions at least one recognizable
    smartphone brand, model series, or chipset keyword (or model number like 'f6', '15 pro').
    """
    words = set(re.findall(r"[a-z0-9]+", query.lower()))
    if words.intersection(KNOWN_HARDWARE_KEYWORDS):
        return True
    # Also allow queries with alphanumeric model numbers like "x100", "f6", "z9", "16 pro"
    if re.search(r"\b([a-z]{1,3}\d{1,3}|\d{1,2}\s*(pro|ultra|plus|max|fe|fusion|neo|gt))\b", query.lower()):
        return True
    return False


class ResilientAgentClient:
    def __init__(self):
        self.primary_key = os.environ.get("GEMINI_API_KEY_PRIMARY") or os.environ.get("GEMINI_API_KEY")
        self.secondary_key = os.environ.get("GEMINI_API_KEY_SECONDARY")
        self.openrouter_key = os.environ.get("OPENROUTER_API_KEY")

    def _gather_web_telemetry(self, user_query: str) -> str:
        """
        Deterministically runs targeted Tavily web searches in Python FIRST.
        This uses 0 LLM requests for tool-looping, saving 80% of your Gemini RPM quota!
        """
        q_lower = user_query.lower()
        chunks = []

        # If comparing two phones (contains 'vs' or 'compare'), run 2 targeted searches
        if " vs " in q_lower or "compare" in q_lower:
            chunks.append(search_hardware_telemetry(f"{user_query} specifications chipset UFS storage PWM dimming Hz"))
            chunks.append(search_hardware_telemetry(f"{user_query} 3DMark Wild Life Extreme stability temperature BGMI FPS test"))
        else:
            # Single phone deep dive
            chunks.append(search_hardware_telemetry(f"{user_query} specifications chipset UFS storage PWM dimming 3DMark stability temperature"))
            chunks.append(search_hardware_telemetry(f"{user_query} real world gaming test sustained FPS thermal throttling"))

        return "\n\n===\n\n".join(chunks)

    def run_chat_with_fallback(
        self, model_id: str, system_instructions: str, user_query: str
    ) -> SiliconPulseReport:
        """
        1. Gathers live web telemetry via Tavily (0 LLM calls).
        2. Makes exactly 1 structured JSON call to Primary Gemini Key.
        3. Fails over to Secondary Gemini Key -> OpenRouter if needed.
        """
        # GUARDRAIL: Reject vague/non-device queries in 0.001s before spending Tavily or Gemini tokens!
        if not is_specific_hardware_query(user_query):
            return SiliconPulseReport(
                mode="INVALID_QUERY",
                target_workload="Rejected by Input Guardrail",
                primary_device=None,
                secondary_device=None,
                engineering_verdict=(
                    f"Query Rejected: '{user_query}' does not specify a recognizable smartphone model or SoC chipset. "
                    "SiliconPulse requires at least one concrete device model to pull hardware telemetry.\n\n"
                    "Try queries like:\n"
                    "• 'Motorola Edge 60 Fusion BGMI FPS and thermals'\n"
                    "• 'Compare Poco F6 vs iQOO Neo 9 Pro for sustained 90fps gaming and PWM dimming'"
                ),
            )

        raw_telemetry = self._gather_web_telemetry(user_query)

        combined_prompt = (
            f"User Query: {user_query}\n\n"
            f"Verified Web Search Telemetry:\n{raw_telemetry}\n\n"
            "Analyze the telemetry above and populate the SiliconPulseReport JSON schema."
        )

        gemini_keys = [
            ("Primary Gemini Key", self.primary_key),
            ("Secondary Gemini Key", self.secondary_key),
        ]

        for label, key in gemini_keys:
            if not key:
                continue
            try:
                client = genai.Client(api_key=key)
                response = client.models.generate_content(
                    model=model_id,
                    contents=combined_prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instructions,
                        response_mime_type="application/json",
                        response_schema=SiliconPulseReport,
                        temperature=0.0,
                    ),
                )
                if not response.text:
                    raise ValueError("Empty response text from model.")
                return SiliconPulseReport.model_validate_json(response.text)

            except ClientError as e:
                if e.code == 429:
                    console.print(f"[yellow]⚠️ [Rate Limit 429] {label} quota reached. Switching to backup key...[/yellow]")
                    continue
                console.print(f"[yellow]⚠️ API Error on {label} ({e.code}). Switching to backup key...[/yellow]")
                continue
            except Exception as e:
                console.print(f"[yellow]⚠️ Error on {label}: {str(e)}. Trying next key...[/yellow]")
                continue

        # 3. Ultimate Fallback: OpenRouter (Strictly capped at 2000 max_tokens)
        if self.openrouter_key:
            console.print("[bold magenta]🔄 Switching to OpenRouter Backup Gateway...[/bold magenta]")
            return self._run_openrouter_fallback(system_instructions, combined_prompt)

        raise RuntimeError("❌ All configured API keys (Primary, Secondary, OpenRouter) failed or exhausted their quotas!")

    def _run_openrouter_fallback(self, system_instructions: str, combined_prompt: str) -> SiliconPulseReport:
        schema_json = json.dumps(SiliconPulseReport.model_json_schema(), indent=2)

        or_client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=self.openrouter_key,
        )

        or_prompt = (
            f"{combined_prompt}\n\n"
            f"CRITICAL: Return ONLY valid JSON matching this exact Pydantic schema:\n{schema_json}"
        )

        completion = or_client.chat.completions.create(
            model="google/gemini-2.5-flash",
            messages=[
                {"role": "system", "content": system_instructions},
                {"role": "user", "content": or_prompt},
            ],
            response_format={"type": "json_object"},
            max_tokens=2000,
            temperature=0.0,
        )
        content = completion.choices[0].message.content
        return SiliconPulseReport.model_validate_json(content)