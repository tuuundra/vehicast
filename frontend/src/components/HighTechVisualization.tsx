import React from "react";
import { Box } from "@chakra-ui/react";
import { MinimalistNeuralNetwork } from "./MinimalistNeuralNetwork";

interface HighTechVisualizationProps {
  className?: string;
  width?: number;
  height?: number;
  primaryColor?: string;
  secondaryColor?: string;
  rotate?: boolean;
  scale?: number;
}

export function HighTechVisualization({
  className = "",
  width = 500,
  height = 400,
  primaryColor = "#38B2AC", // Teal color
  secondaryColor = "#805AD5", // Purple color
  rotate = true,
  scale = 1.2,
}: HighTechVisualizationProps) {
  // Calculate dimensions based on rotation
  const containerWidth = rotate ? height * scale : width * scale;
  const containerHeight = rotate ? width * scale : height * scale;
  
  // Calculate inner component dimensions
  const innerWidth = width * scale;
  const innerHeight = height * scale;
  
  return (
    <Box 
      className={`relative ${className}`}
      width={containerWidth}
      height={containerHeight}
      position="relative"
      overflow="hidden"
    >
      {/* Rotated container */}
      <Box
        position="absolute"
        width={innerWidth}
        height={innerHeight}
        top="50%"
        left="50%"
        transform={rotate ? 
          `translate(-50%, -50%) rotate(90deg)` : 
          `translate(-50%, -50%)`
        }
        transformOrigin="center center"
      >
        {/* Neural network visualization - only keeping snowfall particles */}
        <Box
          position="absolute"
          top="0"
          left="0"
          width="100%"
          height="100%"
          zIndex={3}
        >
          <MinimalistNeuralNetwork 
            width={innerWidth}
            height={innerHeight}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            nodeColor="#FFFFFF"
            showOnlySnowfall={true}
          />
        </Box>
      </Box>
    </Box>
  );
} 