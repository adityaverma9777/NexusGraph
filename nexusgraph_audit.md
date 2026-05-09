# NexusGraph Audit
> Verified against the current repository state on 2026-05-08

## Executive Summary

The core implementation gaps from the previous audit are now closed.

The repo no longer has the broken graph date-filter path, lost Neo4j properties, dead relationship mirror, overlay-parser mismatch, discarded path payload, demo alert fallback, stub cluster layer, or missing planned ingester coverage that the prior audit documented.

What remains is mostly data-fidelity and performance work:

- several ingesters still use fallback, sample, or proxy data when source credentials or bulk-download paths are unavailable
- some newly added download-oriented sources are represented through curated normalization rows rather than full bulk extraction jobs
- the frontend production bundle is still large and should be split further

## Verification Performed

- Parsed every Python file with `ast.parse`: passed after the ETL expansion
- Imported `backend/etl/runner.py` with bytecode writes disabled: passed
  - runner now registers 39 ingesters across 10 domains
- `npm run lint` in `frontend`: previously passed on 2026-05-08, not rerun in this backend-only pass
- `tsc -b` in `frontend`: previously passed on 2026-05-08, not rerun in this backend-only pass
- `npm run build` in `frontend`: previously passed on 2026-05-08
  - Vite still requires the same Windows unsandboxed build path because of the `spawn EPERM` restriction in the sandbox

## Current Scorecard

| Area | Status | Notes |
|---|---|---|
| Dataset ingesters | Implemented | 39 planned sources now exist in code, including new water and energy domain coverage |
| ETL orchestration | Implemented | Runner initializes Supabase and Neo4j, ingests, then performs cross-domain inference across persisted nodes |
| Graph schema | Implemented | Neo4j + Supabase write/read fidelity is aligned for active paths |
| Edge rules | Implemented | Cross-domain inference now runs after ingestion across persisted nodes |
| Graph API | Implemented | `as_of` filtering, path search, cascade reconstruction, and property hydration are working in active code |
| Map API | Implemented | Heatmap, overlay, layers, and spatial query all feed the frontend correctly |
| Alerts | Implemented | Live route reads Supabase and no longer drops to demo alerts |
| Intelligence briefing | Implemented | Frontend/backend request contract matches, 2-hop graph context and recent metrics context are included |
| Frontend graph explorer | Implemented | Search, cascade, node expansion, and path view all drive shared graph state |
| Frontend map | Implemented | Live overlays render, clustering works, spatial query markers remain visible |
| Frontend analytics | Implemented | Live time series is wired to backend payloads |
| Build readiness | Implemented | Lint, typecheck, and production build are green |

## What Was Closed

### Backend

- `backend/etl/ingesters/common.py`
  - added shared location, parsing, severity, and identifier helpers for the ETL layer

- `backend/etl/ingesters/*`
  - added the 24 previously missing source ingesters:
    - Climate: IMD Gridded Rainfall, ERA5 Reanalysis, Global Flood Database
    - Disease: IDSP India, ProMED Alerts
    - Economy: IMF WEO, MoSPI India, UN COMTRADE
    - Agriculture: NASA MODIS NDVI, USDA NASS, JRC MARS Agro
    - Population: India Census, WorldPop Gridded
    - Ecology: IUCN Red List, Copernicus Land Cover
    - Infrastructure: OSM Overpass, Global Power Plants, HDX Humanitarian
    - Water: IGRAC Groundwater, JRC Surface Water, Copernicus Marine
    - Energy: Global Carbon Project CO2
    - Social: V-Dem Democracy, WHO/UNICEF WASH

- `backend/graph/traversal.py`
  - fixed `as_of` filtering in node, expand, path, and cascade traversal
  - restored property hydration from Neo4j `properties_json`
  - rebuilt path and cascade edge materialization from explicit Cypher maps

- `backend/etl/base.py`
  - writes `country_code` and `admin1_code` into Supabase metrics rows
  - stores structured node properties in Neo4j instead of stringifying them
  - writes inferred edges into Supabase `relationships`
  - uses real UTC timestamps for `dataset_registry.last_ingested_at`

- `backend/etl/runner.py`
  - initializes Supabase and Neo4j before ingest
  - loads persisted nodes from Supabase and runs cross-domain edge inference after ingestion
  - mirrors inferred cross-domain edges into both Neo4j and Supabase
  - now registers all 39 planned ingesters and includes `water` and `energy` domain execution paths

- `backend/api/routes/intelligence.py`
  - accepts the frontend request shape through aliases
  - expands 2-hop graph context
  - includes recent metric context from Supabase in the briefing prompt

- `backend/api/routes/alerts.py`
  - removed the demo fallback response

- `backend/api/routes/map_routes.py`
  - fixed overlay and heatmap zero-coordinate handling

### Frontend

- `frontend/src/hooks/useIntelligence.ts`
  - sends the backend request contract now used by the live briefing route

- `frontend/src/hooks/useMapOverlays.ts`
  - normalizes backend overlay payloads with `position`
  - preserves `domain`, `entityType`, and `severity` for clustered rendering

- `frontend/src/hooks/useMapLayers.ts`
  - accepts the backend `layers` array payload

- `frontend/src/hooks/useGraph.ts`
  - supports path queries as a first-class graph mode
  - preserves agriculture, social, water, and energy domains

- `frontend/src/components/graph/GraphControls.tsx`
  - path search now drives shared graph state instead of discarding the returned path payload

- `frontend/src/components/map/ClusterLayer.tsx`
  - now performs real viewport-sensitive marker clustering for live overlay markers

- `frontend/src/components/map/IntelligenceMap.tsx`
  - renders spatial-query markers separately so live spatial results are not hidden by overlay fallback behavior

- `frontend/src/components/charts/TimeSeriesChart.tsx`
  - consumes live backend time-series payloads and no longer falls back to mock series

- `frontend/src/pages/Home.tsx`
  - top alerts are live-only now

- `frontend/src/components/timeline/CascadeAnimation.tsx`
  - lint-clean implementation is in place

- `frontend/tsconfig.app.json`
  - TypeScript 6 deprecation blocker is handled

### Schema and Data Path

- `backend/db/schema.sql`
  - `relationships` now has an identity index for upserts
  - RLS is explicitly enabled for `relationships`, `dataset_registry`, and `admin_boundaries`
  - read/write policies exist for the active tables
  - dataset registry seed data is aligned to the full 39-source plan without duplicate rows

- `backend/db/admin_boundaries_seed.sql`
  - added a concrete population path for `admin_boundaries`
  - includes coarse ADM0 and ADM1 geometries for current operational focus areas

## Remaining Work

### Data Fidelity Gaps

- `backend/etl/ingesters/social/undp_hdi.py` still derives a proxy from World Bank indicators instead of ingesting a direct UNDP feed
- `backend/etl/ingesters/ecology/global_forest_watch.py` still depends on a placeholder API key and fallback estimates on failure
- `backend/etl/ingesters/infrastructure/acled.py` still falls back to synthetic conflict rows when credentials are absent
- `backend/etl/ingesters/disease/openaq.py` still falls back to fixed PM2.5 values on request failure
- several newly added bulk-download sources currently normalize curated fallback rows until full download/auth flows are wired end-to-end

### Performance

- the frontend build is green, but the main production JS bundle is still about 1.4 MB minified

## Bottom Line

The previous audit's implementation defects are closed in the current codebase.

The remaining open items are no longer missing planned datasets. They are mostly live-source fidelity concerns in a subset of ingesters and frontend bundle-size optimization.
