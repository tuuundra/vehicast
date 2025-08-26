import React, { useState, useEffect, ReactNode } from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Container, 
  SimpleGrid, 
  Stat, 
  StatLabel, 
  StatNumber, 
  StatHelpText, 
  Select, 
  Flex, 
  Table, 
  Thead, 
  Tbody, 
  Tr, 
  Th, 
  Td, 
  Skeleton, 
  Badge, 
  Card, 
  CardHeader, 
  CardBody,
  useColorModeValue,
  VStack,
  HStack,
  Icon,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  chakra,
  keyframes,
  Divider,
  useToken,
  Tooltip
} from '@chakra-ui/react';
import { ChevronDownIcon, InfoIcon, ArrowUpIcon } from '@chakra-ui/icons';
import { getDemandForecast, getRegionalDemandData } from '../api/api';
import CollapsibleSidebar from '../components/CollapsibleSidebar';
import MapboxHeatmap from '../components/MapboxHeatmap';
import { 
  OverviewIcon, 
  InventoryIcon, 
  PartsIcon
} from '../components/DashboardIcons';

// Animation keyframes
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const numberCountAnimation = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

interface Part {
  part_id: number;
  part_name: string;
  part_number: string;
  component_name: string;
  vehicle_type: string;
  expected_demand: number;
  recommended_stock: number;
}

interface DemandData {
  time_window: string;
  parts: Part[];
  total_demand: number;
  total_stock: number;
}

// Format currency with appropriate units based on value
const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  } else {
    return `$${value.toFixed(2)}`;
  }
};

// Stat card component
const StatCard = ({ title, value, subtitle, isLoading, accentColor }: { 
  title: string; 
  value: number | string; 
  subtitle: string; 
  isLoading: boolean;
  accentColor: string;
}) => {
  const cardBg = useColorModeValue('gray.800', 'gray.800');
  const borderColor = 'gray.700';
  const headingColor = useColorModeValue('white', 'white');
  
  return (
    <Card 
      bg={cardBg} 
      borderRadius="xl" 
      overflow="hidden" 
      borderColor={borderColor} 
      borderWidth="1px"
      position="relative"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        bgGradient: `linear(to-r, ${accentColor}, transparent)`,
      }}
    >
      <CardHeader pb={0}>
        <Text fontSize="sm" color="gray.400" fontWeight="medium" textTransform="uppercase" letterSpacing="wider">
          {title}
        </Text>
      </CardHeader>
      <CardBody>
        <Stat>
          <Box
            sx={{
              animation: `${fadeIn} 0.5s ease-out`
            }}
          >
            <StatNumber fontSize="5xl" fontWeight="bold" color={headingColor} lineHeight="1">
              {isLoading ? (
                <Skeleton height="60px" width="150px" startColor="gray.700" endColor="gray.600" />
              ) : (
                value
              )}
            </StatNumber>
          </Box>
          <StatHelpText fontSize="md" color="gray.400" mt={2}>{subtitle}</StatHelpText>
        </Stat>
      </CardBody>
    </Card>
  );
};

const InventoryContent = () => {
  const [timeWindow, setTimeWindow] = useState('6 months');
  const [demandData, setDemandData] = useState<DemandData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Color scheme to match homepage
  const bgColor = useColorModeValue('gray.900', 'gray.900');
  const cardBg = useColorModeValue('gray.800', 'gray.800');
  const textColor = useColorModeValue('gray.300', 'gray.300');
  const headingColor = useColorModeValue('white', 'white');
  const accentColor = 'brand.400';
  const borderColor = 'gray.700';
  const tableBg = 'gray.800';
  
  // Get color tokens for gradients
  const [brand400, purple500] = useToken('colors', ['brand.400', 'purple.500']);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getDemandForecast(timeWindow);
        console.log('Fetched data:', data); // Debug log
        setDemandData(data);
      } catch (error) {
        console.error('Error fetching demand data:', error);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeWindow]);

  return (
    <Box 
      minH="100vh" 
      color={textColor}
      bgGradient={`linear(to-b, gray.900, gray.800)`}
      pt={8}
      pb={16}
    >
      <Container maxW="container.xl">
        <Box
          sx={{
            animation: `${fadeIn} 0.5s ease-out`
          }}
        >
          <VStack spacing={8} align="stretch">
            <Flex justify="space-between" align="center">
              <Box>
                <Heading 
                  as="h1" 
                  size="2xl" 
                  mb={3} 
                  color={headingColor}
                  fontWeight="extrabold"
                  letterSpacing="-0.02em"
                  bgGradient={`linear(to-r, ${brand400}, ${purple500})`}
                  bgClip="text"
                >
                  Inventory Management
                </Heading>
                <Text 
                  fontSize="lg" 
                  color={textColor}
                  maxW="800px"
                >
                  Track inventory levels, monitor demand, and optimize your stock.
                </Text>
              </Box>
              
              {/* Time filter dropdown */}
              <Menu>
                <MenuButton 
                  as={Button} 
                  rightIcon={<ChevronDownIcon />}
                  bg={cardBg}
                  color={textColor}
                  borderColor={borderColor}
                  borderWidth="1px"
                  _hover={{ bg: 'gray.700' }}
                  _active={{ bg: 'gray.700' }}
                >
                  {timeWindow}
                </MenuButton>
                <MenuList bg={cardBg} borderColor={borderColor}>
                  <MenuItem bg={cardBg} _hover={{ bg: 'gray.700' }} onClick={() => setTimeWindow('7 days')}>Next 7 Days</MenuItem>
                  <MenuItem bg={cardBg} _hover={{ bg: 'gray.700' }} onClick={() => setTimeWindow('30 days')}>Next 30 Days</MenuItem>
                  <MenuItem bg={cardBg} _hover={{ bg: 'gray.700' }} onClick={() => setTimeWindow('90 days')}>Next 90 Days</MenuItem>
                  <MenuItem bg={cardBg} _hover={{ bg: 'gray.700' }} onClick={() => setTimeWindow('6 months')}>Next 6 Months</MenuItem>
                </MenuList>
              </Menu>
            </Flex>
            
            {/* Top-level metrics */}
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              <StatCard 
                title="Total Expected Demand" 
                value={demandData ? demandData.total_demand.toLocaleString() : '0'} 
                subtitle={`For ${timeWindow}`} 
                isLoading={loading}
                accentColor={brand400}
              />
              
              <StatCard 
                title="Current Inventory" 
                value={demandData ? demandData.total_stock.toLocaleString() : '0'} 
                subtitle="Total parts in stock" 
                isLoading={loading}
                accentColor={purple500}
              />
            </SimpleGrid>
            
            {/* Inventory table */}
            <Card 
              bg={cardBg} 
              borderRadius="xl" 
              overflow="hidden" 
              borderColor={borderColor} 
              borderWidth="1px"
              position="relative"
              _before={{
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                bgGradient: `linear(to-r, ${brand400}, ${purple500}, transparent)`,
              }}
            >
              <CardHeader pb={2}>
                <Text fontSize="sm" color="gray.400" fontWeight="medium" textTransform="uppercase" letterSpacing="wider">
                  Inventory Status by Part
                </Text>
              </CardHeader>
              <CardBody pt={2}>
                {loading ? (
                  <VStack spacing={4} align="stretch">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} height="60px" startColor="gray.700" endColor="gray.600" />
                    ))}
                  </VStack>
                ) : error ? (
                  <Box 
                    p={4} 
                    bg="red.900" 
                    color="white" 
                    borderRadius="md"
                    borderLeft="4px solid" 
                    borderColor="red.500"
                  >
                    <Flex align="center">
                      <Icon as={InfoIcon} mr={2} color="red.300" />
                      <Text>{error}</Text>
                    </Flex>
                    <Button 
                      mt={2} 
                      size="sm" 
                      colorScheme="red" 
                      onClick={() => {
                        const fetchData = async () => {
                          setLoading(true);
                          setError(null);
                          try {
                            const data = await getDemandForecast(timeWindow);
                            setDemandData(data);
                          } catch (error) {
                            console.error('Error fetching demand data:', error);
                            setError('Failed to load data. Please try again later.');
                          } finally {
                            setLoading(false);
                          }
                        };
                        fetchData();
                      }}
                    >
                      Try Again
                    </Button>
                  </Box>
                ) : demandData && demandData.parts && demandData.parts.length > 0 ? (
                  <Box overflowX="auto">
                    <Table variant="simple" size="md">
                      <Thead>
                        <Tr>
                          <Th color="gray.400" borderColor={borderColor}>PART NAME</Th>
                          <Th color="gray.400" borderColor={borderColor}>PART NUMBER</Th>
                          <Th color="gray.400" borderColor={borderColor}>VEHICLE TYPE</Th>
                          <Th isNumeric color="gray.400" borderColor={borderColor}>FORECASTED DEMAND</Th>
                          <Th isNumeric color="gray.400" borderColor={borderColor}>CURRENT STOCK</Th>
                          <Th isNumeric color="gray.400" borderColor={borderColor}>STATUS</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {demandData.parts.map((part: Part, index: number) => {
                          const stockStatus = part.recommended_stock >= part.expected_demand 
                            ? { color: 'green', text: 'Sufficient' }
                            : part.recommended_stock >= part.expected_demand * 0.8
                              ? { color: 'yellow', text: 'Low' }
                              : { color: 'red', text: 'Critical' };
                          
                          return (
                            <Tr 
                              key={index} 
                              _hover={{ bg: 'gray.700' }}
                              sx={{
                                animation: `${fadeIn} 0.3s ease-out forwards`,
                                animationDelay: `${index * 0.05}s`,
                                opacity: 0,
                                height: "60px",
                                transition: "height 0.2s ease-in-out"
                              }}
                            >
                              <Td 
                                borderColor={borderColor} 
                                maxW="250px" 
                                isTruncated 
                                title={part.part_name}
                                height="60px"
                              >
                                {part.part_name}
                              </Td>
                              <Td 
                                borderColor={borderColor}
                                height="60px"
                              >
                                {part.part_number}
                              </Td>
                              <Td 
                                borderColor={borderColor} 
                                maxW="200px" 
                                isTruncated
                                title={part.vehicle_type}
                                height="60px"
                              >
                                {part.vehicle_type}
                              </Td>
                              <Td 
                                isNumeric 
                                borderColor={borderColor}
                                height="60px"
                              >
                                {part.expected_demand}
                              </Td>
                              <Td 
                                isNumeric 
                                borderColor={borderColor}
                                height="60px"
                              >
                                {part.recommended_stock}
                              </Td>
                              <Td 
                                isNumeric 
                                borderColor={borderColor}
                                height="60px"
                              >
                                <Badge 
                                  px={2} 
                                  py={1} 
                                  borderRadius="md" 
                                  colorScheme={stockStatus.color}
                                  fontWeight="medium"
                                >
                                  {stockStatus.text}
                                </Badge>
                              </Td>
                            </Tr>
                          );
                        })}
                      </Tbody>
                    </Table>
                  </Box>
                ) : (
                  <Box 
                    p={4} 
                    bg="gray.700" 
                    color="white" 
                    borderRadius="md"
                    textAlign="center"
                  >
                    <Text>No inventory data available</Text>
                  </Box>
                )}
              </CardBody>
            </Card>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
};

// Update the OverviewContent component with more useful content structure
const OverviewContent = () => {
  const headingColor = useColorModeValue('white', 'white');
  const textColor = useColorModeValue('gray.300', 'gray.300');
  const cardBg = useColorModeValue('gray.800', 'gray.800');
  const borderColor = 'gray.700';
  const [brand400, purple500] = useToken('colors', ['brand.400', 'purple.500']);
  
  // State for time filtering
  const [timeWindow, setTimeWindow] = useState<string>('6 months');
  
  // State for part filtering
  const [selectedPartId] = useState<number | null>(null);
  
  // Sample parts data for the dropdown
  const sampleParts = [
    { id: 1, name: "Brake Pads - Toyota Camry 2018" },
    { id: 2, name: "Oil Filter - Honda Accord 2020" },
    { id: 3, name: "Spark Plugs - Ford F-150 2019" },
    { id: 4, name: "Air Filter - Nissan Altima 2021" },
    { id: 5, name: "Battery - Chevrolet Malibu 2017" }
  ];
  
  // State for heatmap data
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [isHeatmapLoading, setIsHeatmapLoading] = useState(true);
  const [heatmapError, setHeatmapError] = useState<string | null>(null);
  
  // State for metrics data
  interface MetricsDataState {
    totalDemand: number;
    totalInventory: number;
    potentialRevenue: number;
    isLoading: boolean;
    error: string | null;
  }
  
  const [metricsData, setMetricsData] = useState<MetricsDataState>({
    totalDemand: 0,
    totalInventory: 0,
    potentialRevenue: 0,
    isLoading: true,
    error: null
  });
  
  // Add state for top parts data
  const [topParts, setTopParts] = useState<Part[]>([]);
  const [isTopPartsLoading, setIsTopPartsLoading] = useState(true);
  
  // Fetch metrics data when time window changes
  useEffect(() => {
    const fetchMetricsData = async () => {
      setMetricsData(prev => ({ ...prev, isLoading: true, error: null }));
      setIsTopPartsLoading(true);
      
      try {
        console.log('Fetching metrics data for time window:', timeWindow);
        const data = await getDemandForecast(timeWindow);
        
        if (data) {
          // Use potential revenue from API if available, otherwise calculate it
          const potentialRevenue = data.potential_revenue !== undefined 
            ? data.potential_revenue 
            : data.total_demand * 50;
          
          setMetricsData({
            totalDemand: data.total_demand,
            totalInventory: data.total_stock,
            potentialRevenue,
            isLoading: false,
            error: null
          });
          
          // Update top parts data
          if (data.parts && Array.isArray(data.parts)) {
            // Sort by expected_demand and take top 5
            const sortedParts = [...data.parts]
              .sort((a, b) => b.expected_demand - a.expected_demand)
              .slice(0, 5);
            
            setTopParts(sortedParts);
          }
          setIsTopPartsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching metrics data:', error);
        setMetricsData(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to load metrics data'
        }));
        setIsTopPartsLoading(false);
      }
    };
    
    fetchMetricsData();
  }, [timeWindow]);
  
  // Fetch heatmap data when time window or selected part changes
  useEffect(() => {
    const fetchHeatmapData = async () => {
      setIsHeatmapLoading(true);
      setHeatmapError(null);
      
      try {
        // Try to fetch from API with both timeWindow and selectedPartId
        console.log("Fetching heatmap data with:", { timeWindow, selectedPartId });
        const response = await getRegionalDemandData(timeWindow, selectedPartId);
        console.log("API response received:", response);
        
        if (response && response.success === true && Array.isArray(response.features)) {
          console.log(`Successfully loaded ${response.features.length} features from API`);
          // Convert our API response to the expected GeoJSON format
          setHeatmapData({
            type: 'FeatureCollection',
            features: response.features
          });
        } else {
          console.error("Invalid API response format:", response);
          throw new Error(response?.error || 'Invalid data format from API');
        }
      } catch (error) {
        console.error('Error fetching heatmap data:', error);
        // More descriptive error message
        const errorMessage = error instanceof Error 
          ? `Failed to load regional demand data: ${error.message}` 
          : 'Failed to load regional demand data';
        
        setHeatmapError(errorMessage);
        
        // Fallback to sample data if API fails
        setHeatmapData({
          type: 'FeatureCollection',
          features: [
            // Northeast
            { type: 'Feature', properties: { intensity: 0.9, city: "New York", state: "NY" }, geometry: { type: 'Point', coordinates: [-74.0060, 40.7128] } }, // NYC
            { type: 'Feature', properties: { intensity: 0.8, city: "Boston", state: "MA" }, geometry: { type: 'Point', coordinates: [-71.0589, 42.3601] } }, // Boston
            { type: 'Feature', properties: { intensity: 0.7, city: "Philadelphia", state: "PA" }, geometry: { type: 'Point', coordinates: [-75.1652, 39.9526] } }, // Philadelphia
            
            // Midwest
            { type: 'Feature', properties: { intensity: 0.8, city: "Chicago", state: "IL" }, geometry: { type: 'Point', coordinates: [-87.6298, 41.8781] } }, // Chicago
            { type: 'Feature', properties: { intensity: 0.6, city: "Detroit", state: "MI" }, geometry: { type: 'Point', coordinates: [-83.0458, 42.3314] } }, // Detroit
            { type: 'Feature', properties: { intensity: 0.5, city: "Minneapolis", state: "MN" }, geometry: { type: 'Point', coordinates: [-93.2650, 44.9778] } }, // Minneapolis
            
            // South
            { type: 'Feature', properties: { intensity: 0.9, city: "Houston", state: "TX" }, geometry: { type: 'Point', coordinates: [-95.3698, 29.7604] } }, // Houston
            { type: 'Feature', properties: { intensity: 0.8, city: "Atlanta", state: "GA" }, geometry: { type: 'Point', coordinates: [-84.3880, 33.7490] } }, // Atlanta
            { type: 'Feature', properties: { intensity: 0.7, city: "Miami", state: "FL" }, geometry: { type: 'Point', coordinates: [-80.1918, 25.7617] } }, // Miami
            { type: 'Feature', properties: { intensity: 0.7, city: "Dallas", state: "TX" }, geometry: { type: 'Point', coordinates: [-96.7970, 32.7767] } }, // Dallas
            
            // West
            { type: 'Feature', properties: { intensity: 0.9, city: "Los Angeles", state: "CA" }, geometry: { type: 'Point', coordinates: [-118.2437, 34.0522] } }, // Los Angeles
            { type: 'Feature', properties: { intensity: 0.8, city: "San Francisco", state: "CA" }, geometry: { type: 'Point', coordinates: [-122.4194, 37.7749] } }, // San Francisco
            { type: 'Feature', properties: { intensity: 0.7, city: "Seattle", state: "WA" }, geometry: { type: 'Point', coordinates: [-122.3321, 47.6062] } }, // Seattle
            { type: 'Feature', properties: { intensity: 0.6, city: "Las Vegas", state: "NV" }, geometry: { type: 'Point', coordinates: [-115.1398, 36.1699] } }, // Las Vegas
          ]
        });
      } finally {
        setIsHeatmapLoading(false);
      }
    };
    
    fetchHeatmapData();
  }, [timeWindow, selectedPartId]);
  
  return (
    <Box 
      minH="100vh" 
      color={textColor}
      bgGradient={`linear(to-b, gray.900, gray.800)`}
      pt={8}
      pb={16}
    >
      <Container maxW="container.xl">
        <Box
          sx={{
            animation: `${fadeIn} 0.5s ease-out`
          }}
        >
          <VStack spacing={8} align="stretch">
            <Flex justify="space-between" align="center">
              <Box>
                <Heading 
                  as="h1" 
                  size="2xl" 
                  mb={3} 
                  color={headingColor}
                  fontWeight="extrabold"
                  letterSpacing="-0.02em"
                  bgGradient={`linear(to-r, ${brand400}, ${purple500})`}
                  bgClip="text"
                >
                  Distributor Overview
                </Heading>
                <Text 
                  fontSize="lg" 
                  color={textColor}
                  maxW="800px"
                >
                  Track demand trends, inventory health, and optimize your distribution strategy.
                </Text>
              </Box>
              
              {/* Filter controls */}
              <HStack spacing={4}>
                {/* Time filter dropdown */}
                <Menu>
                  <MenuButton 
                    as={Button} 
                    rightIcon={<ChevronDownIcon />}
                    bg={cardBg}
                    color={textColor}
                    borderColor={borderColor}
                    borderWidth="1px"
                    _hover={{ bg: 'gray.700' }}
                    _active={{ bg: 'gray.700' }}
                  >
                    {timeWindow}
                  </MenuButton>
                  <MenuList bg={cardBg} borderColor={borderColor}>
                    <MenuItem bg={cardBg} _hover={{ bg: 'gray.700' }} onClick={() => setTimeWindow('7 days')}>Next 7 Days</MenuItem>
                    <MenuItem bg={cardBg} _hover={{ bg: 'gray.700' }} onClick={() => setTimeWindow('30 days')}>Next 30 Days</MenuItem>
                    <MenuItem bg={cardBg} _hover={{ bg: 'gray.700' }} onClick={() => setTimeWindow('90 days')}>Next 90 Days</MenuItem>
                    <MenuItem bg={cardBg} _hover={{ bg: 'gray.700' }} onClick={() => setTimeWindow('6 months')}>Next 6 Months</MenuItem>
                  </MenuList>
                </Menu>
              </HStack>
            </Flex>
            
            {/* Top-level metrics */}
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
              <StatCard 
                title="Total Expected Demand" 
                value={metricsData.isLoading ? '...' : metricsData.totalDemand.toLocaleString()} 
                subtitle={`Forecasted for ${timeWindow}`} 
                isLoading={metricsData.isLoading}
                accentColor={brand400}
              />
              
              <StatCard 
                title="Current Inventory" 
                value={metricsData.isLoading ? '...' : metricsData.totalInventory.toLocaleString()} 
                subtitle="Total parts in stock" 
                isLoading={metricsData.isLoading}
                accentColor={purple500}
              />
              
              <StatCard 
                title="Est. Revenue" 
                value={metricsData.isLoading ? '...' : formatCurrency(metricsData.potentialRevenue)} 
                subtitle={`Forecasted for ${timeWindow}`} 
                isLoading={metricsData.isLoading}
                accentColor="orange.400"
              />
            </SimpleGrid>
            
            {/* Top demand parts and heatmap section */}
            <SimpleGrid 
              columns={{ base: 1, md: 2 }} 
              spacing={6} 
              mt={6}
              flex="1"
              minH={{ md: "400px" }}
            >
              {/* Top parts by expected demand */}
              <Card 
                bg={cardBg} 
                borderRadius="xl" 
                overflow="hidden" 
                borderColor={borderColor} 
                borderWidth="1px"
                position="relative"
                display="flex"
                flexDirection="column"
                height="100%"
                _before={{
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                }}
              >
                <CardHeader pb={2}>
                  <Text fontSize="sm" color="gray.400" fontWeight="medium" textTransform="uppercase" letterSpacing="wider">
                    Top 5 Parts by Forecasted Demand for {timeWindow}
                  </Text>
                </CardHeader>
                <CardBody pt={2} flex="1" display="flex" flexDirection="column">
                  {/* Top parts list from API data */}
                  <Box overflowX="auto" flex="1">
                    <Table variant="simple" size="md">
                      <Thead>
                        <Tr>
                          <Th color="gray.400" borderColor={borderColor}>PART NAME</Th>
                          <Th isNumeric color="gray.400" borderColor={borderColor}>FORECASTED DEMAND</Th>
                          <Th isNumeric color="gray.400" borderColor={borderColor}>CURRENT STOCK</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {isTopPartsLoading ? (
                          // Show loading skeleton when data is loading
                          Array(5).fill(0).map((_, index) => (
                            <Tr key={index}>
                              <Td borderColor={borderColor} height="60px">
                                <Skeleton height="20px" startColor="gray.700" endColor="gray.600" />
                              </Td>
                              <Td borderColor={borderColor} height="60px">
                                <Skeleton height="20px" startColor="gray.700" endColor="gray.600" />
                              </Td>
                              <Td borderColor={borderColor} height="60px">
                                <Skeleton height="20px" startColor="gray.700" endColor="gray.600" />
                              </Td>
                            </Tr>
                          ))
                        ) : topParts.length > 0 ? (
                          // Show actual top parts data
                          topParts.map((part, index) => (
                            <Tr 
                              key={part.part_id || index} 
                              _hover={{ bg: 'gray.700' }}
                              sx={{
                                animation: `${fadeIn} 0.3s ease-out forwards`,
                                animationDelay: `${index * 0.05}s`,
                                opacity: 0,
                                height: "60px",
                                transition: "height 0.2s ease-in-out"
                              }}
                            >
                              <Td 
                                borderColor={borderColor} 
                                maxW="300px" 
                                isTruncated 
                                title={part.part_name}
                                height="60px"
                              >
                                {part.part_name}
                              </Td>
                              <Td isNumeric borderColor={borderColor} height="60px">
                                {part.expected_demand}
                              </Td>
                              <Td isNumeric borderColor={borderColor} height="60px">
                                <Badge 
                                  px={2} 
                                  py={1} 
                                  borderRadius="md" 
                                  colorScheme={part.recommended_stock >= part.expected_demand ? 'green' : 'orange'}
                                  fontWeight="medium"
                                >
                                  {part.recommended_stock}
                                </Badge>
                              </Td>
                            </Tr>
                          ))
                        ) : (
                          // Show a message when no data is available
                          <Tr>
                            <Td colSpan={3} textAlign="center" borderColor={borderColor} height="60px">
                              No parts data available
                            </Td>
                          </Tr>
                        )}
                      </Tbody>
                    </Table>
                  </Box>
                </CardBody>
              </Card>
              
              {/* US Heatmap */}
              <Card 
                bg={cardBg} 
                borderRadius="xl" 
                overflow="hidden" 
                borderColor={borderColor} 
                borderWidth="1px"
                position="relative"
                display="flex"
                flexDirection="column"
                height={{ base: "400px", md: "100%" }}
                minH="350px"
                _before={{
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                }}
              >
                <CardHeader pb={2} flexShrink={0}>
                  <Flex justify="space-between" align="center">
                    <Text fontSize="sm" color="gray.400" fontWeight="medium" textTransform="uppercase" letterSpacing="wider">
                      Demand by Region
                    </Text>
                    {heatmapError && (
                      <Tooltip label={heatmapError} placement="top">
                        <Text fontSize="xs" color="red.400" maxW="250px" isTruncated>
                          {heatmapError.includes(':') ? heatmapError.split(':')[0] : heatmapError} (using sample data)
                        </Text>
                      </Tooltip>
                    )}
                  </Flex>
                </CardHeader>
                <CardBody pt={2} flex="1" display="flex" flexDirection="column">
                  {isHeatmapLoading ? (
                    <Skeleton height="100%" startColor="gray.700" endColor="gray.600" borderRadius="md" flex="1" />
                  ) : (
                    <Box flex="1" position="relative" height="100%">
                      <MapboxHeatmap 
                        data={heatmapData as any} 
                        height="100%" 
                        width="100%"
                      />
                    </Box>
                  )}
                </CardBody>
              </Card>
            </SimpleGrid>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
};

// Update the PartsManagementContent component
const PartsManagementContent = () => {
  const headingColor = useColorModeValue('white', 'white');
  const textColor = useColorModeValue('gray.300', 'gray.300');
  const [brand400, purple500] = useToken('colors', ['brand.400', 'purple.500']);

  return (
    <Box 
      minH="100vh" 
      color={textColor}
      bgGradient={`linear(to-b, gray.900, gray.800)`}
      pt={8}
      pb={16}
    >
      <Container maxW="container.xl">
        <Box>
          <Heading 
            as="h1" 
            size="2xl" 
            mb={3} 
            color={headingColor}
            fontWeight="extrabold"
            letterSpacing="-0.02em"
            bgGradient={`linear(to-r, ${brand400}, ${purple500})`}
            bgClip="text"
          >
            Fulfillment
          </Heading>
          <Text fontSize="lg" color={textColor}>
            Manage your parts catalog, inventory details, and order fulfillment.
          </Text>
        </Box>
      </Container>
    </Box>
  );
};

const Distributor = () => {
  const [activeSection, setActiveSection] = useState(0);

  const navItems = [
    {
      icon: <OverviewIcon boxSize={6} />,
      label: "Overview",
      onClick: () => setActiveSection(0)
    },
    {
      icon: <InventoryIcon boxSize={6} />,
      label: "Inventory",
      onClick: () => setActiveSection(1)
    },
    {
      icon: <PartsIcon boxSize={6} />,
      label: "Fulfillment",
      onClick: () => setActiveSection(2)
    }
  ];

  // Render different content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 0:
        return <OverviewContent />;
      case 1:
        return <InventoryContent />;
      case 2:
        return <PartsManagementContent />;
      default:
        return <OverviewContent />;
    }
  };

  return (
    <CollapsibleSidebar navItems={navItems} activeIndex={activeSection}>
      {renderContent()}
    </CollapsibleSidebar>
  );
};

export default Distributor; 