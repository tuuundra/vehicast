import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Box, useColorModeValue } from '@chakra-ui/react';

// Use environment variable for Mapbox token
// You'll need to add REACT_APP_MAPBOX_TOKEN to your .env file
// For development, you can use a placeholder token, but for production
// you should get a token from https://account.mapbox.com/
mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || 
  'pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjbHJlcGxhY2UtdGhpcy13aXRoLXlvdXItYWN0dWFsLXRva2VuIn0.replaceWithActualToken';

// Add custom CSS for Mapbox attribution
// This makes the attribution more subtle
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
  
  /* Hide the Mapbox logo (gray circle) */
  .mapboxgl-ctrl-logo {
    display: none !important;
  }
  
  /* Hide the info button */
  .mapboxgl-ctrl-attrib-button {
    display: none !important;
  }
  
  /* Hide any other controls we don't want */
  .mapboxgl-ctrl-group:not(.mapboxgl-ctrl-attrib) {
    display: none !important;
  }
  
  /* Custom styling for the map */
  .mapboxgl-canvas {
    outline: none;
  }
  
  /* Ensure the map container has no outline */
  .mapboxgl-map:focus {
    outline: none;
  }
  
  /* Hide the "improve this map" link */
  .mapbox-improve-map {
    display: none !important;
  }
  
  /* Custom styling for popups */
  .mapboxgl-popup {
    z-index: 10;
  }
  
  .mapboxgl-popup-content {
    background: rgba(30, 30, 30, 0.9);
    color: white;
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 500;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .mapboxgl-popup-tip {
    border-top-color: rgba(30, 30, 30, 0.9);
    border-bottom-color: rgba(30, 30, 30, 0.9);
  }
  
  .mapboxgl-popup-close-button {
    color: rgba(255, 255, 255, 0.7);
    font-size: 16px;
    padding: 0 6px;
  }
  
  .mapboxgl-popup-close-button:hover {
    color: white;
    background: none;
  }
  
  .city-name {
    font-weight: bold;
    margin-bottom: 2px;
  }
  
  .intensity-value {
    opacity: 0.8;
  }
`;

// Define proper GeoJSON types
type FeatureCollection = {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: {
      intensity: number;
      city?: string;
      state?: string;
    };
    geometry: {
      type: 'Point';
      coordinates: [number, number]; // [longitude, latitude]
    };
  }>;
};

interface MapboxHeatmapProps {
  data?: FeatureCollection;
  height?: string;
  width?: string;
  showPopups?: boolean;
}

const MapboxHeatmap: React.FC<MapboxHeatmapProps> = ({ 
  data = defaultData,
  height = '320px',
  width = '100%',
  showPopups = true
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const popup = useRef<mapboxgl.Popup | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Use Chakra UI's color mode to determine map style
  const mapStyle = useColorModeValue(
    'mapbox://styles/mapbox/light-v11',
    'mapbox://styles/mapbox/dark-v11'
  );

  // Initialize map when component mounts
  useEffect(() => {
    if (map.current) return; // Initialize map only once
    
    if (mapContainer.current) {
      // Create a completely clean map with no controls
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: mapStyle,
        center: [-98.5795, 39.8283], // Center of the US
        zoom: 3, // Show the entire US
        projection: 'mercator',
        attributionControl: false, // Disable default attribution control
        logoPosition: 'bottom-left', // Move logo to bottom-left (will be hidden anyway)
        interactive: true, // Keep the map interactive
        boxZoom: false, // Disable box zoom
        doubleClickZoom: false, // Disable double click zoom
        touchZoomRotate: true, // Keep touch zoom
        dragRotate: false, // Disable drag rotate
        renderWorldCopies: false, // Don't render world copies
        fadeDuration: 0 // No fade duration
      });

      // Don't add any controls at all
      // We'll handle attribution with our own custom element if needed

      map.current.on('load', () => {
        setMapLoaded(true);
        
        // After map loads, find and remove any Mapbox UI elements
        const container = mapContainer.current;
        if (container) {
          // Find and completely remove the control container
          const controlContainer = container.querySelector('.mapboxgl-control-container');
          if (controlContainer) {
            controlContainer.remove();
          }
          
          // Set up a MutationObserver to continuously check for and remove any Mapbox controls
          const observer = new MutationObserver((mutations) => {
            // Check for and remove control container
            const controlContainer = container.querySelector('.mapboxgl-control-container');
            if (controlContainer) {
              controlContainer.remove();
            }
            
            // Check for and remove any logos
            const logos = container.querySelectorAll('.mapboxgl-ctrl-logo');
            logos.forEach(logo => logo.remove());
          });
          
          // Start observing the container for DOM changes
          observer.observe(container, { 
            childList: true, 
            subtree: true 
          });
        }
        
        // Initialize popup but don't add it to the map yet
        if (showPopups) {
          popup.current = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
            maxWidth: '300px',
            className: 'demand-popup'
          });
        }
      });
      
      // Handle resize to ensure the map fills the container
      const resizeObserver = new ResizeObserver(() => {
        if (map.current) {
          map.current.resize();
        }
      });
      
      if (mapContainer.current) {
        resizeObserver.observe(mapContainer.current);
      }
      
      // Clean up observer on unmount
      return () => {
        resizeObserver.disconnect();
        if (map.current) {
          map.current.remove();
          map.current = null;
        }
      };
    }
  }, [mapStyle, showPopups]);

  // Add heatmap layer when map is loaded and data changes
  useEffect(() => {
    if (!map.current || !mapLoaded || !data) return;

    // Check if source already exists and remove it
    if (map.current.getSource('heatmap-data')) {
      map.current.removeLayer('heatmap-layer');
      
      // Remove point layer if it exists
      if (map.current.getLayer('point-layer')) {
        map.current.removeLayer('point-layer');
      }
      
      map.current.removeSource('heatmap-data');
    }

    // We're no longer adding heatmap or point layers as requested
    // Just keep the base map without the visualization elements
    
    // Force a resize to ensure the map fills the container
    if (map.current) {
      setTimeout(() => {
        if (map.current) {
          map.current.resize();
        }
      }, 100);
    }
  }, [mapLoaded, data, showPopups]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (map.current) {
        map.current.resize();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Initial resize
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <Box 
      ref={mapContainer} 
      height={height} 
      width={width} 
      borderRadius="md"
      overflow="hidden"
      position="relative"
      className="mapbox-container"
      sx={{
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          borderRadius: 'inherit',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)'
        },
        '.mapboxgl-map': {
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          height: '100%',
          width: '100%'
        },
        '.mapboxgl-canvas-container': {
          height: '100%',
          width: '100%'
        },
        '.mapboxgl-canvas': {
          height: '100% !important',
          width: '100% !important'
        },
        // Hide the info button
        '.mapboxgl-ctrl-attrib-button': {
          display: 'none !important'
        },
        // Hide any other controls we don't want
        '.mapboxgl-ctrl-group:not(.mapboxgl-ctrl-attrib)': {
          display: 'none !important'
        },
        // Hide the Mapbox logo
        '.mapboxgl-ctrl-logo': {
          display: 'none !important',
          opacity: '0 !important',
          visibility: 'hidden !important'
        }
      }}
    >
      <style>{mapboxAttributionStyle}</style>
    </Box>
  );
};

// Default sample data - empty features array to ensure nothing is displayed
const defaultData: FeatureCollection = {
  type: 'FeatureCollection',
  features: []
};

export default MapboxHeatmap; 