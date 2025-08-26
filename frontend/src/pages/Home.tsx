import React, { useEffect, useRef, useState } from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  SimpleGrid, 
  Button, 
  VStack, 
  HStack, 
  Container, 
  Flex, 
  Grid,
  Divider,
  Badge,
  Stack,
  keyframes,
  Image,
  Icon,
  Center,
  Input,
  useColorModeValue,
  useBreakpointValue,
  Link,
  AspectRatio,
  chakra,
  useToken
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { ChevronRightIcon, ChatIcon as ChatIconChakra } from '@chakra-ui/icons';
import { useMotionValue, MotionValue, useScroll, useTransform, motion } from 'framer-motion';
import GoogleGeminiEffect from '../components/GoogleGeminiEffect';
import { HighTechVisualization } from '../components/HighTechVisualization';
import InventoryGraphic from "../components/InventoryGraphic";
import LiveKitAgentUI, { LiveKitAgentUIHandle } from '../components/LiveKitAgentUI';
import { RotatingWheel } from '../components/RotatingWheel';

// SVG icons for feature cards
const BoxIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 1L21.5 6.5V17.5L12 23L2.5 17.5V6.5L12 1Z" stroke="#3ECF8E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 23V12" stroke="#3ECF8E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21.5 6.5L12 12L2.5 6.5" stroke="#3ECF8E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 3V21H21" stroke="#8B46FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 14L11 10L15 14L21 8" stroke="#8B46FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const WrenchIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.7 6.3C14.1 5.7 13.3 5.4 12.5 5.4C11.1 5.4 9.7 6.2 9.1 7.5C8.5 8.8 8.9 10.5 10 11.6L4 17.6C3.6 18 3.6 18.6 4 19C4.4 19.4 5 19.4 5.4 19L11.4 13C12.5 14.1 14.2 14.5 15.5 13.9C16.8 13.3 17.6 11.9 17.6 10.5C17.6 9.7 17.3 8.9 16.7 8.3" stroke="#3ECF8E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19.9922 8L21.9922 6" stroke="#3ECF8E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15.9961 2L17.9961 4" stroke="#3ECF8E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19.9922 4L17.9922 6" stroke="#3ECF8E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SearchIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#8B46FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 21L16.65 16.65" stroke="#8B46FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const GearIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#3ECF8E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z" stroke="#3ECF8E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChatIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke="#8B46FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Animation keyframes
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const marqueeAnimation = keyframes`
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
`;

const borderGlow = keyframes`
  0% { border-color: rgba(99, 102, 241, 0.4); }
  50% { border-color: rgba(99, 102, 241, 0.8); }
  100% { border-color: rgba(99, 102, 241, 0.4); }
`;

const fadeInUnblur = keyframes`
  from { 
    opacity: 0; 
    transform: translateY(20px); 
    filter: blur(8px);
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
    filter: blur(0);
  }
`;

// Grid animation element
const GridAnimation = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      // Calculate mouse position relative to the container
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setMousePosition({ x, y });
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
    }

    // Also track mouse on the whole window for consistent experience
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <Box
      ref={containerRef}
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      overflow="hidden"
      display={{ base: 'none', lg: 'block' }}
    >
      {/* Grid pattern - extend across the entire page with fade-out */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        opacity={0.4}
        zIndex={0}
        backgroundImage="linear-gradient(#333333 1px, transparent 1px), linear-gradient(90deg, #333333 1px, transparent 1px)"
        backgroundSize="40px 40px"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '70%',
          background: 'linear-gradient(to right, rgba(18, 18, 18, 1) 30%, rgba(18, 18, 18, 0.7) 65%, rgba(18, 18, 18, 0))',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />
      
      {/* High-Tech Visualization */}
      <Box
        position="absolute"
        top="15%"
        right="10%"
        width="600px"
        height="600px"
        zIndex={1}
        sx={{
          animation: `${fadeIn} 0.6s ease-out 0.2s both`,
        }}
      >
        <HighTechVisualization 
          width={500}
          height={400}
          primaryColor="#38B2AC" // Teal
          secondaryColor="#805AD5" // Purple
          rotate={false}
          scale={1.2}
        />
      </Box>
    </Box>
  );
};

// Feature component with Supabase-inspired styling
const FeatureCard = ({ title, text, icon, accentColor = 'brand.400', isWide = false }: { 
  title: string; 
  text: string; 
  icon: React.ReactNode;
  accentColor?: string;
  isWide?: boolean;
}) => {
  const isInventoryCard = title === "Inventory Optimization";
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <Box
      as="a"
      href="#"
      className="group relative w-full sm:h-[400px] flex flex-col gap-5 focus:outline-none focus:border-none focus:ring-brand-600 focus:ring-2 focus:rounded-xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Box 
        className="group/panel rounded-lg md:rounded-xl p-px bg-surface-75 bg-gradient-to-b from-border to-border/50 dark:to-surface-100 transition-all hover:shadow-md flex items-center justify-center hover:bg-none relative w-full h-full"
        bg="#121212"
        borderWidth="1px"
        borderColor="gray.700"
        borderRadius="xl"
        overflow="hidden"
        transition="all 0.3s ease-in-out"
        _hover={{
          boxShadow: `0 4px 20px rgba(${accentColor === 'brand.500' ? '62, 207, 142' : '139, 70, 255'}, 0.3)`,
          borderColor: accentColor,
        }}
        sx={{
          '&:hover': {
            '&:before': {
              opacity: 1,
            }
          },
          '&:before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            padding: '1px',
            background: `linear-gradient(135deg, ${accentColor}, transparent 50%, ${accentColor})`,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            opacity: 0,
            transition: 'opacity 0.3s ease-in-out',
          }
        }}
      >
        <Box 
          className="z-10 rounded-[11px] relative overflow-hidden flex-1 flex flex-col gap-4 items-start justify-between w-full h-full"
          bg="#121212"
          p={4}
          pt={6}
          pb={6}
          position="relative"
          height={{ base: "400px", md: "400px" }}
          maxW={{ base: "100%" }}
          borderRadius="lg"
          transition="transform 0.3s ease-out, box-shadow 0.3s ease-out"
          _groupHover={{
            transform: 'translateY(-2px)',
            boxShadow: `0 0 20px rgba(${accentColor === 'brand.500' ? '62, 207, 142' : '139, 70, 255'}, 0.1)`,
          }}
        >
          <VStack align="start" spacing={4} flex="1" className="relative z-10 h-full w-full">
            {/* Icon container */}
            <Flex 
              align="center" 
              gap={2} 
              mb={0}
              color="white"
            >
              <Box
                as="span"
                p={3}
                bg="#1A1A1A" 
                borderRadius="md" 
                width="auto"
                height="auto"
                transition="all 0.3s ease"
                position="relative"
                sx={{
                  '&:after': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 'inherit',
                    padding: '1px',
                    background: accentColor,
                    opacity: 0,
                    filter: 'blur(8px)',
                    transform: 'scale(0.85)',
                    transition: 'opacity 0.3s ease, transform 0.3s ease',
                  }
                }}
                _groupHover={{
                  bg: `${accentColor}20`,
                  transform: 'scale(1.05)',
                  '&:after': {
                    opacity: 0.5,
                    transform: 'scale(1.15)',
                  }
                }}
              >
                {icon}
              </Box>
              <Heading 
                size="md" 
                fontWeight="normal" 
                color="white" 
                letterSpacing="-0.01em"
                fontSize="18px"
                transition="color 0.3s ease"
                _groupHover={{
                  color: accentColor,
                }}
              >
                {title}
              </Heading>
            </Flex>
            
            <Box 
              flex="1" 
              display="flex" 
              flexDirection="column" 
              justifyContent="space-between"
              maxWidth={isWide ? { base: "100%", md: "70%" } : "100%"}
            >
              <Text 
                color="gray.400" 
                fontSize="sm" 
                letterSpacing="-0.01em" 
                lineHeight="1.7"
                fontWeight="normal"
                mt={2}
              >
                <Box as="span" color="white" fontWeight="normal">{text.split(' ').slice(0, 3).join(' ')} </Box>
                {text.split(' ').slice(3).join(' ')}
              </Text>
            </Box>
          </VStack>
          
          {/* Background animation effect - subtle grid pattern */}
      <Box 
        position="absolute" 
        top={0} 
        left={0} 
        right={0}
        bottom={0}
        opacity={0.1}
        zIndex={0}
        backgroundImage="linear-gradient(#333333 1px, transparent 1px), linear-gradient(90deg, #333333 1px, transparent 1px)"
        backgroundSize="40px 40px"
        _before={{
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '50%',
          background: 'linear-gradient(to right, rgba(18, 18, 18, 1), rgba(18, 18, 18, 0))',
          pointerEvents: 'none',
          zIndex: 1
        }}
        className="transition-opacity group-hover:opacity-20"
      />
          
          {/* Subtle glow effect on hover */}
          <Box
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            width="80%"
            height="80%"
            borderRadius="full"
            bg={accentColor} 
            opacity={0}
            filter="blur(60px)"
            transition="opacity 0.5s ease"
            _groupHover={{
              opacity: 0.07,
            }}
          />

          {/* Visual elements specific to each card */}
          {isInventoryCard && (
            <Box 
              position="relative" 
              width="100%" 
              height="100%" 
              zIndex={10} 
              overflow="visible"
            >
              <InventoryGraphic accentColor={accentColor} isHovered={isHovered} />
            </Box>
          )}
          
          {title === "Component Failure Prediction" && (
            <Box
              position="absolute"
              right="10px"
              bottom="10px"
              width="120px"
              height="120px"
              opacity={0.15}
              zIndex={0}
              className="transition-opacity group-hover:opacity-25"
            >
              <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14.7 6.3C14.1 5.7 13.3 5.4 12.5 5.4C11.1 5.4 9.7 6.2 9.1 7.5C8.5 8.8 8.9 10.5 10 11.6L4 17.6C3.6 18 3.6 18.6 4 19C4.4 19.4 5 19.4 5.4 19L11.4 13C12.5 14.1 14.2 14.5 15.5 13.9C16.8 13.3 17.6 11.9 17.6 10.5C17.6 9.7 17.3 8.9 16.7 8.3" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M19.9922 8L21.9922 6" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15.9961 2L17.9961 4" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M19.9922 4L17.9922 6" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Box>
          )}
          
          {title === "Semantic Part Search" && (
            <Box
              position="absolute"
              right="10px"
              bottom="10px"
              width="120px"
              height="120px"
              opacity={0.15}
              zIndex={0}
              className="transition-opacity group-hover:opacity-25"
            >
              <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 21L16.65 16.65" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Box>
          )}
          
          {title === "Predictive Analytics Dashboard" && (
            <Box
              position="absolute"
              right="10px"
              bottom="10px"
              width="180px"
              height="180px"
              opacity={0.15}
              zIndex={0}
              className="transition-opacity group-hover:opacity-25"
            >
              <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3V21H21" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 14L11 10L15 14L21 8" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Box>
          )}

          {/* Wave animation inspired by GoogleGeminiEffect */}
          <Box
            as="svg"
            position="absolute"
            bottom="0"
            left="0"
            width="100%"
            height="40%"
            viewBox="0 0 400 100"
            preserveAspectRatio="none"
            opacity={0}
            transition="opacity 0.5s ease"
            _groupHover={{
              opacity: 0.1,
            }}
            zIndex={1}
          >
            <path
              d="M0 50 C 80 30, 150 70, 200 50 C 250 30, 300 70, 400 50 L 400 100 L 0 100 Z"
              fill={accentColor}
              opacity={0.5}
            >
              <animate
                attributeName="d"
                dur="5s"
                repeatCount="indefinite"
                values="
                  M0 50 C 80 30, 150 70, 200 50 C 250 30, 300 70, 400 50 L 400 100 L 0 100 Z;
                  M0 50 C 50 70, 100 30, 200 50 C 300 70, 350 30, 400 50 L 400 100 L 0 100 Z;
                  M0 50 C 80 30, 150 70, 200 50 C 250 30, 300 70, 400 50 L 400 100 L 0 100 Z
                "
              />
            </path>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

// Simple Chat component
const ChatBox = () => {
  const [messages, setMessages] = useState([
    { text: "Hello! How can I help you with automotive inventory management today?", isUser: false }
  ]);
  const [inputValue, setInputValue] = useState("");
  
  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    // Add user message
    setMessages([...messages, { text: inputValue, isUser: true }]);
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [
        ...prev, 
        { 
          text: "Thanks for your message! Our team will get back to you shortly with more information about our automotive inventory solutions.", 
          isUser: false 
        }
      ]);
    }, 1000);
    
    setInputValue("");
  };
  
  return (
    <Box 
      borderWidth="1px"
      borderColor="gray.700"
      borderRadius="md"
      bg="gray.800"
      p={4}
      width="100%"
      maxW="600px"
      mx="auto"
      mt={6}
    >
      <VStack spacing={4} align="stretch">
        <Box 
          p={4}
          borderRadius="md"
          height="300px"
          overflowY="auto"
          bg="gray.900"
          css={{
            '&::-webkit-scrollbar': {
              width: '4px',
            },
            '&::-webkit-scrollbar-track': {
              width: '6px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'gray',
              borderRadius: '24px',
            },
          }}
        >
          {messages.map((msg, index) => (
            <Box 
              key={index} 
              bg={msg.isUser ? 'brand.500' : 'gray.700'} 
              color={msg.isUser ? 'black' : 'white'}
              p={3} 
              borderRadius="md" 
              alignSelf={msg.isUser ? 'flex-end' : 'flex-start'}
              maxW="80%"
              mb={3}
              ml={msg.isUser ? 'auto' : 0}
            >
              {msg.text}
            </Box>
          ))}
        </Box>
        
        <Flex>
          <Input
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
            bg="gray.900"
            borderColor="gray.700"
            _hover={{ borderColor: 'gray.600' }}
            _focus={{ borderColor: 'brand.500' }}
            mr={2}
          />
          <Button 
            colorScheme="brand" 
            onClick={handleSendMessage}
          >
            Send
          </Button>
      </Flex>
      </VStack>
    </Box>
  );
};

// Animated heading component with scroll reveal
const AnimatedHeading: React.FC<React.PropsWithChildren<any>> = ({ children, ...props }) => {
  const ref = useRef<HTMLHeadingElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <Heading
      ref={ref}
      as="h2"
      animation={isVisible ? `${fadeInUnblur} 1.2s ease-out forwards` : 'none'}
      opacity={0}
      {...props}
    >
      {children}
    </Heading>
  );
};

// Trusted by section with Google Gemini Effect
const TrustedBySection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref as React.RefObject<HTMLElement>,
    offset: ["start 0.8", "end start"],
  });

  // Create transformed motion values with slightly faster completion timing
  const pathLengthFirst = useTransform(scrollYProgress, [0, 0.7], [0.2, 1.2]);
  const pathLengthSecond = useTransform(scrollYProgress, [0, 0.7], [0.15, 1.2]);
  const pathLengthThird = useTransform(scrollYProgress, [0, 0.7], [0.1, 1.2]);
  const pathLengthFourth = useTransform(scrollYProgress, [0, 0.7], [0.05, 1.2]);
  const pathLengthFifth = useTransform(scrollYProgress, [0, 0.7], [0, 1.2]);

  return (
    <Box 
      py={16} 
      bg="gray.900" 
      borderTop="1px" 
      borderColor="gray.800"
      h="60vh"
      ref={ref}
      position="relative"
      overflow="hidden"
    >
      <Container maxW="container.xl" h="full" position="relative">
        <Center position="absolute" top="10%" width="full" zIndex={2} flexDirection="column">
          <AnimatedHeading
            size="2xl"
            fontWeight="bold"
            letterSpacing="-0.03em"
            color="white"
            textAlign="center"
          >
            Automotive Repair Intelligence Platform
          </AnimatedHeading>
          <Text
            fontSize="lg"
            color="gray.300"
            maxW="700px"
            textAlign="center"
            mt={4}
            lineHeight="1.6"
            fontWeight="normal"
            letterSpacing="-0.01em"
            sx={{ animation: `${fadeInUnblur} 1.2s ease-out 0.2s forwards` }}
            opacity={0}
          >
            Our comprehensive suite of AI-powered tools helps automotive businesses optimize inventory, predict failures, and make data-driven decisions.
          </Text>
        </Center>
      
        <Box position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" w="full">
          <GoogleGeminiEffect 
            pathLengths={[
              pathLengthFirst,
              pathLengthSecond,
              pathLengthThird,
              pathLengthFourth,
              pathLengthFifth,
            ]}
          />
        </Box>
      </Container>
    </Box>
  );
};

const Home = () => {
  const heroBg = useColorModeValue('gray.50', 'gray.900');
  const accentBg = 'gray.800';
  const sectionBg = 'gray.800';
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = 'gray.700';
  const headingColor = useColorModeValue('gray.800', 'white');
  const accentColor = 'brand.400';
  const ctaBg = 'gray.800';
  
  // Create a ref to the LiveKitAgentUI component
  const liveKitAgentRef = useRef<LiveKitAgentUIHandle>(null);
  
  // State for tracking button loading state
  const [isLoading, setIsLoading] = useState(false);
  
  // Handle click for our custom positioned button
  const handleCustomChatClick = async () => {
    if (liveKitAgentRef.current) {
      setIsLoading(true);
      try {
        // Call the handleClick method of the LiveKitAgentUI component
        await liveKitAgentRef.current.handleClick();
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  // Animate elements on scroll
  const featureRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Initialize with all elements visible
    const featureElements = featureRef.current?.querySelectorAll('.feature-item');
    featureElements?.forEach((el) => {
      el.classList.add('animate-fade-in');
    });
    
    // Still set up observer for future scrolling
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
          }
        });
      },
      { threshold: 0.1 }
    );
    
    featureElements?.forEach((el) => observer.observe(el));
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <Box>
      {/* Hero Section - Render.com style */}
      <Box bg={heroBg} pt={{ base: 20, lg: 32 }} pb={{ base: 20, lg: 32 }} position="relative" overflow="hidden">
        {/* LiveKitAgentUI with ref - hide its button */}
        <LiveKitAgentUI ref={liveKitAgentRef} hideButton={true} />
        
        {/* Grid Animation */}
        <GridAnimation />
        
        {/* 3D Rotating Wheel - position it prominently but behind text */}
        <Box 
          position="absolute" 
          top="-10" 
          left="0" 
          right="0" 
          bottom="0" 
          zIndex={1} 
          pointerEvents="none"
          overflow="visible"
        >
          <RotatingWheel position="right" size={400} />
        </Box>
        
        <Container maxW="container.xl" position="relative" zIndex={4}>
          <Flex direction={{ base: 'column', lg: 'row' }} align={{ base: 'center', lg: 'flex-start' }} justify="space-between">
            <VStack 
              spacing={8} 
              align={{ base: 'center', lg: 'flex-start' }} 
              textAlign={{ base: 'center', lg: 'left' }}
              maxW={{ base: 'full', lg: '55%' }}
            >
            <Heading 
              as="h1" 
              size="4xl" 
                fontWeight="extrabold" 
                lineHeight="0.95"
                letterSpacing="-0.04em"
              color="white"
                sx={{ 
                  fontSize: { base: '3.8rem', md: '5.2rem' },
                  animation: `${fadeIn} 0.5s ease-out`
                }}
            >
              Your fastest path to automotive parts stock optimization
            </Heading>
            
            <Text 
              fontSize="xl" 
                color="gray.300" 
              mt={6}
                lineHeight="1.6"
                fontWeight="normal"
                letterSpacing="-0.01em"
                sx={{ animation: `${fadeIn} 0.5s ease-out 0.1s both` }}
            >
              Predict component failures, optimize inventory, and increase sales with the power of neural networks
            </Text>
            
            <Stack 
              direction={{ base: 'column', md: 'row' }} 
              spacing={4} 
              pt={10}
              w={{ base: 'full', md: 'auto' }}
                sx={{ animation: `${fadeIn} 0.5s ease-out 0.2s both` }}
            >
              <Button
                as={RouterLink}
                to="/new-distributor"
                size="lg"
                colorScheme="brand"
                fontWeight="medium"
                px={8}
                py={7}
                minW="220px"
                borderRadius="md"
                fontSize="md"
                letterSpacing="-0.01em"
                color="black"
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: 'lg',
                  color: 'white'
                }}
                rightIcon={<ChevronRightIcon />}
              >
                Distributor Dashboard
              </Button>
              <Button
                as={RouterLink}
                to="/mechanics"
                size="lg"
                variant="outline"
                colorScheme="gray"
                fontWeight="medium"
                px={8}
                py={7}
                minW="220px"
                borderRadius="md"
                fontSize="md"
                letterSpacing="-0.01em"
                borderColor="gray.600"
                color="white"
                rightIcon={<ChevronRightIcon />}
                _hover={{
                  borderColor: 'white',
                  transform: 'translateY(-2px)',
                  boxShadow: 'dark-lg'
                }}
              >
                Mechanics Dashboard
              </Button>
            </Stack>
          </VStack>
          </Flex>
        </Container>
        
        {/* Chat button positioned in front of particles */}
        <Box
          position="fixed"
          top="50%"
          right="40px"
          transform="translateY(-50%)"
          zIndex={10}
          sx={{ animation: `${fadeIn} 0.5s ease-out 0.3s both` }}
        >
          <Button
            onClick={handleCustomChatClick}
            size="lg"
            variant="outline"
            colorScheme="gray"
            fontWeight="medium"
            px={8}
            py={7}
            minW="220px"
            borderRadius="md"
            fontSize="md"
            letterSpacing="-0.01em"
            borderColor="gray.600"
            color="white"
            rightIcon={<ChevronRightIcon />}
            leftIcon={<ChatIconChakra />}
            isLoading={isLoading}
            display="none"
          >
            Click to Chat
          </Button>
        </Box>
      </Box>

      {/* Trusted by section with Google Gemini Effect */}
      <TrustedBySection />

      {/* Features Section */}
      <Box py={16} bg={heroBg} ref={featureRef}>
        <Container maxW="container.xl" px={{ base: 4, lg: 8 }}>
          <VStack spacing={10} align="center" width="full">
            <Box textAlign="center" width="full">
              <Text 
                fontSize="sm" 
                fontWeight="medium" 
                color="brand.500" 
                mb={3}
                letterSpacing="0.1em"
                textTransform="uppercase"
              >
                Features
              </Text>
            </Box>
            
            <Box 
              className="sm:py-18 container relative mx-auto px-6 py-8 md:py-16 lg:px-16 lg:py-16 xl:px-20 !pt-0"
              width="full"
              sx={{
                display: "grid",
                gridTemplateColumns: { 
                  base: "1fr", 
                  sm: "repeat(2, 1fr)",
                  md: "repeat(12, 1fr)" 
                },
                gridAutoRows: "auto",
                gridTemplateRows: {
                  md: "repeat(2, auto)"
                },
                gap: { base: 4, md: 6, xl: 8 },
                mx: "auto",
                maxWidth: { md: "90%", lg: "85%", xl: "80%" }
              }}
            >
              {[
                {
                  title: "Inventory Optimization",
                  text: "Reduce carrying costs while maintaining service levels with AI-driven stock recommendations based on regional demand patterns and seasonal trends.",
                  icon: <BoxIcon />,
                  color: "brand.500",
                  colSpan: "col-span-8 md:col-span-8 xl:col-span-8",
                  rowSpan: "md:row-span-1",
                  isWide: true
                },
                {
                  title: "Component Failure Prediction",
                  text: "Anticipate part failures before they happen using machine learning models trained on vehicle data, usage patterns, and environmental factors.",
                  icon: <WrenchIcon />,
                  color: "brand.500",
                  colSpan: "col-span-4 md:col-span-4 xl:col-span-4",
                  rowSpan: "md:row-span-1",
                  isWide: false
                },
                {
                  title: "Semantic Part Search",
                  text: "Locate exact parts using natural language queries that understand context, synonyms, and technical specifications without requiring exact part numbers.",
                  icon: <SearchIcon />,
                  color: "purple.500",
                  colSpan: "col-span-4 md:col-span-4 xl:col-span-4",
                  rowSpan: "md:row-span-1",
                  isWide: false
                },
                {
                  title: "Predictive Analytics Dashboard",
                  text: "Access comprehensive visualizations of failure rates, demand forecasts, and inventory health with actionable insights tailored to your business needs.",
                  icon: <ChartIcon />,
                  color: "purple.500",
                  colSpan: "col-span-8 md:col-span-8 xl:col-span-8",
                  rowSpan: "md:row-span-1",
                  isWide: true
                }
              ].map((feature, idx) => (
                <Box 
                  key={idx} 
                  className={`feature-item ${feature.colSpan} ${feature.rowSpan}`}
                  sx={{
                    opacity: 1,
                    transform: 'translateY(0)',
                    transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
                    transitionDelay: `${0.1 + idx * 0.1}s`,
                    width: '100%',
                    height: '100%',
                    gridRow: idx < 2 ? "1" : "2",
                    gridColumn: feature.isWide ? "span 8 / span 8" : "span 4 / span 4"
                  }}
                >
                  <FeatureCard
                    icon={feature.icon}
                    title={feature.title}
                    text={feature.text}
                    accentColor={feature.color}
                    isWide={feature.isWide}
                  />
                </Box>
              ))}
            </Box>
            
            {/* Tagline section - moved outside the grid for cleaner layout */}
            <Box 
              width="full" 
              textAlign="center" 
              mt={12} 
              mb={4}
              px={4}
              maxW="container.lg"
              mx="auto"
            >
              <Text 
                fontSize={{ base: "xl", sm: "2xl" }} 
                letterSpacing="-0.01em" 
                color="gray.400"
                fontWeight="normal"
                lineHeight="1.4"
              >
                <Box as="span" color="white" fontWeight="semibold">Predict with precision.</Box>
                &nbsp;Optimize inventory. Reduce downtime with neural networks.
              </Text>
              
              {/* Added Distributor Dashboard button */}
              <Box 
                width="full" 
                display="flex" 
                justifyContent="center" 
                mt={20}
                sx={{ 
                  animation: `${fadeIn} 0.5s ease-out 0.2s both` 
                }}
              >
                <Stack 
                  direction={{ base: 'column', md: 'row' }} 
                  spacing={4}
                >
                  <Button
                    as={RouterLink}
                    to="/new-distributor"
                    size="lg"
                    colorScheme="brand"
                    fontWeight="medium"
                    px={8}
                    py={7}
                    minW="220px"
                    borderRadius="md"
                    fontSize="md"
                    letterSpacing="-0.01em"
                    color="black"
                    _hover={{
                      transform: 'translateY(-2px)',
                      boxShadow: 'lg',
                      color: 'white'
                    }}
                    rightIcon={<ChevronRightIcon />}
                  >
                    Distributor Dashboard
                  </Button>
                  <Button
                    as={RouterLink}
                    to="/mechanics"
                    size="lg"
                    variant="outline"
                    colorScheme="gray"
                    fontWeight="medium"
                    px={8}
                    py={7}
                    minW="220px"
                    borderRadius="md"
                    fontSize="md"
                    letterSpacing="-0.01em"
                    borderColor="gray.600"
                    color="white"
                    rightIcon={<ChevronRightIcon />}
                    _hover={{
                      borderColor: 'white',
                      transform: 'translateY(-2px)',
                      boxShadow: 'dark-lg'
                    }}
                  >
                    Mechanics Dashboard
                  </Button>
                </Stack>
              </Box>
            </Box>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
};

export default Home; 