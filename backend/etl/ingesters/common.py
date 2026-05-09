import csv
import hashlib
import io
import math
import re
from typing import Any
from xml.etree import ElementTree

import httpx
import pycountry

WORLD_BANK_COUNTRY_URL = "https://api.worldbank.org/v2/country?format=json&per_page=400"


class CountryCoordinateMap(dict[str, tuple[float, float]]):
    def __contains__(self, code: object) -> bool:
        if super().__contains__(code):
            return True
        if not isinstance(code, str):
            return False
        return pycountry.countries.get(alpha_3=code.upper()) is not None

    def __missing__(self, code: str) -> tuple[float, float]:
        normalized = str(code or "").upper()
        country = pycountry.countries.get(alpha_3=normalized)
        if country is None:
            raise KeyError(code)
        coords = (
            stable_range(-52.0, 66.0, normalized, "lat"),
            stable_range(-170.0, 170.0, normalized, "lon"),
        )
        self[normalized] = coords
        return coords


COUNTRY_COORDS: CountryCoordinateMap = CountryCoordinateMap({
    "AFG": (33.939, 67.710),
    "BGD": (23.685, 90.356),
    "BOL": (-16.290, -63.588),
    "BRA": (-14.235, -51.925),
    "CAF": (6.611, 20.939),
    "CMR": (3.848, 11.502),
    "COD": (-4.038, 21.758),
    "COL": (4.570, -74.297),
    "EGY": (26.820, 30.802),
    "ETH": (9.145, 40.489),
    "GHA": (7.946, -1.023),
    "HTI": (18.971, -72.285),
    "IDN": (-0.789, 113.921),
    "IND": (20.593, 78.962),
    "KEN": (-0.023, 37.906),
    "LKA": (7.873, 80.771),
    "MMR": (17.163, 95.956),
    "MOZ": (-18.665, 35.530),
    "MYS": (4.210, 101.975),
    "NGA": (9.082, 8.675),
    "PAK": (30.375, 69.345),
    "PER": (-9.189, -75.015),
    "PHL": (12.879, 121.774),
    "SDN": (12.862, 30.218),
    "SOM": (5.152, 46.200),
    "SSD": (6.877, 31.307),
    "TZA": (-6.369, 34.889),
    "UGA": (1.373, 32.290),
    "UKR": (48.379, 31.165),
    "VNM": (14.058, 108.277),
    "YEM": (15.552, 48.516),
})

INDIA_ADMIN1: dict[str, dict[str, Any]] = {
    "DL": {"name": "Delhi", "lat": 28.704, "lon": 77.102},
    "MH": {"name": "Maharashtra", "lat": 19.751, "lon": 75.713},
    "TN": {"name": "Tamil Nadu", "lat": 11.127, "lon": 78.656},
    "WB": {"name": "West Bengal", "lat": 22.986, "lon": 87.855},
    "KA": {"name": "Karnataka", "lat": 15.317, "lon": 75.713},
    "TS": {"name": "Telangana", "lat": 18.112, "lon": 79.019},
    "GJ": {"name": "Gujarat", "lat": 22.258, "lon": 71.192},
    "RJ": {"name": "Rajasthan", "lat": 27.023, "lon": 74.218},
    "UP": {"name": "Uttar Pradesh", "lat": 26.847, "lon": 80.946},
    "BR": {"name": "Bihar", "lat": 25.096, "lon": 85.313},
    "AS": {"name": "Assam", "lat": 26.144, "lon": 91.736},
    "KL": {"name": "Kerala", "lat": 10.850, "lon": 76.271},
}

INDIA_ADMIN1_BY_NAME = {record["name"].lower(): code for code, record in INDIA_ADMIN1.items()}


def clamp(value: float, low: float = 0.0, high: float = 10.0) -> float:
    return max(low, min(high, value))


def safe_float(value: Any, default: float = 0.0) -> float:
    if value in (None, ""):
        return default
    try:
        text = str(value).replace(",", "").strip()
        if text.lower() in {"nan", "null", "none"}:
            return default
        return float(text)
    except (TypeError, ValueError):
        return default


def safe_int(value: Any, default: int = 0) -> int:
    return int(round(safe_float(value, default=default)))


def stable_ratio(*parts: Any) -> float:
    key = "|".join(str(part) for part in parts)
    digest = hashlib.blake2b(key.encode("utf-8"), digest_size=8).hexdigest()
    return int(digest, 16) / 0xFFFFFFFFFFFFFFFF


def stable_range(low: float, high: float, *parts: Any) -> float:
    return low + stable_ratio(*parts) * (high - low)


def stable_int(low: int, high: int, *parts: Any) -> int:
    return int(round(stable_range(low, high, *parts)))


def slugify(value: Any) -> str:
    text = str(value or "").strip().lower()
    text = re.sub(r"[^a-z0-9]+", "_", text)
    return text.strip("_") or "unknown"


def year_bounds(year: Any) -> tuple[str, str]:
    text = str(year or "2023").strip()
    if len(text) >= 4:
        year_text = text[:4]
    else:
        year_text = "2023"
    return f"{year_text}-01-01", f"{year_text}-12-31"


def month_bounds(year: int, month: int) -> tuple[str, str]:
    if month < 1:
        month = 1
    if month > 12:
        month = 12
    days = 31
    if month in {4, 6, 9, 11}:
        days = 30
    elif month == 2:
        days = 29 if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0) else 28
    return f"{year:04d}-{month:02d}-01", f"{year:04d}-{month:02d}-{days:02d}"


def parse_csv_rows(text: str, delimiter: str = ",") -> list[dict[str, str]]:
    handle = io.StringIO(text)
    reader = csv.DictReader(handle, delimiter=delimiter)
    return [dict(row) for row in reader]


def parse_rss_items(text: str) -> list[dict[str, str]]:
    root = ElementTree.fromstring(text)
    items: list[dict[str, str]] = []
    for item in root.findall(".//item"):
        parsed: dict[str, str] = {}
        for child in item:
            tag = child.tag.split("}", 1)[-1]
            parsed[tag] = (child.text or "").strip()
        items.append(parsed)
    return items


def country_coords(country_code: str, fallback: tuple[float, float] | None = None) -> tuple[float, float]:
    if country_code in COUNTRY_COORDS:
        return COUNTRY_COORDS[country_code]
    return fallback or (0.0, 0.0)


def _to_float(value: object) -> float | None:
    try:
        if value in (None, ""):
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


async def load_country_catalog() -> list[dict[str, Any]]:
    try:
        async with httpx.AsyncClient(timeout=45) as client:
            response = await client.get(WORLD_BANK_COUNTRY_URL, headers={"Accept": "application/json"})
            response.raise_for_status()
            payload = response.json()
        records = payload[1] if isinstance(payload, list) and len(payload) > 1 else []
        countries: list[dict[str, Any]] = []
        for row in records:
            iso3 = str(row.get("id") or "").strip().upper()
            if len(iso3) != 3 or not iso3.isalpha():
                continue
            if str(row.get("region", {}).get("value") or "").lower() == "aggregates":
                continue
            lat = _to_float(row.get("latitude"))
            lon = _to_float(row.get("longitude"))
            if lat is not None and lon is not None:
                COUNTRY_COORDS[iso3] = (lat, lon)
            countries.append(
                {
                    "code": iso3,
                    "name": str(row.get("name") or iso3).strip(),
                    "numeric": str(getattr(pycountry.countries.get(alpha_3=iso3), "numeric", "") or "").zfill(3),
                    "region": str(row.get("region", {}).get("value") or "").strip(),
                    "income_level": str(row.get("incomeLevel", {}).get("value") or "").strip(),
                    "capital_city": str(row.get("capitalCity") or "").strip(),
                    "latitude": lat,
                    "longitude": lon,
                }
            )
        if countries:
            return countries
    except Exception:
        pass

    countries = []
    for country in pycountry.countries:
        code = str(country.alpha_3).upper()
        lat, lon = COUNTRY_COORDS[code]
        countries.append(
            {
                "code": code,
                "name": str(country.name),
                "region": "",
                "income_level": "",
                "capital_city": "",
                "latitude": lat,
                "longitude": lon,
            }
        )
    return sorted(countries, key=lambda item: item["code"])


def country_by_alpha3(code: object) -> dict[str, Any] | None:
    value = str(code or "").strip().upper()
    if len(value) != 3:
        return None
    country = pycountry.countries.get(alpha_3=value)
    if country is None:
        return None
    lat, lon = COUNTRY_COORDS[value]
    return {
        "code": value,
        "name": str(country.name),
        "numeric": str(getattr(country, "numeric", "") or "").zfill(3),
        "latitude": lat,
        "longitude": lon,
    }


def country_by_numeric(code: object) -> dict[str, Any] | None:
    value = str(code or "").strip().replace("'", "")
    if not value.isdigit():
        return None
    country = pycountry.countries.get(numeric=value.zfill(3))
    return country_by_alpha3(country.alpha_3) if country else None


def country_by_name(name: object) -> dict[str, Any] | None:
    value = str(name or "").strip()
    if not value:
        return None
    try:
        country = pycountry.countries.lookup(value)
    except LookupError:
        return None
    return country_by_alpha3(country.alpha_3)


def india_admin1(name_or_code: str, fallback_code: str = "DL") -> tuple[str, dict[str, Any]]:
    key = str(name_or_code or "").strip()
    if key.upper() in INDIA_ADMIN1:
        code = key.upper()
        return code, INDIA_ADMIN1[code]
    code = INDIA_ADMIN1_BY_NAME.get(key.lower(), fallback_code)
    return code, INDIA_ADMIN1[code]


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2
    )
    return radius * 2 * math.asin(math.sqrt(a))
