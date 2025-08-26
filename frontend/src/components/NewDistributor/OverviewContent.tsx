import React from 'react';
import {
  Box,
  Heading,
  Text,
  Container,
  VStack,
  useColorModeValue,
  useToken,
} from '@chakra-ui/react';
import MapView from './MapView';

const OverviewContent = () => {
  // Color scheme to match homepage
  const bgColor = useColorModeValue('gray.900', 'gray.900');
  const textColor = useColorModeValue('gray.300', 'gray.300');
  const headingColor = useColorModeValue('white', 'white');
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
            New Distributor Dashboard
          </Heading>
          <Text fontSize="lg" color={textColor} mb={8}>
            Welcome to the revamped distributor dashboard experience with interactive market visualization.
          </Text>
          
          <VStack spacing={8} align="stretch">
            {/* Map View with Heatmap */}
            <MapView />
            
            {/* Additional dashboard content */}
            <Box p={6} bg="gray.800" borderRadius="xl" borderWidth="1px" borderColor="gray.700">
              <Heading as="h3" size="md" mb={4} color="white">
                Market Insights
              </Heading>
              <Text mb={4}>
                The interactive map above displays vehicle registration density and estimated demand by county. 
                Select a state or county to filter the data, or click directly on the map to explore.
              </Text>
              <Text>
                Switch between visualization metrics using the controls on the map to view different aspects of the market.
              </Text>
            </Box>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
};

export default OverviewContent; 