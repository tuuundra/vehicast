import React from 'react';
import { 
  Box, 
  Container, 
  Text,
  VStack
} from '@chakra-ui/react';

const About = () => {
  return (
    <Box bg="gray.900" minH="calc(100vh - 86px)" py={16}>
      <Container maxW="container.md">
        <VStack spacing={16} align="start">
          <Box>
            <Text color="whiteAlpha.700" fontSize="sm" fontWeight="500" letterSpacing="0.5px" mb={1}>
              TECHNICAL OVERVIEW
            </Text>
            <Text color="white" fontSize="md" mt={4}>
              This proof of concept is a system that:
            </Text>
            <Text color="white" fontSize="md" mt={2} ml={4}>
              • Predicts component failures for specific vehicles at specific mileages
            </Text>
            <Text color="white" fontSize="md" ml={4}>
              • Analyzes local vehicle registrations to understand what vehicles exist in a given area
            </Text>
            <Text color="white" fontSize="md" ml={4}>
              • Forecasts demand based on vehicle types and historical failure rates
            </Text>
            <Text color="white" fontSize="md" ml={4}>
              • Optimizes inventory levels for distributors to meet local demand efficiently
            </Text>
            <Text color="white" fontSize="md" ml={4}>
              • Provides quick part identification for mechanics doing specific repairs
            </Text>
            
            <Text color="white" fontSize="md" mt={6}>
              Distributors who have parts in stock win sales, even at higher prices
            </Text>
            <Text color="white" fontSize="md">
              Mechanics prioritize fast turnaround and will pay more to get parts same-day
            </Text>
            <Text color="white" fontSize="md">
              Reduced downtime for drivers leads to happier customers
            </Text>
            
            <Text color="white" fontSize="md" mt={6}>
              Local auto shops can compete with major chains through better inventory management
            </Text>
          </Box>
          
          <Box mt={8}>
            <Text color="whiteAlpha.700" fontSize="sm" fontWeight="500" letterSpacing="0.5px" mb={1}>
              SYNTHETIC DATA
            </Text>
            <Text color="white" fontSize="md" mt={4}>
              For this proof of concept, I generated synthetic datasets to power the predictive modeling.
            </Text>
            <Text color="white" fontSize="md" mt={2}>
              I simulated vehicle registration data across different geographic regions, created component failure histories based on vehicle make/model/year combinations, and established parts fitment relationships to connect vehicles with the correct components.
            </Text>
            <Text color="white" fontSize="md" mt={2}>
              This synthetic data foundation demonstrates how real-world vehicle and parts data would flow through the system to generate actionable inventory recommendations for distributors.
            </Text>
          </Box>
          
          <Box mt={8}>
            <Text color="whiteAlpha.700" fontSize="sm" fontWeight="500" letterSpacing="0.5px" mb={1}>
              PREDICTIVE MODELING
            </Text>
            <Text color="white" fontSize="md" mt={4}>
              The predictive modeling system consists of two main components: a training pipeline and a prediction service.
            </Text>
            
            <Text color="white" fontSize="md" mt={4} fontWeight="500">
              Training Pipeline:
            </Text>
            <Text color="white" fontSize="md">
              This component trains logistic regression models for automotive component failure prediction. It:
            </Text>
            <Text color="white" fontSize="md" ml={4}>
              • Uses scikit-learn's LogisticRegression with balanced class weights to account for the rarity of failure events
            </Text>
            <Text color="white" fontSize="md" ml={4}>
              • Creates separate models for each component type (brakes, alternators, etc.)
            </Text>
            <Text color="white" fontSize="md" ml={4}>
              • Processes vehicle data using OneHotEncoder for categorical features (make, model) and standardizes numerical features (year, mileage)
            </Text>
            <Text color="white" fontSize="md" ml={4}>
              • Implements a train-test split (80/20) to validate model performance
            </Text>
            <Text color="white" fontSize="md" ml={4}>
              • Calculates standard metrics (accuracy, precision, recall, F1) to assess prediction quality
            </Text>
            <Text color="white" fontSize="md" ml={4}>
              • Saves trained models using pickle serialization
            </Text>
            
            <Text color="white" fontSize="md" mt={4} fontWeight="500">
              Prediction Service:
            </Text>
            <Text color="white" fontSize="md">
              This component applies the trained models to predict failures for specific vehicles. It:
            </Text>
            <Text color="white" fontSize="md" ml={4}>
              • Loads the component-specific models from storage
            </Text>
            <Text color="white" fontSize="md" ml={4}>
              • Takes vehicle information (make, model, year, mileage) as input
            </Text>
            <Text color="white" fontSize="md" ml={4}>
              • Calculates failure probabilities for each component
            </Text>
            <Text color="white" fontSize="md" ml={4}>
              • Uses a configurable threshold (default 0.1) to identify likely failures
            </Text>
            <Text color="white" fontSize="md" ml={4}>
              • Maps components to specific replacement parts through database queries
            </Text>
            
            <Text color="white" fontSize="md" mt={4}>
              The system connects predictive analytics to inventory management by identifying which parts are likely to be needed based on the local vehicle population, helping distributors stock the right parts at the right time.
            </Text>
          </Box>
          
          <Box mt={8}>
            <Text color="whiteAlpha.700" fontSize="sm" fontWeight="500" letterSpacing="0.5px" mb={1}>
              DATABASE ARCHITECTURE
            </Text>
            <Text color="white" fontSize="md" mt={4}>
              The system is built on a Supabase PostgreSQL database with a carefully designed schema optimized for automotive parts management and predictive analytics. Key features include:
            </Text>
            
            <Text color="white" fontSize="md" mt={4} fontWeight="500">
              Vector Embeddings:
            </Text>
            <Text color="white" fontSize="md">
              I implemented vector embeddings across multiple tables to enable semantic search and similarity matching. These embeddings power:
            </Text>
            <Text color="white" fontSize="md" ml={4}>
              • Part similarity detection to find suitable alternatives when exact matches aren't available
            </Text>
            <Text color="white" fontSize="md" ml={4}>
              • Vehicle similarity for extending predictions to similar makes/models
            </Text>
            <Text color="white" fontSize="md" ml={4}>
              • Component failure pattern recognition across vehicle types
            </Text>
            
            <Text color="white" fontSize="md" mt={4} fontWeight="500">
              Relational Structure:
            </Text>
            <Text color="white" fontSize="md">
              The database maintains critical relationships between:
            </Text>
            <Text color="white" fontSize="md" ml={4}>
              • Vehicles and their compatible parts
            </Text>
            <Text color="white" fontSize="md" ml={4}>
              • Components and their associated failure rates
            </Text>
            <Text color="white" fontSize="md" ml={4}>
              • Parts and their pricing information
            </Text>
            <Text color="white" fontSize="md" ml={4}>
              • Vehicle types and their registration statistics
            </Text>
            
            <Box mt={12} mb={12} display="flex" justifyContent="center">
              <Box maxW="90%" borderRadius="md" overflow="hidden" boxShadow="lg">
                <img 
                  src="/assets/images/supabase-screenshot.png" 
                  alt="Supabase Database Schema" 
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              </Box>
            </Box>
            
            <Text color="white" fontSize="md" mt={4}>
              The schema includes specialized tables for parts, part prices, vehicles, components, failures, and various embedding tables that store vector representations for semantic operations.
            </Text>
            
            <Text color="white" fontSize="md" mt={4}>
              This database architecture enables efficient querying of complex relationships while supporting the vector operations needed for advanced predictive analytics.
            </Text>
          </Box>
          
          <Box mt={8}>
            <Text color="whiteAlpha.700" fontSize="sm" fontWeight="500" letterSpacing="0.5px" mb={1}>
              FRONTEND IMPLEMENTATION
            </Text>
            <Text color="white" fontSize="md" mt={4}>
              The frontend of this proof of concept consists of two specialized dashboards tailored to different user roles:
            </Text>
            
            <Box height="4" />
            
            <Text color="white" fontSize="md" mt={4} fontWeight="500">
              Distributor Dashboard:
            </Text>
            <Text color="white" fontSize="md">
              The distributor interface provides inventory optimization tools and demand forecasting:
            </Text>
            <Text color="white" fontSize="md" ml={4}>
              • Interactive heatmap visualization showing geographic demand concentration
            </Text>
            <Text color="white" fontSize="md" ml={4}>
              • Time-window adjustable forecasts for inventory planning (7 days to 6 months)
            </Text>
            <Text color="white" fontSize="md" ml={4}>
              • Top components by forecasted demand with dynamic scaling
            </Text>
            <Text color="white" fontSize="md" ml={4}>
              • Inventory valuation metrics with shortage/excess indicators
            </Text>
            <Text color="white" fontSize="md" ml={4}>
              • Automated reorder recommendations based on predicted demand
            </Text>
            
            <Box height="4" />
            
            <Text color="white" fontSize="md" mt={4} fontWeight="500">
              Mechanic Dashboard:
            </Text>
            <Text color="white" fontSize="md">
              The mechanic interface focuses on efficient part identification and ordering:
            </Text>
            <Text color="white" fontSize="md" ml={4}>
              • Semantic search functionality for finding parts by description, not just part numbers
            </Text>
            <Text color="white" fontSize="md" ml={4}>
              • Vehicle-specific part compatibility filtering
            </Text>
            <Text color="white" fontSize="md" ml={4}>
              • Interactive 3D component visualization for complex assemblies
            </Text>
            <Text color="white" fontSize="md" ml={4}>
              • Intelligent part alternatives suggestion when exact matches are unavailable
            </Text>
            <Text color="white" fontSize="md" ml={4}>
              • Streamlined cart and checkout process with real-time availability
            </Text>
            
            <Box height="4" />
            
            <Text color="white" fontSize="md" mt={4}>
              Both interfaces leverage the vector embeddings in the database to provide intelligent recommendations. The distributor dashboard uses predictive analytics to optimize inventory levels, while the mechanic dashboard employs semantic search to quickly identify needed parts, reducing vehicle downtime and improving customer satisfaction.
            </Text>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default About; 