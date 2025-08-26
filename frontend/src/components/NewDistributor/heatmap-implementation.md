# Distributor Dashboard Heatmap Implementation Plan

## Core Features

1. **Multi-Metric Visualization**
   - Vehicle Registration Density (# of vehicles in each county)
   - Estimated Part Demand (predicted based on vehicle age/type and failure rates)
   - Optional future metric: Sales Opportunity Value ($)

2. **Interactive Selection**
   - Click on county in map to select and zoom
   - Selection updates the detailed data tables below
   - Two-way binding with filter controls (map selection updates filters, filter changes update map)

3. **Responsive Filtering**
   - State filter: zooms to state boundaries, maintains county-level detail
   - County filter: zooms to specific county
   - Time frame filter: adjusts heat intensity based on projected demand in selected time frame

## Visualization Approaches

### Option A: Point-Based Heatmap (Simpler)
- **Implementation**: Use county centroids from regions.csv (latitude/longitude)
- **Pros**:
  - Easier to implement with Mapbox's built-in heatmap layer
  - Better performance with many data points
  - Simpler data preparation
- **Cons**:
  - Less geographically precise
  - Doesn't show county boundaries
  - May be visually misleading in larger counties

### Option B: GeoJSON Polygon Heatmap (More Detailed)
- **Implementation**: Use county boundary GeoJSON with fill colors
- **Pros**:
  - Geographically accurate
  - Clear county boundaries
  - Better for clicking/selection
  - More professional appearance
- **Cons**:
  - Requires obtaining county boundary GeoJSON
  - Slightly more complex implementation
  - May have performance impact with many counties

## Data Integration

1. **Data Sources**
   - County centroids and population from regions.csv
   - Vehicle registration data (synthetic for now)
   - Part failure rate predictions

2. **Data Transformations**
   - Join registration data with county information
   - Calculate demand metrics per county
   - Normalize data for consistent visualization

## Interaction Model

1. **Map Interactions**
   - Hover: Show tooltip with county name and metric value
   - Click: Select county, update filters and tables
   - Zoom: Automatically adjust based on filter selections

2. **Control Panel Integration**
   - Add metric selector (toggle between registration and demand)
   - Connect existing filters to map view
   - Add reset/zoom out button

## Implementation Steps

1. **Preparation**
   - Decide between point-based or polygon-based approach
   - Gather necessary data (county centroids or boundaries)
   - Create test dataset for visualization

2. **Base Map Enhancement**
   - Modify MapboxBasic.tsx to support data layers
   - Add zoom/pan functionality tied to filters

3. **Data Layer Implementation**
   - Add heatmap or fill layer based on chosen approach
   - Implement color scale (blue to red gradient)
   - Connect data sources

4. **Interaction Development**
   - Implement click handlers for county selection
   - Add hover effects and tooltips
   - Connect map selection to filters

5. **UI Integration**
   - Add metric selector
   - Ensure responsive updates between map and tables
   - Optimize performance

## Next Steps

- Decide between point-based (Option A) and polygon-based (Option B) visualization
- Set up synthetic data structure for testing
- Begin MapboxBasic.tsx enhancements 