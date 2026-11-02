import re
import warnings
from typing import Optional, Dict
import requests
from bs4 import BeautifulSoup

warnings.filterwarnings("ignore", category=RuntimeWarning)

try:
    from ddgs import DDGS
except ImportError:
    try:
        from duckduckgo_search import DDGS
    except ImportError:
        DDGS = None

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}

_IMAGE_CACHE: Dict[str, str] = {}


def _lookup_catalog_image(device_name: str) -> Optional[str]:
    """Checks if the device already exists in the master Supabase devices_catalog."""
    try:
        import os
        import psycopg2
        from dotenv import load_dotenv

        backend_dir = os.path.dirname(__file__)
        env_path = os.path.join(backend_dir, ".env")
        if os.path.exists(env_path):
            load_dotenv(env_path)

        pwd = os.getenv("SUPABASE_DB_PASSWORD")
        proj = os.getenv("SUPABASE_PROJECT_ID", "dkwkzoztkyklztqzmhis")
        host = os.getenv("SUPABASE_HOST", "aws-0-ap-southeast-1.pooler.supabase.com")
        port = int(os.getenv("SUPABASE_PORT", "6543"))

        if not pwd or not proj:
            return None

        conn = psycopg2.connect(
            host=host,
            port=port,
            user=f"postgres.{proj}",
            password=pwd,
            database="postgres",
            connect_timeout=2,
        )
        clean = device_name.strip()
        with conn.cursor() as cur:
            # 1. Exact match
            cur.execute(
                "SELECT default_image FROM devices_catalog WHERE LOWER(canonical_name) = LOWER(%s) AND default_image IS NOT NULL LIMIT 1;",
                (clean,),
            )
            row = cur.fetchone()
            if row and row[0]:
                conn.close()
                return row[0]

            # 2. Case-insensitive like match
            cur.execute(
                "SELECT default_image FROM devices_catalog WHERE canonical_name ILIKE %s AND default_image IS NOT NULL ORDER BY release_year DESC LIMIT 1;",
                (f"%{clean}%",),
            )
            row = cur.fetchone()
            if row and row[0]:
                conn.close()
                return row[0]
        conn.close()
    except Exception:
        pass
    return None


def _score_image_candidate(url: str, title: str, device_name: str) -> int:
    """Scores candidate image URLs based on source authenticity, resolution, and relevance."""
    score = 0
    u = url.lower()
    t = title.lower()
    d_lower = device_name.lower().strip()
    d_parts = d_lower.split()

    # Tier 1: Canonical GSMArena official renders
    if "gsmarena.com/vv/bigpic/" in u or "gsmarena.com/vv/pics/" in u:
        score += 150
    # Tier 2: Official manufacturer CDN transparent renders or Amazon official product imagery
    elif any(brand in u for brand in ["apple.com", "samsung.com", "vivo.com", "mi.com", "oneplus.com", "motorola.com", "realme.com", "oppo.com", "in-exstatic-vivofs"]):
        score += 110
    elif "m.media-amazon.com/images" in u:
        score += 85
    elif "gsmarena.com" in u:
        score += 80

    # Device keyword presence in title or URL
    for p in d_parts:
        if len(p) > 1 and (p in t or p in u):
            score += 20

    # Strict number checking (e.g. '8', '15', '24')
    d_numbers = re.findall(r"\b\d+\b", d_lower)
    for num in d_numbers:
        if re.search(r"\b" + re.escape(num) + r"\b", t) or re.search(r"[-_/]" + re.escape(num) + r"[-_.]", u):
            score += 60
        else:
            # Model number is missing from the image title/url! Heavy penalty
            score -= 150

    # Avoid picking wrong generation (e.g., iPhone 16 when user asked for iPhone 8)
    if "iphone" in d_lower:
        found_nums = re.findall(r"\b(?:1[1-6]|[4-9]|x|xs|xr|se)\b", t + " " + u)
        for fn in found_nums:
            if fn not in d_parts:
                score -= 250

    # Avoid picking wrong variant (e.g., Pro, Max, Plus when user asked for standard base model)
    for variant in ["plus", "pro", "max", "ultra", "mini", "fe", "neo", "lite"]:
        if variant in d_parts and (variant in t or variant in u):
            score += 40
        elif variant not in d_parts and (variant in t or variant in u):
            score -= 80

    # Penalize accessories, cases, reviews thumbnails, and logos
    if any(bad in u or bad in t for bad in ["case", "cover", "protector", "screen-guard", "logo", "icon", "banner", "unboxing"]):
        score -= 150

    return score


def get_high_res_phone_image(device_name: str) -> Optional[str]:
    """
    Keylessly fetches a verified high-resolution product render for a smartphone.
    Uses multi-stage discovery:
      1. In-memory cache check (0ms)
      2. Master Supabase devices_catalog check (~50ms)
      3. Direct high-res product image search via DDGS (~400-800ms)
      4. GSMArena HTML page scrape fallback
    """
    if not device_name or not device_name.strip():
        return None

    clean_name = device_name.strip()
    cache_key = clean_name.lower()

    # 1. Cache hit (0ms)
    if cache_key in _IMAGE_CACHE:
        return _IMAGE_CACHE[cache_key]

    # 2. Supabase master devices_catalog check (exact match)
    catalog_img = _lookup_catalog_image(clean_name)
    if catalog_img:
        _IMAGE_CACHE[cache_key] = catalog_img
        return catalog_img

    if DDGS is None:
        return None

    best_url = None
    best_score = -1

    # 3. Stage 1: Fast direct product render search via DDGS Images
    try:
        with DDGS() as ddgs:
            # First pass: Clean white-background official render
            results = list(ddgs.images(f"{clean_name} official smartphone white background product", max_results=8))
            for r in results:
                url = r.get("image", "")
                title = r.get("title", "")
                if not url or not url.startswith("http"):
                    continue
                s = _score_image_candidate(url, title, clean_name)
                if s > best_score:
                    best_score = s
                    best_url = url
                    if s >= 160:
                        break

            # Second pass: If not found or low confidence, search explicitly with gsmarena
            if best_score < 75:
                results_gsm = list(ddgs.images(f"{clean_name} gsmarena official picture", max_results=6))
                for r in results_gsm:
                    url = r.get("image", "")
                    title = r.get("title", "")
                    if not url or not url.startswith("http"):
                        continue
                    s = _score_image_candidate(url, title, clean_name)
                    if s > best_score:
                        best_score = s
                        best_url = url

            # Third pass: If still no top score, take first high-quality result
            if not best_url and results:
                best_url = results[0].get("image") or results[0].get("thumbnail")
    except Exception:
        pass

    # 3. Stage 2: Fallback to GSMArena HTML Page Scrape if direct image search yielded nothing
    if not best_url:
        try:
            with DDGS() as ddgs:
                text_results = list(ddgs.text(f"{clean_name} gsmarena specs official picture", max_results=3))
            
            target_url = None
            for r in text_results:
                url = r.get("href", "")
                if "gsmarena.com" in url and "-" in url:
                    target_url = url
                    break

            if not target_url and text_results:
                target_url = text_results[0].get("href")

            if target_url and "gsmarena.com" in target_url:
                resp = requests.get(target_url, headers=HEADERS, timeout=4)
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    pic_div = soup.find("div", class_="specs-photo-pic")
                    if pic_div:
                        img_tag = pic_div.find("img")
                        if img_tag and img_tag.get("src"):
                            img_url = img_tag["src"]
                            if img_url.startswith("//"):
                                img_url = "https:" + img_url
                            best_url = img_url

                    if not best_url:
                        og_image = soup.find("meta", property="og:image")
                        if og_image and og_image.get("content"):
                            best_url = og_image["content"]
        except Exception:
            pass

    if best_url:
        _IMAGE_CACHE[cache_key] = best_url

    return best_url
