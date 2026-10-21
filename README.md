# ⚡ PulseThrottle

> **99% API-Free Autonomous Mobile Hardware & Gaming Telemetry Engine**

**PulseThrottle** is an autonomous mobile hardware intelligence and gaming telemetry agent. It bridges the gap between raw hardware data (SoC architectures, GPU benchmarks, UFS storage tiers, 3DMark stress stability, thermal dissipation, and display PWM dimming) and structured, production-ready engineering reports.

Unlike traditional LLM wrappers that burn expensive API tokens on basic spec lookups, **PulseThrottle operates 99% API-free**: combining keyless parallel web scraping, bounded deterministic regex extraction, architectural ground-truth baselines, quantitative algorithmic scoring, and local SQLite time-series analytics.

---

## ⚡ 99% API-Free Architecture: How It Works

PulseThrottle is architected to deliver deep, verified hardware analysis with **zero required API keys**:

```
User Query ("Poco F6 vs iQOO Neo 9 Pro BGMI 90fps thermals")
  │
  ├── 1. Zero-Token Regex Guardrail (<1ms) ────────── Block vague/off-topic queries instantly
  │
  ├── 2. Keyless Parallel Web Scraper (tools.py) ───── DuckDuckGo + BeautifulSoup4 concurrent deep scrape
  │
  ├── 3. Bounded Regex & Reference Engine (regex_parser.py) 
  │      └── Extracts AnTuTu v10, Geekbench 6, 3DMark, UFS, PWM & Peak Temp in 0.01s (0 tokens)
  │
  ├── 4. Quantitative Scoring Engine (scoring.py) ──── Calculates PulseThrottle Index (0–100)
  │
  ├── 5. Optional OpenRouter Polish (client_manager.py)
  │      ├── IF OPENROUTER_API_KEY: Polishes gaming notes & verdict via gemini-2.5-flash (~1.5s)
  │      └── IF KEYLESS / OFFLINE: 100% Deterministic Engineering Verdict (0 API keys used)
  │
  └── 6. Relational SQLite Store & Analytics (engine_db.py) ── Logs to pulsethrottle.db & /db top
```

---

## 🚀 Core Pillars & Current Features

### 1. 🌐 Keyless Parallel Web Scraper (`tools.py`)
* **100% Keyless Primary Search:** Executes concurrent queries via DuckDuckGo Search without requiring any search API keys or subscriptions.
* **Deep Page Text Extraction:** Automatically fetches and cleans HTML content from top benchmark URLs in parallel using `BeautifulSoup4` (up to 3,000 characters per page).
* **Hybrid Fallback:** Gracefully supplements with Tavily advanced search only if keyless snippets lack benchmark depth and `TAVILY_API_KEY` is present.

### 2. 🎯 Bounded Regex & Hardware Reference Engine (`regex_parser.py`)
* **Number Collision Prevention:** Bounded context windows strictly separate overlapping digits:
  * **AnTuTu v10:** `[150,000 – 3,500,000]` (supports shorthand notations like `1.44M` or `1.38 million`).
  * **Geekbench 6:** Single-core `[400 – 3,800]` and Multi-core `[1,000 – 12,000]`.
  * **3DMark Wild Life Stability:** Strictly bounded to `[40.0% – 99.9%]`.
  * **Peak Thermal Dissipation:** Bounded strictly to `[35.0°C – 55.0°C]`.
* **Hardware Reference DB:** Contains ground-truth hardware anchors for common SoCs and Indian retail variants (e.g., Dimensity 8350 Extreme, Dimensity 7400, Snapdragon 8s Gen 3) so known architectural metrics never show "Not Reported".
* **BGMI Context Guard:** Isolates frame-rate figures exclusively within gaming telemetry snippets, ensuring display refresh rates or video recording settings (`4K@60fps`) never pollute benchmark metrics.

### 3. 📊 Quantitative PulseThrottle Index (PTI) Engine (`scoring.py`)
An objective, mathematical performance score normalized from 0 to 100:

$$\text{PTI} = 0.30 \times \text{TSS} + 0.30 \times \text{FPE} + 0.25 \times \text{Compute} + 0.15 \times \text{Storage}$$

| Sub-Score | Weight | Metric Base | Details |
| :--- | :---: | :--- | :--- |
| **Thermal Stability Score (TSS)** | 30% | 3DMark Wild Life % & Peak Temp | Scaled from 3DMark loops; penalizes thermal runaway exceeding 42°C. |
| **FPS Pacing Efficiency (FPE)** | 30% | Sustained FPS & Tier Multiplier | Evaluates frame stability with tier weighting ($1.0\times$ for 90/120 FPS vs $0.85\times$ ceiling for 60 FPS capped). |
| **Normalized Compute Score** | 25% | AnTuTu v10 & Geekbench 6 | Evaluates raw synthetic CPU & GPU silicon headroom. |
| **Storage Speed Tier** | 15% | UFS Generation (UFS 4.0 / 3.1 / 2.2) | Bandwidth score for asset streaming and load times. |

### 4. 🗄️ Relational SQLite Time-Series DB & Leaderboard (`engine_db.py`)
* **Relational Storage:** Automatically logs every query into normalized SQLite tables (`devices` and `telemetry_runs`) inside `pulsethrottle.db`.
* **Safe Connection Lifecycle:** Implements `contextlib.closing` to guarantee clean resource management with zero SQLite handle leaks.
* **Window-Function Leaderboard Deduplication:** `/db top` leverages SQL window functions (`ROW_NUMBER() OVER PARTITION BY device_id`) so each unique device appears only once on the leaderboard with its highest-scoring, most complete telemetry run.

### 5. ✨ Lightweight Optional OpenRouter Polish (`client_manager.py`)
* **Speed & Economy:** When `OPENROUTER_API_KEY` is present, it uses `google/gemini-2.5-flash` via OpenRouter to polish gaming notes and synthesize custom verdicts in ~1.5s.
* **Safety Merge:** Guaranteed protection ensuring regex-verified numbers are never overwritten with nulls.
* **Verdict Score Synchronization:** Dynamically calculates and prepends the exact PTI score delta to the top of the verdict.
* **Complete Offline Fallback:** If OpenRouter is missing or quota-depleted, PulseThrottle immediately falls back to its deterministic verdict engine without error.

---

## 🏗️ Architecture & Core Components

```
silicon_pulse/
├── agent.py            # Orchestrator uniting telemetry, scoring, and markdown formatting
├── scoring.py          # Quantitative PulseThrottle Index (PTI) mathematical engine
├── regex_parser.py     # Deterministic context-bounded extractor & hardware reference anchors
├── client_manager.py   # Multi-threaded parallel scraper & resilient fallback client
├── engine_db.py        # SQLite relational store, auto-migration, and leaderboard analytics
├── schemas.py          # Pydantic v2 models (DeviceTelemetry, GameBenchmark, SiliconPulseReport)
├── tools.py            # Keyless DuckDuckGo + BeautifulSoup4 web scraper with Tavily backup
├── main.py             # Interactive CLI REPL session manager & database query dispatcher
└── requirements.txt    # Production dependencies
```

---

## 🛠️ Tech Stack

* **Language:** Python 3.10+
* **Keyless Web Scraping:** DuckDuckGo Search (`ddgs`) + `BeautifulSoup4` + `requests`
* **Schema Validation:** Pydantic v2
* **Database & Analytics:** SQLite3 + `contextlib.closing`
* **Terminal UI:** Rich (Styled tables, panels, and Markdown rendering)
* **Optional Polish Gateway:** OpenAI SDK (`openrouter.ai`) / Tavily API (Hybrid fallback)

---

## ⚙️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sahal9229/Pulse_Throttle.git
   cd Pulse_Throttle
   git checkout feature/keyless-telemetry
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

4. **Configure environment variables (Optional):**
   PulseThrottle runs **100% keyless out of the box**. To enable optional LLM polish or hybrid Tavily backup, create a `.env` file:
   ```env
   # Optional: For LLM-polished verdicts
   OPENROUTER_API_KEY="your_openrouter_key"

   # Optional: For hybrid fallback scraping
   TAVILY_API_KEY="your_tavily_key"
   ```

---

## 💡 Usage

### 1. Interactive REPL Mode
Launch the interactive terminal session:
```bash
python main.py
```

#### Telemetry Queries
At the `PulseThrottle >` prompt, enter any smartphone model or comparison:
* **Single Device:** `How does the Motorola Edge 60 Fusion perform in BGMI, and what are its thermals?`
* **Head-to-Head Comparison:** `Compare Poco F6 vs iQOO Neo 9 Pro for sustained 90fps gaming and PWM dimming`
* **Cache Bypass:** Append `--refresh` to bypass local cache and fetch fresh live telemetry:
  ```
  PulseThrottle > iQOO 12 BGMI FPS and thermals --refresh
  ```

#### Database & Leaderboard Commands (`/db`)
Inspect historical telemetry and query rankings directly from the REPL prompt:
* `/db` — Show the 10 most recent telemetry runs.
* `/db top` — View leaderboard ranked by PulseThrottle Index (deduplicated per device).
* `/db top <min_score>` — View leaderboard filtered by minimum score (e.g., `/db top 75`).
* `/db chip <keyword>` — Filter runs by chipset (e.g., `/db chip snapdragon` or `/db chip dimensity`).
* `/db cool <temp_celsius>` — Filter runs by thermal efficiency (e.g., `/db cool 42.0`).
* `/db cool <temp_celsius> <chip>` — Combined thermal and SoC filter (e.g., `/db cool 41.5 dimensity`).

### 2. Direct CLI Argument Mode
Run queries directly from the shell without entering the REPL:
```bash
python main.py "Motorola Edge 60 Pro BGMI 90fps stability"
```

---

## 📄 Output Artifacts

Every completed analysis automatically generates two persistent artifacts in your workspace:
* **`latest_report.md`**: Clean, formatted Markdown technical report featuring specification comparison tables, benchmark matrices, thermal evaluations, PulseThrottle Index breakdowns, and an engineering verdict.
* **`latest_report.json`**: Machine-readable JSON structured strictly against the `SiliconPulseReport` Pydantic schema, ready for dashboards, APIs, or database pipelines.