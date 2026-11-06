import os
import sys
import re
import json
import time
import sqlite3
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from dotenv import load_dotenv
import psycopg2

# Ensure Backend modules and database are accessible from project root
backend_dir = os.path.join(os.path.dirname(__file__), "Backend")
if os.path.exists(backend_dir) and backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Load environment variables
backend_env = os.path.join(backend_dir, ".env")
if os.path.exists(backend_env):
    load_dotenv(backend_env)
else:
    load_dotenv()

SUPABASE_PROJECT_ID = os.getenv("SUPABASE_PROJECT_ID", "dkwkzoztkyklztqzmhis")
SUPABASE_DB_PASSWORD = os.getenv("SUPABASE_DB_PASSWORD")
SUPABASE_HOST = os.getenv("SUPABASE_HOST", "aws-0-ap-southeast-1.pooler.supabase.com")
SUPABASE_PORT = int(os.getenv("SUPABASE_PORT", "6543"))

def get_supabase_conn():
    if not SUPABASE_DB_PASSWORD or not SUPABASE_PROJECT_ID:
        return None
    try:
        conn = psycopg2.connect(
            host=SUPABASE_HOST,
            port=SUPABASE_PORT,
            user=f"postgres.{SUPABASE_PROJECT_ID}",
            password=SUPABASE_DB_PASSWORD,
            database="postgres",
            connect_timeout=3,
        )
        return conn
    except Exception as e:
        print(f"[Supabase Warning] Could not connect: {e}")
        return None

_SEARCH_CACHE: Dict[str, Dict[str, Any]] = {}

import engine_db
if os.path.exists(os.path.join(backend_dir, "pulsethrottle.db")):
    engine_db.DB_PATH = os.path.join(backend_dir, "pulsethrottle.db")

from engine_db import DB_PATH, init_db, log_report_to_db, load_report_from_db
from agent import run_silicon_pulse

app = FastAPI(
    title="PulseThrottle Telemetry API",
    description="Local SQLite + Keyless Scraper Bridge for React Frontend",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SYNC_INTERVAL_SECONDS = 12 * 3600  # 12 Hours

# Seed catalog so typing "iphone", "xs", "samsung", "moto", "iqoo", "poco" works at 0ms
MASTER_SEED_CATALOG: List[Dict[str, Any]] = [
    # Apple (iOS)
    {"id": "iphone_16_pro_max", "name": "iPhone 16 Pro Max", "brand": "Apple", "os": "iOS", "soc": "Apple A18 Pro (3nm TSMC)", "gpuStorage": "Apple 6-core GPU, NVMe", "antutu": 1780000, "gbSingle": 3400, "gbMulti": 8500, "stability": 82.5, "temp": 43.8, "pwm": "480Hz", "score": 92.4, "tss": 74.0, "fpe": 98.5, "compute": 98.0, "storageScore": 100, "image": "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-pro-max.jpg"},
    {"id": "iphone_16_pro", "name": "iPhone 16 Pro", "brand": "Apple", "os": "iOS", "soc": "Apple A18 Pro (3nm TSMC)", "gpuStorage": "Apple 6-core GPU, NVMe", "antutu": 1720000, "gbSingle": 3380, "gbMulti": 8400, "stability": 80.0, "temp": 44.2, "pwm": "480Hz", "score": 90.8, "tss": 71.2, "fpe": 97.5, "compute": 97.0, "storageScore": 100, "image": "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-16-pro.jpg"},
    {"id": "iphone_15_pro_max", "name": "iPhone 15 Pro Max", "brand": "Apple", "os": "iOS", "soc": "Apple A17 Pro (3nm TSMC)", "gpuStorage": "Apple 6-core GPU, NVMe", "antutu": 1540000, "gbSingle": 2950, "gbMulti": 7250, "stability": 74.5, "temp": 45.4, "pwm": "480Hz", "score": 86.2, "tss": 63.0, "fpe": 94.0, "compute": 94.0, "storageScore": 100, "image": "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-pro-max.jpg"},
    {"id": "iphone_15", "name": "iPhone 15", "brand": "Apple", "os": "iOS", "soc": "Apple A16 Bionic (4nm TSMC)", "gpuStorage": "Apple 5-core GPU, NVMe", "antutu": 1350000, "gbSingle": 2600, "gbMulti": 6500, "stability": 78.0, "temp": 43.5, "pwm": "480Hz", "score": 82.0, "tss": 71.0, "fpe": 88.0, "compute": 88.5, "storageScore": 95, "image": "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15.jpg"},
    {"id": "iphone_14_pro_max", "name": "iPhone 14 Pro Max", "brand": "Apple", "os": "iOS", "soc": "Apple A16 Bionic (4nm TSMC)", "gpuStorage": "Apple 5-core GPU, NVMe", "antutu": 1420000, "gbSingle": 2640, "gbMulti": 6750, "stability": 81.0, "temp": 43.2, "pwm": "480Hz", "score": 87.1, "tss": 75.0, "fpe": 95.0, "compute": 90.0, "storageScore": 95, "image": "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-14-pro-max-.jpg"},
    {"id": "iphone_13_pro_max", "name": "iPhone 13 Pro Max", "brand": "Apple", "os": "iOS", "soc": "Apple A15 Bionic (5nm TSMC)", "gpuStorage": "Apple 5-core GPU, NVMe", "antutu": 1250000, "gbSingle": 2380, "gbMulti": 5950, "stability": 86.5, "temp": 41.8, "pwm": "480Hz", "score": 86.8, "tss": 82.5, "fpe": 95.5, "compute": 84.0, "storageScore": 90, "image": "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-13-pro-max.jpg"},
    {"id": "iphone_13", "name": "iPhone 13", "brand": "Apple", "os": "iOS", "soc": "Apple A15 Bionic (5nm TSMC)", "gpuStorage": "Apple 4-core GPU, NVMe", "antutu": 1120000, "gbSingle": 2290, "gbMulti": 5500, "stability": 79.0, "temp": 42.9, "pwm": "610Hz", "score": 78.5, "tss": 74.0, "fpe": 86.0, "compute": 79.0, "storageScore": 85, "image": "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-13.jpg"},
    {"id": "iphone_12", "name": "iPhone 12", "brand": "Apple", "os": "iOS", "soc": "Apple A14 Bionic (5nm TSMC)", "gpuStorage": "Apple 4-core GPU, NVMe", "antutu": 920000, "gbSingle": 2050, "gbMulti": 4750, "stability": 72.0, "temp": 44.1, "pwm": "480Hz", "score": 71.4, "tss": 66.0, "fpe": 80.0, "compute": 68.0, "storageScore": 80, "image": "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-12.jpg"},
    {"id": "iphone_11", "name": "iPhone 11", "brand": "Apple", "os": "iOS", "soc": "Apple A13 Bionic (7nm+ TSMC)", "gpuStorage": "Apple 4-core GPU, NVMe", "antutu": 795000, "gbSingle": 1720, "gbMulti": 3950, "stability": 76.0, "temp": 43.0, "pwm": "DC Dimming (LCD)", "score": 68.2, "tss": 71.0, "fpe": 78.0, "compute": 58.0, "storageScore": 75, "image": "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-11.jpg"},
    {"id": "iphone_xs_max", "name": "iPhone XS Max", "brand": "Apple", "os": "iOS", "soc": "Apple A12 Bionic (7nm TSMC)", "gpuStorage": "Apple 4-core GPU, NVMe", "antutu": 615000, "gbSingle": 1320, "gbMulti": 2980, "stability": 69.5, "temp": 44.5, "pwm": "240Hz", "score": 59.8, "tss": 61.0, "fpe": 72.0, "compute": 46.0, "storageScore": 70, "image": "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-xs-max-new1.jpg"},
    {"id": "iphone_xs", "name": "iPhone XS", "brand": "Apple", "os": "iOS", "soc": "Apple A12 Bionic (7nm TSMC)", "gpuStorage": "Apple 4-core GPU, NVMe", "antutu": 595000, "gbSingle": 1310, "gbMulti": 2890, "stability": 68.0, "temp": 44.8, "pwm": "240Hz", "score": 58.2, "tss": 59.0, "fpe": 70.0, "compute": 44.5, "storageScore": 70, "image": "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-xs-new.jpg"},
    {"id": "iphone_xr", "name": "iPhone XR", "brand": "Apple", "os": "iOS", "soc": "Apple A12 Bionic (7nm TSMC)", "gpuStorage": "Apple 4-core GPU, NVMe", "antutu": 580000, "gbSingle": 1295, "gbMulti": 2820, "stability": 73.0, "temp": 43.4, "pwm": "DC Dimming (LCD)", "score": 59.0, "tss": 65.0, "fpe": 72.0, "compute": 43.5, "storageScore": 70, "image": "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-xr-new.jpg"},
    {"id": "iphone_7", "name": "iPhone 7", "brand": "Apple", "os": "iOS", "soc": "Apple A10 Fusion (16nm TSMC)", "gpuStorage": "PowerVR Series7XT Plus, NVMe (Gen 1)", "antutu": 285000, "gbSingle": 780, "gbMulti": 1410, "stability": 71.0, "temp": 42.0, "pwm": "DC Dimming (LCD)", "score": 29.8, "tss": 50.0, "fpe": 45.0, "compute": 22.0, "storageScore": 82.5, "image": "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-7-r1.jpg"},
    {"id": "iphone_5s", "name": "iPhone 5s", "brand": "Apple", "os": "iOS", "soc": "Apple A7 (28nm Samsung)", "gpuStorage": "PowerVR G6430, eMMC 4.5", "antutu": 65000, "gbSingle": 255, "gbMulti": 470, "stability": 65.0, "temp": 39.5, "pwm": "DC Dimming (LCD)", "score": 13.0, "tss": 33.6, "fpe": 25.0, "compute": 8.0, "storageScore": 22.0, "image": "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-5s-ofic.jpg"},
    # Motorola (Android)
    {"id": "motorola_edge_60_pro", "name": "Motorola Edge 60 Pro", "brand": "Motorola", "os": "Android", "soc": "MediaTek Dimensity 8350 Extreme (4nm TSMC)", "gpuStorage": "ARM Mali-G615 MC6, LPDDR5X, UFS 4.0", "antutu": 1385000, "gbSingle": 1429, "gbMulti": 4476, "stability": 84.5, "temp": 43.2, "pwm": "720Hz", "score": 87.5, "tss": 70.6, "fpe": 95.6, "compute": 90.4, "storageScore": 100, "image": "https://fdn2.gsmarena.com/vv/bigpic/motorola-edge-60-pro.jpg"},
    {"id": "motorola_edge_60_fusion", "name": "Motorola Edge 60 Fusion", "brand": "Motorola", "os": "Android", "soc": "MediaTek Dimensity 7400 (4nm TSMC)", "gpuStorage": "ARM Mali-G615 MC2, LPDDR4X, UFS 2.2", "antutu": 655000, "gbSingle": 1050, "gbMulti": 2980, "stability": 97.6, "temp": 42.4, "pwm": "720Hz", "score": 73.9, "tss": 83.2, "fpe": 96.7, "compute": 43.7, "storageScore": 60, "image": "https://fdn2.gsmarena.com/vv/bigpic/motorola-edge-60-fusion.jpg"},
    # iQOO / Vivo (Android)
    {"id": "iqoo_neo_9_pro", "name": "iQOO Neo 9 Pro", "brand": "iQOO", "os": "Android", "soc": "Qualcomm Snapdragon 8 Gen 2 (4nm TSMC)", "gpuStorage": "Adreno 740, LPDDR5X, UFS 4.0", "antutu": 1580410, "gbSingle": 2015, "gbMulti": 5420, "stability": 91.0, "temp": 44.1, "pwm": "1440Hz", "score": 91.2, "tss": 85.0, "fpe": 98.2, "compute": 95.0, "storageScore": 100, "image": "https://fdn2.gsmarena.com/vv/bigpic/vivo-iqoo-neo9-pro.jpg"},
    {"id": "iqoo_12", "name": "iQOO 12", "brand": "iQOO", "os": "Android", "soc": "Qualcomm Snapdragon 8 Gen 3 (4nm TSMC)", "gpuStorage": "Adreno 750, LPDDR5X, UFS 4.0", "antutu": 2080000, "gbSingle": 2230, "gbMulti": 6850, "stability": 86.0, "temp": 44.0, "pwm": "2160Hz", "score": 94.1, "tss": 81.0, "fpe": 99.0, "compute": 99.0, "storageScore": 100, "image": "https://fdn2.gsmarena.com/vv/bigpic/vivo-iqoo-12.jpg"},
    # Xiaomi / Poco (Android)
    {"id": "poco_f6", "name": "Poco F6", "brand": "Xiaomi", "os": "Android", "soc": "Qualcomm Snapdragon 8s Gen 3 (4nm TSMC)", "gpuStorage": "Adreno 735, LPDDR5X, UFS 4.0", "antutu": 1485000, "gbSingle": 1930, "gbMulti": 5010, "stability": 86.2, "temp": 43.8, "pwm": "1920Hz", "score": 88.4, "tss": 74.2, "fpe": 94.0, "compute": 92.1, "storageScore": 100, "image": "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-poco-f6.jpg"},
    {"id": "poco_x6_pro", "name": "Poco X6 Pro", "brand": "Xiaomi", "os": "Android", "soc": "MediaTek Dimensity 8300 Ultra (4nm TSMC)", "gpuStorage": "Mali-G615 MC6, LPDDR5X, UFS 4.0", "antutu": 1396000, "gbSingle": 1415, "gbMulti": 4420, "stability": 83.0, "temp": 43.9, "pwm": "1920Hz", "score": 86.5, "tss": 72.0, "fpe": 93.5, "compute": 90.0, "storageScore": 100, "image": "https://fdn2.gsmarena.com/vv/bigpic/xiaomi-poco-x6-pro.jpg"},
    # Samsung (Android)
    {"id": "samsung_s24_ultra", "name": "Samsung Galaxy S24 Ultra", "brand": "Samsung", "os": "Android", "soc": "Snapdragon 8 Gen 3 for Galaxy (4nm TSMC)", "gpuStorage": "Adreno 750, LPDDR5X, UFS 4.0", "antutu": 1950000, "gbSingle": 2280, "gbMulti": 7100, "stability": 68.5, "temp": 45.1, "pwm": "492Hz", "score": 86.4, "tss": 62.0, "fpe": 94.0, "compute": 98.0, "storageScore": 100, "image": "https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-ultra-5g-sm-s928-stylus.jpg"},
    {"id": "samsung_s22_exynos", "name": "Samsung Galaxy S22 (Exynos)", "brand": "Samsung", "os": "Android", "soc": "Samsung Exynos 2200 (4nm Samsung)", "gpuStorage": "Samsung Xclipse 920, UFS 3.1", "antutu": 980000, "gbSingle": 1510, "gbMulti": 3780, "stability": 58.5, "temp": 45.8, "pwm": "240Hz", "score": 70.0, "tss": 56.0, "fpe": 82.0, "compute": 68.0, "storageScore": 80.0, "image": "https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s22-5g.jpg"},
    {"id": "samsung_a55", "name": "Samsung Galaxy A55 5G", "brand": "Samsung", "os": "Android", "soc": "Exynos 1480 (4nm Samsung)", "gpuStorage": "Xclipse 530 GPU, LPDDR5, UFS 3.1", "antutu": 725000, "gbSingle": 1150, "gbMulti": 3450, "stability": 91.5, "temp": 41.2, "pwm": "240Hz", "score": 74.8, "tss": 86.0, "fpe": 88.0, "compute": 52.0, "storageScore": 80, "image": "https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-a55.jpg"},
    # OnePlus (Android)
    {"id": "oneplus_12", "name": "OnePlus 12", "brand": "OnePlus", "os": "Android", "soc": "Qualcomm Snapdragon 8 Gen 3 (4nm TSMC)", "gpuStorage": "Adreno 750, LPDDR5X, UFS 4.0", "antutu": 2040000, "gbSingle": 2210, "gbMulti": 6720, "stability": 88.5, "temp": 43.4, "pwm": "2160Hz", "score": 93.8, "tss": 84.0, "fpe": 98.0, "compute": 98.5, "storageScore": 100, "image": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-12.jpg"},
    {"id": "oneplus_nord_4", "name": "OnePlus Nord 4", "brand": "OnePlus", "os": "Android", "soc": "Qualcomm Snapdragon 7+ Gen 3 (4nm TSMC)", "gpuStorage": "Adreno 732, LPDDR5X, UFS 4.0", "antutu": 1280000, "gbSingle": 1820, "gbMulti": 4650, "stability": 89.5, "temp": 41.9, "pwm": "2160Hz", "score": 84.2, "tss": 82.1, "fpe": 91.0, "compute": 82.0, "storageScore": 100, "image": "https://fdn2.gsmarena.com/vv/bigpic/oneplus-nord-4.jpg"},
]


def ensure_catalog_tables() -> None:
    """Initializes the device_catalog & sync metadata tables inside pulsethrottle.db if local SQLite is usable."""
    try:
        init_db()
        with sqlite3.connect(DB_PATH) as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS device_catalog (
                    id TEXT PRIMARY KEY,
                    name TEXT UNIQUE NOT NULL,
                    brand TEXT NOT NULL,
                    os TEXT NOT NULL,
                    soc TEXT NOT NULL,
                    gpu_storage TEXT NOT NULL,
                    antutu INTEGER,
                    gb_single INTEGER,
                    gb_multi INTEGER,
                    stability REAL,
                    temp REAL,
                    pwm TEXT,
                    score REAL,
                    tss REAL,
                    fpe REAL,
                    compute REAL,
                    storage_score REAL,
                    image TEXT,
                    is_past_search INTEGER DEFAULT 0,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS sync_meta (
                    key TEXT PRIMARY KEY,
                    last_sync_epoch REAL
                )
                """
            )
            # Seed catalog into SQLite
            for p in MASTER_SEED_CATALOG:
                conn.execute(
                    """
                    INSERT INTO device_catalog (
                        id, name, brand, os, soc, gpu_storage, antutu, gb_single, gb_multi,
                        stability, temp, pwm, score, tss, fpe, compute, storage_score, image
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        name = excluded.name,
                        brand = excluded.brand,
                        os = excluded.os,
                        soc = excluded.soc,
                        gpu_storage = excluded.gpu_storage,
                        antutu = excluded.antutu,
                        gb_single = excluded.gb_single,
                        gb_multi = excluded.gb_multi,
                        stability = excluded.stability,
                        temp = excluded.temp,
                        pwm = excluded.pwm,
                        score = excluded.score,
                        tss = excluded.tss,
                        fpe = excluded.fpe,
                        compute = excluded.compute,
                        storage_score = excluded.storage_score,
                        image = excluded.image
                    """,
                    (
                        p["id"], p["name"], p["brand"], p["os"], p["soc"], p["gpuStorage"],
                        p["antutu"], p["gbSingle"], p["gbMulti"], p["stability"], p["temp"],
                        p["pwm"], p["score"], p["tss"], p["fpe"], p["compute"],
                        p["storageScore"], p["image"],
                    ),
                )
            conn.commit()
    except Exception as e:
        print(f"[SQLite Notice] Running in cloud-only mode without local SQLite cache: {e}")


@app.on_event("startup")
def on_startup() -> None:
    ensure_catalog_tables()


@app.get("/api/health")
def health_check():
    """Returns health status of both Supabase and MongoDB connections."""
    supabase_ok = False
    try:
        conn = get_supabase_conn()
        if conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1;")
            conn.close()
            supabase_ok = True
    except Exception:
        supabase_ok = False

    mongo_ok = False
    try:
        import sys, os
        backend_dir_path = os.path.join(os.path.dirname(__file__), "Backend")
        if backend_dir_path not in sys.path:
            sys.path.insert(0, backend_dir_path)
        from mongo_cache import ping_mongo
        mongo_ok = ping_mongo()
    except Exception:
        mongo_ok = False

    return {
        "status": "ok" if (supabase_ok and mongo_ok) else "degraded",
        "supabase": "✅ connected" if supabase_ok else "❌ unreachable",
        "mongodb": "✅ connected" if mongo_ok else "❌ unreachable",
    }


@app.get("/api/mongo/cache")
def list_mongo_cache(limit: int = Query(20, ge=1, le=100)):
    """Lists the most recently scraped devices cached in MongoDB Atlas."""
    try:
        import sys, os
        backend_dir_path = os.path.join(os.path.dirname(__file__), "Backend")
        if backend_dir_path not in sys.path:
            sys.path.insert(0, backend_dir_path)
        from mongo_cache import _get_collection
        col = _get_collection()
        if col is None:
            raise HTTPException(status_code=503, detail="MongoDB not available")
        docs = list(
            col.find(
                {},
                {"_id": 0, "canonical_name": 1, "display_name": 1, "soc_chipset": 1,
                 "antutu_v10": 1, "pti_score": 1, "last_scraped_at": 1}
            ).sort("last_scraped_at", -1).limit(limit)
        )
        return {"count": len(docs), "devices": docs}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.get("/api/catalog")
def get_catalog(q: Optional[str] = None, brand: Optional[str] = None, os_filter: Optional[str] = None):
    """Returns all phones from pulsethrottle.db (merging past CLI searches + master catalog)."""
    ensure_catalog_tables()
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        # Also sync any phones from the CLI `devices` + `telemetry_runs` table into `device_catalog`
        cli_rows = conn.execute(
            """
            SELECT d.device_name, d.soc_chipset, d.gpu_and_storage, d.pwm_dimming_hz, d.image_url,
                   t.antutu_v10_score, t.geekbench_6_single, t.geekbench_6_multi,
                   t.wildlife_stability_pct, t.peak_temp_celsius,
                   t.pulse_throttle_index, t.score_breakdown
            FROM devices d
            JOIN telemetry_runs t ON t.device_id = d.id
            GROUP BY d.id
            HAVING t.id = MAX(t.id)
            """
        ).fetchall()

        for r in cli_rows:
            dname = r["device_name"]
            slug = re.sub(r"[^a-z0-9]+", "_", dname.lower()).strip("_")
            brand_guess = dname.split()[0].capitalize()
            os_guess = "iOS" if "iphone" in dname.lower() or "apple" in dname.lower() else "Android"

            soc = r["soc_chipset"]
            if not soc or soc == "Unverified SoC Architecture" or (os_guess == "iOS" and not soc.lower().startswith("apple")):
                try:
                    from regex_parser import _lookup_catalog_soc, extract_soc
                    soc = _lookup_catalog_soc(dname) or extract_soc("", dname)
                except Exception:
                    pass

            img = r["image_url"] if "image_url" in r.keys() and r["image_url"] else None
            if not img or "unsplash" in img:
                try:
                    from image_scraper import get_high_res_phone_image
                    img = get_high_res_phone_image(dname)
                except Exception:
                    img = None

            sb = {}
            if r["score_breakdown"]:
                try:
                    sb = json.loads(r["score_breakdown"]) if isinstance(r["score_breakdown"], str) else r["score_breakdown"]
                except Exception:
                    sb = {}
            tss = sb.get("thermal_stability_score", 75.0)
            fpe = sb.get("fps_pacing_efficiency", 88.0)
            comp = sb.get("compute_index", 75.0)
            storage = sb.get("storage_bandwidth_score", 80.0)

            from regex_parser import _get_reference_profile
            ref = _get_reference_profile(dname)
            fb_antutu = ref.get("antutu") if ref else 750000
            fb_gb_single = ref.get("geekbench_single") if ref else 1200
            fb_gb_multi = ref.get("geekbench_multi") if ref else 3500
            fb_stability = ref.get("stability") if ref else 80.0
            fb_temp = ref.get("temp") if ref else 43.0
            fb_score = ref.get("target_pti") if ref else 65.0

            final_score = r["pulse_throttle_index"]
            if ref and "target_pti" in ref:
                if final_score is None or abs(final_score - ref["target_pti"]) > 18:
                    final_score = ref["target_pti"]
            elif final_score is None:
                final_score = fb_score

            final_antutu = r["antutu_v10_score"]
            if ref and "antutu" in ref:
                if final_antutu is None or abs(final_antutu - ref["antutu"]) > 350000:
                    final_antutu = ref["antutu"]
            elif final_antutu is None:
                final_antutu = fb_antutu

            gpu_storage_val = r["gpu_and_storage"]
            if ref and (not gpu_storage_val or "Standard GPU" in gpu_storage_val or "Unverified" in gpu_storage_val):
                gpu_storage_val = f"{ref.get('gpu', 'Integrated GPU')}, {ref.get('storage', 'UFS')}"

            conn.execute(
                """
                INSERT INTO device_catalog (
                    id, name, brand, os, soc, gpu_storage, antutu, gb_single, gb_multi,
                    stability, temp, pwm, score, tss, fpe, compute, storage_score, image, is_past_search
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                ON CONFLICT(id) DO UPDATE SET
                    is_past_search = 1,
                    soc = excluded.soc,
                    image = COALESCE(excluded.image, device_catalog.image),
                    score = excluded.score,
                    antutu = excluded.antutu,
                    gpu_storage = excluded.gpu_storage
                """,
                (
                    slug, dname, brand_guess, os_guess, soc, gpu_storage_val,
                    final_antutu, r["geekbench_6_single"] or fb_gb_single,
                    r["geekbench_6_multi"] or fb_gb_multi, r["wildlife_stability_pct"] or fb_stability,
                    r["peak_temp_celsius"] or fb_temp, r["pwm_dimming_hz"] or "720Hz",
                    final_score, tss,
                    fpe, comp,
                    storage, img,
                ),
            )
        conn.commit()

        sql = "SELECT * FROM device_catalog WHERE 1=1"
        params: List[Any] = []
        if q:
            sql += " AND (LOWER(name) LIKE ? OR LOWER(brand) LIKE ? OR LOWER(soc) LIKE ?)"
            like_q = f"%{q.lower()}%"
            params.extend([like_q, like_q, like_q])
        if brand and brand.lower() != "all":
            sql += " AND LOWER(brand) = ?"
            params.append(brand.lower())
        if os_filter and os_filter.lower() != "all":
            sql += " AND LOWER(os) = ?"
            params.append(os_filter.lower())

        sql += " ORDER BY score DESC"
        rows = conn.execute(sql, params).fetchall()
        return {"count": len(rows), "devices": [dict(row) for row in rows]}


@app.get("/api/catalog/search")
def search_catalog(
    q: str = Query("", description="Query text to search canonical phones by name, brand, or soc"),
    brand: Optional[str] = Query(None, description="Optional brand filter"),
    limit: int = Query(15, ge=1, le=50, description="Max suggestions to return")
):
    """
    Real-time autocomplete & canonical phone search:
    1. In-memory LRU cache hit (<1ms)
    2. Supabase master `devices_catalog` with exact-match and prefix prioritization
    3. Resilient fallback to local SQLite cache if offline
    """
    clean_q = q.strip()
    if not clean_q:
        return {"query": "", "source": "empty", "count": 0, "results": []}

    cache_key = f"{clean_q.lower()}_{brand or ''}_{limit}"
    if cache_key in _SEARCH_CACHE:
        return _SEARCH_CACHE[cache_key]

    results: List[Dict[str, Any]] = []
    source = "supabase"

    # 1. Query Supabase Master Phone Catalog
    conn = get_supabase_conn()
    if conn:
        try:
            with conn.cursor() as cur:
                like_q = f"%{clean_q}%"
                prefix_q = f"{clean_q}%"
                if brand and brand.lower() != "all":
                    cur.execute(
                        """
                        SELECT id, canonical_name, brand, series, os, release_year, base_soc, default_image, image_urls
                        FROM devices_catalog
                        WHERE (canonical_name ILIKE %s OR base_soc ILIKE %s)
                          AND LOWER(brand) = LOWER(%s)
                        ORDER BY
                            CASE
                                WHEN LOWER(canonical_name) = LOWER(%s) THEN 1
                                WHEN LOWER(canonical_name) LIKE LOWER(%s) THEN 2
                                ELSE 3
                            END,
                            release_year DESC
                        LIMIT %s;
                        """,
                        (like_q, like_q, brand, clean_q, prefix_q, limit),
                    )
                else:
                    cur.execute(
                        """
                        SELECT id, canonical_name, brand, series, os, release_year, base_soc, default_image, image_urls
                        FROM devices_catalog
                        WHERE (canonical_name ILIKE %s OR brand ILIKE %s OR series ILIKE %s OR base_soc ILIKE %s)
                        ORDER BY
                            CASE
                                WHEN LOWER(canonical_name) = LOWER(%s) THEN 1
                                WHEN LOWER(canonical_name) LIKE LOWER(%s) THEN 2
                                ELSE 3
                            END,
                            release_year DESC
                        LIMIT %s;
                        """,
                        (like_q, like_q, like_q, like_q, clean_q, prefix_q, limit),
                    )

                for r in cur.fetchall():
                    results.append({
                        "id": r[0],
                        "canonical_name": r[1],
                        "brand": r[2],
                        "series": r[3],
                        "os": r[4],
                        "release_year": r[5],
                        "base_soc": r[6],
                        "default_image": r[7],
                        "image_urls": r[8] or [],
                    })
        except Exception as e:
            print(f"[Supabase Search Error] {e}")
            results = []
        finally:
            conn.close()

    # 2. Resilient fallback to local SQLite catalog
    if not results:
        source = "sqlite_fallback"
        ensure_catalog_tables()
        with sqlite3.connect(DB_PATH) as s_conn:
            s_conn.row_factory = sqlite3.Row
            s_sql = """
                SELECT id, name as canonical_name, brand, '' as series, os,
                       0 as release_year, soc as base_soc, image as default_image
                FROM device_catalog
                WHERE LOWER(name) LIKE ? OR LOWER(brand) LIKE ? OR LOWER(soc) LIKE ?
            """
            s_params: List[Any] = [f"%{clean_q.lower()}%", f"%{clean_q.lower()}%", f"%{clean_q.lower()}%"]
            if brand and brand.lower() != "all":
                s_sql += " AND LOWER(brand) = ?"
                s_params.append(brand.lower())
            s_sql += " ORDER BY score DESC LIMIT ?"
            s_params.append(limit)
            for r in s_conn.execute(s_sql, s_params).fetchall():
                results.append({
                    "id": r["id"],
                    "canonical_name": r["canonical_name"],
                    "brand": r["brand"],
                    "series": r["series"],
                    "os": r["os"],
                    "release_year": r["release_year"],
                    "base_soc": r["base_soc"],
                    "default_image": r["default_image"],
                    "image_urls": [],
                })

    response = {
        "query": clean_q,
        "source": source,
        "count": len(results),
        "results": results,
    }

    if len(_SEARCH_CACHE) > 500:
        _SEARCH_CACHE.clear()
    _SEARCH_CACHE[cache_key] = response

    return response


@app.post("/api/extract")
def extract_custom_phone(device_name: str = Query(..., description="Phone name to scrape and store")):
    """Triggers your keyless DuckDuckGo + Regex engine for any unlisted phone & saves to pulsethrottle.db."""
    report = load_report_from_db(device_name)
    if report is None:
        report = run_silicon_pulse(device_name)
        if report.mode != "INVALID_QUERY":
            log_report_to_db(report)

    dev = report.primary_device
    if not dev:
        raise HTTPException(status_code=400, detail="Could not extract telemetry for device.")

    if not dev.image_url:
        try:
            from image_scraper import get_high_res_phone_image
            dev.image_url = get_high_res_phone_image(dev.device_name)
        except Exception:
            pass

    return {"status": "ok", "report": report.model_dump()}


# Mount compiled React frontend for single-service Render deployment if dist exists
_frontend_dist = os.path.join(os.path.dirname(__file__), "Frontend", "dist")
if os.path.exists(_frontend_dist):
    app.mount("/", StaticFiles(directory=_frontend_dist, html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    uvicorn.run("api_server:app", host=host, port=port, reload=False)
