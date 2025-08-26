import React from 'react';
import {
  Box,
  Flex,
  Text,
  Tooltip,
  IconButton,
  useColorModeValue,
  HStack,
  Heading,
  Select,
  Spacer
} from '@chakra-ui/react';
import { RepeatIcon } from '@chakra-ui/icons';
import { TimeFrame, STATES, COUNTIES } from './types';

const TIME_FRAMES = [
  { value: '7days', label: 'Next 7 Days' },
  { value: '1month', label: 'Next Month' },
  { value: '3months', label: 'Next 3 Months' },
  { value: '6months', label: 'Next 6 Months' }
];

interface FilterControlsProps {
  selectedTimeFrame: TimeFrame;
  setSelectedTimeFrame: (timeFrame: TimeFrame) => void;
  selectedState: number | null;
  setSelectedState: (stateId: number | null) => void;
  selectedCounties: number[];
  setSelectedCounties: (counties: number[]) => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  selectedTimeFrame,
  setSelectedTimeFrame,
  selectedState,
  setSelectedState,
  selectedCounties,
  setSelectedCounties
}) => {
  // Reset all filters
  const handleReset = () => {
    setSelectedTimeFrame('6months');
    setSelectedState(null);
    setSelectedCounties([]);
  };

  // Get active filter count
  const getActiveFilterCount = (): number => {
    let count = 0;
    if (selectedTimeFrame !== '6months') count++; // If not default
    if (selectedState !== null) count++;
    if (selectedCounties.length > 0) count++;
    return count;
  };

  // Get state name
  const getStateName = (stateId: number | null): string => {
    if (!stateId) return 'All States';
    const state = STATES.find(s => s.id === stateId);
    return state ? state.name : 'All States';
  };

  // Get counties for selected state
  const getCountiesForState = () => {
    if (!selectedState) return [];
    // Return counties for the selected state, sorted by population (highest first)
    return COUNTIES
      .filter(county => county.stateId === selectedState)
      .sort((a, b) => (b.population || 0) - (a.population || 0));
  };

  // Get location text
  const getLocationText = (): string => {
    if (selectedCounties.length === 1) {
      const county = COUNTIES.find(c => c.id === selectedCounties[0]);
      if (county) return `${county.name}, ${getStateName(selectedState)}`;
    }
    
    if (selectedState !== null) {
      return getStateName(selectedState);
    }
    
    return 'USA';
  };

  return (
    <Box 
      bg="gray.800" 
      borderBottom="1px" 
      borderColor="gray.700"
      boxShadow="sm"
      borderRadius="md"
      overflow="hidden"
      mb={4}
      p={4}
    >
      <Flex 
        align="center" 
        justify="space-between"
      >
        <Heading size="md" fontWeight="bold" color="white">
          {getLocationText()}
        </Heading>

        <Spacer />

        <HStack spacing={4}>
          {/* Time Period Filter */}
          <Box minW="150px">
            <Select 
              value={selectedTimeFrame}
              onChange={(e) => setSelectedTimeFrame(e.target.value as TimeFrame)}
              bg="gray.700"
              color="white"
              borderColor="gray.600"
              size="sm"
            >
              {TIME_FRAMES.map(tf => (
                <option key={tf.value} value={tf.value}>
                  {tf.label}
                </option>
              ))}
            </Select>
          </Box>

          {/* State Filter */}
          <Box minW="180px">
            <Select 
              value={selectedState || ''}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value) : null;
                setSelectedState(value);
                setSelectedCounties([]);
              }}
              placeholder="All States"
              bg="gray.700"
              color="white"
              borderColor="gray.600"
              size="sm"
            >
              {STATES
                .sort((a, b) => (b.population || 0) - (a.population || 0))
                .map(state => (
                  <option key={state.id} value={state.id}>
                    {state.name} ({(state.population || 0).toLocaleString()})
                  </option>
                ))}
            </Select>
          </Box>

          {/* County Filter - Only enabled if a state is selected */}
          <Box minW="180px">
            <Select 
              value={selectedCounties.length === 1 ? selectedCounties[0] : ''}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value) : null;
                setSelectedCounties(value ? [value] : []);
              }}
              placeholder="All Counties"
              isDisabled={!selectedState}
              bg="gray.700"
              color="white"
              borderColor="gray.600"
              size="sm"
            >
              {getCountiesForState().map(county => (
                <option key={county.id} value={county.id}>
                  {county.name} ({(county.population || 0).toLocaleString()})
                </option>
              ))}
            </Select>
          </Box>

          {/* Reset Button */}
          <Tooltip label="Reset all filters" placement="top">
            <IconButton
              aria-label="Reset filters"
              icon={<RepeatIcon />}
              size="sm"
              variant="ghost"
              colorScheme="gray"
              isDisabled={getActiveFilterCount() === 0}
              onClick={handleReset}
            />
          </Tooltip>
        </HStack>
      </Flex>
    </Box>
  );
};

export default FilterControls; 