import React from 'react';
import {
  Box,
  Select,
  Flex,
} from '@chakra-ui/react';
import { TimeFrameFilterProps, TIME_FRAMES } from './types';

const TimeFrameFilter = ({ selectedTimeFrame, onChange }: TimeFrameFilterProps) => {
  return (
    <Flex align="center">
      <Select
        value={selectedTimeFrame}
        onChange={(e) => onChange(e.target.value as any)}
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
        {TIME_FRAMES.map((timeFrame) => (
          <option key={timeFrame.value} value={timeFrame.value}>
            {timeFrame.label}
          </option>
        ))}
      </Select>
    </Flex>
  );
};

export default TimeFrameFilter; 