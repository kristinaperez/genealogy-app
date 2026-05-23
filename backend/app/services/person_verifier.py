"""
Person Verifier — проверяет, что найденный человек соответствует запросу.
Формирует confidence score и решает, принять или отклонить совпадение.
"""

from dataclasses import dataclass
from rapidfuzz import fuzz

CONFIDENCE_THRESHOLD = 0.75


@dataclass
class VerificationResult:
    accepted: bool
    confidence: float
    reasons: list[str]


def verify_person(
    query_name: str,
    details: dict,
) -> VerificationResult:
    """
    Принимает оригинальное имя из запроса и словарь деталей из Wikidata.
    Возвращает VerificationResult.

    Критерии оценки:
      - Совпадение имени (fuzzy)         → до 0.40
      - Испанская национальность          → +0.20
      - Наличие биографии / Wikipedia URL → +0.15
      - Наличие birthplace               → +0.15
      - Наличие изображения              → +0.10
    """
    score = 0.0
    reasons: list[str] = []

    full_name: str = details.get("full_name") or ""
    nationality: str = details.get("nationality") or ""
    source_url: str = details.get("source_url") or ""
    birth_place = details.get("birth_place_label") or details.get("birth_place_wikidata_id")
    image_url: str = details.get("main_image_url") or ""

    # 1. Fuzzy-совпадение имени (нормализуем оба до lower без акцентов)
    name_ratio = fuzz.token_sort_ratio(
        _normalize(query_name),
        _normalize(full_name),
    ) / 100.0
    name_score = round(name_ratio * 0.40, 3)
    score += name_score
    reasons.append(f"name_match={name_ratio:.2f} (+{name_score})")

    # 2. Испанская национальность
    if _is_spanish(nationality):
        score += 0.20
        reasons.append("nationality=Spain (+0.20)")
    else:
        reasons.append(f"nationality='{nationality}' (+0.00)")

    # 3. Wikipedia ES URL
    if source_url:
        score += 0.15
        reasons.append("wikipedia_es=found (+0.15)")
    else:
        reasons.append("wikipedia_es=missing (+0.00)")

    # 4. Место рождения
    if birth_place:
        score += 0.15
        reasons.append(f"birthplace='{birth_place}' (+0.15)")
    else:
        reasons.append("birthplace=missing (+0.00)")

    # 5. Изображение
    if image_url:
        score += 0.10
        reasons.append("image=found (+0.10)")
    else:
        reasons.append("image=missing (+0.00)")

    score = round(min(score, 1.0), 3)
    accepted = score >= CONFIDENCE_THRESHOLD

    return VerificationResult(
        accepted=accepted,
        confidence=score,
        reasons=reasons,
    )


# ─── Helpers ───────────────────────────────────────────────────────────────────

_ACCENT_MAP = str.maketrans(
    "áéíóúàèìòùäëïöüâêîôûñ",
    "aeiouaeiouaeiouaeioun",
)

def _normalize(text: str) -> str:
    return text.lower().translate(_ACCENT_MAP).strip()


_SPANISH_TERMS = {"españa", "spanish", "español", "española"}

def _is_spanish(nationality: str) -> bool:
    return _normalize(nationality) in _SPANISH_TERMS

