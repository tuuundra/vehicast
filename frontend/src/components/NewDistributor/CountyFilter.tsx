import React from 'react';
import {
  Select,
  Flex,
} from '@chakra-ui/react';
import { CountyFilterProps, COUNTIES, County } from './types';

const CountyFilter = ({ selectedState, selectedCounties, onChange }: CountyFilterProps) => {
  // Filter counties based on selected state
  const filteredCounties = selectedState 
    ? COUNTIES.filter(county => county.stateId === selectedState)
    : COUNTIES;

  // Get the selected county name
  const getSelectedCountyName = (): string => {
    if (selectedCounties.length === 1) {
      const county = COUNTIES.find(c => c.id === selectedCounties[0]);
      return county ? county.name : 'All Counties';
    }
    return 'All Counties';
  };

  // Handle selection change
  const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value ? Number(e.target.value) : null;
    
    if (value === null) {
      // If "All Counties" is selected
      onChange([]);
    } else {
      // Set to just this county
      onChange([value]);
    }
  };

  return (
    <Flex align="center">
      <Select
        value={selectedCounties.length === 1 ? selectedCounties[0].toString() : ""}
        onChange={handleSelectionChange}
        bg="transparent"
        borderColor="gray.700"
        color="white"
        size="sm"
        height="28px"
        fontSize="sm"
        borderRadius="md"
        paddingInlineStart="2"
        paddingInlineEnd="8"
        width="auto"
        minWidth="160px"
        variant="filled"
        _hover={{ 
          borderColor: selectedState ? 'blue.400' : 'gray.700',
          bg: selectedState ? 'gray.700' : 'transparent'
        }}
        _focus={{ 
          borderColor: selectedState ? 'blue.400' : 'gray.700', 
          boxShadow: 'none',
          bg: selectedState ? 'gray.700' : 'transparent'
        }}
        isDisabled={!selectedState}
        iconColor={selectedState ? "blue.400" : "gray.600"}
        sx={{
          option: {
            bg: 'gray.800',
            _hover: { bg: 'gray.700' },
            _selected: { bg: 'blue.600' }
          }
        }}
      >
        <option value="">All Counties</option>
        {filteredCounties.map((county) => (
          <option key={county.id} value={county.id}>
            {county.name}
          </option>
        ))}
      </Select>
    </Flex>
  );
};

export default CountyFilter; 