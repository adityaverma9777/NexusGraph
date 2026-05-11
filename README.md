# NexusGraph: Relationship Intelligence Engine

I wanted to make a small project that could combine multiple small, free, available datasets and generate insights. The idea was simple: I wanted to have something like Palantir that uses data to make meaningful insights across complex, interlinked systems.

NexusGraph is an end-to-end intelligence platform that processes raw datasets into a knowledge graph, allowing for the exploration of systemic relationships between climate, economy, disease, and social infrastructure.

## Project Vision

The goal of this project is to connect disparate data sources to reveal how changes in one domain (like climate) might correlate with or impact another (like economic stability or disease outbreaks). By treating data points as nodes in a graph rather than rows in a table, I can visualize the "nexus" of global issues.

## Current Scale and Stats

- Datasets Integrated: 126
- Raw Data Processed: 1,04,30,692 Rows
- Graph Nodes: 1,27,407
- Graph Relationships: 4,01,090

## Technical Stack

### Backend
- Framework: FastAPI (Python)
- Database: Neo4j (Graph), PostgreSQL with PostGIS (Relational/Spatial)
- ETL: Custom Python ingestion pipelines for 126 datasets across 39 system-level integrations and 85 Kaggle source files.

### Frontend
- Framework: React (TypeScript)
- Bundler: Vite
- Visualization: Cytoscape.js for graph rendering, Leaflet for spatial data, and Recharts for temporal analysis.

## Scaling Challenges and Future Work

A core component of this project is the Neo4j knowledge graph. During development, I reached a limit of approximately 0.4 million relationships in my current setup. This constraint prevented me from expanding the graph further, even though my predicted number of relationships for the full dataset was 1 million+.

Because of this limitation, I am still working on improving the stack and finding better ways to scale this to its full potential. I am exploring optimized graph modeling techniques and potentially distributed graph databases to handle the 1M+ relationships originally envisioned.

## Repository Structure

- /backend: FastAPI server and the core ETL ingestion engine.
- /frontend: React/Vite dashboard for graph exploration and briefings.
- /data: Local storage for raw CSV source files and ingestion logs.

I am continuing to iterate on this project to move past current hardware and software constraints and build a truly comprehensive systemic intelligence engine.
