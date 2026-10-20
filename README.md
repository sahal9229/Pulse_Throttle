# ⚡ PulseThrottle

**PulseThrottle** is an autonomous mobile hardware and gaming telemetry agent. It bridges the gap between raw hardware data (SoC architectures, GPU benchmarks, UFS storage tiers, 3DMark stress stability, thermal behavior, and display PWM dimming) and structured, production-ready engineering reports. 

Designed for developers, tech enthusiasts, and data engineers, PulseThrottle operates either as an interactive command-line REPL tool or via a resilient multi-key AI agent backend, featuring local SHA-256 query caching, strict Pydantic v2 validation, and multi-key failover capabilities.

---

## 🏗️ Architecture & Core Components

PulseThrottle is built with a modular, clean-code architecture:

* **`schemas.py`**: Defines the rigorous Pydantic v2 models (`PulseThrottleReport` / `SiliconPulseReport`, `DeviceTelemetry`, `GameBenchmark`) supporting both single-device deep dives and dual-device head-to-head comparisons, complete with intent guardrails (`INVALID_QUERY` handling).
* **`tools.py`**: A robust Tavily Search API wrapper tailored specifically to unearth real-world hardware benchmarks, sustained FPS figures, and thermal metrics.
* **`client_manager.py`**: A resilient multi-key orchestrator implementing automatic failover (**Primary Gemini Key ➔ Secondary Gemini Key ➔ OpenRouter Backup Gateway** with token safety caps).
* **`cache.py`**: A local SHA-256 query caching layer (`telemetry_cache.json`) that stores verified reports to save API tokens and reduce execution time to milliseconds.
* **`agent.py`**: The core orchestration layer uniting Tavily RAG data with structured Pydantic schema extraction.
* **`main.py`**: The interactive CLI REPL session manager supporting continuous queries and dual-export functionality (`latest_report.md` and `latest_report.json`).

---

## 🚀 Key Features

* **Autonomous Hardware RAG:** Searches live web telemetry for exact chipsets, storage speeds, and stress-test data.
* **Strict Schema Validation:** Eliminates LLM hallucinations by enforcing strict Pydantic typing and structured JSON schemas.
* **Resilient Multi-Key Failover:** Automatically switches accounts on rate-limit (`429`) errors to ensure high availability.
* **Smart Local Caching:** SHA-256 normalization prevents redundant API calls for identical or similarly phrased queries.
* **Dual Output Export:** Generates human-readable Markdown reports (`latest_report.md`) and machine-readable data payloads (`latest_report.json`) instantly.
* **Input Guardrails:** Zero-token regex pre-check blocks vague or non-device queries instantly.

---

## 🛠️ Tech Stack

* **Python 3.10+**
* **Google GenAI SDK** (`gemini-3.8-flash`)
* **Tavily Search API**
* **Pydantic v2**
* **Rich UI** (Terminal styling and markdown rendering)
* **OpenAI SDK** (For OpenRouter gateway fallback)

---

## ⚙️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/pulse_throttle.git
   cd pulse_throttle
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

4. **Configure your environment variables:**
   Create a `.env` file in the root directory and add your credentials:
   ```env
   GEMINI_API_KEY_PRIMARY="your_primary_gemini_key"
   GEMINI_API_KEY_SECONDARY="your_secondary_gemini_key"
   OPENROUTER_API_KEY="your_openrouter_key"
   TAVILY_API_KEY="your_tavily_key"
   ```

---

## 💡 Usage

### 1. Interactive REPL Mode
Launch the interactive CLI session:
```bash
python main.py
```
*At the `PulseThrottle >` prompt, type any single-device query or head-to-head comparison:*
* `How does the Motorola Edge 60 Fusion perform in BGMI, and what are its thermals?`
* `Compare Motorola Edge 60 Pro vs Poco F6 for sustained 90fps gaming and PWM dimming`

### 2. Direct CLI Argument Mode
Run a query directly from your terminal:
```bash
python main.py "Motorola Edge 60 Pro BGMI 90fps stability"
```
*(Add `--refresh` to bypass the local cache and fetch fresh live data)*

---

## 📄 Example Output

Each run automatically exports two files to your project workspace:
* **`latest_report.md`**: Formatted engineering markdown report with tables, specifications, and verdicts.
* **`latest_report.json`**: Structured JSON payload ready for database ingestion, dashboards, or web frontends.