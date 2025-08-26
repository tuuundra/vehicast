import React from 'react';
import { Box, useToken } from '@chakra-ui/react';

interface InventoryGraphicProps {
  accentColor: string;
  isHovered: boolean;
}

const InventoryGraphic: React.FC<InventoryGraphicProps> = ({ accentColor, isHovered }) => {
  const [colorValue] = useToken('colors', [accentColor]);

  // Define fixed positions for each box when not hovering - normalized to stay on conveyor
  const boxPositions = [
    { x: 250, y: 220 },  // Adjusted to be more centered
    { x: 400, y: 210 },  // Adjusted to avoid overlap
    { x: 550, y: 215 },  // Adjusted to be more centered
    { x: 700, y: 225 },  // Adjusted to be more centered
    { x: 850, y: 215 },  // Adjusted to avoid overlap
    { x: 1000, y: 220 }, // Adjusted to be more centered
    { x: 1150, y: 210 }, // Adjusted to avoid overlap
    { x: 1300, y: 220 }, // Adjusted to be more centered
    { x: 475, y: 180 },  // Adjusted to avoid overlap
    { x: 775, y: 190 },  // Adjusted to be more centered
    { x: 1075, y: 185 }, // Adjusted to avoid overlap
    { x: 625, y: 200 }   // Adjusted to be more centered
  ];

  return (
    <Box 
      position="absolute" 
      bottom="120px"  
      left="0"
      right="0"
      height="240px"
      zIndex={100}
      pointerEvents="none"
      overflow="hidden"
    >
      <svg 
        width="200%" 
        height="100%" 
        viewBox="0 0 2000 400" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ 
          opacity: isHovered ? 1 : 0.8,
          transition: 'all 0.6s ease-in-out', // Smoother transition
          marginLeft: "-50%"
        }}
      >


        {/* Conveyor belt - base structure - extended width */}
        <g transform="translate(0, 300)">
          {/* Belt top surface - extended */}
          <path 
            d="M0,0 L1900,0 L2100,-80 L200,-80 Z" 
            fill="#333" 
            stroke="#444" 
            strokeWidth="1"
          />
          
          {/* Belt side - extended */}
          <path 
            d="M0,0 L0,20 L1900,20 L1900,0 Z" 
            fill="#222" 
            stroke="#444" 
            strokeWidth="1"
          />
          
          {/* Belt end side - extended */}
          <path 
            d="M1900,0 L2100,-80 L2100,-60 L1900,20 Z" 
            fill="#222" 
            stroke="#444" 
            strokeWidth="1"
          />
          
          {/* Belt segments - extended */}
          {Array.from({ length: 38 }).map((_, i) => (
            <line 
              key={`segment-${i}`}
              x1={50 * i} 
              y1="0" 
              x2={50 * i + 60} 
              y2="-3" 
              stroke="#444" 
              strokeWidth="1" 
            />
          ))}
          
          {/* Support legs - extended */}
          <g>
            <path d="M50,20 L40,60 L60,60 L70,20 Z" fill="#222" stroke="#444" strokeWidth="1" />
            <path d="M450,20 L440,60 L460,60 L470,20 Z" fill="#222" stroke="#444" strokeWidth="1" />
            <path d="M850,20 L840,60 L860,60 L870,20 Z" fill="#222" stroke="#444" strokeWidth="1" />
            <path d="M1250,20 L1240,60 L1260,60 L1270,20 Z" fill="#222" stroke="#444" strokeWidth="1" />
            <path d="M1650,20 L1640,60 L1660,60 L1670,20 Z" fill="#222" stroke="#444" strokeWidth="1" />
          </g>
          
          {/* Floor shadow - extended */}
          <ellipse cx="950" cy="60" rx="950" ry="10" fill="black" opacity="0.2" />
        </g>

        {/* Entry point for boxes - left side */}
        <g opacity="0.3">
          <path d="M50,200 L100,200 L100,250 L50,250 Z" fill="#444" stroke="#555" strokeWidth="1" />
          <path d="M50,180 L100,180 L100,200 L50,200 Z" fill="#555" stroke="#666" strokeWidth="1" />
          <line x1="75" y1="180" x2="75" y2="240" stroke="#666" strokeWidth="2" strokeDasharray="5,5" />
        </g>

        {/* Box 1: Large Green Box */}
        <g opacity={1} style={{ transition: 'opacity 0.8s ease-in-out' }}>
          <animateTransform
            attributeName="transform"
            type="translate"
            values={isHovered ? `-150,100; -100,220; 2000,220` : `${boxPositions[0].x},${boxPositions[0].y}; ${boxPositions[0].x},${boxPositions[0].y}`}
            keyTimes="0; 0.05; 1"
            dur="25s"
            repeatCount="indefinite"
          />
          <animateTransform
            attributeName="transform"
            type="rotate"
            values={isHovered ? "0; -10; 0" : "0; 0"}
            keyTimes="0; 0.05; 0.1"
            dur="25s"
            repeatCount="indefinite"
            additive="sum"
          />
          <animate 
            attributeName="opacity" 
            values={isHovered ? "0; 1; 1; 0" : "1; 1"} 
            keyTimes={isHovered ? "0; 0.05; 0.9; 1" : "0; 1"}
            dur="25s" 
            repeatCount="indefinite" 
          />
          {/* Top face */}
          <path 
            d="M0,0 L100,0 L100,100 L0,100 Z" 
            fill={colorValue} 
            stroke="rgba(255,255,255,0.2)" 
            strokeWidth="1"
          />
          
          {/* Right face */}
          <path 
            d="M100,0 L130,-20 L130,80 L100,100 Z" 
            fill={colorValue} 
            filter="brightness(0.8)" 
            stroke="rgba(255,255,255,0.1)" 
            strokeWidth="1"
          />
          
          {/* Top face */}
          <path 
            d="M0,0 L30,-20 L130,-20 L100,0 Z" 
            fill={colorValue} 
            filter="brightness(0.9)" 
            stroke="rgba(255,255,255,0.1)" 
            strokeWidth="1"
          />
          
          {/* Details */}
          <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
        </g>

        {/* Box 2: Yellow/gold box */}
        <g opacity={1} style={{ transition: 'opacity 0.8s ease-in-out' }}>
          <animateTransform
            attributeName="transform"
            type="translate"
            values={isHovered ? `-150,100; -100,230; 2000,230` : `${boxPositions[1].x},${boxPositions[1].y}; ${boxPositions[1].x},${boxPositions[1].y}`}
            keyTimes="0; 0.05; 1"
            dur="25s"
            repeatCount="indefinite"
            begin="2s"
          />
          <animateTransform
            attributeName="transform"
            type="rotate"
            values={isHovered ? "0; -10; 0" : "0; 0"}
            keyTimes="0; 0.05; 0.1"
            dur="25s"
            repeatCount="indefinite"
            additive="sum"
            begin="2s"
          />
          <animate 
            attributeName="opacity" 
            values={isHovered ? "0; 1; 1; 0" : "1; 1"} 
            keyTimes={isHovered ? "0; 0.05; 0.9; 1" : "0; 1"}
            dur="25s" 
            repeatCount="indefinite" 
            begin="2s"
          />
          {/* Top face */}
          <path 
            d="M0,0 L60,0 L60,60 L0,60 Z" 
            fill="#E6C656" 
            stroke="rgba(255,255,255,0.2)" 
            strokeWidth="1"
          />
          
          {/* Right face */}
          <path 
            d="M60,0 L80,-15 L80,45 L60,60 Z" 
            fill="#E6C656" 
            filter="brightness(0.8)" 
            stroke="rgba(255,255,255,0.1)" 
            strokeWidth="1"
          />
          
          {/* Top face */}
          <path 
            d="M0,0 L20,-15 L80,-15 L60,0 Z" 
            fill="#E6C656" 
            filter="brightness(0.9)" 
            stroke="rgba(255,255,255,0.1)" 
            strokeWidth="1"
          />
          
          {/* Box label details */}
          <line x1="15" y1="20" x2="45" y2="20" stroke="rgba(0,0,0,0.4)" strokeWidth="3" />
          <line x1="15" y1="35" x2="45" y2="35" stroke="rgba(0,0,0,0.4)" strokeWidth="3" />
        </g>

        {/* Box 3: Medium Green box */}
        <g opacity={1} style={{ transition: 'opacity 0.8s ease-in-out' }}>
          <animateTransform
            attributeName="transform"
            type="translate"
            values={isHovered ? `-150,100; -100,215; 2000,215` : `${boxPositions[2].x},${boxPositions[2].y}; ${boxPositions[2].x},${boxPositions[2].y}`}
            keyTimes="0; 0.05; 1"
            dur="25s"
            repeatCount="indefinite"
            begin="4s"
          />
          <animateTransform
            attributeName="transform"
            type="rotate"
            values={isHovered ? "0; -10; 0" : "0; 0"}
            keyTimes="0; 0.05; 0.1"
            dur="25s"
            repeatCount="indefinite"
            additive="sum"
            begin="4s"
          />
          <animate 
            attributeName="opacity" 
            values={isHovered ? "0; 1; 1; 0" : "1; 1"} 
            keyTimes={isHovered ? "0; 0.05; 0.9; 1" : "0; 1"}
            dur="25s" 
            repeatCount="indefinite" 
            begin="4s"
          />
          {/* Top face */}
          <path 
            d="M0,0 L80,0 L80,80 L0,80 Z" 
            fill={colorValue} 
            stroke="rgba(255,255,255,0.2)" 
            strokeWidth="1"
          />
          
          {/* Right face */}
          <path 
            d="M80,0 L105,-15 L105,65 L80,80 Z" 
            fill={colorValue} 
            filter="brightness(0.8)" 
            stroke="rgba(255,255,255,0.1)" 
            strokeWidth="1"
          />
          
          {/* Top face */}
          <path 
            d="M0,0 L25,-15 L105,-15 L80,0 Z" 
            fill={colorValue} 
            filter="brightness(0.9)" 
            stroke="rgba(255,255,255,0.1)" 
            strokeWidth="1"
          />
          
          {/* Details */}
          <line x1="40" y1="0" x2="40" y2="80" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
          <line x1="0" y1="40" x2="80" y2="40" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
        </g>

        {/* Box 4: Small black box */}
        <g opacity={1} style={{ transition: 'opacity 0.8s ease-in-out' }}>
          <animateTransform
            attributeName="transform"
            type="translate"
            values={isHovered ? `-150,100; -100,235; 2000,235` : `${boxPositions[3].x},${boxPositions[3].y}; ${boxPositions[3].x},${boxPositions[3].y}`}
            keyTimes="0; 0.05; 1"
            dur="25s"
            repeatCount="indefinite"
            begin="6s"
          />
          <animateTransform
            attributeName="transform"
            type="rotate"
            values={isHovered ? "0; -10; 0" : "0; 0"}
            keyTimes="0; 0.05; 0.1"
            dur="25s"
            repeatCount="indefinite"
            additive="sum"
            begin="6s"
          />
          <animate 
            attributeName="opacity" 
            values={isHovered ? "0; 0.8; 0.8; 0" : "0.8; 0.8"} 
            keyTimes={isHovered ? "0; 0.05; 0.9; 1" : "0; 1"}
            dur="25s" 
            repeatCount="indefinite" 
            begin="6s"
          />
          {/* Top face */}
          <path 
            d="M0,0 L40,0 L40,40 L0,40 Z" 
            fill="#333" 
            stroke="#444" 
            strokeWidth="1"
            opacity="0.8"
          />
          
          {/* Right face */}
          <path 
            d="M40,0 L55,-10 L55,30 L40,40 Z" 
            fill="#333" 
            filter="brightness(0.8)" 
            stroke="#444" 
            strokeWidth="1"
            opacity="0.8"
          />
          
          {/* Top face */}
          <path 
            d="M0,0 L15,-10 L55,-10 L40,0 Z" 
            fill="#333" 
            filter="brightness(0.9)" 
            stroke="#444" 
            strokeWidth="1"
            opacity="0.8"
          />
        </g>

        {/* Box 5: Dark gray box */}
        <g opacity={1} style={{ transition: 'opacity 0.8s ease-in-out' }}>
          <animateTransform
            attributeName="transform"
            type="translate"
            values={isHovered ? `-150,100; -100,225; 2000,225` : `${boxPositions[4].x},${boxPositions[4].y}; ${boxPositions[4].x},${boxPositions[4].y}`}
            keyTimes="0; 0.05; 1"
            dur="25s"
            repeatCount="indefinite"
            begin="8s"
          />
          <animateTransform
            attributeName="transform"
            type="rotate"
            values={isHovered ? "0; -10; 0" : "0; 0"}
            keyTimes="0; 0.05; 0.1"
            dur="25s"
            repeatCount="indefinite"
            additive="sum"
            begin="8s"
          />
          <animate 
            attributeName="opacity" 
            values={isHovered ? "0; 0.8; 0.8; 0" : "0.8; 0.8"} 
            keyTimes={isHovered ? "0; 0.05; 0.9; 1" : "0; 1"}
            dur="25s" 
            repeatCount="indefinite" 
            begin="8s"
          />
          {/* Top face */}
          <path 
            d="M0,0 L50,0 L50,50 L0,50 Z" 
            fill="#444" 
            stroke="#555" 
            strokeWidth="1"
            opacity="0.8"
          />
          
          {/* Right face */}
          <path 
            d="M50,0 L70,-15 L70,35 L50,50 Z" 
            fill="#444" 
            filter="brightness(0.8)" 
            stroke="#555" 
            strokeWidth="1"
            opacity="0.8"
          />
          
          {/* Top face */}
          <path 
            d="M0,0 L20,-15 L70,-15 L50,0 Z" 
            fill="#444" 
            filter="brightness(0.9)" 
            stroke="#555" 
            strokeWidth="1"
            opacity="0.8"
          />
        </g>
        
        {/* Box 6: Blue box */}
        <g opacity={1} style={{ transition: 'opacity 0.8s ease-in-out' }}>
          <animateTransform
            attributeName="transform"
            type="translate"
            values={isHovered ? `-150,100; -100,217; 2000,217` : `${boxPositions[5].x},${boxPositions[5].y}; ${boxPositions[5].x},${boxPositions[5].y}`}
            keyTimes="0; 0.05; 1"
            dur="25s"
            repeatCount="indefinite"
            begin="10s"
          />
          <animateTransform
            attributeName="transform"
            type="rotate"
            values={isHovered ? "0; -10; 0" : "0; 0"}
            keyTimes="0; 0.05; 0.1"
            dur="25s"
            repeatCount="indefinite"
            additive="sum"
            begin="10s"
          />
          <animate 
            attributeName="opacity" 
            values={isHovered ? "0; 1; 1; 0" : "1; 1"} 
            keyTimes={isHovered ? "0; 0.05; 0.9; 1" : "0; 1"}
            dur="25s" 
            repeatCount="indefinite" 
            begin="10s"
          />
          {/* Top face */}
          <path 
            d="M0,0 L60,0 L60,60 L0,60 Z" 
            fill="#3a7ca5" 
            stroke="rgba(255,255,255,0.2)" 
            strokeWidth="1"
          />
          
          {/* Right face */}
          <path 
            d="M60,0 L80,-15 L80,45 L60,60 Z" 
            fill="#3a7ca5" 
            filter="brightness(0.8)" 
            stroke="rgba(255,255,255,0.1)" 
            strokeWidth="1"
          />
          
          {/* Top face */}
          <path 
            d="M0,0 L20,-15 L80,-15 L60,0 Z" 
            fill="#3a7ca5" 
            filter="brightness(0.9)" 
            stroke="rgba(255,255,255,0.1)" 
            strokeWidth="1"
          />
          
          {/* Box details */}
          <line x1="30" y1="0" x2="30" y2="60" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
          <line x1="0" y1="30" x2="60" y2="30" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
        </g>

        {/* Box 7: Purple box */}
        <g opacity={1} style={{ transition: 'opacity 0.8s ease-in-out' }}>
          <animateTransform
            attributeName="transform"
            type="translate"
            values={isHovered ? `-150,100; -100,230; 2000,230` : `${boxPositions[6].x},${boxPositions[6].y}; ${boxPositions[6].x},${boxPositions[6].y}`}
            keyTimes="0; 0.05; 1"
            dur="25s"
            repeatCount="indefinite"
            begin="12s"
          />
          <animateTransform
            attributeName="transform"
            type="rotate"
            values={isHovered ? "0; -10; 0" : "0; 0"}
            keyTimes="0; 0.05; 0.1"
            dur="25s"
            repeatCount="indefinite"
            additive="sum"
            begin="12s"
          />
          <animate 
            attributeName="opacity" 
            values={isHovered ? "0; 1; 1; 0" : "1; 1"} 
            keyTimes={isHovered ? "0; 0.05; 0.9; 1" : "0; 1"}
            dur="25s" 
            repeatCount="indefinite" 
            begin="12s"
          />
          {/* Top face */}
          <path 
            d="M0,0 L70,0 L70,70 L0,70 Z" 
            fill="#7c3a78" 
            stroke="rgba(255,255,255,0.2)" 
            strokeWidth="1"
          />
          
          {/* Right face */}
          <path 
            d="M70,0 L95,-15 L95,55 L70,70 Z" 
            fill="#7c3a78" 
            filter="brightness(0.8)" 
            stroke="rgba(255,255,255,0.1)" 
            strokeWidth="1"
          />
          
          {/* Top face */}
          <path 
            d="M0,0 L25,-15 L95,-15 L70,0 Z" 
            fill="#7c3a78" 
            filter="brightness(0.9)" 
            stroke="rgba(255,255,255,0.1)" 
            strokeWidth="1"
          />
          
          {/* Box details */}
          <line x1="35" y1="0" x2="35" y2="70" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
          <line x1="0" y1="35" x2="70" y2="35" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
        </g>

        {/* Box 8: Small orange box */}
        <g opacity={1} style={{ transition: 'opacity 0.8s ease-in-out' }}>
          <animateTransform
            attributeName="transform"
            type="translate"
            values={isHovered ? `-150,100; -100,220; 2000,220` : `${boxPositions[7].x},${boxPositions[7].y}; ${boxPositions[7].x},${boxPositions[7].y}`}
            keyTimes="0; 0.05; 1"
            dur="25s"
            repeatCount="indefinite"
            begin="14s"
          />
          <animateTransform
            attributeName="transform"
            type="rotate"
            values={isHovered ? "0; -10; 0" : "0; 0"}
            keyTimes="0; 0.05; 0.1"
            dur="25s"
            repeatCount="indefinite"
            additive="sum"
            begin="14s"
          />
          <animate 
            attributeName="opacity" 
            values={isHovered ? "0; 1; 1; 0" : "1; 1"} 
            keyTimes={isHovered ? "0; 0.05; 0.9; 1" : "0; 1"}
            dur="25s" 
            repeatCount="indefinite" 
            begin="14s"
          />
          {/* Top face */}
          <path 
            d="M0,0 L45,0 L45,45 L0,45 Z" 
            fill="#d17a22" 
            stroke="rgba(255,255,255,0.2)" 
            strokeWidth="1"
          />
          
          {/* Right face */}
          <path 
            d="M45,0 L65,-15 L65,30 L45,45 Z" 
            fill="#d17a22" 
            filter="brightness(0.8)" 
            stroke="rgba(255,255,255,0.1)" 
            strokeWidth="1"
          />
          
          {/* Top face */}
          <path 
            d="M0,0 L20,-15 L65,-15 L45,0 Z" 
            fill="#d17a22" 
            filter="brightness(0.9)" 
            stroke="rgba(255,255,255,0.1)" 
            strokeWidth="1"
          />
          
          {/* Box details */}
          <line x1="22.5" y1="0" x2="22.5" y2="45" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
          <line x1="0" y1="22.5" x2="45" y2="22.5" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
        </g>

        {/* BOX 9: New Teal Box (added) */}
        <g opacity={1} style={{ transition: 'opacity 0.8s ease-in-out' }}>
          <animateTransform
            attributeName="transform"
            type="translate"
            values={isHovered ? `-150,100; -100,175; 2000,175` : `${boxPositions[8].x},${boxPositions[8].y}; ${boxPositions[8].x},${boxPositions[8].y}`}
            keyTimes="0; 0.05; 1"
            dur="25s"
            repeatCount="indefinite"
            begin="16s"
          />
          <animateTransform
            attributeName="transform"
            type="rotate"
            values={isHovered ? "0; -10; 0" : "0; 0"}
            keyTimes="0; 0.05; 0.1"
            dur="25s"
            repeatCount="indefinite"
            additive="sum"
            begin="16s"
          />
          <animate 
            attributeName="opacity" 
            values={isHovered ? "0; 1; 1; 0" : "1; 1"} 
            keyTimes={isHovered ? "0; 0.05; 0.9; 1" : "0; 1"}
            dur="25s" 
            repeatCount="indefinite" 
            begin="16s"
          />
          {/* Top face */}
          <path 
            d="M0,0 L65,0 L65,65 L0,65 Z" 
            fill="#2a9d8f" 
            stroke="rgba(255,255,255,0.2)" 
            strokeWidth="1"
          />
          
          {/* Right face */}
          <path 
            d="M65,0 L85,-15 L85,50 L65,65 Z" 
            fill="#2a9d8f" 
            filter="brightness(0.8)" 
            stroke="rgba(255,255,255,0.1)" 
            strokeWidth="1"
          />
          
          {/* Top face */}
          <path 
            d="M0,0 L20,-15 L85,-15 L65,0 Z" 
            fill="#2a9d8f" 
            filter="brightness(0.9)" 
            stroke="rgba(255,255,255,0.1)" 
            strokeWidth="1"
          />
          
          {/* Box details */}
          <line x1="32.5" y1="0" x2="32.5" y2="65" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
          <line x1="0" y1="32.5" x2="65" y2="32.5" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
        </g>

        {/* BOX 10: New Red Box (added) */}
        <g opacity={1} style={{ transition: 'opacity 0.8s ease-in-out' }}>
          <animateTransform
            attributeName="transform"
            type="translate"
            values={isHovered ? `-150,100; -100,190; 2000,190` : `${boxPositions[9].x},${boxPositions[9].y}; ${boxPositions[9].x},${boxPositions[9].y}`}
            keyTimes="0; 0.05; 1"
            dur="25s"
            repeatCount="indefinite"
            begin="18s"
          />
          <animateTransform
            attributeName="transform"
            type="rotate"
            values={isHovered ? "0; -10; 0" : "0; 0"}
            keyTimes="0; 0.05; 0.1"
            dur="25s"
            repeatCount="indefinite"
            additive="sum"
            begin="18s"
          />
          <animate 
            attributeName="opacity" 
            values={isHovered ? "0; 1; 1; 0" : "1; 1"} 
            keyTimes={isHovered ? "0; 0.05; 0.9; 1" : "0; 1"}
            dur="25s" 
            repeatCount="indefinite" 
            begin="18s"
          />
          {/* Top face */}
          <path 
            d="M0,0 L55,0 L55,55 L0,55 Z" 
            fill="#e63946" 
            stroke="rgba(255,255,255,0.2)" 
            strokeWidth="1"
          />
          
          {/* Right face */}
          <path 
            d="M55,0 L75,-15 L75,40 L55,55 Z" 
            fill="#e63946" 
            filter="brightness(0.8)" 
            stroke="rgba(255,255,255,0.1)" 
            strokeWidth="1"
          />
          
          {/* Top face */}
          <path 
            d="M0,0 L20,-15 L75,-15 L55,0 Z" 
            fill="#e63946" 
            filter="brightness(0.9)" 
            stroke="rgba(255,255,255,0.1)" 
            strokeWidth="1"
          />
          
          {/* Box details */}
          <line x1="27.5" y1="0" x2="27.5" y2="55" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
          <line x1="0" y1="27.5" x2="55" y2="27.5" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
        </g>

        {/* BOX 11: New Mint Green Box (added) */}
        <g opacity={1} style={{ transition: 'opacity 0.8s ease-in-out' }}>
          <animateTransform
            attributeName="transform"
            type="translate"
            values={isHovered ? `-150,100; -100,180; 2000,180` : `${boxPositions[10].x},${boxPositions[10].y}; ${boxPositions[10].x},${boxPositions[10].y}`}
            keyTimes="0; 0.05; 1"
            dur="25s"
            repeatCount="indefinite"
            begin="20s"
          />
          <animateTransform
            attributeName="transform"
            type="rotate"
            values={isHovered ? "0; -10; 0" : "0; 0"}
            keyTimes="0; 0.05; 0.1"
            dur="25s"
            repeatCount="indefinite"
            additive="sum"
            begin="20s"
          />
          <animate 
            attributeName="opacity" 
            values={isHovered ? "0; 1; 1; 0" : "1; 1"} 
            keyTimes={isHovered ? "0; 0.05; 0.9; 1" : "0; 1"}
            dur="25s" 
            repeatCount="indefinite" 
            begin="20s"
          />
          {/* Top face */}
          <path 
            d="M0,0 L70,0 L70,70 L0,70 Z" 
            fill="#90be6d" 
            stroke="rgba(255,255,255,0.2)" 
            strokeWidth="1"
          />
          
          {/* Right face */}
          <path 
            d="M70,0 L90,-15 L90,55 L70,70 Z" 
            fill="#90be6d" 
            filter="brightness(0.8)" 
            stroke="rgba(255,255,255,0.1)" 
            strokeWidth="1"
          />
          
          {/* Top face */}
          <path 
            d="M0,0 L20,-15 L90,-15 L70,0 Z" 
            fill="#90be6d" 
            filter="brightness(0.9)" 
            stroke="rgba(255,255,255,0.1)" 
            strokeWidth="1"
          />
          
          {/* Box details */}
          <line x1="35" y1="0" x2="35" y2="70" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
          <line x1="0" y1="35" x2="70" y2="35" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
        </g>

        {/* BOX 12: New Slate Gray Box (added) */}
        <g opacity={1} style={{ transition: 'opacity 0.8s ease-in-out' }}>
          <animateTransform
            attributeName="transform"
            type="translate"
            values={isHovered ? `-150,100; -100,205; 2000,205` : `${boxPositions[11].x},${boxPositions[11].y}; ${boxPositions[11].x},${boxPositions[11].y}`}
            keyTimes="0; 0.05; 1"
            dur="25s"
            repeatCount="indefinite"
            begin="22s"
          />
          <animateTransform
            attributeName="transform"
            type="rotate"
            values={isHovered ? "0; -10; 0" : "0; 0"}
            keyTimes="0; 0.05; 0.1"
            dur="25s"
            repeatCount="indefinite"
            additive="sum"
            begin="22s"
          />
          <animate 
            attributeName="opacity" 
            values={isHovered ? "0; 1; 1; 0" : "1; 1"} 
            keyTimes={isHovered ? "0; 0.05; 0.9; 1" : "0; 1"}
            dur="25s" 
            repeatCount="indefinite" 
            begin="22s"
          />
          {/* Top face */}
          <path 
            d="M0,0 L50,0 L50,50 L0,50 Z" 
            fill="#6c757d" 
            stroke="rgba(255,255,255,0.2)" 
            strokeWidth="1"
          />
          
          {/* Right face */}
          <path 
            d="M50,0 L70,-15 L70,35 L50,50 Z" 
            fill="#6c757d" 
            filter="brightness(0.8)" 
            stroke="rgba(255,255,255,0.1)" 
            strokeWidth="1"
          />
          
          {/* Top face */}
          <path 
            d="M0,0 L20,-15 L70,-15 L50,0 Z" 
            fill="#6c757d" 
            filter="brightness(0.9)" 
            stroke="rgba(255,255,255,0.1)" 
            strokeWidth="1"
          />
          
          {/* Box details */}
          <line x1="25" y1="0" x2="25" y2="50" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
          <line x1="0" y1="25" x2="50" y2="25" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
        </g>

        {/* Small indicator lights - removed all purple ones */}
        <>
          <circle cx="150" cy="320" r="2" fill="#ff3366" opacity={isHovered ? 0.8 : 0.5}>
            <animate attributeName="opacity" values={isHovered ? "0;0.8;0" : "0.5;0.5"} dur="2s" repeatCount="indefinite" />
          </circle>
        </>
      </svg>
    </Box>
  );
};

export default InventoryGraphic; 