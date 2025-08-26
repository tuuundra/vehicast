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
  Flex,
  Tooltip,
  HStack,
  chakra,
  useColorModeValue,
  Badge
} from '@chakra-ui/react';
import { InfoCircleIcon, ArrowUpIcon, ArrowDownIcon } from '../../components/Icons';
import { PartStockRecommendation } from '../../services/distributorDataService';
import { TriangleDownIcon, TriangleUpIcon } from '@chakra-ui/icons';

interface StockingRecommendationsProps {
  recommendations: PartStockRecommendation[];
  isLoading: boolean;
}

type SortField = 'partNumber' | 'partName' | 'currentStock' | 'estimatedDemand' | 'revenueOpportunity';
type SortDirection = 'asc' | 'desc';

const StockingRecommendations: React.FC<StockingRecommendationsProps> = ({ 
  recommendations,
  isLoading
}) => {
  // State for sorting
  const [sortField, setSortField] = useState<SortField>('estimatedDemand');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Get demand color based on comparison with current stock
  const getDemandColor = (currentStock: number, estimatedDemand: number): string => {
    // Avoid division by zero
    if (estimatedDemand === 0) return "gray.400";
    
    const ratio = currentStock / estimatedDemand;
    
    if (ratio < 0.7) {
      // Current stock is significantly below demand
      return "red.400"; // Warning - need to stock more
    } else if (ratio < 0.9) {
      // Current stock is slightly below demand
      return "yellow.400"; // Caution - may need to stock more
    } else {
      // Current stock meets or exceeds demand
      return "green.400"; // Good - adequate stock
    }
  };

  // Get demand color scheme based on comparison with current stock
  const getDemandColorScheme = (currentStock: number, estimatedDemand: number): string => {
    // Avoid division by zero
    if (estimatedDemand === 0) return "gray";
    
    const ratio = currentStock / estimatedDemand;
    
    if (ratio < 0.7) {
      // Current stock is significantly below demand
      return "red"; // Warning - need to stock more
    } else if (ratio < 0.9) {
      // Current stock is slightly below demand
      return "yellow"; // Caution - may need to stock more
    } else {
      // Current stock meets or exceeds demand
      return "green"; // Good - adequate stock
    }
  };

  // Badge style to ensure consistent sizing and alignment
  const badgeStyle = {
    width: '40px',
    display: 'inline-flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 'full',
    py: 0.5,
    px: 0,
    fontSize: 'xs',
    fontWeight: 'medium',
    textAlign: 'center',
    variant: 'solid',
    mr: 1
  };

  // Sort the recommendations
  const sortedRecommendations = [...recommendations].sort((a, b) => {
    let comparison = 0;

    // Determine comparison based on field
    switch (sortField) {
      case 'partNumber':
        comparison = a.partNumber.localeCompare(b.partNumber);
        break;
      case 'partName':
        comparison = a.partName.localeCompare(b.partName);
        break;
      case 'currentStock':
        comparison = a.currentStock - b.currentStock;
        break;
      case 'estimatedDemand':
        comparison = a.estimatedDemand - b.estimatedDemand;
        break;
      case 'revenueOpportunity':
        comparison = a.revenueOpportunity - b.revenueOpportunity;
        break;
      default:
        comparison = 0;
    }

    // Reverse for descending order
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  return (
    <Box overflowY="auto" maxHeight="400px" position="relative">
      <Table variant="simple" size="sm">
        <Thead position="sticky" top={0} zIndex={1} bg="gray.800">
          <Tr>
            <Th 
              color="gray.400" 
              cursor="pointer" 
              onClick={() => handleSort('partNumber')}
            >
              <HStack spacing={1}>
                <Text>Part Number</Text>
                {sortField === 'partNumber' && (
                  sortDirection === 'asc' ? <TriangleUpIcon /> : <TriangleDownIcon />
                )}
              </HStack>
            </Th>
            <Th 
              color="gray.400" 
              cursor="pointer" 
              onClick={() => handleSort('partName')}
            >
              <HStack spacing={1}>
                <Text>Part Name</Text>
                {sortField === 'partName' && (
                  sortDirection === 'asc' ? <TriangleUpIcon /> : <TriangleDownIcon />
                )}
              </HStack>
            </Th>
            <Th 
              color="gray.400" 
              isNumeric 
              cursor="pointer" 
              onClick={() => handleSort('currentStock')}
            >
              <HStack spacing={1} justify="flex-end">
                <Text>Current Stock</Text>
                {sortField === 'currentStock' && (
                  sortDirection === 'asc' ? <TriangleUpIcon /> : <TriangleDownIcon />
                )}
              </HStack>
            </Th>
            <Th 
              color="gray.400" 
              isNumeric 
              cursor="pointer" 
              onClick={() => handleSort('estimatedDemand')}
            >
              <HStack spacing={1} justify="flex-end">
                <Text>Est. Demand</Text>
                {sortField === 'estimatedDemand' && (
                  sortDirection === 'asc' ? <TriangleUpIcon /> : <TriangleDownIcon />
                )}
              </HStack>
            </Th>
            <Th 
              color="gray.400" 
              isNumeric 
              cursor="pointer" 
              onClick={() => handleSort('revenueOpportunity')}
            >
              <HStack spacing={1} justify="flex-end">
                <Text>Est. Revenue</Text>
                {sortField === 'revenueOpportunity' && (
                  sortDirection === 'asc' ? <TriangleUpIcon /> : <TriangleDownIcon />
                )}
              </HStack>
            </Th>
          </Tr>
        </Thead>
        <Tbody>
          {sortedRecommendations.map((part) => (
            <Tr key={part.partNumber} _hover={{ bg: "gray.700" }}>
              <Td color="white">{part.partNumber}</Td>
              <Td color="white">
                <Flex align="center">
                  {part.partName}
                  {part.isCritical && (
                    <Tooltip label="Critical part - high revenue impact">
                      <Box as="span" ml={2}>
                        <InfoCircleIcon color="red.400" size="0.8em" />
                      </Box>
                    </Tooltip>
                  )}
                </Flex>
              </Td>
              <Td isNumeric color="white">{part.currentStock}</Td>
              <Td isNumeric>
                <Flex 
                  justifyContent="flex-end" 
                  alignItems="center"
                  width="100%"
                >
                  <Badge 
                    colorScheme={getDemandColorScheme(part.currentStock, part.estimatedDemand)}
                    sx={badgeStyle}
                  >
                    {part.estimatedDemand}
                  </Badge>
                  <Box width="14px" display="flex" justifyContent="center">
                    {part.demandTrend > 0 ? (
                      <ArrowUpIcon color="green.400" size="0.8em" />
                    ) : part.demandTrend < 0 ? (
                      <ArrowDownIcon color="red.400" size="0.8em" />
                    ) : null}
                  </Box>
                </Flex>
              </Td>
              <Td isNumeric color="white">{formatCurrency(part.revenueOpportunity)}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
      
      {recommendations.length === 0 && !isLoading && (
        <Box textAlign="center" py={10}>
          <Text color="gray.500">No inventory data available for the selected filters.</Text>
        </Box>
      )}
    </Box>
  );
};

export default StockingRecommendations; 