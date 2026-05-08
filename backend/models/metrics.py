from pydantic import BaseModel
from typing import Optional

class MetricRow(BaseModel):
    domain: str
    entity_type: str
    entity_id: str
    country_code: Optional[str] = None
    admin1_code: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None
    metric_name: str
    metric_value: Optional[float] = None
    unit: str = ""
    valid_from: str
    valid_to: Optional[str] = None
    source_dataset: str

class TimeSeriesPoint(BaseModel):
    date: str
    value: float
    entity_id: str
    entity_type: str
    country_code: Optional[str] = None
