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

const FulfillmentContent = () => {
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
            Fulfillment
          </Heading>
          <Text fontSize="lg" color={textColor} mb={8}>
            Manage your parts catalog, inventory details, and order fulfillment.
          </Text>
          
          <VStack spacing={8} align="stretch">
            <Box p={6} bg="gray.800" borderRadius="xl" borderWidth="1px" borderColor="gray.700">
              <Heading as="h3" size="md" mb={4} color="white">
                Fulfillment Content
              </Heading>
              <Text>
                This is a placeholder for the new fulfillment content.
              </Text>
            </Box>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
};

export default FulfillmentContent; 