import React from 'react';
import {
  Box,
  Select,
  Flex,
} from '@chakra-ui/react';
import { StateFilterProps, STATES } from './types';

const StateFilter = ({ selectedState, onChange }: StateFilterProps) => {
  return (
    <Flex align="center">
      <Select
        value={selectedState?.toString() || ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
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
        minWidth="120px"
        variant="filled"
        _hover={{ 
          borderColor: 'blue.400',
          bg: 'gray.700'
        }}
        _focus={{ 
          borderColor: 'blue.400', 
          boxShadow: 'none',
          bg: 'gray.700'
        }}
        iconColor="blue.400"
        sx={{
          option: {
            bg: 'gray.800',
            _hover: { bg: 'gray.700' },
            _selected: { bg: 'blue.600' }
          }
        }}
      >
        <option value="">All States</option>
        {STATES.map((state) => (
          <option key={state.id} value={state.id}>
            {state.name}
          </option>
        ))}
      </Select>
    </Flex>
  );
};

export default StateFilter; 