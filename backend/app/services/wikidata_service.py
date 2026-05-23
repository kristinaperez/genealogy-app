"""
Wikidata Service — поиск людей и городов через SPARQL и REST API.
"""

import httpx
from typing import Optional
from SPARQLWrapper import SPARQLWrapper, JSON

WIKIDATA_SPARQL = "https://query.wikidata.org/sparql"
WIKIDATA_API = "https://www.wikidata.org/w/api.php"

HEADERS = {
    "User-Agent": "GenealogyPlatform/1.0 (genealogy@example.com)"
}


# ─── Поиск человека ────────────────────────────────────────────────────────────

async def search_person(name: str) -> list[dict]:
    """
    Ищет человека в Wikidata по имени.
    Возвращает список кандидатов с базовыми полями.
    """
    async with httpx.AsyncClient(headers=HEADERS, timeout=15) as client:
        resp = await client.get(WIKIDATA_API, params={
            "action": "wbsearchentities",
            "search": name,
            "language": "es",
            "type": "item",
            "limit": 10,
            "format": "json",
        })
        resp.raise_for_status()
        results = resp.json().get("search", [])

    candidates = []
    for item in results:
        candidates.append({
            "wikidata_id": item["id"],
            "label": item.get("label", ""),
            "description": item.get("description", ""),
            "aliases": item.get("aliases", []),
        })
    return candidates


async def get_person_details(wikidata_id: str) -> Optional[dict]:
    """
    Загружает полные данные человека через SPARQL.
    Возвращает словарь с полями или None, если запрос не дал результата.
    """
    sparql = SPARQLWrapper(WIKIDATA_SPARQL)
    sparql.addCustomHttpHeader("User-Agent", HEADERS["User-Agent"])

    query = f"""
    SELECT ?person ?personLabel ?birthDate ?deathDate
           ?birthPlaceLabel ?birthPlace
           ?occupationLabel ?nationalityLabel
           ?image ?articleEs
    WHERE {{
      BIND(wd:{wikidata_id} AS ?person)

      OPTIONAL {{ ?person wdt:P569 ?birthDate. }}
      OPTIONAL {{ ?person wdt:P570 ?deathDate. }}
      OPTIONAL {{ ?person wdt:P19  ?birthPlace. }}
      OPTIONAL {{ ?person wdt:P106 ?occupation. }}
      OPTIONAL {{ ?person wdt:P27  ?nationality. }}
      OPTIONAL {{ ?person wdt:P18  ?image. }}

      OPTIONAL {{
        ?articleEs schema:about ?person;
                   schema:inLanguage "es";
                   schema:isPartOf <https://es.wikipedia.org/>.
      }}

      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "es,en". }}
    }}
    LIMIT 1
    """

    sparql.setQuery(query)
    sparql.setReturnFormat(JSON)

    try:
        results = sparql.query().convert()
        bindings = results["results"]["bindings"]
    except Exception:
        return None

    if not bindings:
        return None

    row = bindings[0]

    def val(key: str) -> Optional[str]:
        return row[key]["value"] if key in row else None

    birth_place_id = None
    if "birthPlace" in row:
        birth_place_id = row["birthPlace"]["value"].split("/")[-1]  # QID

    return {
        "wikidata_id": wikidata_id,
        "full_name": val("personLabel"),
        "birth_date": val("birthDate"),
        "death_date": val("deathDate"),
        "birth_place_label": val("birthPlaceLabel"),
        "birth_place_wikidata_id": birth_place_id,
        "occupation": val("occupationLabel"),
        "nationality": val("nationalityLabel"),
        "main_image_url": val("image"),
        "source_url": val("articleEs"),
    }


# ─── Поиск города ──────────────────────────────────────────────────────────────

async def get_city_details(wikidata_id: str) -> Optional[dict]:
    """
    Загружает данные города через SPARQL.
    """
    sparql = SPARQLWrapper(WIKIDATA_SPARQL)
    sparql.addCustomHttpHeader("User-Agent", HEADERS["User-Agent"])

    query = f"""
    SELECT ?cityLabel ?provinceLabel ?regionLabel ?countryLabel
           ?lat ?lon ?coatOfArms ?image
    WHERE {{
      BIND(wd:{wikidata_id} AS ?city)

      OPTIONAL {{ ?city wdt:P131 ?province. }}
      OPTIONAL {{ ?city wdt:P17  ?country.  }}
      OPTIONAL {{
        ?city p:P625 ?coord.
        ?coord psv:P625 ?coordNode.
        ?coordNode wikibase:geoLatitude  ?lat.
        ?coordNode wikibase:geoLongitude ?lon.
      }}
      OPTIONAL {{ ?city wdt:P94  ?coatOfArms. }}
      OPTIONAL {{ ?city wdt:P18  ?image. }}

      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "es,en". }}
    }}
    LIMIT 1
    """

    sparql.setQuery(query)
    sparql.setReturnFormat(JSON)

    try:
        results = sparql.query().convert()
        bindings = results["results"]["bindings"]
    except Exception:
        return None

    if not bindings:
        return None

    row = bindings[0]

    def val(key: str) -> Optional[str]:
        return row[key]["value"] if key in row else None

    lat = float(val("lat")) if val("lat") else None
    lon = float(val("lon")) if val("lon") else None

    return {
        "wikidata_id": wikidata_id,
        "name": val("cityLabel"),
        "province": val("provinceLabel"),
        "region": val("regionLabel"),
        "country": val("countryLabel") or "España",
        "latitude": lat,
        "longitude": lon,
        "coat_of_arms_url": val("coatOfArms"),
        "hero_image_url": val("image"),
    }

