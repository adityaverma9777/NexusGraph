-- NexusGraph Supabase Schema
-- Run this in the Supabase SQL editor

create extension if not exists "uuid-ossp";

create table if not exists metrics (
    id uuid default gen_random_uuid() primary key,
    domain varchar(50) not null,
    entity_type varchar(100) not null,
    entity_id varchar(255) not null,
    country_code char(3),
    admin1_code varchar(10),
    lat decimal(10, 6),
    lon decimal(10, 6),
    metric_name varchar(100) not null default 'severity',
    metric_value decimal(15, 4),
    unit varchar(50) default 'score',
    valid_from date not null,
    valid_to date,
    source_dataset varchar(100) not null,
    properties jsonb default '{}',
    created_at timestamptz default now()
);

create unique index if not exists idx_metrics_entity_metric on metrics(entity_id, metric_name);
create index if not exists idx_metrics_domain on metrics(domain);
create index if not exists idx_metrics_entity_type on metrics(entity_type);
create index if not exists idx_metrics_time on metrics(valid_from, valid_to);
create index if not exists idx_metrics_country on metrics(country_code);
create index if not exists idx_metrics_coords on metrics(lat, lon) where lat is not null and lon is not null;

create table if not exists relationships (
    id uuid default gen_random_uuid() primary key,
    source_entity_id varchar(255) not null,
    target_entity_id varchar(255) not null,
    relationship_type varchar(50) not null,
    confidence_score decimal(3, 2),
    lag_weeks integer default 0,
    source_dataset varchar(100),
    evidence_type varchar(30) default 'correlational',
    valid_from date,
    created_at timestamptz default now()
);

create index if not exists idx_rels_source on relationships(source_entity_id);
create index if not exists idx_rels_target on relationships(target_entity_id);
create index if not exists idx_rels_type on relationships(relationship_type);

create table if not exists dataset_registry (
    id serial primary key,
    name varchar(100) unique not null,
    domain varchar(50),
    source_url text,
    update_frequency varchar(20) default 'Daily',
    last_ingested_at timestamptz,
    record_count integer default 0,
    is_active boolean default true,
    created_at timestamptz default now()
);

insert into dataset_registry (name, domain, source_url, update_frequency) values
    ('Open-Meteo Historical Weather', 'climate', 'https://archive-api.open-meteo.com/v1/archive', 'Daily'),
    ('WHO Global Health Observatory', 'disease', 'https://ghoapi.azureedge.net/api/', 'Annual'),
    ('World Bank Open Data', 'economy', 'https://api.worldbank.org/v2/', 'Annual'),
    ('GBIF Biodiversity', 'ecology', 'https://api.gbif.org/v1/', 'Realtime'),
    ('UNHCR Displacement Data', 'population', 'https://api.unhcr.org/population/v1/', 'Annual'),
    ('NOAA GSOD', 'climate', 'https://www.ncei.noaa.gov/access/services/data/v1', 'Daily'),
    ('IMD Gridded Rainfall', 'climate', 'https://imdpune.gov.in/cmpg/Griddata/', 'Daily'),
    ('FAO Food Price Index', 'economy', 'http://fenixservices.fao.org/faostat/api/v1/', 'Monthly'),
    ('FAOSTAT Crops', 'agriculture', 'http://fenixservices.fao.org/faostat/api/v1/en/data/QCL', 'Annual'),
    ('NASA FIRMS Fires', 'ecology', 'https://firms.modaps.eosdis.nasa.gov/api/', 'Realtime'),
    ('Global Forest Watch', 'ecology', 'https://www.globalforestwatch.org/', 'Annual'),
    ('ACLED Conflict', 'infrastructure', 'https://developer.acleddata.com/', 'Weekly'),
    ('OpenAQ Air Quality', 'disease', 'https://api.openaq.org/v3/', 'Hourly'),
    ('OWID COVID-19', 'disease', 'https://raw.githubusercontent.com/owid/covid-19-data/master/', 'Daily'),
    ('UNDP HDI', 'social', 'https://hdr.undp.org/', 'Annual'),
    ('UN World Population', 'population', 'https://population.un.org/dataportal/api/', 'Annual'),
    ('IUCN Red List', 'ecology', 'https://apiv3.iucnredlist.org/api/v3/', 'Annual'),
    ('Global Power Plants', 'infrastructure', 'https://datasets.wri.org/', 'Annual'),
    ('Copernicus Marine (CMEMS)', 'water', 'https://marine.copernicus.eu/', 'Daily'),
    ('Global Carbon Project CO2', 'energy', 'https://globalcarbonproject.org/', 'Annual')
on conflict (name) do nothing;

create table if not exists alert_events (
    id uuid default gen_random_uuid() primary key,
    alert_type varchar(50),
    severity varchar(10) check (severity in ('low', 'medium', 'high', 'critical')),
    title text,
    description text,
    affected_countries text[],
    related_entity_ids text[],
    fired_at timestamptz default now(),
    expires_at timestamptz
);

create index if not exists idx_alerts_severity on alert_events(severity);
create index if not exists idx_alerts_fired on alert_events(fired_at desc);

alter table metrics enable row level security;
alter table alert_events enable row level security;

create policy "Public read metrics" on metrics for select using (true);
create policy "Public read alerts" on alert_events for select using (true);
create policy "Service write metrics" on metrics for all using (auth.role() = 'service_role');
create policy "Service write alerts" on alert_events for all using (auth.role() = 'service_role');
create policy "Public read registry" on dataset_registry for select using (true);
create policy "Service write registry" on dataset_registry for all using (auth.role() = 'service_role');
