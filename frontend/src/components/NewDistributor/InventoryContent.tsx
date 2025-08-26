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

const InventoryContent = () => {
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
            Inventory
          </Heading>
          <Text fontSize="lg" color={textColor} mb={8}>
            Manage and monitor your inventory with improved analytics.
          </Text>
          
          <VStack spacing={8} align="stretch">
            <Box p={6} bg="gray.800" borderRadius="xl" borderWidth="1px" borderColor="gray.700">
              <Heading as="h3" size="md" mb={4} color="white">
                Inventory Content
              </Heading>
              <Text>
                This is a placeholder for the new inventory management content.
              </Text>
            </Box>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
};

export default InventoryContent; 