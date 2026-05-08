from pydantic import BaseModel, Field
from typing import Optional

class GraphNode(BaseModel):
    id: str
    domain: str
    entity_type: str = Field(alias="entityType", default="")
    label: str
    properties: dict = {}
    lat: Optional[float] = None
    lon: Optional[float] = None
    valid_from: Optional[str] = Field(alias="validFrom", default=None)
    valid_to: Optional[str] = Field(alias="validTo", default=None)
    source: str = ""
    severity: float = 5.0

    model_config = {"populate_by_name": True}

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    relationship: str
    confidence: float
    lag_weeks: int = Field(alias="lagWeeks", default=0)
    source_dataset: str = Field(alias="sourceDataset", default="")
    evidence_type: str = Field(alias="evidenceType", default="correlational")

    model_config = {"populate_by_name": True}

class GraphPayload(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]

class ETLNode(BaseModel):
    id: str
    domain: str
    entity_type: str
    label: str
    properties: dict = {}
    lat: Optional[float] = None
    lon: Optional[float] = None
    valid_from: Optional[str] = None
    valid_to: Optional[str] = None
    source: str = ""
    severity: float = 5.0

class ETLEdge(BaseModel):
    source_id: str
    target_id: str
    relationship: str
    confidence: float
    lag_weeks: int = 0
    source_dataset: str = ""
    evidence_type: str = "correlational"
