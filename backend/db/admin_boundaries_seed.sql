with boundary_seed(level, iso_code, admin1_code, name, min_lon, min_lat, max_lon, max_lat) as (
    values
        ('ADM0', 'IND', null, 'India', 68.0, 6.0, 97.5, 37.5),
        ('ADM0', 'BRA', null, 'Brazil', -74.5, -34.0, -34.0, 5.5),
        ('ADM0', 'SDN', null, 'Sudan', 21.5, 8.5, 39.0, 22.5),
        ('ADM0', 'TCD', null, 'Chad', 13.5, 7.0, 24.0, 24.0),
        ('ADM0', 'EGY', null, 'Egypt', 24.0, 22.0, 36.0, 31.8),
        ('ADM0', 'ETH', null, 'Ethiopia', 32.8, 3.2, 47.9, 14.9),
        ('ADM0', 'KEN', null, 'Kenya', 33.8, -4.8, 41.9, 5.6),
        ('ADM0', 'BGD', null, 'Bangladesh', 88.0, 20.6, 92.7, 26.7),
        ('ADM0', 'COD', null, 'Democratic Republic of the Congo', 12.0, -13.5, 31.5, 5.5),
        ('ADM0', 'USA', null, 'United States', -125.0, 24.0, -66.9, 49.5),
        ('ADM1', 'IND', 'IND-KL', 'Kerala', 74.8, 8.1, 77.7, 12.9),
        ('ADM1', 'IND', 'IND-TN', 'Tamil Nadu', 76.0, 8.0, 80.4, 13.6),
        ('ADM1', 'IND', 'IND-PB', 'Punjab', 73.8, 29.5, 76.9, 32.6),
        ('ADM1', 'IND', 'IND-BR', 'Bihar', 83.2, 24.0, 88.2, 27.5),
        ('ADM1', 'BRA', 'BRA-AM', 'Amazonas', -73.8, -9.8, -56.0, 2.3),
        ('ADM1', 'SDN', 'SDN-KH', 'Khartoum', 31.0, 15.0, 33.2, 16.6)
)
insert into admin_boundaries(level, iso_code, admin1_code, name, geom)
select
    level,
    iso_code,
    admin1_code,
    name,
    st_multi(st_makeenvelope(min_lon, min_lat, max_lon, max_lat, 4326))
from boundary_seed seed
where not exists (
    select 1
    from admin_boundaries existing
    where existing.level = seed.level
      and existing.iso_code = seed.iso_code
      and coalesce(existing.admin1_code, '') = coalesce(seed.admin1_code, '')
      and existing.name = seed.name
);
