from collections import defaultdict
from datetime import date

from db.supabase_client import get_supabase
from models.graph import ETLEdge


def _parse_date(value: object) -> date | None:
    if not isinstance(value, str) or not value:
        return None
    try:
        return date.fromisoformat(value[:10])
    except ValueError:
        return None


def build_temporal_edges() -> list[ETLEdge]:
    client = get_supabase()
    rows: list[dict] = []
    offset = 0
    page_size = 1000
    while True:
        result = (
            client.table("metrics")
            .select("entity_id,entity_type,country_code,admin1_code,valid_from,source_dataset,metric_value")
            .not_.is_("entity_id", "null")
            .not_.is_("entity_type", "null")
            .not_.is_("valid_from", "null")
            .range(offset, offset + page_size - 1)
            .execute()
        )
        batch = result.data or []
        if not batch:
            break
        rows.extend(batch)
        if len(batch) < page_size:
            break
        offset += page_size

    grouped: dict[tuple[str, str, str], list[dict]] = defaultdict(list)
    for row in rows:
        entity_type = row.get("entity_type")
        entity_id = row.get("entity_id")
        valid_from = _parse_date(row.get("valid_from"))
        if not isinstance(entity_type, str) or not isinstance(entity_id, str) or valid_from is None:
            continue
        series_key = (
            entity_type,
            str(row.get("country_code") or ""),
            str(row.get("admin1_code") or ""),
        )
        grouped[series_key].append(row)

    edges: list[ETLEdge] = []
    for series_rows in grouped.values():
        ordered = sorted(
            series_rows,
            key=lambda row: (
                _parse_date(row.get("valid_from")) or date.min,
                str(row.get("entity_id") or ""),
            ),
        )
        if len(ordered) < 2:
            continue
        for current, nxt in zip(ordered, ordered[1:]):
            current_date = _parse_date(current.get("valid_from"))
            next_date = _parse_date(nxt.get("valid_from"))
            current_id = current.get("entity_id")
            next_id = nxt.get("entity_id")
            if current_date is None or next_date is None or not isinstance(current_id, str) or not isinstance(next_id, str):
                continue
            delta_days = max((next_date - current_date).days, 0)
            lag_weeks = max(delta_days // 7, 0)
            edges.append(
                ETLEdge(
                    source_id=current_id,
                    target_id=next_id,
                    relationship="PRECEDES",
                    confidence=0.95,
                    lag_weeks=lag_weeks,
                    source_dataset="temporal_series_continuity",
                    evidence_type="temporal",
                )
            )
    return edges
