import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Box, useColorModeValue, Button, ButtonGroup, Text, Flex, Tooltip } from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';
import { COUNTIES, STATES } from './types';
import type { Feature, Point, FeatureCollection } from 'geojson';

// Use environment variable for Mapbox token
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || 
  'pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjbHJlcGxhY2UtdGhpcy13aXRoLXlvdXItYWN0dWFsLXRva2VuIn0.replaceWithActualToken';

// Add custom CSS for Mapbox attribution
const mapboxAttributionStyle = `
  .mapboxgl-ctrl-attrib {
    font-size: 10px;
    opacity: 0.7;
    background: rgba(0,0,0,0.4);
    padding: 2px 5px;
    border-radius: 3px 0 0 0;
  }
  .mapboxgl-ctrl-attrib a {
    color: rgba(255,255,255,0.7);
  }
  .mapboxgl-ctrl-attrib a:hover {
    color: rgba(255,255,255,1);
  }
  
  /* Hide the Mapbox logo */
  .mapboxgl-ctrl-logo {
    display: none !important;
  }
  
  /* Hide the info button */
  .mapboxgl-ctrl-attrib-button {
    display: none !important;
  }
  
  /* Custom styling for the map */
  .mapboxgl-canvas {
    outline: none;
  }
  
  /* Popup styling */
  .mapboxgl-popup {
    max-width: 220px;
  }
  
  .mapboxgl-popup-content {
    text-align: left;
    font-family: 'Open Sans', sans-serif;
    padding: 12px;
    border-radius: 4px;
    background-color: rgba(33, 33, 33, 0.9);
    color: white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }
  
  .mapboxgl-popup-content strong {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 600;
    border-bottom: 1px solid rgba(255,255,255,0.2);
    padding-bottom: 4px;
  }
  
  .mapboxgl-popup-content .data-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
    font-size: 12px;
  }
  
  .mapboxgl-popup-content .data-value {
    font-weight: 500;
  }
  
  .mapboxgl-popup-close-button {
    color: white;
  }
  
  .mapboxgl-popup-tip {
    border-top-color: rgba(33, 33, 33, 0.9) !important;
    border-bottom-color: rgba(33, 33, 33, 0.9) !important;
  }
  
  /* Custom zoom controls styling */
  .mapboxgl-ctrl-zoom-in, .mapboxgl-ctrl-zoom-out {
    background-color: rgba(50, 50, 50, 0.7) !important;
    width: 28px !important;
    height: 28px !important;
  }
  
  .mapboxgl-ctrl-zoom-in span, .mapboxgl-ctrl-zoom-out span {
    color: rgba(220, 220, 220, 0.9) !important;
    font-weight: normal !important;
  }
  
  .mapboxgl-ctrl-zoom-in:hover, .mapboxgl-ctrl-zoom-out:hover {
    background-color: rgba(60, 60, 60, 0.8) !important;
  }
`;

// Data metrics that can be visualized
type DataMetric = 'registrations' | 'demand';

interface CountyData {
  id: number;
  name: string;
  stateId: number;
  stateName: string;
  population: number;
  latitude: number;
  longitude: number;
  registrations: number;
  demand: number;
  areaSquareMiles: number;
}

// County coordinate data from regions.csv
const COUNTY_COORDINATES: Record<number, [number, number]> = {
  // Virginia counties
  6: [-77.3064, 38.8462], // Fairfax County
  7: [-75.978, 36.8529],  // Virginia Beach
  8: [-77.6536, 39.0768], // Loudoun County
  9: [-77.392, 37.5407],  // Henrico County
  10: [-76.2859, 36.8508], // Norfolk County
  
  // California counties
  11: [-118.2437, 34.0522], // Los Angeles County
  12: [-117.1611, 32.7157], // San Diego County
  13: [-117.8311, 33.7175], // Orange County
  14: [-117.3961, 33.9533], // Riverside County
  15: [-117.2898, 34.1083], // San Bernardino County
  
  // Texas counties
  16: [-95.3103, 29.7752], // Harris County
  17: [-96.797, 32.7767],  // Dallas County
  18: [-97.2918, 32.7732], // Tarrant County
  19: [-98.4936, 29.4241], // Bexar County
  20: [-97.7911, 30.3372], // Travis County
  
  // New York counties
  21: [-73.9496, 40.6501], // Kings County
  22: [-73.7949, 40.7282], // Queens County
  23: [-73.9712, 40.7831], // New York County
  24: [-72.6151, 40.9849], // Suffolk County
  25: [-73.8648, 40.8448], // Bronx County
  
  // Florida counties
  26: [-80.1918, 25.7617], // Miami-Dade County
  27: [-80.3659, 26.1901], // Broward County
  28: [-80.0364, 26.7056], // Palm Beach County
  29: [-82.3018, 27.9904], // Hillsborough County
  30: [-81.3792, 28.5383], // Orange County
};

// Add county area data in square miles
const COUNTY_AREAS: Record<number, number> = {
  // Virginia counties
  6: 406,  // Fairfax County
  7: 249,  // Virginia Beach
  8: 521,  // Loudoun County
  9: 245,  // Henrico County
  10: 96,  // Norfolk County
  
  // California counties
  11: 4751, // Los Angeles County
  12: 4526, // San Diego County
  13: 948,  // Orange County
  14: 7303, // Riverside County
  15: 20105, // San Bernardino County (largest county by area in the US outside Alaska)
  
  // Texas counties
  16: 1778, // Harris County
  17: 909,  // Dallas County
  18: 902,  // Tarrant County
  19: 1256, // Bexar County
  20: 1023, // Travis County
  
  // New York counties
  21: 78,   // Kings County
  22: 109,  // Queens County
  23: 33,   // New York County (Manhattan)
  24: 2373, // Suffolk County
  25: 42,   // Bronx County
  
  // Florida counties
  26: 2431, // Miami-Dade County
  27: 1323, // Broward County
  28: 2383, // Palm Beach County
  29: 1266, // Hillsborough County
  30: 1003  // Orange County
};

// State coordinate data with bounding boxes for zooming
interface StateBounds {
  center: [number, number];
  bounds: [[number, number], [number, number]]; // [[southwest], [northeast]]
}

const STATE_BOUNDS: Record<number, StateBounds> = {
  1: { // Virginia
    center: [-78.17, 37.7693],
    bounds: [[-83.6753, 36.5408], [-75.2312, 39.4660]]
  },
  2: { // California
    center: [-119.4179, 36.7783],
    bounds: [[-124.4096, 32.5343], [-114.1308, 42.0095]]
  },
  3: { // Texas
    center: [-99.9018, 31.9686],
    bounds: [[-106.6456, 25.8371], [-93.5083, 36.5007]]
  },
  4: { // New York
    center: [-74.006, 40.7128],
    bounds: [[-79.7624, 40.4961], [-71.8559, 45.0125]]
  },
  5: { // Florida
    center: [-81.5158, 27.6648],
    bounds: [[-87.6348, 24.5231], [-80.0312, 31.0009]]
  }
};

// Add debugging when generating data
const generateSyntheticData = (): CountyData[] => {
  const data = COUNTIES.map(county => {
    const state = STATES.find(s => s.id === county.stateId);
    const stateName = state ? state.name : 'Unknown';
    const population = county.population || 0; // Handle undefined population
    
    // Get coordinates from our mapping, fallback to state center if not found
    const coordinates = COUNTY_COORDINATES[county.id] || 
                       (state ? STATE_BOUNDS[state.id]?.center : [0, 0]);
    
    // Get the county area in square miles or use a default value
    const areaSquareMiles = COUNTY_AREAS[county.id] || 500; // Default to 500 sq miles if unknown
    
    // Generate synthetic registrations (50-90% of population)
    const registrationPercentage = 0.5 + Math.random() * 0.4;
    const registrations = Math.floor(population * registrationPercentage);
    
    // Generate synthetic demand (10-30% of registrations)
    const demandPercentage = 0.1 + Math.random() * 0.2;
    const demand = Math.floor(registrations * demandPercentage);
    
    return {
      id: county.id,
      name: county.name,
      stateId: county.stateId,
      stateName,
      population,
      latitude: coordinates[1], // Latitude is second in the pair
      longitude: coordinates[0], // Longitude is first in the pair
      registrations,
      demand,
      areaSquareMiles // Add area to the county data
    };
  });
  
  console.log("Generated county data:", data);
  return data;
};

interface MapboxHeatmapProps {
  height?: string;
  width?: string;
  center?: [number, number]; // [longitude, latitude]
  zoom?: number;
  selectedState: number | null;
  selectedCounty: number | null;
  onCountySelect?: (countyId: number, stateId: number) => void;
}

// Add custom type for the map with our extension
interface ExtendedMap extends mapboxgl.Map {
  handleSelectionZoom?: () => void;
}

const MapboxHeatmap: React.FC<MapboxHeatmapProps> = ({ 
  height = '380px',
  width = '100%',
  center = [-98.5795, 39.8283], // Center of the US
  zoom = 3.5,
  selectedState,
  selectedCounty,
  onCountySelect
}) => {
  console.log("🔍 COMPONENT RENDER - State:", selectedState, "County:", selectedCounty);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<ExtendedMap | null>(null);
  const popup = useRef<mapboxgl.Popup | null>(null);
  const [dataMetric, setDataMetric] = useState<DataMetric>('registrations');
  const [countyData, setCountyData] = useState<CountyData[]>([]);
  
  // Use Chakra UI's color mode to determine map style
  const mapStyle = useColorModeValue(
    'mapbox://styles/mapbox/light-v11',
    'mapbox://styles/mapbox/dark-v11'
  );

  // Generate synthetic data on component mount
  useEffect(() => {
    // Generate data immediately
    const data = generateSyntheticData();
    setCountyData(data);
  }, []);

  // Initialize map when component mounts
  useEffect(() => {
    if (map.current) return; // Initialize map only once
    
    if (mapContainer.current) {
      // Create a basic map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: center,
        zoom: zoom,
        attributionControl: false, // We'll add a custom attribution control
        logoPosition: 'bottom-left',
      });
      
      // Add minimal controls
      map.current.addControl(
        new mapboxgl.AttributionControl({
          compact: true
        }),
        'bottom-left'
      );
      
      // Create a popup but don't add it to the map yet
      popup.current = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false
      });
      
      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl({
          showCompass: false,
          showZoom: true,
          visualizePitch: false
        }),
        'bottom-right'
      );
      
      // Wait for map to load before adding data
      map.current.on('load', () => {
        console.log("Map loaded, adding data layers");
        // Add data layers with a small delay to ensure style is fully loaded
        // This avoids a race condition where the map style isn't ready yet
        setTimeout(() => {
          if (map.current && countyData.length > 0) {
            console.log("Adding data layers with", countyData.length, "counties");
            addDataLayers();
            setupZoomHandler();
          } else {
            console.error("Map or county data not available for adding layers");
          }
        }, 500);
      });
    }
    
    // Clean up on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapStyle]); // Only depend on mapStyle, not on center or zoom to prevent re-initialization

  // Add a separate effect to add the data layers when county data changes
  // This ensures that even if data loads after the map, the layers get added
  useEffect(() => {
    if (!map.current || countyData.length === 0) return;
    
    // Only add layers if map is fully loaded
    if (map.current.loaded()) {
      console.log("County data changed, checking if layers need to be added");
      // Check if layers already exist
      if (!map.current.getSource('counties-data')) {
        console.log("Adding data layers after data load");
        addDataLayers();
        setupZoomHandler();
      } else {
        console.log("Layers already exist, not adding again");
      }
    } else {
      console.log("Map not loaded yet, will add layers on load");
      map.current.once('load', () => {
        if (map.current && !map.current.getSource('counties-data')) {
          console.log("Adding data layers after map load");
          addDataLayers();
          setupZoomHandler();
        }
      });
    }
  }, [countyData]);

  // At component level - track prop changes explicitly
  const diagnosticZoom = () => {
    console.log("\n🔍 DIAGNOSTIC ZOOM ANALYSIS");
    console.log("📌 Props received:");
    console.log("   - selectedState:", selectedState);
    console.log("   - selectedCounty:", selectedCounty);
    
    console.log("\n📌 County data status:");
    console.log("   - County data length:", countyData.length);
    
    if (selectedCounty !== null) {
      const county = countyData.find(c => c.id === selectedCounty);
      console.log("   - Looking for county ID:", selectedCounty);
      console.log("   - County found:", county ? "YES" : "NO");
      if (county) {
        console.log("   - County name:", county.name);
        console.log("   - County coordinates:", [county.longitude, county.latitude]);
      }
    }
    
    if (selectedState !== null) {
      console.log("   - Looking for state ID:", selectedState);
      console.log("   - State bounds found:", STATE_BOUNDS[selectedState] ? "YES" : "NO");
    }
    
    console.log("\n📌 Map status:");
    console.log("   - Map object exists:", map.current ? "YES" : "NO");
    if (map.current) {
      console.log("   - Map loaded:", map.current.loaded() ? "YES" : "NO");
      console.log("   - Map style loaded:", map.current.isStyleLoaded() ? "YES" : "NO");
      console.log("   - Current center:", map.current.getCenter());
      console.log("   - Current zoom:", map.current.getZoom());
    }
    
    console.log("\n📌 Zoom decision tree:");
    if (selectedCounty !== null) {
      console.log("   - Decision: Should zoom to COUNTY");
    } else if (selectedState !== null) {
      console.log("   - Decision: Should zoom to STATE");
    } else {
      console.log("   - Decision: Should zoom to USA");
    }
    console.log("🔍 END DIAGNOSTIC\n");
  };
  
  // Add to useEffect to run diagnostics when selections change
  useEffect(() => {
    // Run diagnostics without affecting functionality
    setTimeout(diagnosticZoom, 0);
    
    // Rest of the existing code
    // ...
  }, [selectedState, selectedCounty]);

  // Simplify the zoom handler setup to reduce complexity
  const setupZoomHandler = () => {
    if (!map.current) return;
    
    // Store the zoom handler function directly on the map
    // But wrap it in a function that captures the current selections
    map.current.handleSelectionZoom = () => {
      // Capture current selections at the time this is called
      const capturedState = selectedState;
      const capturedCounty = selectedCounty;
      
      console.log("MAP ZOOM HANDLER CALLED");
      console.log(`Using captured map selections - State: ${capturedState}, County: ${capturedCounty}`);
      
      // First priority: County selection
      if (capturedCounty !== null) {
        const county = countyData.find(c => c.id === capturedCounty);
        if (county) {
          console.log(`Zooming map to county: ${county.name}`);
          const zoomLevel = county.areaSquareMiles > 1000 ? 8 : 10;
          map.current?.flyTo({
            center: [county.longitude, county.latitude],
            zoom: zoomLevel,
            essential: true,
            duration: 1500
          });
          return;
        }
      }
      
      // Second priority: State selection
      if (capturedState !== null) {
        const stateBound = STATE_BOUNDS[capturedState];
        if (stateBound) {
          console.log(`Zooming map to state bounds`);
          map.current?.fitBounds(stateBound.bounds, {
            padding: 50,
            duration: 1500
          });
          return;
        }
      }
      
      // Only reset if both are null
      if (capturedState === null && capturedCounty === null) {
        console.log("Resetting map to USA view");
        map.current?.flyTo({
          center: [-98.5795, 39.8283],
          zoom: 3.5,
          duration: 1500
        });
      }
    };
    
    // Register an event listener for the custom zoom event
    map.current.on('zoomToSelection', map.current.handleSelectionZoom);
    
    // If we already have selections when the map is initialized, zoom to them
    if (selectedState !== null || selectedCounty !== null) {
      console.log("Initial selections detected, triggering initial zoom");
      // Short delay to ensure map is ready
      setTimeout(map.current.handleSelectionZoom, 500);
    }
  };

  // Make the selection change handler more direct and focused
  useEffect(() => {
    // Only proceed if we have a map and it's loaded
    if (!map.current) {
      console.log("Map not available for selection change");
      return;
    }
    
    console.log(`SELECTION CHANGED to State: ${selectedState}, County: ${selectedCounty}`);
    
    // If we don't have county data yet, we can't zoom properly
    if (countyData.length === 0) {
      console.warn("County data not loaded yet, can't zoom accurately");
      return;
    }
    
    // IMPORTANT: Capture current selection values in closure variables to prevent loss
    const currentSelectedState = selectedState;
    const currentSelectedCounty = selectedCounty;
    
    console.log(`Captured stable selection values - State: ${currentSelectedState}, County: ${currentSelectedCounty}`);
    
    // Create a new zoom handler function that uses captured values
    const stableZoomHandler = () => {
      if (!map.current) return;
      
      console.log("STABLE ZOOM HANDLER CALLED");
      console.log(`Using captured selections - State: ${currentSelectedState}, County: ${currentSelectedCounty}`);
      
      // First priority: County selection
      if (currentSelectedCounty !== null) {
        console.log(`Zooming to captured county ID: ${currentSelectedCounty}`);
        const county = countyData.find(c => c.id === currentSelectedCounty);
        
        if (county) {
          console.log(`Found county: ${county.name} at [${county.longitude}, ${county.latitude}]`);
          const zoomLevel = county.areaSquareMiles > 1000 ? 8 : 10;
          
          // DIRECT APPROACH: Use immediate flyTo call with no conditions
          map.current.flyTo({
            center: [county.longitude, county.latitude],
            zoom: zoomLevel,
            essential: true,
            duration: 1500  // Longer duration for smoother transition
          });
          return; // Exit early to prevent other zoom operations
        }
      }
      
      // Second priority: State selection
      if (currentSelectedState !== null) {
        console.log(`Zooming to captured state ID: ${currentSelectedState}`);
        const stateBound = STATE_BOUNDS[currentSelectedState];
        
        if (stateBound) {
          console.log(`Found state bounds: ${JSON.stringify(stateBound.bounds)}`);
          
          map.current.fitBounds(stateBound.bounds, {
            padding: 50,
            duration: 1500
          });
          return;
        }
      }
      
      // Only reset to USA view if explicitly requested
      if (currentSelectedState === null && currentSelectedCounty === null) {
        console.log("Both captured state and county are null, resetting to USA view");
        map.current.flyTo({
          center: [-98.5795, 39.8283],
          zoom: 3.5,
          duration: 1500
        });
      }
    };
    
    // Wait a moment to ensure all state updates are complete
    // But use a stable zoom handler with captured selection values
    setTimeout(stableZoomHandler, 300);
  }, [selectedState, selectedCounty]);

  // Function to add data layers to the map
  const addDataLayers = () => {
    if (!map.current || countyData.length === 0) {
      console.error("Cannot add data layers - map or data not available");
      return;
    }
    
    try {
      console.log("Creating data layers with", countyData.length, "counties");
      
      // Check if the source already exists
      if (map.current.getSource('counties-data')) {
        console.log("Source already exists, not adding again");
        return;
      }
      
      // Find max area for normalization
      const maxArea = Math.max(...countyData.map(c => c.areaSquareMiles));
      
      // Create a GeoJSON source from our county data
      const pointFeatures = countyData.map(county => ({
        type: 'Feature' as const,
        properties: {
          id: county.id,
          name: county.name,
          stateId: county.stateId,
          stateName: county.stateName,
          population: county.population,
          registrations: county.registrations,
          demand: county.demand,
          area: county.areaSquareMiles,
          // Normalized values for visualization (0-1 scale)
          // Boost smaller values to ensure minimum visibility
          registrationsNorm: Math.max(0.3, county.registrations / Math.max(...countyData.map(c => c.registrations))),
          demandNorm: Math.max(0.3, county.demand / Math.max(...countyData.map(c => c.demand))),
          // Area-based size factor with reduced sqrt effect to make large counties properly sized
          // Use a more linear scaling to preserve the actual size differences between counties
          sizeFactor: Math.pow(county.areaSquareMiles / maxArea, 0.6) * 6 + 0.8
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [county.longitude, county.latitude]
        }
      }));
      
      const geojsonData = {
        type: 'FeatureCollection' as const,
        features: pointFeatures
      };
      
      // Add the GeoJSON source
      map.current.addSource('counties-data', {
        type: 'geojson',
        data: geojsonData
      });
      
      // Add a heatmap layer that works across all zoom levels
      map.current.addLayer({
        id: 'county-heat',
        type: 'heatmap',
        source: 'counties-data',
        paint: {
          // Increase weight based on selected metric, with minimum threshold to ensure visibility
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', `${dataMetric}Norm`],
            0, 0.3,  // Minimum weight of 0.3 instead of 0
            1, 1
          ],
          // Increase intensity as zoom level increases, with higher base intensity
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 1.5,  // Higher base intensity (was 1)
            6, 2.5,  // Increased medium zoom intensity (was 2)
            9, 3.5,  // Increased higher zoom intensity (was 3)
            15, 4.5  // Increased detailed zoom intensity (was 4)
          ],
          // Color by density - adjusted to make lower values more visible
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(33,102,172,0)',
            0.1, 'rgb(33,102,172)',  // Start color at lower density (was 0.2)
            0.3, 'rgb(103,169,207)', // Adjusted middle colors to spread the gradient
            0.5, 'rgb(250,227,149)',
            0.7, 'rgb(239,138,98)',
            0.9, 'rgb(178,24,43)'    // Higher color at lower density (was 1.0)
          ],
          // Radius based on county size (using area) and zoom level
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, ['*', 5, ['get', 'sizeFactor']],     // Base size at lowest zoom
            6, ['*', 20, ['get', 'sizeFactor']],    // Medium zoom
            9, ['*', 50, ['get', 'sizeFactor']],    // Higher zoom - much larger
            12, ['*', 80, ['get', 'sizeFactor']],   // Detailed zoom - county filling
            15, ['*', 120, ['get', 'sizeFactor']]   // Very detailed zoom - match county boundaries
          ],
          // Increase base opacity to ensure visibility
          'heatmap-opacity': 0.9  // Higher opacity for better visibility (was 0.8)
        }
      });
      
      // Add invisible click layer for interactivity
      map.current.addLayer({
        id: 'county-interaction',
        type: 'circle',
        source: 'counties-data',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, ['*', 5, ['get', 'sizeFactor']],
            6, ['*', 20, ['get', 'sizeFactor']],
            9, ['*', 50, ['get', 'sizeFactor']],
            12, ['*', 80, ['get', 'sizeFactor']]
          ],
          'circle-opacity': 0,  // Completely transparent
          'circle-stroke-width': 0
        }
      });
      
      // Add click interactivity
      map.current.on('click', 'county-interaction', (e) => {
        if (!e.features || e.features.length === 0) return;
        
        const feature = e.features[0] as Feature<Point>;
        const props = feature.properties;
        
        console.log("Clicked feature:", feature);
        console.log("Properties:", props);
        
        if (props) {
          // Type conversion for number properties (mapbox stores all properties as strings)
          const countyId = typeof props.id === 'string' ? parseInt(props.id) : props.id;
          const stateId = typeof props.stateId === 'string' ? parseInt(props.stateId) : props.stateId;
          
          console.log(`Clicked County ID: ${countyId}, State ID: ${stateId}`);
          
          if (countyId && stateId && onCountySelect) {
            // Pass both the county ID and state ID to the parent component
            onCountySelect(countyId, stateId);
          }
        }
      });
      
      // Add hover interactivity
      map.current.on('mouseenter', 'county-interaction', (e) => {
        if (!map.current || !popup.current || !e.features || e.features.length === 0) return;
        
        map.current.getCanvas().style.cursor = 'pointer';
        
        // Use proper type casting for the feature and its properties
        const feature = e.features[0] as Feature<Point>;
        const props = feature.properties;
        
        if (!props) return;
        
        // Store the current feature ID to avoid duplicate updates
        const currentFeatureId = typeof props.id === 'string' ? parseInt(props.id) : props.id;
        (map.current as any).hoverFeatureId = currentFeatureId;
        
        // Handle property type conversion (from string to number if needed)
        const population = typeof props.population === 'string' ? parseInt(props.population) : props.population || 0;
        const registrations = typeof props.registrations === 'string' ? parseInt(props.registrations) : props.registrations || 0;
        const demand = typeof props.demand === 'string' ? parseInt(props.demand) : props.demand || 0;
        
        // Get coordinates safely
        const coordinates = feature.geometry.coordinates.slice() as [number, number];
        
        // Format the popup content with null checks
        const popupContent = `
          <strong>${props.name || 'Unknown'}, ${props.stateName || 'Unknown'}</strong>
          <div class="data-row">
            <span>Population:</span>
            <span class="data-value">${population.toLocaleString()}</span>
          </div>
          <div class="data-row">
            <span>Registrations:</span>
            <span class="data-value">${registrations.toLocaleString()}</span>
          </div>
          <div class="data-row">
            <span>Est. Demand:</span>
            <span class="data-value">${demand.toLocaleString()}</span>
          </div>
        `;
        
        // Position the popup
        popup.current
          .setLngLat(coordinates)
          .setHTML(popupContent)
          .addTo(map.current);
      });
      
      // Add a mousemove handler to update popup when moving between counties
      map.current.on('mousemove', 'county-interaction', (e) => {
        if (!map.current || !popup.current || !e.features || e.features.length === 0) return;
        
        // Use proper type casting for the feature and its properties
        const feature = e.features[0] as Feature<Point>;
        const props = feature.properties;
        
        if (!props) return;
        
        // Check if we're hovering over a new county (to avoid unnecessary updates)
        const featureId = typeof props.id === 'string' ? parseInt(props.id) : props.id;
        if (featureId === (map.current as any).hoverFeatureId) return;
        
        // Update the current feature ID
        (map.current as any).hoverFeatureId = featureId;
        
        // Handle property type conversion (from string to number if needed)
        const population = typeof props.population === 'string' ? parseInt(props.population) : props.population || 0;
        const registrations = typeof props.registrations === 'string' ? parseInt(props.registrations) : props.registrations || 0;
        const demand = typeof props.demand === 'string' ? parseInt(props.demand) : props.demand || 0;
        
        // Get coordinates safely
        const coordinates = feature.geometry.coordinates.slice() as [number, number];
        
        // Format the popup content with null checks
        const popupContent = `
          <strong>${props.name || 'Unknown'}, ${props.stateName || 'Unknown'}</strong>
          <div class="data-row">
            <span>Population:</span>
            <span class="data-value">${population.toLocaleString()}</span>
          </div>
          <div class="data-row">
            <span>Registrations:</span>
            <span class="data-value">${registrations.toLocaleString()}</span>
          </div>
          <div class="data-row">
            <span>Est. Demand:</span>
            <span class="data-value">${demand.toLocaleString()}</span>
          </div>
        `;
        
        // Update the popup
        popup.current
          .setLngLat(coordinates)
          .setHTML(popupContent);
      });
      
      // Improve the mouseleave behavior
      map.current.on('mouseleave', 'county-interaction', () => {
        if (!map.current || !popup.current) return;
        
        // Reset the current feature ID
        (map.current as any).hoverFeatureId = null;
        
        map.current.getCanvas().style.cursor = '';
        popup.current.remove();
      });
      
      console.log("Successfully added map layers");
    } catch (error) {
      console.error("Error adding data layers:", error);
    }
  };
  
  // Update data visualization when metric changes
  useEffect(() => {
    if (!map.current) return;
    
    // Update the heatmap to use the new metric
    if (map.current.getLayer('county-heat')) {
      map.current.setPaintProperty('county-heat', 'heatmap-weight', [
        'interpolate',
        ['linear'],
        ['get', `${dataMetric}Norm`],
        0, 0.3,
        1, 1
      ]);
    }
    
  }, [dataMetric]);

  return (
    <Box position="relative">
      <Box 
        ref={mapContainer}
        height={height} 
        width={width}
        borderRadius="md"
        overflow="hidden"
        css={mapboxAttributionStyle}
        position="relative"
      />
      
      {/* Metric selector overlay */}
      <Box 
        position="absolute" 
        top="10px" 
        right="10px"
        zIndex={10}
        bg="rgba(0,0,0,0.6)"
        borderRadius="md"
        p={2}
      >
        <ButtonGroup size="sm" isAttached variant="outline">
          <Button 
            colorScheme={dataMetric === 'registrations' ? 'blue' : 'gray'}
            onClick={() => setDataMetric('registrations')}
            _hover={{ bg: dataMetric === 'registrations' ? 'blue.600' : 'gray.600' }}
            transition="background-color 0.2s"
          >
            Vehicle Registrations
          </Button>
          <Button 
            colorScheme={dataMetric === 'demand' ? 'blue' : 'gray'}
            onClick={() => setDataMetric('demand')}
            _hover={{ bg: dataMetric === 'demand' ? 'blue.600' : 'gray.600' }}
            transition="background-color 0.2s"
          >
            Estimated Demand
          </Button>
        </ButtonGroup>
      </Box>
      
      {/* Map Legend */}
      <Box 
        position="absolute" 
        bottom="30px" 
        left="10px"
        zIndex={10}
        bg="rgba(0,0,0,0.6)"
        borderRadius="md"
        p={2}
        maxWidth="150px"
      >
        <Flex direction="column" color="white" fontSize="xs">
          <Flex justify="space-between" align="center" mb={1}>
            <Text>Data: {dataMetric === 'registrations' ? 'Vehicle Registrations' : 'Estimated Demand'}</Text>
            <Tooltip label="Click on a county to select it and view detailed data">
              <InfoIcon boxSize={3} />
            </Tooltip>
          </Flex>
          <Box 
            h="10px" 
            w="100%" 
            mb={1}
            bgGradient="linear(to-r, blue.600, blue.400, yellow.400, orange.400, red.500)"
            borderRadius="sm"
          />
          <Flex justify="space-between">
            <Text>Low</Text>
            <Text>High</Text>
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
};

export default MapboxHeatmap; 