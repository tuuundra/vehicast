# Static Data for Distributor Dashboard

This directory contains static data files used by the distributor dashboard to improve performance and reduce database load.

## Purpose

The static data approach offers several benefits:
1. **Improved Performance**: Eliminates database query latency
2. **Reduced Server Load**: Minimizes Supabase connection usage
3. **Offline Capability**: Dashboard can function even if Supabase is unavailable
4. **Predictable Behavior**: Consistent data for development and testing

## Implementation Details

The distributor dashboard now uses static data files instead of direct Supabase queries. This change is isolated to the distributor dashboard only - all other parts of the application continue to use Supabase directly.

### Files

- `regions.csv` / `regions.json`: Geographic regions (states, counties)
- `demand_forecast.csv` / `demand_forecast.json`: Part demand forecasts
- `regional_demand.json`: GeoJSON data for heatmap visualization
- `parts.csv` / `parts.json`: Parts catalog
- `part_prices.csv` / `part_prices.json`: Part pricing information
- `vehicles.csv` / `vehicles.json`: Vehicle information
- `vehicle_types.csv` / `vehicle_types.json`: Vehicle type information
- `components.csv` / `components.json`: Component information
- `failures.csv` / `failures.json`: Failure data
- `region_vehicle_types.csv` / `region_vehicle_types.json`: Regional vehicle registration data

### Data Flow

1. Frontend makes API requests to `/api/static/*` endpoints
2. Backend loads data from these static files using `utils/static_data_loader.py`
3. Data is returned to the frontend in the same format as the original Supabase endpoints

### Updating Static Data

To update the static data:
1. Export fresh data from Supabase tables
2. Convert to CSV/JSON format
3. Replace the files in this directory

## Technical Implementation

- `utils/static_data_loader.py`: Utility for loading and filtering static data
- `frontend/src/api/staticDataApi.ts`: Frontend API client for static data
- New backend routes in `app.py`: `/api/static/regions`, `/api/static/demand`, `/api/static/regional_demand`

## Limitations

- Data is not real-time and must be manually updated
- Complex queries that would normally be handled by Supabase must be simulated in the backend
- Region-specific filtering is simulated rather than using actual regional data 