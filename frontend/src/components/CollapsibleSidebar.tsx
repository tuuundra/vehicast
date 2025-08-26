import React, { ReactNode, useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Icon,
  VStack,
  Text,
} from '@chakra-ui/react';
import { motion, Variants } from 'framer-motion';
import { ChevronRightIcon } from '@chakra-ui/icons';

// Define the nav item interface
interface NavItem {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
}

interface CollapsibleSidebarProps {
  children: ReactNode;
  navItems: NavItem[];
  activeIndex?: number;
}

const MotionBox = motion(Box);

const CollapsibleSidebar = ({ children, navItems, activeIndex = 0 }: CollapsibleSidebarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  // Check for mobile view on mount and window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    // Initial check
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Animation variants for the sidebar
  const sidebarVariants: Variants = {
    expanded: { width: "240px", x: 0 },
    collapsed: { width: "60px", x: "-5px" },
    hidden: { width: "240px", x: "-100%" }
  };

  // Animation variants for the content
  const contentVariants: Variants = {
    expanded: { marginLeft: isMobileView ? "0" : "240px" },
    collapsed: { marginLeft: isMobileView ? "0" : "55px" },
    hidden: { marginLeft: "0" }
  };

  const currentSidebarState = isMobileView 
    ? (isExpanded ? "expanded" : "hidden") 
    : (isExpanded ? "expanded" : "collapsed");

  return (
    <Flex>
      {/* Sidebar */}
      <MotionBox
        variants={sidebarVariants}
        animate={currentSidebarState}
        initial={isMobileView ? "hidden" : "collapsed"}
        transition={{ duration: 0.3 }}
        position="fixed"
        top="86px" // Position below the header
        left="0"
        h="calc(100vh - 86px)" // Account for the header height
        bg="gray.800"
        borderRight="1px"
        borderColor="whiteAlpha.100"
        zIndex={10}
        pt={4}
        onMouseEnter={() => !isMobileView && setIsExpanded(true)}
        onMouseLeave={() => !isMobileView && setIsExpanded(false)}
        overflow="hidden"
        display={{ base: isExpanded ? "block" : "none", md: "block" }}
        sx={{
          '.sidebar-item-icon': {
            marginRight: isExpanded ? '16px' : '0',
            width: '24px',
            minWidth: '24px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            transition: 'margin 0.3s'
          },
          '.sidebar-item-label': {
            opacity: isExpanded ? 1 : 0,
            visibility: isExpanded ? 'visible' : 'hidden',
            transition: isExpanded 
              ? 'opacity 0.15s, visibility 0s' 
              : 'opacity 0.05s, visibility 0s 0.05s',
            maxWidth: isExpanded ? '180px' : '0',
            overflow: 'hidden'
          }
        }}
      >
        <VStack align="start" spacing={1} px={2} width="100%">
          {navItems.map((item, index) => (
            <Flex
              key={index}
              p={3}
              pl={2} // Reduced left padding to match the sidebar edge
              mb={2}
              alignItems="center"
              borderRadius="md"
              cursor="pointer"
              color={index === activeIndex ? "white" : "whiteAlpha.700"}
              bg={index === activeIndex ? "whiteAlpha.200" : "transparent"}
              _hover={{ bg: "whiteAlpha.100", color: "white" }}
              onClick={() => {
                item.onClick && item.onClick();
                if (isMobileView) setIsExpanded(false);
              }}
              transition="all 0.2s"
              whiteSpace="nowrap"
              width="calc(100% - 1px)" // Slightly narrower than 100%
              mx="2px" // Smaller margin to align better with sidebar edge
              position="relative"
            >
              <Box className="sidebar-item-icon">
                {item.icon}
              </Box>
              <Text 
                className="sidebar-item-label"
                fontWeight={index === activeIndex ? "semibold" : "normal"}
              >
                {item.label}
              </Text>
            </Flex>
          ))}
        </VStack>
      </MotionBox>

      {/* Mobile toggle button */}
      {isMobileView && (
        <Box 
          position="fixed" 
          bottom="20px" 
          left="20px" 
          zIndex="20"
          bg="blue.500"
          color="white"
          p={3}
          borderRadius="full"
          boxShadow="lg"
          cursor="pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Icon 
            as={ChevronRightIcon} 
            boxSize={5} 
            transform={isExpanded ? "rotate(180deg)" : "rotate(0deg)"} 
            transition="transform 0.3s"
          />
        </Box>
      )}

      {/* Main content */}
      <MotionBox
        variants={contentVariants}
        animate={currentSidebarState}
        initial={isMobileView ? "hidden" : "collapsed"}
        transition={{ duration: 0.3 }}
        width="100%"
        minH="calc(100vh - 86px)" // Account for the header height
        p={6}
      >
        {children}
      </MotionBox>
    </Flex>
  );
};

export default CollapsibleSidebar;