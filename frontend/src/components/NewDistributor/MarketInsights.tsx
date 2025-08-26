import React, { useState } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  HStack,
  Button,
  Flex,
  useColorModeValue
} from '@chakra-ui/react';
import { MarketInsight, VehicleLocationData } from '../../services/distributorDataService';
import { TriangleDownIcon, TriangleUpIcon } from '@chakra-ui/icons';

interface MarketInsightsProps {
  insights: MarketInsight[];
  isLoading: boolean;
  vehicleData?: VehicleLocationData[]; // Added real vehicle data prop
}

type SortField = 'make' | 'model' | 'year' | 'estimatedMileage' | 'registrations';
type SortDirection = 'asc' | 'desc';

const MarketInsights: React.FC<MarketInsightsProps> = ({ 
  insights,
  isLoading,
  vehicleData = [] // Default to empty array if not provided
}) => {
  // State for sorting vehicle data
  const [sortField, setSortField] = useState<SortField>('estimatedMileage');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  // State for pagination
  const [itemsPerPage] = useState(100);
  const [displayCount, setDisplayCount] = useState(100);
  
  // Handle sort click
  const handleSort = (field: SortField) => {
    if (field === sortField) {
      // Toggle direction if the same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Sort vehicle data
  const sortedVehicleData = [...vehicleData].sort((a, b) => {
    let comparison = 0;

    // Determine comparison based on field
    switch (sortField) {
      case 'make':
        comparison = a.make.localeCompare(b.make);
        break;
      case 'model':
        comparison = a.model.localeCompare(b.model);
        break;
      case 'year':
        comparison = a.year - b.year;
        break;
      case 'estimatedMileage':
        comparison = a.estimatedMileage - b.estimatedMileage;
        break;
      case 'registrations':
        comparison = a.registrations - b.registrations;
        break;
      default:
        comparison = 0;
    }

    // Reverse for descending order
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Get current page of data
  const currentData = sortedVehicleData.slice(0, displayCount);
  
  // Handler for loading more data
  const handleShowMore = () => {
    setDisplayCount(prev => Math.min(prev + itemsPerPage, sortedVehicleData.length));
  };

  return (
    <Box position="relative">
      <Box>
        <Table variant="simple" size="sm">
          <Thead position="sticky" top={0} zIndex={1} bg="gray.800">
            <Tr>
              <Th 
                color="gray.400" 
                cursor="pointer" 
                onClick={() => handleSort('make')}
                px={2}
                py={2}
                width="22%"
              >
                <HStack spacing={1}>
                  <Text>MAKE</Text>
                  {sortField === 'make' && (
                    sortDirection === 'asc' ? <TriangleUpIcon /> : <TriangleDownIcon />
                  )}
                </HStack>
              </Th>
              <Th 
                color="gray.400" 
                cursor="pointer" 
                onClick={() => handleSort('model')}
                px={2}
                py={2}
                width="45%"
              >
                <HStack spacing={1}>
                  <Text>MODEL</Text>
                  {sortField === 'model' && (
                    sortDirection === 'asc' ? <TriangleUpIcon /> : <TriangleDownIcon />
                  )}
                </HStack>
              </Th>
              <Th 
                color="gray.400" 
                isNumeric 
                cursor="pointer" 
                onClick={() => handleSort('year')}
                px={0}
                py={2}
                width="10%"
                textAlign="right"
                pr={8}
              >
                <Text>YEAR</Text>
                {sortField === 'year' && (
                  sortDirection === 'asc' ? <TriangleUpIcon /> : <TriangleDownIcon />
                )}
              </Th>
              <Th 
                color="gray.400" 
                isNumeric 
                cursor="pointer" 
                onClick={() => handleSort('estimatedMileage')}
                px={0}
                py={2}
                width="23%"
                textAlign="right"
                pl={10}
                pr={6}
              >
                <Text>EST. MILEAGE</Text>
                {sortField === 'estimatedMileage' && (
                  sortDirection === 'asc' ? <TriangleUpIcon /> : <TriangleDownIcon />
                )}
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {currentData.map((vehicle, idx) => (
              <Tr key={idx} _hover={{ bg: "gray.700" }}>
                <Td color="white" px={2} py={2}>{vehicle.make}</Td>
                <Td color="white" px={2} py={2}>{vehicle.model}</Td>
                <Td isNumeric color="white" px={0} py={2} textAlign="right" pr={8}>{vehicle.year}</Td>
                <Td isNumeric color="white" px={0} py={2} textAlign="right" pl={10} pr={6}>
                  {vehicle.estimatedMileage.toLocaleString()}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
      
      {/* Show more button */}
      {displayCount < sortedVehicleData.length && (
        <Flex justify="center" mt={3} mb={2}>
          <Button 
            size="sm" 
            colorScheme="blue" 
            variant="outline" 
            onClick={handleShowMore}
          >
            See More ({displayCount} of {sortedVehicleData.length})
          </Button>
        </Flex>
      )}
    </Box>
  );
};

export default MarketInsights; 