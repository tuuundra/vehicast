import React, { useRef, useEffect, useState } from "react";
import { motion, useAnimationFrame, useMotionValue } from "framer-motion";

interface MinimalistLineGraphProps {
  className?: string;
  width?: number;
  height?: number;
  color?: string;
  secondaryColor?: string;
  lineCount?: number;
  interactive?: boolean;
}

export function MinimalistLineGraph({
  className = "",
  width = 500,
  height = 300,
  color = "#38B2AC", // Teal color
  secondaryColor = "#805AD5", // Purple color
  lineCount = 3,
  interactive = true,
}: MinimalistLineGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const phase = useMotionValue(0);
  const mouseX = useMotionValue(width / 2);
  const mouseY = useMotionValue(height / 2);
  const [virtualMouseTime, setVirtualMouseTime] = useState(0);
  const [isRealMouseActive, setIsRealMouseActive] = useState(false);
  
  // Handle mouse movement for interactive effect
  useEffect(() => {
    if (!interactive || !containerRef.current) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
        setIsRealMouseActive(true);
      }
    };
    
    const handleMouseLeave = () => {
      // Instead of resetting to center, just mark real mouse as inactive
      // Virtual mouse will take over
      setIsRealMouseActive(false);
    };
    
    const container = containerRef.current;
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [interactive, width, height, mouseX, mouseY]);

  // Animation frame update with virtual mouse movement
  useAnimationFrame((time) => {
    // Update phase for animation
    phase.set(time * 0.0003);
    
    // Virtual mouse animation only when real mouse is not active
    if (!isRealMouseActive) {
      // Update virtual mouse time
      setVirtualMouseTime(prevTime => prevTime + 0.01);
      
      // Create a smooth flowing pattern for virtual mouse using Lissajous curves
      // Different parameters from neural network for variety
      const t = virtualMouseTime;
      const virtualX = width * 0.5 + Math.sin(t * 0.4) * Math.cos(t * 0.3) * width * 0.4;
      const virtualY = height * 0.5 + Math.sin(t * 0.5) * Math.cos(t * 0.2) * height * 0.4;
      
      // Update mouse values with virtual positions
      mouseX.set(virtualX);
      mouseY.set(virtualY);
    }
  });

  // Generate line paths
  const generateLinePath = (lineIndex: number) => {
    const phaseValue = phase.get();
    const amplitude = height * 0.15;
    const frequency = 0.01;
    const points = [];
    
    // Get current mouse position (either real or virtual)
    const mouseXValue = mouseX.get();
    const mouseYValue = mouseY.get();
    
    for (let x = 0; x <= width; x += 5) {
      // Calculate distance from mouse for interactive effect
      const distanceFromMouse = Math.sqrt(Math.pow(x - mouseXValue, 2) + Math.pow(height/2 - mouseYValue, 2));
      const mouseInfluence = Math.max(0, 1 - distanceFromMouse / (width / 2)) * 0.5;
      
      // Calculate y position with phase offset for each line
      const baseY = height / 2 + 
        Math.sin(x * frequency + phaseValue + lineIndex * 1.5) * amplitude * (1 + lineIndex * 0.2);
      
      // Add mouse influence
      const y = baseY + (mouseYValue - height / 2) * mouseInfluence * (1 - x / width);
      
      points.push(`${x},${y}`);
    }
    
    return `M0,${height/2} L${points.join(" L")}`;
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
        {/* Gradient definitions */}
        <defs>
          {Array.from({ length: lineCount }).map((_, i) => (
            <linearGradient
              key={`line-gradient-${i}`}
              id={`line-gradient-${i}`}
              x1="0"
              y1="0"
              x2={width}
              y2="0"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor={i % 2 === 0 ? color : secondaryColor} stopOpacity="0.1" />
              <stop offset="0.5" stopColor={i % 2 === 0 ? color : secondaryColor} stopOpacity="0.8" />
              <stop offset="1" stopColor={i % 2 === 0 ? color : secondaryColor} stopOpacity="0.1" />
            </linearGradient>
          ))}
        </defs>
        
        {/* Background grid lines */}
        <g opacity="0.1">
          {Array.from({ length: 5 }).map((_, i) => (
            <line
              key={`grid-h-${i}`}
              x1="0"
              y1={height * (i + 1) / 6}
              x2={width}
              y2={height * (i + 1) / 6}
              stroke="#FFFFFF"
              strokeWidth="0.5"
              strokeDasharray="4 4"
            />
          ))}
          {Array.from({ length: 5 }).map((_, i) => (
            <line
              key={`grid-v-${i}`}
              x1={width * (i + 1) / 6}
              y1="0"
              x2={width * (i + 1) / 6}
              y2={height}
              stroke="#FFFFFF"
              strokeWidth="0.5"
              strokeDasharray="4 4"
            />
          ))}
        </g>
        
        {/* Animated lines */}
        {Array.from({ length: lineCount }).map((_, i) => (
          <motion.path
            key={`line-${i}`}
            d={generateLinePath(i)}
            stroke={`url(#line-gradient-${i})`}
            strokeWidth={1.5 - i * 0.3}
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: 1, 
              opacity: 1,
              d: generateLinePath(i)
            }}
            transition={{
              pathLength: { duration: 1.5, delay: i * 0.2 },
              opacity: { duration: 0.5, delay: i * 0.2 },
              d: { duration: 0.1, ease: "linear" }
            }}
          />
        ))}
        
        {/* Data points */}
        {Array.from({ length: 5 }).map((_, i) => {
          const x = width * (i + 1) / 6;
          const phaseValue = phase.get();
          const y = height / 2 + Math.sin(x * 0.01 + phaseValue) * height * 0.15;
          
          return (
            <motion.circle
              key={`point-${i}`}
              cx={x}
              cy={y}
              r={3}
              fill={i % 2 === 0 ? color : secondaryColor}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 0.8,
                cy: y
              }}
              transition={{
                scale: { duration: 0.5, delay: 1 + i * 0.1 },
                opacity: { duration: 0.5, delay: 1 + i * 0.1 },
                cy: { duration: 0.1, ease: "linear" }
              }}
            />
          );
        })}
        
        {/* Subtle glow effect */}
        <motion.circle
          cx={width / 2}
          cy={height / 2}
          r={Math.min(width, height) * 0.4}
          fill={`url(#glow-gradient)`}
          opacity={0.05}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.03, 0.06, 0.03],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Additional gradient definitions */}
        <defs>
          <radialGradient id="glow-gradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor={secondaryColor} stopOpacity="0.8" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>
        
        {/* Uncomment to visualize the virtual mouse position */}
        {/* <circle
          cx={mouseX.get()}
          cy={mouseY.get()}
          r={5}
          fill="red"
          opacity={0.3}
        /> */}
      </svg>
    </div>
  );
} 