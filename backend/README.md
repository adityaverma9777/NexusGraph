# NexusGraph Backend: Intelligence Engine

I designed this backend as the central intelligence hub for the NexusGraph platform. It handles the complete lifecycle of systemic data—from raw ingestion and ETL processing to complex graph traversals and real-time API serving. My goal was to create a robust pipeline that could normalize disparate datasets into a unified knowledge graph.

## System Overview

The backend is built with FastAPI for high-performance asynchronous execution. It bridges three primary data layers:
1. **Relational Layer**: PostgreSQL (via Supabase) for metadata, user records, and spatial data.
2. **Graph Layer**: Neo4j for managing the 400,000+ relationships between systemic entities.
3. **Data Layer**: A local and cloud-based file storage system for processing over 10 million rows of raw CSV data.

## Directory and File Functions

### Root Files
- **main.py**: The primary entry point. It initializes the FastAPI application, configures middleware (CORS), and mounts all system routes.
- **config.py**: Centralized configuration management. I use this to handle environment variables, database connection strings, and system-wide constants.
- **requirements.txt**: Lists all Python dependencies, including FastAPI, Neo4j drivers, GeoPandas for spatial processing, and Pydantic for validation.

### API Layer (/api)
- **routes/map_routes.py**: Handles spatial queries and coordinates for the MapView interface.
- **routes/registry_routes.py**: Manages the dataset registry, providing metadata about the 126 integrated sources.
- **routes/graph_routes.py**: Serves graph data for the radial and hierarchical visualizations.
- **routes/metric_routes.py**: Provides calculated intelligence metrics for the briefing engine.

### ETL & Ingestion Layer (/etl)
- **runner.py**: The orchestrator for the ingestion pipeline. It handles scheduled updates and batch processing.
- **base.py**: Defines the abstract base classes for all ingesters, ensuring a consistent interface for data loading.
- **kaggle_ingester.py**: A specialized engine for processing the 85+ Kaggle CSV datasets.
- **ingesters/**: A directory containing domain-specific logic for scraping and normalizing data from:
    - **agriculture/**: FAOSTAT and USDA datasets.
    - **climate/**: NOAA, ERA5, and rainfall grids.
    - **disease/**: WHO GHO, OWID COVID-19, and ProMED alerts.
    - **economy/**: World Bank, IMF, and UN COMTRADE data.
    - **population/**: UN Population and WorldPop grids.

### Graph Engine (/graph)
- **neo4j_client.py**: The core driver for Cypher query execution and connection pooling.
- **traversal.py**: Implements the logic for finding multi-hop paths between distant systemic concepts.
- **edge_rules.py**: Defines the semantic rules that determine how nodes are connected (e.g., how a 'Drought' event in the climate domain links to 'Crop Failure' in the agriculture domain).
- **temporal_edges.py**: Manages time-series relationships, allowing the engine to track how connections evolve over historical snapshots.

### Database & Models (/db, /models)
- **db/supabase_client.py**: Manages connections to the relational database for non-graph metadata.
- **models/graph.py**: Pydantic models defining the schema for nodes and relationships.
- **models/metrics.py**: Schema definitions for the systemic risk and briefing metrics.

## Technical Limitations and Roadmap

As noted in the main project README, I am currently constrained by a 0.4 million relationship limit in the Neo4j instance. This backend is architected to handle 1 million+ relationships, but I am currently optimizing the `graph/neo4j_client.py` and `etl/runner.py` logic to implement more efficient batching and relationship pruning to bypass these hardware limits.
