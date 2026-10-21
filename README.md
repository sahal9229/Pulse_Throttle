# ⚡ PulseThrottle

**PulseThrottle** is an autonomous mobile hardware intelligence and gaming telemetry agent. It bridges the gap between raw hardware data (SoC architectures, GPU benchmarks, UFS storage tiers, 3DMark stress stability, thermal dissipation, and display PWM dimming) and structured, production-ready engineering reports.

Designed for developers, tech enthusiasts, and mobile engineers, PulseThrottle operates either as an interactive command-line REPL or via a resilient multi-key AI agent backend, featuring local SHA-256 caching, persistent SQLite telemetry analytics, quantitative index scoring, and multi-key failover capabilities.

---

## 🚀 Key Features in Current Version

* **⚡ PulseThrottle Index (PTI) Scoring Engine:**
  A quantitative mathematical scoring model (0–100) that objectively rates overall device performance:
  * **30% Thermal Stability Score (TSS):** Evaluates sustained performance and penalizes thermal runaway based on 3DMark Wild Life Extreme stress stability and peak surface temperatures.
  * **30% FPS Pacing Efficiency (FPE):** Real-world sustained frame rate versus unlocked graphics limits in demanding titles (e.g., BGMI / PUBG Mobile, Genshin Impact).
  * **25% Normalized Compute Score:** Synthetic raw computing capacity derived from AnTuTu v10 and Geekbench 6 (single/multi-core) benchmarks.
  * **15% Storage Speed Tier:** High-speed I/O bandwidth evaluation based on storage generation (e.g., UFS 4.0 vs UFS 3.1 vs UFS 2.2).

* **🏎️ Targeted 4-Way Parallel Telemetry Search:**
  * Multi-threaded `ThreadPoolExecutor` search architecture.
  * Fires focused, concurrent queries per device: separates **Specs & Synthetic Benchmarks** (AnTuTu, Geekbench, UFS, PWM) from **Thermals & Gaming FPS** (3DMark stability, peak Celsius, sustained FPS) to prevent keyword dilution.
  * Deep search ingestion with 1,500-character snippet windows preserving complete benchmark tables from sources like NanoReview and GSMArena.

* **🗄️ Relational SQLite Telemetry Store & Leaderboard:**
  * Persistent storage in `pulsethrottle.db` tracking all telemetry runs, benchmarks, and verdicts.
  * Dynamic schema auto-migration across updates.
  * Built-in interactive CLI analytics commands (`/db`, `/db chip`, `/db cool`, `/db top`).

* **🛡️ Resilient Multi-Tier API Fallback:**
  * Failover architecture: **Primary Gemini Key ➔ Secondary Gemini Key ➔ OpenRouter Gateway**.
  * Handles rate-limits (`429`) and server load without disrupting active sessions.

* **🎯 Strict Pydantic v2 Schema Validation:**
  * Zero-hallucination structured JSON extraction with validated typing.
  * Full support for single-device deep dives and dual-device head-to-head comparisons.

* **⚡ Smart Local SHA-256 Query Cache:**
  * Content-addressed caching layer (`telemetry_cache.json`) delivers sub-millisecond responses for repeated queries, saving API quota.

* **📊 Multi-Format Reporting:**
  * Terminal-rendered tables and styling via Rich.
  * Automatic dual export on every query: `latest_report.md` (human-readable Markdown) and `latest_report.json` (machine-readable structured data).

* **🛑 Zero-Token Input Guardrails:**
  * Pre-execution regex guardrails reject vague or off-topic queries immediately without wasting API tokens.

---

## 🏗️ Architecture & Core Components

```
silicon_pulse/
├── agent.py            # Orchestrator uniting RAG telemetry, scoring, and markdown formatting
├── scoring.py          # Quantitative PulseThrottle Index (PTI) mathematical engine
├── client_manager.py   # Multi-threaded parallel Tavily search & resilient multi-key LLM client
├── engine_db.py        # SQLite relational persistence, auto-migration, and leaderboard analytics
├── schemas.py          # Pydantic v2 models (DeviceTelemetry, GameBenchmark, SiliconPulseReport)
├── tools.py            # Advanced Tavily Search API wrapper with high-capacity snippet extraction
├── cache.py            # SHA-256 content-addressable query cache
├── main.py             # Interactive CLI REPL session manager & database query dispatcher
└── requirements.txt    # Production dependencies
```

---

## 🛠️ Tech Stack

* **Python 3.10+**
* **Google GenAI SDK** (`gemini-3.8-flash`)
* **Tavily Search API** (Advanced Hardware RAG)
* **Pydantic v2** (Strict schema enforcement)
* **SQLite3** (Relational telemetry logging and leaderboard analytics)
* **Rich UI** (Terminal formatting, tables, and Markdown rendering)
* **OpenAI SDK** (OpenRouter gateway failover)

---

## ⚙️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sahal9229/Pulse_Throttle.git
   cd Pulse_Throttle
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python -m venv .venv

   # On Windows (PowerShell):
   .venv\Scripts\Activate

   # On macOS/Linux:
   source .venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY_PRIMARY="your_primary_gemini_key"
   GEMINI_API_KEY_SECONDARY="your_secondary_gemini_key"
   OPENROUTER_API_KEY="your_openrouter_key"
   TAVILY_API_KEY="your_tavily_key"
   ```

---

## 💡 Usage

### 1. Interactive REPL Mode
Launch the interactive terminal session:
```bash
python main.py
```

#### Running Telemetry Queries
At the `PulseThrottle >` prompt, enter any smartphone model or comparison:
* **Single Device:** `How does the Motorola Edge 60 Fusion perform in BGMI, and what are its thermals?`
* **Head-to-Head Comparison:** `Compare Poco F6 vs iQOO Neo 9 Pro for sustained 90fps gaming and PWM dimming`
* **Cache Bypass:** Append `--refresh` to bypass the local cache and fetch fresh live telemetry:
  ```
  PulseThrottle > iQOO 12 BGMI FPS and thermals --refresh
  ```

#### Database & Leaderboard Commands (`/db`)
Inspect historical telemetry and query rankings directly from the REPL prompt:
* `/db` — Show the 10 most recent telemetry runs.
* `/db top` — View leaderboard ranked by PulseThrottle Index (e.g., `/db top 70` for scores ≥ 70).
* `/db chip <keyword>` — Filter runs by chipset (e.g., `/db chip snapdragon` or `/db chip dimensity`).
* `/db cool <temp_celsius>` — Filter runs by peak temperature (e.g., `/db cool 42.0`).
* `/db cool <temp_celsius> <chip>` — Combined thermal and SoC filter (e.g., `/db cool 41.5 dimensity`).

### 2. Direct CLI Argument Mode
Run queries directly from the shell without entering the REPL:
```bash
python main.py "Motorola Edge 60 Pro BGMI 90fps stability"
```

---

## 📊 PulseThrottle Index (PTI) Formula

$$\text{PTI} = 0.30 \times \text{TSS} + 0.30 \times \text{FPE} + 0.25 \times \text{Compute} + 0.15 \times \text{Storage}$$

| Sub-Score | Weight | Metric Base | Details |
| :--- | :---: | :--- | :--- |
| **Thermal Stability Score (TSS)** | 30% | 3DMark Wild Life Stability % & Peak Temp | Scaled from 3DMark stress loops; penalizes thermal runaway exceeding 42°C. |
| **FPS Pacing Efficiency (FPE)** | 30% | Sustained Average FPS vs Target | Measures real-world 30-minute gaming stability without micro-stutters. |
| **Normalized Compute Score** | 25% | AnTuTu v10 & Geekbench 6 | Evaluates raw synthetic CPU & GPU silicon headroom. |
| **Storage Speed Tier** | 15% | UFS Generation (UFS 4.0 / 3.1 / 2.2) | Bandwidth benchmark score for asset loading and background caching. |

---

## 📄 Output Artifacts

Every completed analysis automatically generates two persistent artifacts in your workspace:
* **`latest_report.md`**: Clean, formatted Markdown technical report featuring specification comparison tables, benchmark matrices, thermal evaluations, PulseThrottle Index breakdowns, and an engineering verdict.
* **`latest_report.json`**: Machine-readable JSON structured strictly against the `SiliconPulseReport` Pydantic schema, ready for dashboards, APIs, or database pipelines.