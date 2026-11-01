"""
PulseThrottle v2 — MongoDB Atlas Telemetry Cache
=================================================
This module provides a cloud-level cache layer that sits between the user
request and the web scraper. Before scraping, we check if this phone's
telemetry already exists in MongoDB. If yes → instant zero-scrape response.
If no → scraper runs, then the result is saved to both MongoDB + SQLite.

The flexible NoSQL schema handles partial benchmarks gracefully —
a phone without AnTuTu v10 but with Geekbench still gets stored/retrieved.

Usage:
    from mongo_cache import load_from_mongo, save_to_mongo
"""

import os
import json
import re
from datetime import datetime, timezone
from typing import Optional, List
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

MONGODB_URI = os.getenv("MONGODB_URI", "")
DB_NAME = "pulsethrottle"
COLLECTION_NAME = "telemetry_runs"

_client = None


def _get_client():
    """Lazy-initializes a single shared PyMongo client (reconnects on failure)."""
    global _client
    if _client is not None:
        return _client
    if not MONGODB_URI:
        return None
    try:
        from pymongo import MongoClient
        from pymongo.server_api import ServerApi
        _client = MongoClient(
            MONGODB_URI,
            server_api=ServerApi("1"),
            serverSelectionTimeoutMS=3000,
            connectTimeoutMS=3000,
            socketTimeoutMS=5000,
        )
        # Quick ping to verify connectivity
        _client.admin.command("ping")
        return _client
    except Exception as e:
        print(f"[MongoDB] Could not connect: {e}")
        _client = None
        return None


def _get_collection():
    client = _get_client()
    if client is None:
        return None
    try:
        db = client[DB_NAME]
        col = db[COLLECTION_NAME]
        # Ensure index on canonical_name for fast lookups (idempotent)
        col.create_index("canonical_name", background=True)
        return col
    except Exception:
        return None


def _normalize_name(name: str) -> str:
    """Lowercase + collapse spaces for fuzzy canonical matching."""
    return re.sub(r"\s+", " ", name.strip().lower())


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def load_from_mongo(device_name: str) -> Optional[dict]:
    """
    Fetches a cached telemetry document from MongoDB Atlas for device_name.
    Returns the raw dict (from which DeviceTelemetry can be reconstructed),
    or None if not found / connection failed.

    Matching is flexible:
      1. Exact canonical_name match (fastest)
      2. Normalized lowercase match
    """
    col = _get_collection()
    if col is None:
        return None

    norm = _normalize_name(device_name)
    try:
        # 1. Exact canonical match
        doc = col.find_one({"canonical_name": {"$regex": f"^{re.escape(norm)}$", "$options": "i"}})
        if doc:
            print(f"  [MongoDB] ✅ Cache hit: '{device_name}'")
            return _doc_to_dict(doc)

        # 2. Substring fallback for minor spelling differences
        doc = col.find_one(
            {"canonical_name": {"$regex": re.escape(norm), "$options": "i"}},
            sort=[("last_scraped_at", -1)],
        )
        if doc:
            print(f"  [MongoDB] ✅ Fuzzy cache hit: '{doc.get('canonical_name')}'")
            return _doc_to_dict(doc)

    except Exception as e:
        print(f"  [MongoDB] Load error: {e}")

    return None


def save_to_mongo(device_name: str, telemetry: dict, workload: str = "") -> bool:
    """
    Upserts a telemetry document in MongoDB Atlas.

    The schema is intentionally flexible — missing benchmark fields are stored as
    None rather than failing the insert. This means older/less-documented phones
    can still be cached and retrieved without breaking the system.

    Returns True if the save succeeded, False otherwise.
    """
    col = _get_collection()
    if col is None:
        return False

    norm = _normalize_name(device_name)
    now = datetime.now(timezone.utc).isoformat()

    # Build the document — all fields are optional except canonical_name
    doc = {
        "canonical_name": norm,
        "display_name": device_name,
        "last_scraped_at": now,
        "target_workload": workload,
        # Hardware identity
        "soc_chipset": telemetry.get("soc_chipset"),
        "gpu_and_storage": telemetry.get("gpu_and_storage"),
        "pwm_dimming_hz": telemetry.get("pwm_dimming_hz"),
        "image_url": telemetry.get("image_url"),
        # Benchmark scores (all nullable — schema is flexible)
        "antutu_v10": telemetry.get("antutu_v10_score"),
        "geekbench_6_single": telemetry.get("geekbench_6_single"),
        "geekbench_6_multi": telemetry.get("geekbench_6_multi"),
        "wildlife_stability_pct": telemetry.get("wildlife_stability_pct"),
        "peak_temp_celsius": telemetry.get("peak_temp_celsius"),
        # Computed score
        "pti_score": telemetry.get("pulse_throttle_index"),
        "score_breakdown": telemetry.get("score_breakdown"),
        # Game benchmarks + source URLs as sub-documents
        "game_benchmarks": telemetry.get("game_benchmarks", []),
        "sources": telemetry.get("sources", []),
    }

    try:
        result = col.update_one(
            {"canonical_name": norm},
            {"$set": doc},
            upsert=True,
        )
        action = "Upserted" if result.upserted_id else "Updated"
        print(f"  [MongoDB] ✅ {action}: '{device_name}'")
        return True
    except Exception as e:
        print(f"  [MongoDB] Save error for '{device_name}': {e}")
        return False


def _doc_to_dict(doc: dict) -> dict:
    """Converts a MongoDB document back to a DeviceTelemetry-compatible dict."""
    return {
        "device_name": doc.get("display_name") or doc.get("canonical_name", ""),
        "image_url": doc.get("image_url"),
        "soc_chipset": doc.get("soc_chipset") or "Unknown",
        "gpu_and_storage": doc.get("gpu_and_storage") or "Unknown",
        "pwm_dimming_hz": doc.get("pwm_dimming_hz") or "Not Reported",
        "antutu_v10_score": doc.get("antutu_v10"),
        "geekbench_6_single": doc.get("geekbench_6_single"),
        "geekbench_6_multi": doc.get("geekbench_6_multi"),
        "wildlife_stability_pct": doc.get("wildlife_stability_pct"),
        "peak_temp_celsius": doc.get("peak_temp_celsius"),
        "pulse_throttle_index": doc.get("pti_score"),
        "score_breakdown": doc.get("score_breakdown"),
        "game_benchmarks": doc.get("game_benchmarks", []),
        "sources": doc.get("sources", []),
    }


def ping_mongo() -> bool:
    """Health-check helper: returns True if MongoDB Atlas is reachable."""
    global _client
    _client = None  # Force reconnect on health check
    client = _get_client()
    return client is not None
