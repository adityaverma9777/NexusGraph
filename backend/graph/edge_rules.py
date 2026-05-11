import math
from models.graph import ETLNode, ETLEdge

def geo_distance_km(n1: ETLNode, n2: ETLNode) -> float:
    if None in (n1.lat, n1.lon, n2.lat, n2.lon):
        return float("inf")
    R = 6371.0
    lat1, lon1 = math.radians(n1.lat), math.radians(n1.lon)
    lat2, lon2 = math.radians(n2.lat), math.radians(n2.lon)
    dlat, dlon = lat2 - lat1, lon2 - lon1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return R * 2 * math.asin(math.sqrt(a))

def calculate_confidence(correlation_r: float, evidence_count: int = 1, mechanism_known: bool = False, temporal_consistency: float = 0.5, sample_size: int = 100) -> float:
    base = abs(correlation_r)
    evidence_boost = min(0.2, evidence_count * 0.02)
    mechanism_bonus = 0.15 if mechanism_known else 0.0
    temporal_factor = temporal_consistency * 0.1
    if sample_size < 30:
        base *= (sample_size / 30) ** 0.5
    return round(min(0.95, max(0.05, base + evidence_boost + mechanism_bonus + temporal_factor)), 2)

EDGE_RULES: list[dict] = [
    {"name": "rainfall_drives_mosquito", "source_type": "RainfallAnomaly", "target_type": "MosquitoBreedingCondition", "relationship": "DRIVES", "max_distance_km": 300, "source_condition": lambda n: n.properties.get("anomaly_pct", 0) > 15, "confidence": 0.75, "lag_weeks": 2, "mechanism_known": True},
    {"name": "rainfall_amplifies_flood", "source_type": "RainfallAnomaly", "target_type": "FloodEvent", "relationship": "AMPLIFIES", "max_distance_km": 200, "source_condition": lambda n: n.properties.get("anomaly_pct", 0) > 30, "confidence": 0.70, "lag_weeks": 1, "mechanism_known": True},
    {"name": "rainfall_reduces_crop", "source_type": "RainfallAnomaly", "target_type": "CropYieldAnomaly", "relationship": "REDUCES", "max_distance_km": 500, "source_condition": lambda n: n.properties.get("anomaly_pct", 0) < -20, "confidence": 0.68, "lag_weeks": 8, "mechanism_known": True},
    {"name": "temp_anomaly_drives_heat_mortality", "source_type": "TemperatureRecord", "target_type": "PandemicEvent", "relationship": "CORRELATES_WITH", "max_distance_km": 300, "source_condition": lambda n: n.properties.get("anomaly_pct", 0) > 15, "confidence": 0.52, "lag_weeks": 1, "mechanism_known": False},
    {"name": "mosquito_amplifies_dengue", "source_type": "MosquitoBreedingCondition", "target_type": "DengueOutbreak", "relationship": "AMPLIFIES", "max_distance_km": 200, "source_condition": lambda n: n.properties.get("breeding_index", 0) > 0.5, "confidence": 0.68, "lag_weeks": 2, "mechanism_known": True},
    {"name": "mosquito_amplifies_malaria", "source_type": "MosquitoBreedingCondition", "target_type": "MalariaOutbreak", "relationship": "AMPLIFIES", "max_distance_km": 300, "source_condition": lambda n: n.properties.get("breeding_index", 0) > 0.4, "confidence": 0.72, "lag_weeks": 3, "mechanism_known": True},
    {"name": "dengue_stresses_health", "source_type": "DengueOutbreak", "target_type": "HealthSystemStress", "relationship": "STRESSES", "max_distance_km": 400, "source_condition": lambda n: n.properties.get("cases", 0) > 100, "confidence": 0.62, "lag_weeks": 0, "mechanism_known": True},
    {"name": "malaria_reduces_productivity", "source_type": "MalariaOutbreak", "target_type": "EconomicIndicator", "relationship": "REDUCES", "max_distance_km": 500, "source_condition": lambda n: n.properties.get("cases", 0) > 50, "confidence": 0.58, "lag_weeks": 4, "mechanism_known": False},
    {"name": "pandemic_reduces_gdp", "source_type": "PandemicEvent", "target_type": "EconomicIndicator", "relationship": "REDUCES", "max_distance_km": 2000, "source_condition": lambda n: n.properties.get("total_deaths", 0) > 1000, "confidence": 0.72, "lag_weeks": 8, "mechanism_known": True},
    {"name": "air_pollution_drives_respiratory", "source_type": "AirPollutionEvent", "target_type": "DengueOutbreak", "relationship": "CORRELATES_WITH", "max_distance_km": 150, "source_condition": lambda n: n.properties.get("pm25", 0) > 35, "confidence": 0.55, "lag_weeks": 0, "mechanism_known": False},
    {"name": "air_pollution_reduces_productivity", "source_type": "AirPollutionEvent", "target_type": "EconomicIndicator", "relationship": "REDUCES", "max_distance_km": 200, "source_condition": lambda n: n.properties.get("pm25", 0) > 50, "confidence": 0.60, "lag_weeks": 0, "mechanism_known": False},
    {"name": "wildfire_drives_air_pollution", "source_type": "WildfireEvent", "target_type": "AirPollutionEvent", "relationship": "DRIVES", "max_distance_km": 500, "source_condition": lambda n: n.properties.get("fire_count_7d", 0) > 50, "confidence": 0.78, "lag_weeks": 0, "mechanism_known": True},
    {"name": "wildfire_amplifies_deforestation", "source_type": "WildfireEvent", "target_type": "DeforestationEvent", "relationship": "AMPLIFIES", "max_distance_km": 200, "source_condition": lambda n: n.properties.get("area_ha", 0) > 5000, "confidence": 0.70, "lag_weeks": 0, "mechanism_known": True},
    {"name": "deforestation_drives_wildlife", "source_type": "DeforestationEvent", "target_type": "WildlifeShiftEvent", "relationship": "DRIVES", "max_distance_km": 200, "source_condition": lambda n: n.properties.get("area_ha", 0) > 1000, "confidence": 0.70, "lag_weeks": 0, "mechanism_known": True},
    {"name": "deforestation_amplifies_zoonotic", "source_type": "DeforestationEvent", "target_type": "MosquitoBreedingCondition", "relationship": "AMPLIFIES", "max_distance_km": 300, "source_condition": lambda n: n.properties.get("area_ha", 0) > 500, "confidence": 0.66, "lag_weeks": 4, "mechanism_known": True},
    {"name": "deforestation_reduces_carbon", "source_type": "DeforestationEvent", "target_type": "EcologicalEvent", "relationship": "AMPLIFIES", "max_distance_km": 100, "source_condition": lambda n: n.properties.get("area_ha", 0) > 2000, "confidence": 0.80, "lag_weeks": 0, "mechanism_known": True},
    {"name": "drought_drives_crop_stress", "source_type": "DroughtEvent", "target_type": "CropYieldAnomaly", "relationship": "DRIVES", "max_distance_km": 500, "source_condition": lambda n: n.properties.get("severity", 0) > 5, "confidence": 0.72, "lag_weeks": 4, "mechanism_known": True},
    {"name": "crop_failure_triggers_migration", "source_type": "CropYieldAnomaly", "target_type": "DisplacementEvent", "relationship": "TRIGGERS", "max_distance_km": 800, "source_condition": lambda n: n.properties.get("yield_deficit_pct", 0) > 20, "confidence": 0.65, "lag_weeks": 8, "mechanism_known": False},
    {"name": "crop_failure_drives_malnutrition", "source_type": "CropYieldAnomaly", "target_type": "DiseaseVulnerability", "relationship": "DRIVES", "max_distance_km": 600, "source_condition": lambda n: n.properties.get("yield_deficit_pct", 0) > 30, "confidence": 0.70, "lag_weeks": 12, "mechanism_known": True},
    {"name": "crop_failure_triggers_food_price", "source_type": "CropYieldAnomaly", "target_type": "FoodPriceEvent", "relationship": "TRIGGERS", "max_distance_km": 3000, "source_condition": lambda n: n.properties.get("yield_deficit_pct", 0) > 25, "confidence": 0.65, "lag_weeks": 4, "mechanism_known": False},
    {"name": "food_price_amplifies_poverty", "source_type": "FoodPriceEvent", "target_type": "InequalityIndex", "relationship": "AMPLIFIES", "max_distance_km": 2000, "source_condition": lambda n: n.properties.get("price_index_change", 0) > 10, "confidence": 0.60, "lag_weeks": 4, "mechanism_known": False},
    {"name": "food_price_triggers_conflict", "source_type": "FoodPriceEvent", "target_type": "ConflictEvent", "relationship": "AMPLIFIES", "max_distance_km": 1000, "source_condition": lambda n: n.properties.get("price_index_change", 0) > 25, "confidence": 0.55, "lag_weeks": 12, "mechanism_known": False},
    {"name": "food_price_drives_displacement", "source_type": "FoodPriceEvent", "target_type": "DisplacementEvent", "relationship": "DRIVES", "max_distance_km": 1500, "source_condition": lambda n: n.properties.get("price_index_change", 0) > 30, "confidence": 0.52, "lag_weeks": 16, "mechanism_known": False},
    {"name": "food_stress_drives_health", "source_type": "FoodPriceEvent", "target_type": "HealthSystemStress", "relationship": "DRIVES", "max_distance_km": 1000, "source_condition": lambda n: n.properties.get("price_index_change", 0) > 20, "confidence": 0.65, "lag_weeks": 4, "mechanism_known": True},
    {"name": "food_stress_triggers_infrastructure_failure", "source_type": "FoodPriceEvent", "target_type": "CriticalInfrastructure", "relationship": "TRIGGERS", "max_distance_km": 1500, "source_condition": lambda n: n.properties.get("price_index_change", 0) > 30, "confidence": 0.60, "lag_weeks": 6, "mechanism_known": False},
    {"name": "food_stress_amplifies_health_risks", "source_type": "FoodPriceEvent", "target_type": "DiseaseVulnerability", "relationship": "AMPLIFIES", "max_distance_km": 800, "source_condition": lambda n: n.properties.get("price_index_change", 0) > 25, "confidence": 0.70, "lag_weeks": 8, "mechanism_known": True},
    {"name": "unemployment_drives_migration", "source_type": "UnemploymentRate", "target_type": "DisplacementEvent", "relationship": "DRIVES", "max_distance_km": 1000, "source_condition": lambda n: n.properties.get("value", 0) > 15, "confidence": 0.60, "lag_weeks": 8, "mechanism_known": False},
    {"name": "inflation_amplifies_poverty", "source_type": "InflationRate", "target_type": "InequalityIndex", "relationship": "AMPLIFIES", "max_distance_km": 500, "source_condition": lambda n: n.properties.get("value", 0) > 20, "confidence": 0.65, "lag_weeks": 4, "mechanism_known": False},
    {"name": "conflict_triggers_displacement", "source_type": "ConflictEvent", "target_type": "DisplacementEvent", "relationship": "TRIGGERS", "max_distance_km": 400, "source_condition": lambda n: n.properties.get("fatalities", 0) > 10, "confidence": 0.78, "lag_weeks": 2, "mechanism_known": True},
    {"name": "conflict_collapses_health", "source_type": "ConflictEvent", "target_type": "HealthSystemStress", "relationship": "COLLAPSES", "max_distance_km": 300, "source_condition": lambda n: n.properties.get("fatalities", 0) > 50, "confidence": 0.72, "lag_weeks": 4, "mechanism_known": True},
    {"name": "conflict_drives_food_insecurity", "source_type": "ConflictEvent", "target_type": "FoodPriceEvent", "relationship": "TRIGGERS", "max_distance_km": 500, "source_condition": lambda n: n.properties.get("fatalities", 0) > 100, "confidence": 0.68, "lag_weeks": 4, "mechanism_known": False},
    {"name": "conflict_amplifies_disease", "source_type": "ConflictEvent", "target_type": "CholeraOutbreak", "relationship": "AMPLIFIES", "max_distance_km": 300, "source_condition": lambda n: n.properties.get("event_count", 0) > 20, "confidence": 0.62, "lag_weeks": 4, "mechanism_known": True},
    {"name": "displacement_stresses_health", "source_type": "DisplacementEvent", "target_type": "HealthSystemStress", "relationship": "STRESSES", "max_distance_km": 500, "source_condition": lambda n: n.properties.get("persons_affected", 0) > 5000, "confidence": 0.60, "lag_weeks": 8, "mechanism_known": False},
    {"name": "displacement_drives_disease_risk", "source_type": "DisplacementEvent", "target_type": "CholeraOutbreak", "relationship": "AMPLIFIES", "max_distance_km": 400, "source_condition": lambda n: n.properties.get("total_displaced", 0) > 10000, "confidence": 0.65, "lag_weeks": 4, "mechanism_known": True},
    {"name": "low_hdi_amplifies_disease", "source_type": "LifeExpectancyIndex", "target_type": "MalariaOutbreak", "relationship": "AMPLIFIES", "max_distance_km": 500, "source_condition": lambda n: n.properties.get("value", 80) < 60, "confidence": 0.65, "lag_weeks": 0, "mechanism_known": False},
    {"name": "low_hdi_amplifies_displacement", "source_type": "HDIScore", "target_type": "DisplacementEvent", "relationship": "AMPLIFIES", "max_distance_km": 800, "source_condition": lambda n: n.properties.get("hdi_value", 1.0) < 0.55, "confidence": 0.58, "lag_weeks": 0, "mechanism_known": False},
    {"name": "urbanization_amplifies_disease", "source_type": "UrbanizationRate", "target_type": "AirPollutionEvent", "relationship": "AMPLIFIES", "max_distance_km": 200, "source_condition": lambda n: n.properties.get("value", 0) > 60, "confidence": 0.62, "lag_weeks": 0, "mechanism_known": False},
    {"name": "population_density_amplifies_disease", "source_type": "PopulationSnapshot", "target_type": "DengueOutbreak", "relationship": "AMPLIFIES", "max_distance_km": 200, "source_condition": lambda n: n.properties.get("value", 0) > 100_000_000, "confidence": 0.55, "lag_weeks": 0, "mechanism_known": False},
    {"name": "pandemic_triggers_migration", "source_type": "PandemicEvent", "target_type": "DisplacementEvent", "relationship": "TRIGGERS", "max_distance_km": 1000, "source_condition": lambda n: n.properties.get("total_deaths", 0) > 5000, "confidence": 0.50, "lag_weeks": 8, "mechanism_known": False},
    {"name": "wildlife_shift_signals_zoonotic", "source_type": "WildlifeShiftEvent", "target_type": "MosquitoBreedingCondition", "relationship": "SIGNALS", "max_distance_km": 400, "source_condition": lambda n: True, "confidence": 0.55, "lag_weeks": 4, "mechanism_known": False},
    {"name": "tb_stresses_health", "source_type": "TuberculosisIncidence", "target_type": "HealthSystemStress", "relationship": "STRESSES", "max_distance_km": 300, "source_condition": lambda n: n.properties.get("cases", 0) > 50, "confidence": 0.65, "lag_weeks": 0, "mechanism_known": True},
    {"name": "cholera_amplifies_displacement", "source_type": "CholeraOutbreak", "target_type": "DisplacementEvent", "relationship": "AMPLIFIES", "max_distance_km": 300, "source_condition": lambda n: n.properties.get("cases", 0) > 100, "confidence": 0.60, "lag_weeks": 2, "mechanism_known": True},
    {"name": "food_production_index_signals_price", "source_type": "FoodProductionIndex", "target_type": "FoodPriceEvent", "relationship": "SIGNALS", "max_distance_km": 2000, "source_condition": lambda n: n.properties.get("value", 100) < 90, "confidence": 0.65, "lag_weeks": 4, "mechanism_known": False},
    {"name": "inequality_amplifies_disease_vulnerability", "source_type": "InequalityIndex", "target_type": "MalariaOutbreak", "relationship": "AMPLIFIES", "max_distance_km": 500, "source_condition": lambda n: n.properties.get("value", 0) > 50, "confidence": 0.55, "lag_weeks": 0, "mechanism_known": False},
    {"name": "conflict_reduces_food_production", "source_type": "ConflictEvent", "target_type": "FoodProductionIndex", "relationship": "REDUCES", "max_distance_km": 500, "source_condition": lambda n: n.properties.get("fatalities", 0) > 200, "confidence": 0.70, "lag_weeks": 4, "mechanism_known": True},
    {"name": "pandemic_stresses_health", "source_type": "PandemicEvent", "target_type": "HealthSystemStress", "relationship": "STRESSES", "max_distance_km": 500, "source_condition": lambda n: n.properties.get("total_cases", 0) > 100000, "confidence": 0.78, "lag_weeks": 0, "mechanism_known": True},
    {"name": "deforestation_drives_wildfire", "source_type": "DeforestationEvent", "target_type": "WildfireEvent", "relationship": "AMPLIFIES", "max_distance_km": 200, "source_condition": lambda n: n.properties.get("area_ha", 0) > 5000, "confidence": 0.72, "lag_weeks": 0, "mechanism_known": True},
    {"name": "wildlife_shift_precedes_zoonotic_disease", "source_type": "WildlifeShiftEvent", "target_type": "CholeraOutbreak", "relationship": "PRECEDES", "max_distance_km": 300, "source_condition": lambda n: True, "confidence": 0.48, "lag_weeks": 8, "mechanism_known": False},
    {"name": "temp_anomaly_shifts_disease_range", "source_type": "TemperatureRecord", "target_type": "MosquitoBreedingCondition", "relationship": "SHIFTS", "max_distance_km": 600, "source_condition": lambda n: n.properties.get("anomaly_pct", 0) > 10, "confidence": 0.60, "lag_weeks": 4, "mechanism_known": True},
    {"name": "hospital_density_mitigates_disease", "source_type": "CriticalInfrastructure", "target_type": "DengueOutbreak", "relationship": "MITIGATES", "max_distance_km": 200, "source_condition": lambda n: True, "confidence": 0.55, "lag_weeks": 0, "mechanism_known": False},
    {"name": "gni_mitigates_disease_vulnerability", "source_type": "HDIScore", "target_type": "DengueOutbreak", "relationship": "MITIGATES", "max_distance_km": 300, "source_condition": lambda n: n.properties.get("hdi_value", 0) > 0.7, "confidence": 0.55, "lag_weeks": 0, "mechanism_known": False},
    {"name": "biodiversity_loss_amplifies_zoonotic", "source_type": "WildlifeShiftEvent", "target_type": "MalariaOutbreak", "relationship": "AMPLIFIES", "max_distance_km": 400, "source_condition": lambda n: True, "confidence": 0.58, "lag_weeks": 4, "mechanism_known": False},
    {"name": "crop_yield_precedes_food_price", "source_type": "CropYieldAnomaly", "target_type": "InflationRate", "relationship": "PRECEDES", "max_distance_km": 3000, "source_condition": lambda n: n.properties.get("yield_deficit_pct", 0) > 15, "confidence": 0.62, "lag_weeks": 6, "mechanism_known": False},
    {"name": "displacement_signals_health_crisis", "source_type": "DisplacementEvent", "target_type": "CholeraOutbreak", "relationship": "SIGNALS", "max_distance_km": 300, "source_condition": lambda n: n.properties.get("persons_affected", 0) > 50000, "confidence": 0.65, "lag_weeks": 4, "mechanism_known": True},
    {"name": "groundwater_stress_reduces_crop_yield", "source_type": "GroundwaterStress", "target_type": "CropYieldAnomaly", "relationship": "REDUCES", "max_distance_km": 600, "source_condition": lambda n: n.properties.get("stress_index", 0) > 0.55, "confidence": 0.68, "lag_weeks": 8, "mechanism_known": True},
    {"name": "surface_water_change_drives_crop_yield", "source_type": "SurfaceWaterChange", "target_type": "CropYieldAnomaly", "relationship": "DRIVES", "max_distance_km": 600, "source_condition": lambda n: abs(n.properties.get("change_pct", 0)) > 10, "confidence": 0.66, "lag_weeks": 8, "mechanism_known": True},
    {"name": "carbon_emissions_drive_temperature", "source_type": "CarbonEmissionEvent", "target_type": "TemperatureRecord", "relationship": "DRIVES", "max_distance_km": 5000, "source_condition": lambda n: n.properties.get("co2_mt", 0) > 300, "confidence": 0.74, "lag_weeks": 12, "mechanism_known": True},
    {"name": "carbon_emissions_amplify_rainfall_anomaly", "source_type": "CarbonEmissionEvent", "target_type": "RainfallAnomaly", "relationship": "AMPLIFIES", "max_distance_km": 5000, "source_condition": lambda n: n.properties.get("co2_mt", 0) > 300, "confidence": 0.58, "lag_weeks": 12, "mechanism_known": False},
    {"name": "power_generation_drives_emissions", "source_type": "PowerPlant", "target_type": "CarbonEmissionEvent", "relationship": "DRIVES", "max_distance_km": 500, "source_condition": lambda n: n.properties.get("capacity_mw", 0) > 100, "confidence": 0.70, "lag_weeks": 0, "mechanism_known": True},
    {"name": "urbanization_amplifies_air_pollution", "source_type": "UrbanizationRate", "target_type": "AirPollutionEvent", "relationship": "AMPLIFIES", "max_distance_km": 800, "source_condition": lambda n: n.properties.get("value", 0) > 40, "confidence": 0.66, "lag_weeks": 4, "mechanism_known": True},
    {"name": "population_density_amplifies_air_pollution", "source_type": "PopulationDensityGrid", "target_type": "AirPollutionEvent", "relationship": "AMPLIFIES", "max_distance_km": 400, "source_condition": lambda n: n.properties.get("population_density", 0) > 20000, "confidence": 0.64, "lag_weeks": 0, "mechanism_known": False},
    {"name": "population_density_amplifies_pandemic", "source_type": "PopulationDensityGrid", "target_type": "PandemicEvent", "relationship": "AMPLIFIES", "max_distance_km": 400, "source_condition": lambda n: n.properties.get("population_density", 0) > 20000, "confidence": 0.62, "lag_weeks": 0, "mechanism_known": False},
    {"name": "wash_constraints_stress_health_system", "source_type": "WASHAccessZone", "target_type": "HealthSystemStress", "relationship": "STRESSES", "max_distance_km": 400, "source_condition": lambda n: n.properties.get("access_index", 0) < 0.6, "confidence": 0.68, "lag_weeks": 4, "mechanism_known": True},
    {"name": "governance_risk_triggers_conflict", "source_type": "GovernanceRisk", "target_type": "ConflictEvent", "relationship": "TRIGGERS", "max_distance_km": 1200, "source_condition": lambda n: n.properties.get("risk_score", 0) > 0.6, "confidence": 0.63, "lag_weeks": 12, "mechanism_known": False},
    {"name": "humanitarian_constraint_drives_displacement", "source_type": "HumanitarianAccessConstraint", "target_type": "DisplacementEvent", "relationship": "DRIVES", "max_distance_km": 1200, "source_condition": lambda n: n.properties.get("access_severity", 0) > 3.0, "confidence": 0.65, "lag_weeks": 4, "mechanism_known": True},
    {"name": "marine_stress_drives_flood", "source_type": "MarineStressEvent", "target_type": "FloodEvent", "relationship": "DRIVES", "max_distance_km": 2000, "source_condition": lambda n: n.properties.get("severity", 0) > 5, "confidence": 0.54, "lag_weeks": 8, "mechanism_known": False},
    {"name": "drought_reduces_groundwater", "source_type": "DroughtEvent", "target_type": "GroundwaterStress", "relationship": "REDUCES", "max_distance_km": 1000, "source_condition": lambda n: n.properties.get("severity", 0) > 5, "confidence": 0.69, "lag_weeks": 8, "mechanism_known": True},
    {"name": "deforestation_amplifies_groundwater_stress", "source_type": "DeforestationEvent", "target_type": "GroundwaterStress", "relationship": "AMPLIFIES", "max_distance_km": 2000, "source_condition": lambda n: n.properties.get("area_ha", 0) > 1000, "confidence": 0.57, "lag_weeks": 12, "mechanism_known": False},
    {"name": "floods_drive_population_displacement", "source_type": "FloodEvent", "target_type": "DisplacementEvent", "relationship": "DRIVES", "max_distance_km": 1200, "source_condition": lambda n: n.properties.get("severity", 0) > 4, "confidence": 0.71, "lag_weeks": 2, "mechanism_known": True},
    {"name": "trade_flows_signal_food_price", "source_type": "TradeFlow", "target_type": "FoodPriceEvent", "relationship": "SIGNALS", "max_distance_km": 5000, "source_condition": lambda n: abs(n.properties.get("value", 0)) > 0, "confidence": 0.48, "lag_weeks": 4, "mechanism_known": False},
    {"name": "debt_stress_amplifies_governance_risk", "source_type": "DebtStressIndicator", "target_type": "GovernanceRisk", "relationship": "AMPLIFIES", "max_distance_km": 5000, "source_condition": lambda n: n.properties.get("value", 0) > 50, "confidence": 0.58, "lag_weeks": 8, "mechanism_known": False},
    {"name": "gdp_reduces_suicide", "source_type": "EconomicIndicator", "target_type": "SocialCrisisRecord", "relationship": "REDUCES", "max_distance_km": 5000, "source_condition": lambda n: n.properties.get("type") == "GDP_Growth" and n.properties.get("value", 0) > 3.0, "confidence": 0.65, "lag_weeks": 52, "mechanism_known": False},
    {"name": "education_drives_economy", "source_type": "EducationMetric", "target_type": "EconomicIndicator", "relationship": "DRIVES", "max_distance_km": 5000, "source_condition": lambda n: n.properties.get("average_score", 0) > 70, "confidence": 0.55, "lag_weeks": 500, "mechanism_known": False},
    {"name": "accommodation_price_signals_economy", "source_type": "Accommodation", "target_type": "EconomicIndicator", "relationship": "SIGNALS", "max_distance_km": 100, "source_condition": lambda n: n.properties.get("price", 0) > 200, "confidence": 0.45, "lag_weeks": 4, "mechanism_known": False},
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
                confidence = calculate_confidence(rule["confidence"] * proximity_factor, mechanism_known=rule.get("mechanism_known", False))
                edges.append(ETLEdge(
                    source_id=src.id,
                    target_id=tgt.id,
                    relationship=rule["relationship"],
                    confidence=confidence,
                    lag_weeks=rule.get("lag_weeks", 0),
                    source_dataset=rule["name"],
                    evidence_type="mechanistic" if rule.get("mechanism_known") else "correlational",
                ))
    return edges
