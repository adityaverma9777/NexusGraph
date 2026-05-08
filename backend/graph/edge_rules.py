import math
from models.graph import ETLNode, ETLEdge

def geo_distance_km(n1: ETLNode, n2: ETLNode) -> float:
    if None in (n1.lat, n1.lon, n2.lat, n2.lon):
        return float("inf")
    R = 6371.0
    lat1, lon1 = math.radians(n1.lat), math.radians(n1.lon)
    lat2, lon2 = math.radians(n2.lat), math.radians(n2.lon)
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))

def calculate_confidence(
    correlation_r: float,
    evidence_count: int = 1,
    mechanism_known: bool = False,
    temporal_consistency: float = 0.5,
    sample_size: int = 100,
) -> float:
    base = abs(correlation_r)
    evidence_boost = min(0.2, evidence_count * 0.02)
    mechanism_bonus = 0.15 if mechanism_known else 0.0
    temporal_factor = temporal_consistency * 0.1
    if sample_size < 30:
        base *= (sample_size / 30) ** 0.5
    confidence = base + evidence_boost + mechanism_bonus + temporal_factor
    return round(min(0.95, max(0.05, confidence)), 2)

EDGE_RULES: list[dict] = [
    {
        "name": "rainfall_drives_mosquito",
        "source_type": "RainfallAnomaly",
        "target_type": "MosquitoBreedingCondition",
        "relationship": "DRIVES",
        "max_distance_km": 300,
        "source_condition": lambda n: n.properties.get("anomaly_pct", 0) > 15,
        "confidence": 0.75,
        "lag_weeks": 2,
        "mechanism_known": True,
    },
    {
        "name": "rainfall_drives_flood",
        "source_type": "RainfallAnomaly",
        "target_type": "FloodEvent",
        "relationship": "AMPLIFIES",
        "max_distance_km": 200,
        "source_condition": lambda n: n.properties.get("anomaly_pct", 0) > 30,
        "confidence": 0.70,
        "lag_weeks": 1,
        "mechanism_known": True,
    },
    {
        "name": "mosquito_amplifies_dengue",
        "source_type": "MosquitoBreedingCondition",
        "target_type": "DengueOutbreak",
        "relationship": "AMPLIFIES",
        "max_distance_km": 200,
        "source_condition": lambda n: n.properties.get("breeding_index", 0) > 0.5,
        "confidence": 0.68,
        "lag_weeks": 2,
        "mechanism_known": True,
    },
    {
        "name": "dengue_stresses_health",
        "source_type": "DengueOutbreak",
        "target_type": "HealthSystemStress",
        "relationship": "STRESSES",
        "max_distance_km": 400,
        "source_condition": lambda n: n.properties.get("cases", 0) > 100,
        "confidence": 0.62,
        "lag_weeks": 0,
        "mechanism_known": True,
    },
    {
        "name": "drought_drives_crop_stress",
        "source_type": "DroughtEvent",
        "target_type": "CropYieldAnomaly",
        "relationship": "DRIVES",
        "max_distance_km": 500,
        "source_condition": lambda n: n.properties.get("severity", 0) > 5,
        "confidence": 0.72,
        "lag_weeks": 4,
        "mechanism_known": True,
    },
    {
        "name": "crop_failure_triggers_migration",
        "source_type": "CropYieldAnomaly",
        "target_type": "InternalMigrantFlow",
        "relationship": "TRIGGERS",
        "max_distance_km": 800,
        "source_condition": lambda n: n.properties.get("yield_deficit_pct", 0) > 20,
        "confidence": 0.65,
        "lag_weeks": 8,
        "mechanism_known": False,
    },
    {
        "name": "food_price_amplifies_poverty",
        "source_type": "FoodPriceEvent",
        "target_type": "PovertyIndicator",
        "relationship": "AMPLIFIES",
        "max_distance_km": 2000,
        "source_condition": lambda n: n.properties.get("price_index_change", 0) > 10,
        "confidence": 0.60,
        "lag_weeks": 4,
        "mechanism_known": False,
    },
    {
        "name": "food_price_triggers_unrest",
        "source_type": "FoodPriceEvent",
        "target_type": "ConflictEvent",
        "relationship": "AMPLIFIES",
        "max_distance_km": 1000,
        "source_condition": lambda n: n.properties.get("price_index_change", 0) > 25,
        "confidence": 0.55,
        "lag_weeks": 12,
        "mechanism_known": False,
    },
    {
        "name": "deforestation_drives_wildlife",
        "source_type": "DeforestationEvent",
        "target_type": "WildlifeShiftEvent",
        "relationship": "DRIVES",
        "max_distance_km": 200,
        "source_condition": lambda n: n.properties.get("area_ha", 0) > 1000,
        "confidence": 0.70,
        "lag_weeks": 0,
        "mechanism_known": True,
    },
    {
        "name": "deforestation_amplifies_zoonotic",
        "source_type": "DeforestationEvent",
        "target_type": "ZoonoticDiseaseRisk",
        "relationship": "AMPLIFIES",
        "max_distance_km": 300,
        "source_condition": lambda n: n.properties.get("area_ha", 0) > 500,
        "confidence": 0.66,
        "lag_weeks": 4,
        "mechanism_known": True,
    },
    {
        "name": "conflict_triggers_displacement",
        "source_type": "ConflictEvent",
        "target_type": "DisplacementEvent",
        "relationship": "TRIGGERS",
        "max_distance_km": 400,
        "source_condition": lambda n: n.properties.get("fatalities", 0) > 10,
        "confidence": 0.78,
        "lag_weeks": 2,
        "mechanism_known": True,
    },
    {
        "name": "conflict_collapses_health",
        "source_type": "ConflictEvent",
        "target_type": "HealthSystemStress",
        "relationship": "COLLAPSES",
        "max_distance_km": 300,
        "source_condition": lambda n: n.properties.get("fatalities", 0) > 50,
        "confidence": 0.72,
        "lag_weeks": 4,
        "mechanism_known": True,
    },
    {
        "name": "displacement_strains_health",
        "source_type": "DisplacementEvent",
        "target_type": "HealthSystemStress",
        "relationship": "STRESSES",
        "max_distance_km": 500,
        "source_condition": lambda n: n.properties.get("persons_affected", 0) > 5000,
        "confidence": 0.60,
        "lag_weeks": 8,
        "mechanism_known": False,
    },
    {
        "name": "air_pollution_drives_respiratory",
        "source_type": "AirPollutionEvent",
        "target_type": "RespiratoryDiseaseIncidence",
        "relationship": "DRIVES",
        "max_distance_km": 150,
        "source_condition": lambda n: n.properties.get("pm25", 0) > 35,
        "confidence": 0.80,
        "lag_weeks": 0,
        "mechanism_known": True,
    },
    {
        "name": "low_hdi_amplifies_disease",
        "source_type": "HDIScore",
        "target_type": "DiseaseVulnerability",
        "relationship": "AMPLIFIES",
        "max_distance_km": 5000,
        "source_condition": lambda n: n.properties.get("hdi_value", 1.0) < 0.55,
        "confidence": 0.65,
        "lag_weeks": 0,
        "mechanism_known": False,
    },
]

def run_edge_rules(all_nodes: list[ETLNode]) -> list[ETLEdge]:
    node_by_type: dict[str, list[ETLNode]] = {}
    for node in all_nodes:
        node_by_type.setdefault(node.entity_type, []).append(node)

    edges: list[ETLEdge] = []
    seen: set[tuple] = set()

    for rule in EDGE_RULES:
        sources = node_by_type.get(rule["source_type"], [])
        targets = node_by_type.get(rule["target_type"], [])
        condition = rule.get("source_condition", lambda _: True)

        for src in sources:
            if not condition(src):
                continue
            for tgt in targets:
                if src.id == tgt.id:
                    continue
                dist = geo_distance_km(src, tgt)
                if dist > rule["max_distance_km"]:
                    continue
                key = (src.id, tgt.id, rule["relationship"])
                if key in seen:
                    continue
                seen.add(key)
                proximity_factor = max(0.5, 1.0 - dist / (rule["max_distance_km"] * 2))
                confidence = calculate_confidence(
                    correlation_r=rule["confidence"] * proximity_factor,
                    mechanism_known=rule.get("mechanism_known", False),
                )
                edges.append(
                    ETLEdge(
                        source_id=src.id,
                        target_id=tgt.id,
                        relationship=rule["relationship"],
                        confidence=confidence,
                        lag_weeks=rule.get("lag_weeks", 0),
                        source_dataset=rule["name"],
                        evidence_type="mechanistic" if rule.get("mechanism_known") else "correlational",
                    )
                )
    return edges
