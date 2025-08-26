import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  GridItem, 
  Card, 
  CardHeader, 
  CardBody, 
  Heading, 
  Text,
  Flex,
  Spinner,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Tooltip
} from '@chakra-ui/react';
import CollapsibleSidebar from '../components/CollapsibleSidebar';
import { 
  OverviewIcon, 
  InventoryIcon, 
  PartsIcon
} from '../components/DashboardIcons';

// Import extracted components
import FilterControls from '../components/NewDistributor/FilterControls';
import MapboxBasic from '../components/NewDistributor/MapboxBasic';
import MapboxHeatmap from '../components/NewDistributor/MapboxHeatmap';
import * as distributorDataService from '../services/distributorDataService';
import { DistributorDashboardData, DashboardMetrics, MarketInsight, VehicleLocationData, PartStockRecommendation } from '../services/distributorDataService';
import { TimeFrame, COUNTIES, STATES } from '../components/NewDistributor/types';
import StockingRecommendations from '../components/NewDistributor/StockingRecommendations';
import MarketInsights from '../components/NewDistributor/MarketInsights';
import ReportButton from '../components/Reports/ReportButton';

// Improved MetricCard with trend indicator
const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  color = "blue.400",
  previousValue,
  formatValue = (val: number) => val.toLocaleString(),
  isLoading = false
}: { 
  title: string;
  value: number;
  subtitle?: string;
  color?: string;
  previousValue?: number;
  formatValue?: (val: number) => string;
  isLoading?: boolean;
}) => {
  // Calculate percent change if both values are available
  const percentChange = previousValue !== undefined ? 
    ((value - previousValue) / previousValue) * 100 : undefined;
  
  const displayValue = formatValue(value);
  const isPositiveChange = percentChange !== undefined ? percentChange > 0 : undefined;
  
  return (
    <Card bg="gray.800" borderRadius="md" overflow="hidden" boxShadow="md" height="100%">
      <CardHeader pb={0} position="relative" _after={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '4px',
        height: '100%',
        bg: color
      }}>
        <Text fontSize="xs" color="gray.400" fontWeight="medium">{title}</Text>
      </CardHeader>
      <CardBody pt={1}>
        {isLoading ? (
          <Flex align="center" height="60px">
            <Spinner size="sm" color={color} mr={2} />
            <Text color="gray.500">Loading...</Text>
          </Flex>
        ) : (
          <>
            <Text fontSize="2xl" fontWeight="bold" color="white">{displayValue}</Text>
            {subtitle && (
              <Text fontSize="xs" color="gray.400" mt={1}>
                {subtitle}
                {percentChange !== undefined && (
                  <Text as="span" color={isPositiveChange ? "green.400" : "red.400"} ml={1}>
                    {isPositiveChange ? '↑' : '↓'} {Math.abs(percentChange).toFixed(1)}%
                  </Text>
                )}
              </Text>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
};

// Dashboard layout for the Overview section
const DashboardLayout = () => {
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>('6months');
  const [selectedState, setSelectedState] = useState<number | null>(null);
  const [selectedCounties, setSelectedCounties] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [stockRecommendations, setStockRecommendations] = useState<PartStockRecommendation[]>([]);
  const [marketInsights, setMarketInsights] = useState<MarketInsight[]>([]);
  const [vehicleData, setVehicleData] = useState<VehicleLocationData[]>([]);
  const toast = useToast();

  // Load dashboard data when filters change
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await distributorDataService.getDistributorDashboardData(
          selectedTimeFrame,
          selectedState,
          selectedCounties.length === 1 ? selectedCounties[0] : null
        );
        
        setMetrics(data.metrics);
        setStockRecommendations(data.stockingRecommendations);
        setMarketInsights(data.marketInsights);
        setVehicleData(data.vehicleData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: 'Error loading data',
          description: 'There was an error loading the dashboard data. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [selectedTimeFrame, selectedState, selectedCounties, toast]);

  // Format currency
  const formatCurrency = (value: number): string => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    } else {
      return `$${value.toFixed(2)}`;
    }
  };

  // Format percentage
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <Container maxW="container.xl" py={6}>
      <Grid
        templateColumns="repeat(12, 1fr)"
        gap={6}
      >
        {/* Top row with filter + map */}
        <GridItem colSpan={12}>
          <FilterControls
            selectedTimeFrame={selectedTimeFrame}
            setSelectedTimeFrame={setSelectedTimeFrame}
            selectedState={selectedState}
            setSelectedState={setSelectedState}
            selectedCounties={selectedCounties}
            setSelectedCounties={setSelectedCounties}
          />
          <Card bg="gray.800" borderRadius="md" boxShadow="lg" overflow="hidden">
            <CardBody p={4}>
              <MapboxHeatmap 
                height="380px"
                width="100%"
                center={[-98.5795, 39.8283]} // Center of the US
                zoom={3.5}
                selectedState={selectedState}
                selectedCounty={selectedCounties.length === 1 ? selectedCounties[0] : null}
                onCountySelect={(countyId, stateId) => {
                  // Use a more stable approach for updating filter states to prevent multiple re-renders
                  // and possible race conditions

                  // Find county and state info for logging
                  const countyName = COUNTIES.find(c => c.id === countyId)?.name || '';
                  const stateName = STATES.find(s => s.id === stateId)?.name || '';
                  console.log(`Selected: ${countyName}, ${stateName}`);
                  
                  // Batch state updates to avoid cascading renders
                  if (selectedState !== stateId) {
                    setSelectedState(stateId);
                    
                    // Clear any existing county selection first to avoid invalid state
                    if (selectedCounties.length > 0) {
                      setSelectedCounties([]);
                    }
                    
                    // Then set the new county after a short delay to ensure state filter has updated
                    setTimeout(() => {
                      setSelectedCounties([countyId]);
                    }, 50);
                  } else {
                    // If the state is already selected, just update the county
                    setSelectedCounties([countyId]);
                  }
                }}
              />
            </CardBody>
          </Card>
        </GridItem>

        {/* Metric cards row */}
        <GridItem colSpan={{ base: 12, md: 3 }}>
          <MetricCard 
            title="Predicted Demand" 
            value={metrics?.predictedDemandUnits || 0}
            subtitle="Units needed"
            previousValue={metrics?.predictedDemandUnitsPrevious}
            color="blue.400"
            isLoading={isLoading}
          />
        </GridItem>
        <GridItem colSpan={{ base: 12, md: 3 }}>
          <MetricCard 
            title="Est. Revenue" 
            value={metrics?.revenueOpportunity || 0}
            subtitle="From predicted demand"
            previousValue={metrics?.revenueOpportunityPrevious}
            color="green.400"
            formatValue={formatCurrency}
            isLoading={isLoading}
          />
        </GridItem>
        <GridItem colSpan={{ base: 12, md: 3 }}>
          <MetricCard 
            title="Parts Coverage Ratio" 
            value={metrics?.partsCoverageRatio || 0}
            subtitle="Of predicted demand"
            previousValue={metrics?.partsCoverageRatioPrevious}
            color="purple.400"
            formatValue={formatPercentage}
            isLoading={isLoading}
          />
        </GridItem>
        <GridItem colSpan={{ base: 12, md: 3 }}>
          <MetricCard 
            title="Critical Stocking Needs" 
            value={metrics?.criticalStockingNeeds || 0}
            subtitle={`${metrics?.criticalItems || 0} critical items`}
            color="orange.400"
            isLoading={isLoading}
          />
        </GridItem>

        {/* Bottom row */}
        <GridItem colSpan={{ base: 12, md: 7 }}>
          <Card bg="gray.800" borderRadius="md" boxShadow="md" height="100%">
            <CardHeader pb={2}>
              <Flex justify="center">
                <Heading size="md" color="white">Inventory</Heading>
              </Flex>
            </CardHeader>
            <CardBody pt={4}>
              {isLoading ? (
                <Flex justify="center" align="center" height="200px">
                  <Spinner size="lg" color="blue.400" />
                </Flex>
              ) : stockRecommendations.length > 0 ? (
                <StockingRecommendations 
                  recommendations={stockRecommendations}
                  isLoading={isLoading}
                />
              ) : (
                <Text color="gray.400">No inventory data available for the selected filters</Text>
              )}
            </CardBody>
          </Card>
        </GridItem>
        <GridItem colSpan={{ base: 12, md: 5 }}>
          <Card bg="gray.800" borderRadius="md" boxShadow="md" height="100%">
            <CardHeader pb={2}>
              <Flex justify="center">
                <Heading size="md" color="white">
                  Vehicles by Location
                  {vehicleData.length > 0 && (
                    <Text as="span" fontSize="sm" color="gray.400" ml={2}>
                      ({vehicleData.length.toLocaleString()})
                    </Text>
                  )}
                </Heading>
              </Flex>
            </CardHeader>
            <CardBody pt={0} maxHeight="400px" overflowY="auto">
              {isLoading ? (
                <Flex justify="center" align="center" height="200px">
                  <Spinner size="lg" color="blue.400" />
                </Flex>
              ) : vehicleData.length > 0 ? (
                <MarketInsights 
                  insights={marketInsights}
                  isLoading={isLoading}
                  vehicleData={vehicleData}
                />
              ) : (
                <Text color="gray.400">No vehicle location data available for the selected filters</Text>
              )}
            </CardBody>
          </Card>
        </GridItem>

        {/* Add the single report button centered below both tables */}
        <GridItem colSpan={12} mt={4} mb={6}>
          <Flex 
            justify="center" 
            borderTop="1px" 
            borderColor="gray.700" 
            pt={6}
          >
            <ReportButton 
              stateId={selectedState}
              countyId={selectedCounties.length === 1 ? selectedCounties[0] : null}
              currentTimeFrame={selectedTimeFrame}
              label="Generate Comprehensive Distribution Report"
            />
          </Flex>
        </GridItem>
      </Grid>
    </Container>
  );
};

// Main component
const NewDistributor: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  
  const navItems = [
    {
      icon: <OverviewIcon />,
      label: 'Overview',
      onClick: () => setActiveTab(0)
    },
    {
      icon: <InventoryIcon />,
      label: 'Inventory',
      onClick: () => setActiveTab(1)
    },
    {
      icon: <PartsIcon />,
      label: 'Parts',
      onClick: () => setActiveTab(2)
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 0:
        return <DashboardLayout />;
      case 1:
        return <Box p={8}><Heading>Inventory View</Heading><Text mt={4}>Inventory management view coming soon...</Text></Box>;
      case 2:
        return <Box p={8}><Heading>Parts View</Heading><Text mt={4}>Parts management view coming soon...</Text></Box>;
      default:
        return <DashboardLayout />;
    }
  };

  return (
    <CollapsibleSidebar navItems={navItems} activeIndex={activeTab}>
      {renderContent()}
    </CollapsibleSidebar>
  );
};

export default NewDistributor; 