import React, { useRef, useEffect, useState } from "react";
import { motion, useMotionValue } from "framer-motion";

interface MinimalistNeuralNetworkProps {
  className?: string;
  width?: number;
  height?: number;
  primaryColor?: string;
  secondaryColor?: string;
  nodeColor?: string;
  interactive?: boolean;
  rotate?: boolean;
  showOnlySnowfall?: boolean;
}

export function MinimalistNeuralNetwork({
  className = "",
  width = 500,
  height = 400,
  primaryColor = "#38B2AC", // Teal color
  secondaryColor = "#805AD5", // Purple color
  nodeColor = "#FFFFFF",
  interactive = true,
  rotate = false, // Default to no rotation
  showOnlySnowfall = false,
}: MinimalistNeuralNetworkProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [time, setTime] = useState(0);
  const requestRef = useRef<number | undefined>(undefined);
  
  // Generate random offsets for falling snow particles
  const [snowParticles] = useState(() => {
    const particles = [];
    for (let i = 0; i < 40; i++) { // More particles for a denser snow effect
      particles.push({
        // For vertical falling (top to bottom):
        x: Math.random() * width, // Random x position across width
        y: -50 - Math.random() * height, // Start above the viewport
        size: 0.5 + Math.random() * 1.5, // Random size
        speed: 0.2 + Math.random() * 0.4, // Speed variation (slower is better)
        drift: Math.random() * 0.6 - 0.3, // Horizontal drift
        color: Math.random() > 0.5 ? primaryColor : secondaryColor,
      });
    }
    return particles;
  });
  
  // Define the neural network structure (only used when showOnlySnowfall is false)
  const layers = [3, 4, 3]; // Number of nodes in each layer
  const nodes: { x: number; y: number; layer: number; index: number }[] = [];
  const connections: { from: number; to: number }[] = [];
  
  // Generate nodes positions
  if (!showOnlySnowfall) {
    layers.forEach((nodeCount, layerIndex) => {
      const layerX = ((layerIndex + 1) / (layers.length + 1)) * width;
      
      for (let i = 0; i < nodeCount; i++) {
        const nodeY = ((i + 1) / (nodeCount + 1)) * height;
        nodes.push({
          x: layerX,
          y: nodeY,
          layer: layerIndex,
          index: i
        });
      }
    });
    
    // Generate connections between layers
    for (let l = 0; l < layers.length - 1; l++) {
      const layerNodes = nodes.filter(node => node.layer === l);
      const nextLayerNodes = nodes.filter(node => node.layer === l + 1);
      
      layerNodes.forEach((fromNode, fromIndex) => {
        nextLayerNodes.forEach((toNode, toIndex) => {
          connections.push({
            from: layerNodes.indexOf(fromNode) + nodes.filter(n => n.layer < l).length,
            to: nextLayerNodes.indexOf(toNode) + nodes.filter(n => n.layer < l + 1).length
          });
        });
      });
    }
  }

  // Animation loop using standard requestAnimationFrame
  const animate = (timestamp: number) => {
    setTime(prevTime => prevTime + 0.01); // Consistent increment independent of framerate
    requestRef.current = requestAnimationFrame(animate);
  };

  // Set up and clean up animation loop
  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []); // Empty dependency array ensures this only runs once

  // Calculate node positions with ambient floating animation (only used when showOnlySnowfall is false)
  const getNodePosition = (node: typeof nodes[0]) => {
    // Simple position calculation for nodes
    const offsetX = Math.sin(time * 0.5 + node.index) * 5;
    const offsetY = Math.cos(time * 0.5 + node.layer) * 5;
    
    return {
      x: node.x + offsetX,
      y: node.y + offsetY
    };
  };

  // Update snow particle position - truly independent falling animation
  const updateSnowParticle = (particle: typeof snowParticles[0]) => {
    // Calculate new y position based on time to create downward movement
    // Increase y value (moving down) based on time and speed
    const newY = (particle.y + time * 50 * particle.speed) % (height + 100) - 50;
    
    // Add some horizontal drift using sine for gentle swaying
    const driftOffset = Math.sin(time * 0.3 + particle.y * 0.01) * 10 * particle.drift;
    const newX = particle.x + driftOffset;
    
    // Calculate opacity based on position
    let opacity = 1;
    
    // Fade in at the top of the viewport
    if (newY < 0) {
      opacity = (newY + 50) / 50;
    }
    // Fade out at the bottom of the viewport
    else if (newY > height - 50) {
      opacity = (height - newY) / 50;
    }
    
    return {
      x: newX,
      y: newY,
      opacity: Math.max(0, Math.min(1, opacity))
    };
  };

  return (
    <div 
      ref={containerRef} 
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Gradient definitions for glow effects */}
        <defs>
          <radialGradient id="tealGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="1" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="purpleGlow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor={secondaryColor} stopOpacity="1" />
            <stop offset="100%" stopColor={secondaryColor} stopOpacity="0" />
          </radialGradient>
        </defs>
        
        {/* Connections between nodes - STRAIGHTENED */}
        {!showOnlySnowfall && connections.map((connection, index) => {
          const fromNode = nodes[connection.from];
          const toNode = nodes[connection.to];
          const fromPos = getNodePosition(fromNode);
          const toPos = getNodePosition(toNode);
          
          // Calculate gradient based on layers
          const gradientProgress = fromNode.layer / (layers.length - 1);
          const strokeColor = `rgba(${parseInt(primaryColor.slice(1, 3), 16)}, ${parseInt(primaryColor.slice(3, 5), 16)}, ${parseInt(primaryColor.slice(5, 7), 16)}, 0.3)`;
          
          return (
            <React.Fragment key={`connection-${index}`}>
              {/* Straight connection line */}
              <line
                x1={fromPos.x}
                y1={fromPos.y}
                x2={toPos.x}
                y2={toPos.y}
                stroke={strokeColor}
                strokeWidth={0.5}
              />
            </React.Fragment>
          );
        })}
        
        {/* Falling snow particles - completely independent of mouse */}
        {snowParticles.map((particle, index) => {
          const pos = updateSnowParticle(particle);
          
          return (
            <circle
              key={`snow-particle-${index}`}
              cx={pos.x}
              cy={pos.y}
              r={particle.size}
              fill={particle.color}
              opacity={pos.opacity * 0.7}
            />
          );
        })}
        
        {/* Nodes */}
        {!showOnlySnowfall && nodes.map((node, index) => {
          const pos = getNodePosition(node);
          
          return (
            <circle
              key={`node-${index}`}
              cx={pos.x}
              cy={pos.y}
              r={3}
              fill={nodeColor}
              stroke={node.layer === 0 ? primaryColor : node.layer === layers.length - 1 ? secondaryColor : "#FFFFFF"}
              strokeWidth={0.5}
            />
          );
        })}
      </svg>
    </div>
  );
} 