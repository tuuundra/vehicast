import React, { useState } from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Flex, 
  useColorModeValue,
  Card,
  CardBody,
  CardHeader
} from '@chakra-ui/react';

import MapboxHeatmap from './MapboxHeatmap';
import FilterControls from './FilterControls';
import { TimeFrame } from './types';

const MapView: React.FC = () => {
  // Filter state
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>('6months');
  const [selectedState, setSelectedState] = useState<number | null>(null);
  const [selectedCounties, setSelectedCounties] = useState<number[]>([]);
  
  // Selected county (can be different from filter counties for map interaction)
  const [selectedMapCounty, setSelectedMapCounty] = useState<number | null>(null);
  
  // Handle county selection from map click
  const handleCountySelect = (countyId: number, stateId: number) => {
    // Update the map selection
    setSelectedMapCounty(countyId);
    
    // Update the filter controls to reflect the selection
    setSelectedState(stateId);
    setSelectedCounties([countyId]);
  };
  
  // Sync county selection from filter to map
  const handleFilterCountyChange = (counties: number[]) => {
    setSelectedCounties(counties);
    
    // If a single county is selected in the filter, update the map selection
    if (counties.length === 1) {
      setSelectedMapCounty(counties[0]);
    } else {
      setSelectedMapCounty(null);
    }
  };
  
  return (
    <Box>
      {/* Filter Controls */}
      <FilterControls
        selectedTimeFrame={selectedTimeFrame}
        setSelectedTimeFrame={setSelectedTimeFrame}
        selectedState={selectedState}
        setSelectedState={setSelectedState}
        selectedCounties={selectedCounties}
        setSelectedCounties={handleFilterCountyChange}
      />
      
      {/* Map Card */}
      <Card 
        mb={4} 
        variant="outline"
        bg={useColorModeValue('white', 'gray.800')}
        borderColor={useColorModeValue('gray.200', 'gray.700')}
      >
        <CardHeader pb={0}>
          <Heading size="md">Market Visualization</Heading>
          <Text color="gray.500" fontSize="sm">
            Click on a county to see detailed data and filter results
          </Text>
        </CardHeader>
        
        <CardBody>
          <Box h="400px">
            <MapboxHeatmap
              height="100%"
              selectedState={selectedState}
              selectedCounty={selectedMapCounty}
              onCountySelect={handleCountySelect}
            />
          </Box>
        </CardBody>
      </Card>
    </Box>
  );
};

export default MapView; 