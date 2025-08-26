import React, { useState } from 'react';
import { Box, Heading, Text, Container, SimpleGrid, FormControl, FormLabel, Input, Button, Tabs, TabList, TabPanels, Tab, TabPanel, VStack, HStack, Divider, Badge, Card, CardHeader, CardBody, useToast, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, List, ListItem } from '@chakra-ui/react';
import { predictVehicleFailures, searchParts } from '../api/api';

const Shop = () => {
  const toast = useToast();
  const [vehicleData, setVehicleData] = useState({
    make: '',
    model: '',
    year: '',
    mileage: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [predictions, setPredictions] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setVehicleData({
      ...vehicleData,
      [name]: value,
    });
  };

  const handlePredict = async () => {
    if (!vehicleData.make && !vehicleData.model && !vehicleData.year && !vehicleData.mileage) {
      toast({
        title: 'Input required',
        description: 'Please enter at least one vehicle detail',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      const results = await predictVehicleFailures(vehicleData);
      setPredictions(results);
    } catch (error) {
      console.error('Error predicting failures:', error);
      toast({
        title: 'Error',
        description: 'Failed to predict component failures',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: 'Input required',
        description: 'Please enter a search query',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSearchLoading(true);
    try {
      const results = await searchParts(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching parts:', error);
      toast({
        title: 'Error',
        description: 'Failed to search for parts',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 0.7) return 'red';
    if (probability >= 0.4) return 'orange';
    return 'green';
  };

  return (
    <Container maxW="container.xl">
      <Box mb={8}>
        <Heading as="h1" size="xl" mb={2}>
          Shop Interface
        </Heading>
        <Text color="gray.600">
          Predict component failures and find the right parts for specific vehicles
        </Text>
      </Box>

      <Tabs variant="enclosed" colorScheme="brand">
        <TabList>
          <Tab>Predict Failures</Tab>
          <Tab>Search Parts</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            <Card mb={6}>
              <CardHeader>
                <Heading size="md">Vehicle Details</Heading>
              </CardHeader>
              <CardBody>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  <FormControl>
                    <FormLabel>Make</FormLabel>
                    <Input
                      name="make"
                      value={vehicleData.make}
                      onChange={handleInputChange}
                      placeholder="e.g. Toyota"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Model</FormLabel>
                    <Input
                      name="model"
                      value={vehicleData.model}
                      onChange={handleInputChange}
                      placeholder="e.g. Camry"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Year</FormLabel>
                    <Input
                      name="year"
                      value={vehicleData.year}
                      onChange={handleInputChange}
                      placeholder="e.g. 2018"
                      type="number"
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Mileage</FormLabel>
                    <Input
                      name="mileage"
                      value={vehicleData.mileage}
                      onChange={handleInputChange}
                      placeholder="e.g. 50000"
                      type="number"
                    />
                  </FormControl>
                </SimpleGrid>
                <Button
                  mt={6}
                  colorScheme="brand"
                  onClick={handlePredict}
                  isLoading={loading}
                  loadingText="Predicting..."
                >
                  🚗 Predict Component Failures
                </Button>
              </CardBody>
            </Card>

            {predictions.length > 0 && (
              <Box>
                <Heading size="md" mb={4}>
                  Prediction Results
                </Heading>
                <Accordion allowMultiple>
                  {predictions.map((prediction, index) => (
                    <AccordionItem key={index}>
                      <h2>
                        <AccordionButton>
                          <Box flex="1" textAlign="left">
                            <HStack>
                              <Text fontWeight="bold">{prediction.component}</Text>
                              <Badge colorScheme={getProbabilityColor(prediction.probability)}>
                                {(prediction.probability * 100).toFixed(1)}% Risk
                              </Badge>
                            </HStack>
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4}>
                        <Text mb={3}>
                          This component has a {(prediction.probability * 100).toFixed(1)}% probability of failure based on
                          the vehicle details provided.
                        </Text>
                        {prediction.parts && prediction.parts.length > 0 ? (
                          <>
                            <Heading size="sm" mb={2}>
                              Recommended Parts:
                            </Heading>
                            <List spacing={2}>
                              {prediction.parts.map((part: any) => (
                                <ListItem key={part.part_id}>
                                  ✓ {part.part_name} ({part.part_number})
                                </ListItem>
                              ))}
                            </List>
                          </>
                        ) : (
                          <Text fontStyle="italic">No specific parts found for this component.</Text>
                        )}
                      </AccordionPanel>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Box>
            )}
          </TabPanel>

          <TabPanel>
            <Card mb={6}>
              <CardHeader>
                <Heading size="md">Search for Parts</Heading>
              </CardHeader>
              <CardBody>
                <HStack>
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Describe the part you're looking for..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button
                    colorScheme="brand"
                    onClick={handleSearch}
                    isLoading={searchLoading}
                    loadingText="Searching..."
                  >
                    🔍 Search
                  </Button>
                </HStack>
              </CardBody>
            </Card>

            {searchResults.length > 0 && (
              <Box>
                <Heading size="md" mb={4}>
                  Search Results
                </Heading>
                <VStack spacing={4} align="stretch">
                  {searchResults.map((result, index) => (
                    <Card key={index}>
                      <CardBody>
                        <Heading size="sm" mb={2}>
                          {result.part_name}
                        </Heading>
                        <Text mb={2}>Part Number: {result.part_number}</Text>
                        {result.description && <Text mb={2}>{result.description}</Text>}
                        <HStack>
                          <Badge>Similarity: {(result.similarity * 100).toFixed(1)}%</Badge>
                          {result.in_stock && <Badge colorScheme="green">In Stock</Badge>}
                        </HStack>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              </Box>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  );
};

export default Shop; 