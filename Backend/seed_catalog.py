"""
PulseThrottle v2 — Supabase Master Phone Catalog Seeder
========================================================
Standalone script. Does NOT modify any existing project files.
Run once: python3 seed_catalog.py

Populates the `devices_catalog` table in Supabase with canonical phone names,
brands, chipsets, release years, and image URLs across all major brands.
"""

import os
import sys
import psycopg2
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

PROJECT_ID = os.getenv("SUPABASE_PROJECT_ID", "dkwkzoztkyklztqzmhis")
DB_PASSWORD = os.getenv("SUPABASE_DB_PASSWORD")
GSMARENA_BASE = "https://fdn2.gsmarena.com/vv/bigpic"

# ──────────────────────────────────────────────────────────────────────────────
# MASTER PHONE CATALOG
# Format: (canonical_name, brand, series, os, release_year, base_soc, image_url, extra_image_urls[])
# ──────────────────────────────────────────────────────────────────────────────
PHONES = [

    # ── APPLE ─────────────────────────────────────────────────────────────────
    ("iPhone 16 Pro Max",    "Apple", "iPhone 16", "iOS", 2024, "Apple A18 Pro (3nm TSMC)",     f"{GSMARENA_BASE}/apple-iphone-16-pro-max.jpg", []),
    ("iPhone 16 Pro",        "Apple", "iPhone 16", "iOS", 2024, "Apple A18 Pro (3nm TSMC)",     f"{GSMARENA_BASE}/apple-iphone-16-pro.jpg", []),
    ("iPhone 16 Plus",       "Apple", "iPhone 16", "iOS", 2024, "Apple A18 (3nm TSMC)",         f"{GSMARENA_BASE}/apple-iphone-16-plus.jpg", []),
    ("iPhone 16",            "Apple", "iPhone 16", "iOS", 2024, "Apple A18 (3nm TSMC)",         f"{GSMARENA_BASE}/apple-iphone-16.jpg", []),
    ("iPhone 15 Pro Max",    "Apple", "iPhone 15", "iOS", 2023, "Apple A17 Pro (3nm TSMC)",     f"{GSMARENA_BASE}/apple-iphone-15-pro-max.jpg", []),
    ("iPhone 15 Pro",        "Apple", "iPhone 15", "iOS", 2023, "Apple A17 Pro (3nm TSMC)",     f"{GSMARENA_BASE}/apple-iphone-15-pro.jpg", []),
    ("iPhone 15 Plus",       "Apple", "iPhone 15", "iOS", 2023, "Apple A16 Bionic (4nm TSMC)",  f"{GSMARENA_BASE}/apple-iphone-15-plus.jpg", []),
    ("iPhone 15",            "Apple", "iPhone 15", "iOS", 2023, "Apple A16 Bionic (4nm TSMC)",  f"{GSMARENA_BASE}/apple-iphone-15.jpg", []),
    ("iPhone 14 Pro Max",    "Apple", "iPhone 14", "iOS", 2022, "Apple A16 Bionic (4nm TSMC)",  f"{GSMARENA_BASE}/apple-iphone-14-pro-max-.jpg", []),
    ("iPhone 14 Pro",        "Apple", "iPhone 14", "iOS", 2022, "Apple A16 Bionic (4nm TSMC)",  f"{GSMARENA_BASE}/apple-iphone-14-pro.jpg", []),
    ("iPhone 14 Plus",       "Apple", "iPhone 14", "iOS", 2022, "Apple A15 Bionic (5nm TSMC)",  f"{GSMARENA_BASE}/apple-iphone-14-plus.jpg", []),
    ("iPhone 14",            "Apple", "iPhone 14", "iOS", 2022, "Apple A15 Bionic (5nm TSMC)",  f"{GSMARENA_BASE}/apple-iphone-14.jpg", []),
    ("iPhone 13 Pro Max",    "Apple", "iPhone 13", "iOS", 2021, "Apple A15 Bionic (5nm TSMC)",  f"{GSMARENA_BASE}/apple-iphone-13-pro-max.jpg", []),
    ("iPhone 13 Pro",        "Apple", "iPhone 13", "iOS", 2021, "Apple A15 Bionic (5nm TSMC)",  f"{GSMARENA_BASE}/apple-iphone-13-pro.jpg", []),
    ("iPhone 13 Mini",       "Apple", "iPhone 13", "iOS", 2021, "Apple A15 Bionic (5nm TSMC)",  f"{GSMARENA_BASE}/apple-iphone-13-mini.jpg", []),
    ("iPhone 13",            "Apple", "iPhone 13", "iOS", 2021, "Apple A15 Bionic (5nm TSMC)",  f"{GSMARENA_BASE}/apple-iphone-13.jpg", []),
    ("iPhone 12 Pro Max",    "Apple", "iPhone 12", "iOS", 2020, "Apple A14 Bionic (5nm TSMC)",  f"{GSMARENA_BASE}/apple-iphone-12-pro-max.jpg", []),
    ("iPhone 12 Pro",        "Apple", "iPhone 12", "iOS", 2020, "Apple A14 Bionic (5nm TSMC)",  f"{GSMARENA_BASE}/apple-iphone-12-pro.jpg", []),
    ("iPhone 12 Mini",       "Apple", "iPhone 12", "iOS", 2020, "Apple A14 Bionic (5nm TSMC)",  f"{GSMARENA_BASE}/apple-iphone-12-mini.jpg", []),
    ("iPhone 12",            "Apple", "iPhone 12", "iOS", 2020, "Apple A14 Bionic (5nm TSMC)",  f"{GSMARENA_BASE}/apple-iphone-12.jpg", []),
    ("iPhone 11 Pro Max",    "Apple", "iPhone 11", "iOS", 2019, "Apple A13 Bionic (7nm TSMC)",  f"{GSMARENA_BASE}/apple-iphone-11-pro-max.jpg", []),
    ("iPhone 11 Pro",        "Apple", "iPhone 11", "iOS", 2019, "Apple A13 Bionic (7nm TSMC)",  f"{GSMARENA_BASE}/apple-iphone-11-pro.jpg", []),
    ("iPhone 11",            "Apple", "iPhone 11", "iOS", 2019, "Apple A13 Bionic (7nm TSMC)",  f"{GSMARENA_BASE}/apple-iphone-11.jpg", []),
    ("iPhone XS Max",        "Apple", "iPhone XS", "iOS", 2018, "Apple A12 Bionic (7nm TSMC)",  f"{GSMARENA_BASE}/apple-iphone-xs-max-new1.jpg", []),
    ("iPhone XS",            "Apple", "iPhone XS", "iOS", 2018, "Apple A12 Bionic (7nm TSMC)",  f"{GSMARENA_BASE}/apple-iphone-xs-new.jpg", []),
    ("iPhone XR",            "Apple", "iPhone XR", "iOS", 2018, "Apple A12 Bionic (7nm TSMC)",  f"{GSMARENA_BASE}/apple-iphone-xr-new.jpg", []),
    ("iPhone X",             "Apple", "iPhone X",  "iOS", 2017, "Apple A11 Bionic (10nm TSMC)", f"{GSMARENA_BASE}/apple-iphone-x.jpg", []),
    ("iPhone 8 Plus",        "Apple", "iPhone 8",  "iOS", 2017, "Apple A11 Bionic (10nm TSMC)", f"{GSMARENA_BASE}/apple-iphone-8-plus.jpg", []),
    ("iPhone 8",             "Apple", "iPhone 8",  "iOS", 2017, "Apple A11 Bionic (10nm TSMC)", f"{GSMARENA_BASE}/apple-iphone-8.jpg", []),
    ("iPhone 7 Plus",        "Apple", "iPhone 7",  "iOS", 2016, "Apple A10 Fusion (16nm)",      f"{GSMARENA_BASE}/apple-iphone-7-plus-r2.jpg", []),
    ("iPhone 7",             "Apple", "iPhone 7",  "iOS", 2016, "Apple A10 Fusion (16nm)",      f"{GSMARENA_BASE}/apple-iphone-7r.jpg", []),
    ("iPhone 6s Plus",       "Apple", "iPhone 6s", "iOS", 2015, "Apple A9 (16nm / 20nm)",       f"{GSMARENA_BASE}/apple-iphone-6s-plus-f.jpg", []),
    ("iPhone 6s",            "Apple", "iPhone 6s", "iOS", 2015, "Apple A9 (16nm / 20nm)",       f"{GSMARENA_BASE}/apple-iphone-6s-f.jpg", []),
    ("iPhone SE (2022)",     "Apple", "iPhone SE",  "iOS", 2022, "Apple A15 Bionic (5nm TSMC)", f"{GSMARENA_BASE}/apple-iphone-se-2022-.jpg", []),
    ("iPhone SE (2020)",     "Apple", "iPhone SE",  "iOS", 2020, "Apple A13 Bionic (7nm TSMC)", f"{GSMARENA_BASE}/apple-iphone-se-2020.jpg", []),

    # ── SAMSUNG GALAXY S SERIES ────────────────────────────────────────────────
    ("Samsung Galaxy S25 Ultra",   "Samsung", "Galaxy S25", "Android", 2025, "Snapdragon 8 Elite (3nm TSMC)",       f"{GSMARENA_BASE}/samsung-galaxy-s25-ultra.jpg", []),
    ("Samsung Galaxy S25+",        "Samsung", "Galaxy S25", "Android", 2025, "Snapdragon 8 Elite (3nm TSMC)",       f"{GSMARENA_BASE}/samsung-galaxy-s25-plus.jpg", []),
    ("Samsung Galaxy S25",         "Samsung", "Galaxy S25", "Android", 2025, "Snapdragon 8 Elite (3nm TSMC)",       f"{GSMARENA_BASE}/samsung-galaxy-s25.jpg", []),
    ("Samsung Galaxy S24 Ultra",   "Samsung", "Galaxy S24", "Android", 2024, "Snapdragon 8 Gen 3 for Galaxy (4nm)", f"{GSMARENA_BASE}/samsung-galaxy-s24-ultra-5g-sm-s928-final.jpg", []),
    ("Samsung Galaxy S24+",        "Samsung", "Galaxy S24", "Android", 2024, "Snapdragon 8 Gen 3 for Galaxy (4nm)", f"{GSMARENA_BASE}/samsung-galaxy-s24-plus-5g-sm-s926-final.jpg", []),
    ("Samsung Galaxy S24",         "Samsung", "Galaxy S24", "Android", 2024, "Exynos 2400 / Snapdragon 8 Gen 3",   f"{GSMARENA_BASE}/samsung-galaxy-s24-5g-sm-s921-final.jpg", []),
    ("Samsung Galaxy S24 FE",      "Samsung", "Galaxy S24", "Android", 2024, "Exynos 2500",                         f"{GSMARENA_BASE}/samsung-galaxy-s24-fe.jpg", []),
    ("Samsung Galaxy S23 Ultra",   "Samsung", "Galaxy S23", "Android", 2023, "Snapdragon 8 Gen 2 (4nm TSMC)",       f"{GSMARENA_BASE}/samsung-galaxy-s23-ultra-5g.jpg", []),
    ("Samsung Galaxy S23+",        "Samsung", "Galaxy S23", "Android", 2023, "Snapdragon 8 Gen 2 (4nm TSMC)",       f"{GSMARENA_BASE}/samsung-galaxy-s23-plus-5g.jpg", []),
    ("Samsung Galaxy S23",         "Samsung", "Galaxy S23", "Android", 2023, "Snapdragon 8 Gen 2 (4nm TSMC)",       f"{GSMARENA_BASE}/samsung-galaxy-s23-5g.jpg", []),
    ("Samsung Galaxy S23 FE",      "Samsung", "Galaxy S23", "Android", 2023, "Exynos 2200 / Snapdragon 8 Gen 1",   f"{GSMARENA_BASE}/samsung-galaxy-s23-fe.jpg", []),
    ("Samsung Galaxy S22 Ultra",   "Samsung", "Galaxy S22", "Android", 2022, "Exynos 2200 / Snapdragon 8 Gen 1",   f"{GSMARENA_BASE}/samsung-galaxy-s22-ultra-5g.jpg", []),
    ("Samsung Galaxy S22+",        "Samsung", "Galaxy S22", "Android", 2022, "Exynos 2200 / Snapdragon 8 Gen 1",   f"{GSMARENA_BASE}/samsung-galaxy-s22-plus-5g.jpg", []),
    ("Samsung Galaxy S22",         "Samsung", "Galaxy S22", "Android", 2022, "Exynos 2200 / Snapdragon 8 Gen 1",   f"{GSMARENA_BASE}/samsung-galaxy-s22-5g.jpg", []),

    # ── SAMSUNG GALAXY A SERIES ────────────────────────────────────────────────
    ("Samsung Galaxy A55 5G",      "Samsung", "Galaxy A55", "Android", 2024, "Exynos 1480 (4nm)",                   f"{GSMARENA_BASE}/samsung-galaxy-a55.jpg", []),
    ("Samsung Galaxy A35 5G",      "Samsung", "Galaxy A35", "Android", 2024, "Exynos 1380 (5nm)",                   f"{GSMARENA_BASE}/samsung-galaxy-a35.jpg", []),
    ("Samsung Galaxy A15 5G",      "Samsung", "Galaxy A15", "Android", 2024, "MediaTek Dimensity 6100+ (6nm)",      f"{GSMARENA_BASE}/samsung-galaxy-a15-5g.jpg", []),
    ("Samsung Galaxy A54 5G",      "Samsung", "Galaxy A54", "Android", 2023, "Exynos 1380 (5nm)",                   f"{GSMARENA_BASE}/samsung-galaxy-a54.jpg", []),
    ("Samsung Galaxy A34 5G",      "Samsung", "Galaxy A34", "Android", 2023, "MediaTek Dimensity 1080 (6nm)",       f"{GSMARENA_BASE}/samsung-galaxy-a34.jpg", []),

    # ── XIAOMI FLAGSHIP ───────────────────────────────────────────────────────
    ("Xiaomi 14 Ultra",            "Xiaomi",  "Xiaomi 14",    "Android", 2024, "Snapdragon 8 Gen 3 (4nm TSMC)",     f"{GSMARENA_BASE}/xiaomi-14-ultra.jpg", []),
    ("Xiaomi 14",                  "Xiaomi",  "Xiaomi 14",    "Android", 2024, "Snapdragon 8 Gen 3 (4nm TSMC)",     f"{GSMARENA_BASE}/xiaomi-14.jpg", []),
    ("Xiaomi 13 Ultra",            "Xiaomi",  "Xiaomi 13",    "Android", 2023, "Snapdragon 8 Gen 2 (4nm TSMC)",     f"{GSMARENA_BASE}/xiaomi-13-ultra.jpg", []),
    ("Xiaomi 13 Pro",              "Xiaomi",  "Xiaomi 13",    "Android", 2023, "Snapdragon 8 Gen 2 (4nm TSMC)",     f"{GSMARENA_BASE}/xiaomi-13-pro.jpg", []),
    ("Xiaomi 13",                  "Xiaomi",  "Xiaomi 13",    "Android", 2022, "Snapdragon 8 Gen 2 (4nm TSMC)",     f"{GSMARENA_BASE}/xiaomi-13.jpg", []),
    ("Xiaomi 12 Pro",              "Xiaomi",  "Xiaomi 12",    "Android", 2022, "Snapdragon 8 Gen 1 (4nm Samsung)",  f"{GSMARENA_BASE}/xiaomi-12-pro.jpg", []),
    ("Xiaomi 12",                  "Xiaomi",  "Xiaomi 12",    "Android", 2022, "Snapdragon 8 Gen 1 (4nm Samsung)",  f"{GSMARENA_BASE}/xiaomi-12.jpg", []),

    # ── REDMI NOTE SERIES ─────────────────────────────────────────────────────
    ("Redmi Note 14 Pro+ 5G",      "Xiaomi",  "Redmi Note 14", "Android", 2025, "MediaTek Dimensity 9300+ (4nm)",   f"{GSMARENA_BASE}/xiaomi-redmi-note-14-pro-plus.jpg", []),
    ("Redmi Note 14 Pro 5G",       "Xiaomi",  "Redmi Note 14", "Android", 2025, "MediaTek Dimensity 7300 Ultra",     f"{GSMARENA_BASE}/xiaomi-redmi-note-14-pro-5g.jpg", []),
    ("Redmi Note 14 5G",           "Xiaomi",  "Redmi Note 14", "Android", 2025, "MediaTek Dimensity 7025 Ultra",     f"{GSMARENA_BASE}/xiaomi-redmi-note-14-5g.jpg", []),
    ("Redmi Note 14",              "Xiaomi",  "Redmi Note 14", "Android", 2025, "Snapdragon 4s Gen 2 (4nm)",         f"{GSMARENA_BASE}/xiaomi-redmi-note-14.jpg", []),
    ("Redmi Note 13 Pro+ 5G",      "Xiaomi",  "Redmi Note 13", "Android", 2024, "MediaTek Dimensity 7200 Ultra",    f"{GSMARENA_BASE}/xiaomi-redmi-note-13-pro-plus.jpg", []),
    ("Redmi Note 13 Pro 5G",       "Xiaomi",  "Redmi Note 13", "Android", 2024, "Snapdragon 7s Gen 2 (4nm TSMC)",   f"{GSMARENA_BASE}/xiaomi-redmi-note-13-pro-5g.jpg", []),
    ("Redmi Note 13 Pro 4G",       "Xiaomi",  "Redmi Note 13", "Android", 2024, "MediaTek Helio G99 Ultra (6nm)",   f"{GSMARENA_BASE}/xiaomi-redmi-note-13-pro-4g.jpg", []),
    ("Redmi Note 13 5G",           "Xiaomi",  "Redmi Note 13", "Android", 2024, "MediaTek Dimensity 6080 (6nm)",    f"{GSMARENA_BASE}/xiaomi-redmi-note-13-5g.jpg", []),
    ("Redmi Note 13 4G",           "Xiaomi",  "Redmi Note 13", "Android", 2024, "Snapdragon 685 (6nm)",             f"{GSMARENA_BASE}/xiaomi-redmi-note-13-4g.jpg", []),
    ("Redmi Note 12 Pro+ 5G",      "Xiaomi",  "Redmi Note 12", "Android", 2023, "MediaTek Dimensity 1080 (6nm)",    f"{GSMARENA_BASE}/xiaomi-redmi-note-12-pro-plus.jpg", []),
    ("Redmi Note 12 Pro 5G",       "Xiaomi",  "Redmi Note 12", "Android", 2023, "MediaTek Dimensity 1080 (6nm)",    f"{GSMARENA_BASE}/xiaomi-redmi-note-12-pro-5g.jpg", []),
    ("Redmi Note 12 5G",           "Xiaomi",  "Redmi Note 12", "Android", 2023, "Snapdragon 4 Gen 1 (6nm TSMC)",    f"{GSMARENA_BASE}/xiaomi-redmi-note-12-5g.jpg", []),
    ("Redmi Note 12 4G",           "Xiaomi",  "Redmi Note 12", "Android", 2023, "Snapdragon 685 (6nm)",             f"{GSMARENA_BASE}/xiaomi-redmi-note-12.jpg", []),
    ("Redmi Note 11 Pro+ 5G",      "Xiaomi",  "Redmi Note 11", "Android", 2022, "MediaTek Dimensity 920 (6nm)",     f"{GSMARENA_BASE}/xiaomi-redmi-note-11-pro-plus.jpg", []),
    ("Redmi Note 11 Pro 5G",       "Xiaomi",  "Redmi Note 11", "Android", 2022, "MediaTek Dimensity 920 (6nm)",     f"{GSMARENA_BASE}/xiaomi-redmi-note-11-pro-5g.jpg", []),
    ("Redmi Note 11S 5G",          "Xiaomi",  "Redmi Note 11", "Android", 2022, "MediaTek Dimensity 810 (6nm)",     f"{GSMARENA_BASE}/xiaomi-redmi-note-11s-5g.jpg", []),
    ("Redmi Note 11 5G",           "Xiaomi",  "Redmi Note 11", "Android", 2022, "MediaTek Dimensity 810 (6nm)",     f"{GSMARENA_BASE}/xiaomi-redmi-note-11-5g.jpg", []),
    ("Redmi Note 11",              "Xiaomi",  "Redmi Note 11", "Android", 2022, "Snapdragon 680 (6nm)",             f"{GSMARENA_BASE}/xiaomi-redmi-note-11.jpg", []),

    # ── POCO ─────────────────────────────────────────────────────────────────
    ("POCO F6 Pro",                "POCO",    "POCO F6",      "Android", 2024, "Snapdragon 8 Gen 2 (4nm TSMC)",     f"{GSMARENA_BASE}/xiaomi-poco-f6-pro.jpg", []),
    ("POCO F6",                    "POCO",    "POCO F6",      "Android", 2024, "Snapdragon 8s Gen 3 (4nm TSMC)",    f"{GSMARENA_BASE}/xiaomi-poco-f6.jpg", []),
    ("POCO X6 Pro 5G",             "POCO",    "POCO X6",      "Android", 2024, "MediaTek Dimensity 8300 Ultra",     f"{GSMARENA_BASE}/xiaomi-poco-x6-pro.jpg", []),
    ("POCO X6 5G",                 "POCO",    "POCO X6",      "Android", 2024, "Snapdragon 7s Gen 2 (4nm TSMC)",    f"{GSMARENA_BASE}/xiaomi-poco-x6.jpg", []),
    ("POCO M6 Pro 5G",             "POCO",    "POCO M6",      "Android", 2024, "MediaTek Dimensity 6080 (6nm)",     f"{GSMARENA_BASE}/xiaomi-poco-m6-pro.jpg", []),
    ("POCO F5 Pro",                "POCO",    "POCO F5",      "Android", 2023, "Snapdragon 8 Gen 2 (4nm TSMC)",     f"{GSMARENA_BASE}/xiaomi-poco-f5-pro.jpg", []),
    ("POCO F5",                    "POCO",    "POCO F5",      "Android", 2023, "Snapdragon 7+ Gen 2 (4nm TSMC)",    f"{GSMARENA_BASE}/xiaomi-poco-f5.jpg", []),
    ("POCO X5 Pro 5G",             "POCO",    "POCO X5",      "Android", 2023, "Snapdragon 778G (6nm TSMC)",        f"{GSMARENA_BASE}/xiaomi-poco-x5-pro.jpg", []),
    ("POCO X5 5G",                 "POCO",    "POCO X5",      "Android", 2023, "Snapdragon 695 5G (6nm TSMC)",      f"{GSMARENA_BASE}/xiaomi-poco-x5-5g.jpg", []),
    ("POCO F4 GT",                 "POCO",    "POCO F4",      "Android", 2022, "Snapdragon 8 Gen 1 (4nm Samsung)",  f"{GSMARENA_BASE}/xiaomi-poco-f4-gt.jpg", []),
    ("POCO F4",                    "POCO",    "POCO F4",      "Android", 2022, "Snapdragon 870 (7nm)",              f"{GSMARENA_BASE}/xiaomi-poco-f4.jpg", []),

    # ── iQOO ─────────────────────────────────────────────────────────────────
    ("iQOO 13",                    "iQOO",    "iQOO 13",      "Android", 2025, "Snapdragon 8 Elite (3nm TSMC)",     f"{GSMARENA_BASE}/vivo-iqoo-13.jpg", []),
    ("iQOO 12",                    "iQOO",    "iQOO 12",      "Android", 2024, "Snapdragon 8 Gen 3 (4nm TSMC)",     f"{GSMARENA_BASE}/vivo-iqoo-12.jpg", []),
    ("iQOO 11",                    "iQOO",    "iQOO 11",      "Android", 2023, "Snapdragon 8 Gen 2 (4nm TSMC)",     f"{GSMARENA_BASE}/vivo-iqoo-11.jpg", []),
    ("iQOO Neo 9 Pro",             "iQOO",    "iQOO Neo 9",   "Android", 2024, "Snapdragon 8 Gen 2 (4nm TSMC)",     f"{GSMARENA_BASE}/vivo-iqoo-neo9-pro.jpg", []),
    ("iQOO Neo 9",                 "iQOO",    "iQOO Neo 9",   "Android", 2024, "MediaTek Dimensity 9300 (4nm)",     f"{GSMARENA_BASE}/vivo-iqoo-neo9.jpg", []),
    ("iQOO Neo 8 Pro",             "iQOO",    "iQOO Neo 8",   "Android", 2023, "Snapdragon 8+ Gen 1 (4nm TSMC)",    f"{GSMARENA_BASE}/vivo-iqoo-neo8-pro.jpg", []),
    ("iQOO Neo 8",                 "iQOO",    "iQOO Neo 8",   "Android", 2023, "MediaTek Dimensity 9200+ (4nm)",    f"{GSMARENA_BASE}/vivo-iqoo-neo8.jpg", []),
    ("iQOO Z9 5G",                 "iQOO",    "iQOO Z9",      "Android", 2024, "Snapdragon 7 Gen 3 (4nm TSMC)",     f"{GSMARENA_BASE}/vivo-iqoo-z9-5g.jpg", []),
    ("iQOO Z9 Turbo",              "iQOO",    "iQOO Z9",      "Android", 2024, "Snapdragon 8s Gen 3 (4nm TSMC)",    f"{GSMARENA_BASE}/vivo-iqoo-z9-turbo.jpg", []),
    ("iQOO Z9x 5G",               "iQOO",    "iQOO Z9",      "Android", 2024, "Snapdragon 6 Gen 1 (4nm TSMC)",     f"{GSMARENA_BASE}/vivo-iqoo-z9x.jpg", []),
    ("iQOO Z8 5G",                 "iQOO",    "iQOO Z8",      "Android", 2023, "MediaTek Dimensity 8200 (4nm TSMC)",f"{GSMARENA_BASE}/vivo-iqoo-z8.jpg", []),
    ("iQOO Z7 Pro 5G",             "iQOO",    "iQOO Z7",      "Android", 2023, "Snapdragon 778G+ (6nm TSMC)",       f"{GSMARENA_BASE}/vivo-iqoo-z7-pro.jpg", []),

    # ── OnePlus ───────────────────────────────────────────────────────────────
    ("OnePlus 13",                 "OnePlus", "OnePlus 13",   "Android", 2025, "Snapdragon 8 Elite (3nm TSMC)",     f"{GSMARENA_BASE}/oneplus-13.jpg", []),
    ("OnePlus 12",                 "OnePlus", "OnePlus 12",   "Android", 2024, "Snapdragon 8 Gen 3 (4nm TSMC)",     f"{GSMARENA_BASE}/oneplus-12.jpg", []),
    ("OnePlus 12R",                "OnePlus", "OnePlus 12",   "Android", 2024, "Snapdragon 8 Gen 1 (4nm Samsung)",  f"{GSMARENA_BASE}/oneplus-12r.jpg", []),
    ("OnePlus 11",                 "OnePlus", "OnePlus 11",   "Android", 2023, "Snapdragon 8 Gen 2 (4nm TSMC)",     f"{GSMARENA_BASE}/oneplus-11.jpg", []),
    ("OnePlus Nord 4",             "OnePlus", "OnePlus Nord 4","Android", 2024, "Snapdragon 7+ Gen 3 (4nm TSMC)",   f"{GSMARENA_BASE}/oneplus-nord-4.jpg", []),
    ("OnePlus Nord CE 4",          "OnePlus", "OnePlus Nord CE 4","Android",2024,"Snapdragon 7 Gen 3 (4nm TSMC)",   f"{GSMARENA_BASE}/oneplus-nord-ce-4.jpg", []),
    ("OnePlus Nord CE 3 Lite 5G",  "OnePlus", "OnePlus Nord CE 3","Android",2023,"Snapdragon 695 5G (6nm TSMC)",   f"{GSMARENA_BASE}/oneplus-nord-ce3-lite-5g.jpg", []),

    # ── Realme ────────────────────────────────────────────────────────────────
    ("Realme GT 6",                "Realme",  "Realme GT 6",  "Android", 2024, "Snapdragon 8s Gen 3 (4nm TSMC)",    f"{GSMARENA_BASE}/realme-gt-6.jpg", []),
    ("Realme GT 6T",               "Realme",  "Realme GT 6",  "Android", 2024, "Snapdragon 7+ Gen 3 (4nm TSMC)",    f"{GSMARENA_BASE}/realme-gt-6t.jpg", []),
    ("Realme GT 5 Pro",            "Realme",  "Realme GT 5",  "Android", 2024, "Snapdragon 8 Gen 3 (4nm TSMC)",     f"{GSMARENA_BASE}/realme-gt5-pro.jpg", []),
    ("Realme 13 Pro+",             "Realme",  "Realme 13",    "Android", 2024, "Snapdragon 7s Gen 2 (4nm TSMC)",    f"{GSMARENA_BASE}/realme-13-pro-plus.jpg", []),
    ("Realme 13 Pro",              "Realme",  "Realme 13",    "Android", 2024, "Snapdragon 7s Gen 2 (4nm TSMC)",    f"{GSMARENA_BASE}/realme-13-pro.jpg", []),
    ("Realme 12 Pro+",             "Realme",  "Realme 12",    "Android", 2024, "Snapdragon 7s Gen 2 (4nm TSMC)",    f"{GSMARENA_BASE}/realme-12-pro-plus.jpg", []),
    ("Realme 12 Pro",              "Realme",  "Realme 12",    "Android", 2024, "Snapdragon 6 Gen 1 (4nm TSMC)",     f"{GSMARENA_BASE}/realme-12-pro.jpg", []),
    ("Realme Narzo 70 Pro",        "Realme",  "Realme Narzo", "Android", 2024, "MediaTek Dimensity 6300 (6nm)",     f"{GSMARENA_BASE}/realme-narzo-70-pro.jpg", []),

    # ── Motorola ──────────────────────────────────────────────────────────────
    ("Motorola Edge 60 Pro",       "Motorola","Motorola Edge 60", "Android", 2024, "Dimensity 8350 Extreme (4nm TSMC)", f"{GSMARENA_BASE}/motorola-edge-60-pro.jpg", []),
    ("Motorola Edge 60 Fusion",    "Motorola","Motorola Edge 60", "Android", 2024, "MediaTek Dimensity 7400 (4nm TSMC)", f"{GSMARENA_BASE}/motorola-edge-60-fusion.jpg", []),
    ("Motorola Edge 60",           "Motorola","Motorola Edge 60", "Android", 2024, "MediaTek Dimensity 7300 (4nm TSMC)", f"{GSMARENA_BASE}/motorola-edge-60.jpg", []),
    ("Motorola Edge 50 Pro",       "Motorola","Motorola Edge 50", "Android", 2024, "Snapdragon 7 Gen 3 (4nm TSMC)",     f"{GSMARENA_BASE}/motorola-edge-50-pro.jpg", []),
    ("Motorola Edge 50 Fusion",    "Motorola","Motorola Edge 50", "Android", 2024, "Snapdragon 7s Gen 2 (4nm TSMC)",    f"{GSMARENA_BASE}/motorola-edge-50-fusion.jpg", []),
    ("Motorola Edge 50 Ultra",     "Motorola","Motorola Edge 50", "Android", 2024, "Snapdragon 8s Gen 3 (4nm TSMC)",    f"{GSMARENA_BASE}/motorola-edge-50-ultra.jpg", []),
    ("Motorola Moto G85 5G",       "Motorola","Motorola Moto G",  "Android", 2024, "Snapdragon 6s Gen 3 (6nm TSMC)",   f"{GSMARENA_BASE}/motorola-moto-g85.jpg", []),
    ("Motorola Moto G64 5G",       "Motorola","Motorola Moto G",  "Android", 2024, "MediaTek Dimensity 7025 (6nm)",     f"{GSMARENA_BASE}/motorola-moto-g64.jpg", []),

    # ── Google Pixel ──────────────────────────────────────────────────────────
    ("Google Pixel 9 Pro XL",      "Google",  "Google Pixel 9",  "Android", 2024, "Google Tensor G4 (4nm Samsung)", f"{GSMARENA_BASE}/google-pixel-9-pro-xl.jpg", []),
    ("Google Pixel 9 Pro",         "Google",  "Google Pixel 9",  "Android", 2024, "Google Tensor G4 (4nm Samsung)", f"{GSMARENA_BASE}/google-pixel-9-pro.jpg", []),
    ("Google Pixel 9",             "Google",  "Google Pixel 9",  "Android", 2024, "Google Tensor G4 (4nm Samsung)", f"{GSMARENA_BASE}/google-pixel-9.jpg", []),
    ("Google Pixel 8 Pro",         "Google",  "Google Pixel 8",  "Android", 2023, "Google Tensor G3 (4nm Samsung)", f"{GSMARENA_BASE}/google-pixel-8-pro.jpg", []),
    ("Google Pixel 8",             "Google",  "Google Pixel 8",  "Android", 2023, "Google Tensor G3 (4nm Samsung)", f"{GSMARENA_BASE}/google-pixel-8.jpg", []),
    ("Google Pixel 8a",            "Google",  "Google Pixel 8",  "Android", 2024, "Google Tensor G3 (4nm Samsung)", f"{GSMARENA_BASE}/google-pixel-8a.jpg", []),
    ("Google Pixel 7 Pro",         "Google",  "Google Pixel 7",  "Android", 2022, "Google Tensor G2 (5nm Samsung)", f"{GSMARENA_BASE}/google-pixel-7-pro.jpg", []),
    ("Google Pixel 7",             "Google",  "Google Pixel 7",  "Android", 2022, "Google Tensor G2 (5nm Samsung)", f"{GSMARENA_BASE}/google-pixel-7.jpg", []),
    ("Google Pixel 7a",            "Google",  "Google Pixel 7",  "Android", 2023, "Google Tensor G2 (5nm Samsung)", f"{GSMARENA_BASE}/google-pixel-7a.jpg", []),

    # ── Nothing ───────────────────────────────────────────────────────────────
    ("Nothing Phone (2a) Plus",    "Nothing", "Nothing Phone 2", "Android", 2024, "MediaTek Dimensity 7350 Pro",    f"{GSMARENA_BASE}/nothing-phone-2a-plus.jpg", []),
    ("Nothing Phone (2a)",         "Nothing", "Nothing Phone 2", "Android", 2024, "MediaTek Dimensity 7200 Pro",    f"{GSMARENA_BASE}/nothing-phone-2a.jpg", []),
    ("Nothing Phone (2)",          "Nothing", "Nothing Phone 2", "Android", 2023, "Snapdragon 8+ Gen 1 (4nm TSMC)", f"{GSMARENA_BASE}/nothing-phone-2.jpg", []),
    ("Nothing Phone (1)",          "Nothing", "Nothing Phone 1", "Android", 2022, "Snapdragon 778G+ (6nm TSMC)",    f"{GSMARENA_BASE}/nothing-phone-1.jpg", []),

    # ── Vivo ─────────────────────────────────────────────────────────────────
    ("Vivo X200 Pro",              "Vivo",    "Vivo X200",    "Android", 2024, "MediaTek Dimensity 9400 (3nm)",     f"{GSMARENA_BASE}/vivo-x200-pro.jpg", []),
    ("Vivo X200",                  "Vivo",    "Vivo X200",    "Android", 2024, "MediaTek Dimensity 9400 (3nm)",     f"{GSMARENA_BASE}/vivo-x200.jpg", []),
    ("Vivo V40 Pro",               "Vivo",    "Vivo V40",     "Android", 2024, "Snapdragon 7 Gen 3 (4nm TSMC)",     f"{GSMARENA_BASE}/vivo-v40-pro.jpg", []),
    ("Vivo V40",                   "Vivo",    "Vivo V40",     "Android", 2024, "Snapdragon 7 Gen 3 (4nm TSMC)",     f"{GSMARENA_BASE}/vivo-v40.jpg", []),
    ("Vivo T3 Ultra",              "Vivo",    "Vivo T3",      "Android", 2024, "Snapdragon 8s Gen 3 (4nm TSMC)",    f"{GSMARENA_BASE}/vivo-t3-ultra.jpg", []),
    ("Vivo T3 Pro",                "Vivo",    "Vivo T3",      "Android", 2024, "Snapdragon 7+ Gen 3 (4nm TSMC)",    f"{GSMARENA_BASE}/vivo-t3-pro.jpg", []),
    ("Vivo T3x 5G",                "Vivo",    "Vivo T3",      "Android", 2024, "Snapdragon 6 Gen 1 (4nm TSMC)",     f"{GSMARENA_BASE}/vivo-t3x.jpg", []),

    # ── OPPO ─────────────────────────────────────────────────────────────────
    ("OPPO Find X8 Pro",           "OPPO",    "OPPO Find X8",  "Android", 2024, "MediaTek Dimensity 9400 (3nm)",    f"{GSMARENA_BASE}/oppo-find-x8-pro.jpg", []),
    ("OPPO Find X8",               "OPPO",    "OPPO Find X8",  "Android", 2024, "MediaTek Dimensity 9400 (3nm)",    f"{GSMARENA_BASE}/oppo-find-x8.jpg", []),
    ("OPPO Reno 13 Pro",           "OPPO",    "OPPO Reno 13",  "Android", 2025, "MediaTek Dimensity 8350",          f"{GSMARENA_BASE}/oppo-reno13-pro.jpg", []),
    ("OPPO Reno 13",               "OPPO",    "OPPO Reno 13",  "Android", 2025, "Snapdragon 8 Gen 3 (4nm TSMC)",    f"{GSMARENA_BASE}/oppo-reno13.jpg", []),
    ("OPPO Reno 12 Pro",           "OPPO",    "OPPO Reno 12",  "Android", 2024, "MediaTek Dimensity 7300 Energy",   f"{GSMARENA_BASE}/oppo-reno12-pro.jpg", []),
    ("OPPO Reno 12",               "OPPO",    "OPPO Reno 12",  "Android", 2024, "MediaTek Dimensity 7300 Energy",   f"{GSMARENA_BASE}/oppo-reno12.jpg", []),

    # ── ASUS ROG ──────────────────────────────────────────────────────────────
    ("ASUS ROG Phone 9 Pro",       "ASUS",    "ROG Phone 9",   "Android", 2025, "Snapdragon 8 Elite (3nm TSMC)",    f"{GSMARENA_BASE}/asus-rog-phone-9-pro.jpg", []),
    ("ASUS ROG Phone 9",           "ASUS",    "ROG Phone 9",   "Android", 2025, "Snapdragon 8 Elite (3nm TSMC)",    f"{GSMARENA_BASE}/asus-rog-phone-9.jpg", []),
    ("ASUS ROG Phone 8 Pro",       "ASUS",    "ROG Phone 8",   "Android", 2024, "Snapdragon 8 Gen 3 (4nm TSMC)",    f"{GSMARENA_BASE}/asus-rog-phone-8-pro.jpg", []),
    ("ASUS ROG Phone 8",           "ASUS",    "ROG Phone 8",   "Android", 2024, "Snapdragon 8 Gen 3 (4nm TSMC)",    f"{GSMARENA_BASE}/asus-rog-phone-8.jpg", []),
    ("ASUS ROG Phone 7 Ultimate",  "ASUS",    "ROG Phone 7",   "Android", 2023, "Snapdragon 8 Gen 2 (4nm TSMC)",    f"{GSMARENA_BASE}/asus-rog-phone-7-ultimate.jpg", []),
    ("ASUS ROG Phone 7",           "ASUS",    "ROG Phone 7",   "Android", 2023, "Snapdragon 8 Gen 2 (4nm TSMC)",    f"{GSMARENA_BASE}/asus-rog-phone-7.jpg", []),
]

INSERT_SQL = """
    INSERT INTO devices_catalog
        (canonical_name, brand, series, os, release_year, base_soc, default_image, image_urls)
    VALUES
        (%s, %s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT (canonical_name) DO NOTHING;
"""

def seed():
    print(f"\n⚡ PulseThrottle v2 — Supabase Catalog Seeder")
    print(f"   Target: {PROJECT_ID}.supabase.co → devices_catalog\n")

    conn = psycopg2.connect(
        host="aws-0-ap-southeast-1.pooler.supabase.com",
        port=6543,
        user=f"postgres.{PROJECT_ID}",
        password=DB_PASSWORD,
        database="postgres",
    )
    conn.autocommit = False

    try:
        with conn.cursor() as cur:
            inserted = 0
            skipped  = 0
            for phone in PHONES:
                name, brand, series, os_, year, soc, img, extra_imgs = phone
                # Fetch existing count before insert
                cur.execute("SELECT 1 FROM devices_catalog WHERE canonical_name = %s", (name,))
                exists = cur.fetchone()
                if exists:
                    skipped += 1
                    continue
                cur.execute(INSERT_SQL, (name, brand, series, os_, year, soc, img, extra_imgs))
                inserted += 1

            conn.commit()
            print(f"  ✅ Inserted : {inserted} new devices")
            print(f"  ⏭️  Skipped  : {skipped} already in catalog")

            # Final count
            cur.execute("SELECT COUNT(*) FROM devices_catalog;")
            total = cur.fetchone()[0]
            print(f"  📊 Total in devices_catalog: {total} phones\n")

    except Exception as e:
        conn.rollback()
        print(f"  ❌ Error during seeding: {e}")
        sys.exit(1)
    finally:
        conn.close()

if __name__ == "__main__":
    seed()
