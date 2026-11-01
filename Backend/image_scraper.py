import re
import warnings
from typing import Optional
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


def get_high_res_phone_image(device_name: str) -> Optional[str]:
    """
    Keylessly searches for an official high-resolution product render of a smartphone
    by targeting GSMArena spec pages via DuckDuckGo Image/Text search.
    """
    if DDGS is None:
        return None

    # Search specifically for GSMArena's page for this phone model
    query = f"{device_name} gsmarena specs official picture"
    
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=3))
    except Exception:
        return None

    target_url = None
    for r in results:
        url = r.get("href", "")
        if "gsmarena.com" in url and "-" in url:
            target_url = url
            break

    if not target_url and results:
        target_url = results[0].get("href")

    if not target_url:
        return None

    # Scrape the GSMArena page to find the high-res product image container
    try:
        resp = requests.get(target_url, headers=HEADERS, timeout=5)
        if resp.status_code != 200:
            return None

        soup = BeautifulSoup(resp.text, "html.parser")
        
        # GSMArena stores the primary high-res image inside the specs-photo-pic container
        pic_div = soup.find("div", class_="specs-photo-pic")
        if pic_div:
            img_tag = pic_div.find("img")
            if img_tag and img_tag.get("src"):
                img_url = img_tag["src"]
                # Ensure it's an absolute URL
                if img_url.startswith("//"):
                    img_url = "https:" + img_url
                return img_url

        # Fallback: Look for any open-graph product image meta tag
        og_image = soup.find("meta", property="og:image")
        if og_image and og_image.get("content"):
            return og_image["content"]

    except Exception:
        pass

    return None
