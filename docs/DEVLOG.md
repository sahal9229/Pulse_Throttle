# PulseThrottle Hardware Telemetry Development Log

## October 18, 2026
- Initialized hardware telemetry research log.
- Analyzed mobile SoC architectures and benchmark metrics.

- Researched fabrication nodes and transistor density scaling across major foundries.
- Defined scope for AnTuTu v10 and Geekbench 6 multi-core metrics.

## October 22, 2026
- Modeled thermal dissipation curves for mobile smartphones under extended gaming workloads.
- Examined package heat thresholds and clock frequency throttling curves.

- Documented 3DMark Wild Life 20-minute stability stress test calculations.
- Formulated correlation between sustained stability percentage and peak case thermals.

## October 23, 2026
- Documented display PWM dimming frequency standards for eye comfort and reduced flicker strain.
- Categorized DC dimming vs high-frequency PWM (>1440Hz / >1920Hz).

- Updated hardware specification parser mapping for display modulation frequencies.
- Added eye-safety filter thresholds to telemetry criteria.

## October 24, 2026
- Evaluated storage bus protocols: UFS 4.0, UFS 3.1, UFS 2.2, and Apple NVMe.
- Calculated comparative sequential/random read and write bandwidths.

- Assigned 20% weighting to storage and memory bus speed in overall device evaluation.
- Documented asset loading time impacts in large open-world games.

## October 25, 2026
- Investigated synthetic benchmark cross-platform parity between iOS and Android.
- Formulated normalization factors for Geekbench 6 Single/Multi and AnTuTu v10.

- Established Compute Index weighting at 30% of total index.
- Mapped raw compute performance brackets from entry-level to flagship.

## October 26, 2026
- Outlined real-world gaming workloads: BGMI / PUBG Mobile, Genshin Impact, CODM, and Wuthering Waves.
- Defined target frame rates: 60 FPS, 90 FPS, and 120 FPS high-refresh rate tiers.

- Modeled 99th percentile frame-time consistency (FPS Pacing Efficiency - FPE).
- Established sustained average FPS reporting format.

## October 27, 2026
- Structured relational schema for local and cloud telemetry caching.
- Added device ID, canonical name, benchmark scores, thermals, and specs columns.

- Added B-tree indexes for fast canonical device name lookups.
- Documented duplicate prevention and upsert strategies.

## October 28, 2026
- Documented resilient web extraction pipeline without paid API key requirements.
- Configured DuckDuckGo and GSMArena fallback parsing timeouts and rate-limit backoff.

