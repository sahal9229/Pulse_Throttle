# ⚡ PulseThrottle v2 — Architecture & Implementation Roadmap

> **Polyglot Cloud Architecture:** Supabase (Master Phone Directory & Autocomplete) + MongoDB Atlas (Semi-Structured Telemetry Store)

---

## 🏗️ System Architecture Overview

```
                      ┌──────────────────────────────────────────┐
                      │              USER / CLIENT               │
                      └────────────────────┬─────────────────────┘
                                           │
                       1. Types "iphone 7" │ (instant debounce query)
                                           ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                           SUPABASE (PostgreSQL)                               │
│                                                                               │
│  📁 Table: `devices_catalog`                                                  │
│  ├── canonical_name: "iPhone 7"                                               │
│  ├── brand: "Apple", series: "iPhone 7 Series"                                │
│  ├── release_year: 2016, base_soc: "Apple A10 Fusion"                         │
│  └── image_urls: ["https://fdn2.gsmarena.com/...", "https://images..."]       │
│                                                                               │
│  🔍 Trigram / Prefix Search returns variants:                                  │
│     ["iPhone 7", "iPhone 7 Plus"]                                             │
└──────────────────────────────────────┬────────────────────────────────────────┘
                                       │
                      2. User selects exact "iPhone 7"
                                       │
                                       ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                           FASTAPI BACKEND BRIDGE                              │
│                                                                               │
│  Step A: Check MongoDB Atlas collection `telemetry_runs`                      │
│          Is `canonical_name: "iPhone 7"` already scraped?                     │
│                                                                               │
│       ┌──────────────────────────────┴──────────────────────────────┐         │
│       │ [FOUND IN CACHE]                                            │ [MISS]  │
│       ▼                                                             ▼         │
│  Return cached document                             3. Run Scraper with       │
│  instantly (0ms)                                       exact canonical name:  │
│                                                        '"iPhone 7" AnTuTu...' │
│                                                             │                 │
│                                                             ▼                 │
│                                                     4. Compute Score (PTI)    │
│                                                             │                 │
│                                                             ▼                 │
│                                                     5. Save document to       │
│                                                        MongoDB Atlas          │
└──────────────────────────────────────┬────────────────────────────────────────┘
                                       │
                                       ▼
┌───────────────────────────────────────────────────────────────────────────────┐
│                            MONGODB ATLAS (NoSQL)                              │
│                                                                               │
│  📁 Collection: `telemetry_runs`                                              │
│  Stores flexible, semi-structured documents:                                  │
│  {                                                                            │
│    "canonical_name": "iPhone 7",                                              │
│    "brand": "Apple",                                                          │
│    "soc": "Apple A10 Fusion",                                                 │
│    "antutu_v10": null,          // older phone, AnTuTu v10 not reported       │
│    "antutu_v9": 350000,         // flexible schema handles variations         │
│    "geekbench_single": 750,                                                   │
│    "geekbench_multi": 1400,                                                   │
│    "pti_score": 62.4,                                                         │
│    "raw_snippets": [...],                                                     │
│    "last_scraped_at": "2026-10-31T12:00:00Z"                                  │
│  }                                                                            │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚦 Phased Implementation Roadmap

### 📍 Phase 0: Database Provisioning & Credentials
- [x] User creates free Supabase project and obtains `SUPABASE_URL` and `SUPABASE_DB_PASSWORD`.
- [x] User creates free MongoDB Atlas M0 cluster and obtains `MONGODB_URI`.
- [x] Setup `.env` with connection strings and verify connectivity (both pinged 100% OK).

### 📍 Phase 1: Supabase Master Phone Directory
- [x] Create `devices_catalog` schema in Supabase with indexes on `name` and `brand` (Verified with 7 initial devices).
- [x] Seed master dataset (157+ canonical global devices seeded across Apple, Samsung, Xiaomi/Poco/Redmi, OnePlus, iQOO/Vivo, Motorola, Google Pixel, Realme, Nothing, ASUS ROG).
- [x] Create FastAPI search/autocomplete endpoint: `GET /api/catalog/search?q={query}` (Verified with live queries, LRU cache & sub-10ms response).
- [x] Implement multi-source fallback image URLs in schema (`default_image` + `image_urls text[]`).

### 📍 Phase 2: MongoDB Atlas Telemetry Cache Integration
- [x] Connect FastAPI backend to MongoDB Atlas using `pymongo` (sync, resilient lazy-init client with 3s timeout).
- [x] Refactor telemetry loader: Created `mongo_cache.py` with `load_from_mongo()` + `save_to_mongo()`. Cache chain is now: ☁️ MongoDB Atlas → 🗄️ SQLite → 🌐 Scraper.
- [x] Flexible document structure — all benchmark fields are nullable; partial results (no AnTuTu but has Geekbench) store and load correctly.
- [x] Added `GET /api/health` (Supabase + MongoDB status) and `GET /api/mongo/cache` (inspect cloud-cached devices) to the API.

### 📍 Phase 3: Targeted Exact-Key Web Scraper
- [x] Added `resolve_canonical_name(raw)` in `tools.py` — looks up Supabase `devices_catalog` and returns verified casing (`"iphone 7"` → `"iPhone 7"`, `"s24 ultra"` → `"Samsung Galaxy S24 Ultra"`).
- [x] Added `build_exact_key_queries(canonical, game)` in `tools.py` — wraps name in double-quotes for exact-match search (e.g. `"POCO F6" AnTuTu Geekbench 3DMark Wild Life UFS specs`).
- [x] `client_manager.py` upgraded: all search paths now resolve canonical name first, then build quoted exact-key queries — dual comparison and single device both updated.
- [x] Non-catalog names fall back gracefully with `⚠ Not in catalog` warning and still do best-effort search — no hard guardrail block.
- [x] Fresh scrape results continue to save to both SQLite and MongoDB Atlas via `log_report_to_db` (Phase 2 chain).

### 📍 Phase 4: Frontend UI Overhaul (Autocomplete & Dropdown)
- [x] Implement responsive autocomplete dropdown in Primary & Secondary device selectors with debounced Supabase live search (`searchCatalogFromApi`).
- [x] Format dropdown: display 3 items visible with smooth vertical scroll (`h-[216px] overflow-y-auto scroll-smooth`) for additional variants.
- [x] Display verified image, brand badge (Apple, Samsung, POCO, Xiaomi, Motorola, etc.), and chipset preview in dropdown options.
- [x] Connect selection to on-demand extraction trigger (`extractCustomPhoneTelemetry`) with live progress indicator.

### 📍 Phase 5: Production & Render Deployment Readiness
- [x] Validate zero-local-file dependency: Wrapped all SQLite read/write operations in `Backend/engine_db.py` and `api_server.py` with graceful fallbacks so MongoDB Atlas acts as the persistent cloud store on ephemeral containers.
- [x] Prepared multi-stage `Dockerfile`, Render blueprint `render.yaml`, and executable `start.sh` with dynamic `PORT` binding (`uvicorn api_server:app --host 0.0.0.0 --port $PORT`).
- [x] Mounted compiled React frontend (`Frontend/dist`) inside FastAPI `api_server.py` for seamless single-service web deployment on Render.
- [x] End-to-end smoke tested server on dynamic port (`PORT=8080`), health check (`/api/health`), static frontend serving (`/`), Supabase search (`/api/catalog/search`), and MongoDB cloud cache (`/api/mongo/cache`).

---

## 📊 Live Progress Tracker

| Phase | Description | Status | Notes |
| :--- | :--- | :---: | :--- |
| **Phase 0** | Cloud DB Setup (Supabase + MongoDB) | ✅ **100% Verified** | Live ping & query confirmed for both! |
| **Phase 1** | Supabase Catalog & Seeding | ✅ **100% Verified** | Master catalog & `/api/catalog/search` live |
| **Phase 2** | MongoDB Telemetry Integration | ✅ **100% Verified** | Cache chain active: MongoDB Atlas → SQLite → Scraper |
| **Phase 3** | Exact-Key Scraper Upgrade | ✅ **100% Verified** | Quoted canonical name resolution & live scrape |
| **Phase 4** | Frontend Dropdown & UX | ✅ **100% Verified** | Autocomplete dropdown, 3-item visible viewport, brand badges |
| **Phase 5** | Render Host Readiness | ✅ **100% Verified** | Dockerfile, render.yaml, start.sh, $PORT binding & smoke tested |
