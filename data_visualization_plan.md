# Distributor Dashboard Revamp: Data Implementation Plan

## 1. Project Overview

The goal is to revamp the distributor dashboard with a focus on deliberate, transparent data handling and visualization. This plan outlines how we'll implement the data processing pipeline and connect it to our newly designed UI.

## 2. Requirements (Based on Stakeholder Feedback)

### Primary Requirements
- **Region-based filtering** with state and county-level granularity
- **Clear visualization of demand by region** on the map
- **Stocking recommendations** based on local demand
- **Drill-down capabilities** by vehicle make/model and parts

### Success Metrics
- Dashboard provides actionable insights for inventory decisions
- Data sources and calculations are transparent and documented
- Performance is optimized for quick filtering and data display
- Interface is intuitive and responds immediately to filter changes

## 3. Available Data Sources

### Geographic Data
- `regions.csv` - States and counties with population data
- `regional_demand.json` - Specific demand by region

### Vehicle Information
- `vehicles.csv` - Details for 1000+ vehicles
- `vehicle_types.csv` - Classifications of vehicles
- `region_vehicle_types.csv` - Vehicle types by region (registrations)

### Parts and Demand Data
- `parts.csv` - Parts catalog (300+ parts)
- `failures.csv` - Part failure rates/instances
- `demand_forecast.csv` - Projected demand by part
- `part_prices.csv` - Pricing information

### Component Data
- `components.csv` - Vehicle components classification

## 4. Data Implementation Architecture

### 4.1 Data Service Layer
Create `distributorDataService.ts` with these responsibilities:
- Loading and parsing CSV data
- Filtering data based on UI selections (time, state, county)
- Joining data across multiple sources
- Calculating aggregates and metrics with documented methodology
- Caching results for performance optimization

### 4.2 Data Processing Pipeline
1. **Data Loading** - Asynchronously load only needed CSV files
2. **Filtering** - Apply time period, state, and county filters
3. **Aggregation** - Combine data sources using common identifiers
4. **Calculation** - Apply business logic to generate insights
5. **Transformation** - Format data for UI components
6. **Caching** - Store results to minimize recalculation

## 5. Key Visualizations & Metrics

### 5.1 Map Visualization
- **Data Source**: `regions.csv`, `regional_demand.json`, `region_vehicle_types.csv`
- **Processing**: Aggregate demand by geographic region with selected filters
- **Visualization**: Choropleth map showing intensity of demand or registrations

### 5.2 Metric Cards (Predictive Analytics Focus)

- **Predicted Demand (Units)**
  - Source: `failures.csv`, `region_vehicle_types.csv`, `vehicles.csv`
  - Calculation: Sum of predicted part failures based on vehicle registrations, types, and calculated failure rates
  - Display: Total unit count with comparison to previous period
  
- **Revenue Opportunity**
  - Source: Predicted demand + `part_prices.csv`
  - Calculation: Sum(predicted demand × price) for all parts in selection
  - Display: Dollar amount with growth percentage
  
- **Parts Coverage Ratio**
  - Source: Current inventory vs predicted demand
  - Calculation: (Parts in stock ÷ Predicted demand) × 100%
  - Display: Percentage with indicator showing if coverage is adequate
  
- **Critical Stocking Needs**
  - Source: Predicted demand, current inventory, part importance ratings
  - Calculation: Count of parts with high demand prediction but low inventory
  - Display: Number with count of critical items

### 5.3 Stocking Recommendations Panel
- **Data Sources**: `failures.csv`, `region_vehicle_types.csv`, `parts.csv`, `vehicles.csv`
- **Content**: Scrollable list of all parts with:
  - Part number and name
  - Current inventory level
  - Predicted demand for selected region/timeframe
  - Recommended stocking level
  - Surplus/deficit indicator
  - Confidence rating for prediction
  - Priority ranking
- **Interaction**: 
  - Sortable by any column
  - Filterable by part category, priority, or deficit
  - Detailed view available for each part showing calculation methodology
  - Export to CSV/Excel option

### 5.4 Market Insights Panel
- **Data Sources**: `demand_forecast.csv`, `part_prices.csv`, `failures.csv`, `vehicles.csv`
- **Multi-tab Interface**:
  
  **Tab 1: Top Demand Parts**
  - Highest predicted failure/demand parts
  - Bar chart visualization
  - Part details on hover/select
  
  **Tab 2: Vehicle Distribution**
  - Breakdown of vehicle types in region
  - Pie/donut chart by make/model/year
  - Correlation with part demands
  
  **Tab 3: Seasonal Trends**
  - How demand changes over time periods
  - Line charts showing trends
  - Seasonality analysis
  
  **Tab 4: Profit Opportunities**
  - High-margin parts with good demand
  - Parts with competitive advantage
  - ROI calculations for stocking recommendations

## 6. Implementation Plan

### Phase 1: Data Service Foundation
- [  ] Create `distributorDataService.ts` file structure
- [  ] Implement CSV loading and parsing functions
- [  ] Build core filtering logic for time/state/county
- [  ] Set up data joining functions across sources
- [  ] Add logging and error handling

### Phase 2: Predictive Metrics Calculation
- [  ] Implement vehicle-to-parts failure prediction model
- [  ] Calculate core metrics for cards (demand, revenue, coverage, critical needs)
- [  ] Develop stocking recommendation algorithm with confidence scores
- [  ] Create market insights data aggregation functions

### Phase 3: UI Component Development
- [  ] Build stocking recommendations table component with sorting/filtering
- [  ] Develop tabbed market insights component with charts
- [  ] Create improved metric cards with comparative indicators
- [  ] Enhance map visualization for demand intensity

### Phase 4: UI Integration & Data Binding
- [  ] Connect filter UI to data service
- [  ] Bind map visualization to geographic data
- [  ] Link metric cards to calculated values
- [  ] Connect table and chart components to data service

### Phase 5: Optimization & Documentation
- [  ] Implement data caching for performance
- [  ] Add detailed code comments explaining calculations
- [  ] Create documentation for data flow and sources
- [  ] Optimize queries for large datasets

## 7. Technical Considerations

### Performance
- Load data asynchronously to prevent UI blocking
- Only load data needed for current view
- Consider using Web Workers for complex calculations
- Implement smart caching to minimize redundant processing

### Data Integrity
- Validate data before processing
- Handle missing or incomplete data gracefully
- Maintain data consistency across visualizations

### Failure Prediction Model
- Combine vehicle type, age, mileage, and historical failure rates
- Apply regional factors (climate, road conditions)
- Include confidence intervals for predictions
- Document and explain prediction methodology

### Future Extensibility
- Design for additional data sources
- Make calculation methods pluggable for different algorithms
- Keep UI and data processing concerns separated

## 8. Next Steps

1. Review this updated plan with stakeholders
2. Begin implementation of the data service layer
3. Create mockups for the new panel designs
4. Implement the predictive analytics calculations
5. Develop UI components for the stocking recommendations table