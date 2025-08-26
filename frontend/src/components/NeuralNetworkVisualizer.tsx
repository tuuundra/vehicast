import React, { useRef } from "react";
import { motion, useSpring, SpringOptions } from "framer-motion";
import { useMouseVector } from "../hooks/use-mouse-vector";

interface NeuralNetworkVisualizerProps {
  className?: string;
}

export function NeuralNetworkVisualizer({ className }: NeuralNetworkVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { position, vector } = useMouseVector(containerRef);
  
  const springOptions: SpringOptions = { 
    stiffness: 100, 
    damping: 30, 
    mass: 0.5 
  };
  
  const springX = useSpring(0, springOptions);
  const springY = useSpring(0, springOptions);
  
  // Update springs based on mouse position
  React.useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // Calculate normalized position (-1 to 1)
      const normalizedX = (position.x - centerX) / centerX;
      const normalizedY = (position.y - centerY) / centerY;
      
      springX.set(normalizedX * 20);
      springY.set(normalizedY * 20);
    }
  }, [position, springX, springY]);

  // Generate nodes for the neural network
  const generateNodes = (count: number, layerIndex: number, totalLayers: number) => {
    return Array.from({ length: count }).map((_, i) => {
      const normalizedPos = i / (count - 1) || 0; // Avoid division by zero
      const yPos = normalizedPos * 100;
      const xPos = (layerIndex / (totalLayers - 1)) * 100;
      
      return (
        <motion.div
          key={`node-${layerIndex}-${i}`}
          style={{
            position: 'absolute',
            width: '0.75rem',
            height: '0.75rem',
            borderRadius: '9999px',
            backgroundColor: '#3B82F6',
            left: `${xPos}%`,
            top: `${yPos}%`,
            x: springX,
            y: springY,
            filter: "blur(2px)",
            opacity: 0.7 + (Math.sin(Date.now() * 0.001 + i * 0.5) + 1) * 0.15,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.7, 0.9, 0.7],
          }}
          transition={{
            duration: 2 + i % 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      );
    });
  };

  // Generate connections between nodes
  const generateConnections = () => {
    const connections = [];
    const layers = [4, 6, 4];
    
    for (let l = 0; l < layers.length - 1; l++) {
      const fromCount = layers[l];
      const toCount = layers[l + 1];
      
      for (let i = 0; i < fromCount; i++) {
        for (let j = 0; j < toCount; j++) {
          const fromX = (l / (layers.length - 1)) * 100;
          const fromY = (i / (fromCount - 1) || 0) * 100; // Avoid division by zero
          const toX = ((l + 1) / (layers.length - 1)) * 100;
          const toY = (j / (toCount - 1) || 0) * 100; // Avoid division by zero
          
          const pulseDelay = (i + j) % 3;
          
          connections.push(
            <motion.div
              key={`conn-${l}-${i}-${j}`}
              style={{
                position: 'absolute',
                background: 'linear-gradient(to right, rgba(96, 165, 250, 0.3), rgba(168, 85, 247, 0.3))',
                left: `${fromX}%`,
                top: `${fromY}%`,
                width: `${toX - fromX}%`,
                height: "1px",
                transformOrigin: "left center",
                transform: `rotate(${Math.atan2(toY - fromY, toX - fromX) * (180 / Math.PI)}deg) scaleX(${Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2)) / (toX - fromX)})`,
                x: springX,
                y: springY,
              }}
              animate={{
                opacity: [0.1, 0.5, 0.1],
              }}
              transition={{
                duration: 3,
                delay: pulseDelay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          );
        }
      }
    }
    
    return connections;
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden rounded-lg bg-gradient-to-r from-slate-900/50 to-slate-800/50 backdrop-blur-sm ${className}`}
    >
      {/* Background pulse effects */}
      {[1, 2, 3].map((i) => (
        <motion.div 
          key={`pulse-${i}`}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '0.5rem',
            background: `radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)`,
            x: springX,
            y: springY,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5,
          }}
        />
      ))}
      
      {/* Neural network connections */}
      {generateConnections()}
      
      {/* Neural network nodes */}
      {generateNodes(4, 0, 3)}
      {generateNodes(6, 1, 3)}
      {generateNodes(4, 2, 3)}
      
      {/* Cursor follower */}
      <motion.div
        style={{
          position: 'absolute',
          width: '2rem',
          height: '2rem',
          borderRadius: '9999px',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          pointerEvents: 'none',
          left: position.x,
          top: position.y,
          x: -16,
          y: -16,
          filter: "blur(8px)",
        }}
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
} 