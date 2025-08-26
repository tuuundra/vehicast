import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Box, useColorModeValue } from '@chakra-ui/react';

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
`;

interface MapboxBasicProps {
  height?: string;
  width?: string;
  center?: [number, number]; // [longitude, latitude]
  zoom?: number;
}

const MapboxBasic: React.FC<MapboxBasicProps> = ({ 
  height = '380px',
  width = '100%',
  center = [-98.5795, 39.8283], // Center of the US
  zoom = 3.5
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  
  // Use Chakra UI's color mode to determine map style
  const mapStyle = useColorModeValue(
    'mapbox://styles/mapbox/light-v11',
    'mapbox://styles/mapbox/dark-v11'
  );

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
      
      // Add navigation controls (optional)
      /*
      map.current.addControl(
        new mapboxgl.NavigationControl({
          showCompass: false,
          showZoom: true,
          visualizePitch: false
        }),
        'bottom-right'
      );
      */
    }
    
    // Clean up on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapStyle, center, zoom]);

  return (
    <Box 
      ref={mapContainer}
      height={height} 
      width={width}
      borderRadius="md"
      overflow="hidden"
      css={mapboxAttributionStyle}
      position="relative"
    />
  );
};

export default MapboxBasic; 