import React, { ReactNode, useState } from 'react';
import { 
  Box, 
  Container,
  Flex,
  Text,
  Button,
  IconButton,
  useDisclosure,
  useColorMode,
  useColorModeValue,
  HStack,
  Link as ChakraLink,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  keyframes
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon, MoonIcon, SunIcon } from '@chakra-ui/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo';

// Navigation links
const Links = [
  { name: 'Distributor Dashboard', path: '/new-distributor' },
  { name: 'Mechanics Dashboard', path: '/mechanics' },
];

// Line animation keyframes
const lineExpand = keyframes`
  0% { width: 0; left: 50%; right: 50%; }
  100% { width: 70%; left: 15%; right: 15%; }
`;

// NavLink component for consistent styling
const NavLink = ({ children, to, isActive }: { children: ReactNode; to: string; isActive: boolean }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <ChakraLink
      as={Link}
      to={to}
      px={4}
      py={2}
      position="relative"
      fontWeight="500"
      letterSpacing="0.02em"
      fontSize="15px"
      color={isActive ? 'white' : 'whiteAlpha.700'}
      _hover={{
        textDecoration: 'none',
        color: 'white',
      }}
      transition="all 0.2s"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      display="inline-block"
    >
      {children}
      <Box
        position="absolute"
        bottom={0}
        height="1px"
        bg="white"
        opacity={0.8}
        left="15%"
        right="15%"
        width={isActive || isHovered ? "70%" : "0"}
        margin="0 auto"
        transition="all 0.3s ease"
      />
    </ChakraLink>
  );
};

// Logo with underline animation
const LogoWithUnderline = () => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname === '/';
  
  return (
    <Box
      position="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      display="inline-block"
      cursor="pointer"
      onClick={() => navigate('/')}
      mr={{ base: 0, md: 6 }}
    >
      <Logo size="36px" />
      <Box
        position="absolute"
        bottom={-1}
        height="1px"
        bg="white"
        opacity={0.8}
        left="35%"
        width={isActive || isHovered ? "55%" : "0"}
        margin="0"
        marginLeft="auto"
        marginRight="5%"
        transition="all 0.3s ease"
      />
    </Box>
  );
};

// Layout component
export default function Layout({ children }: { children: ReactNode }) {
  const disclosure = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();
  const { colorMode, toggleColorMode } = useColorMode();
  
  // Check if current route is homepage
  const isHomePage = location.pathname === '/';
  
  return (
    <Box minH="100vh" bg="gray.900">
      <Box 
        as="header" 
        bg="rgba(10, 10, 15, 0.5)"
        backdropFilter="blur(10px)"
        borderBottom="1px"
        borderColor="whiteAlpha.100"
        position="sticky"
        top="0"
        zIndex="sticky"
        py={6} // Increased padding for taller header
        transition="all 0.3s ease"
      >
        <Container maxW="container.xl">
          <Flex alignItems="center" justifyContent="space-between">
            <Flex alignItems="center" gap={{ base: 4, md: 10 }}>
              <LogoWithUnderline />
              
              <HStack spacing={10} display={{ base: 'none', md: 'flex' }}>
                {Links.map((link) => (
                  <NavLink 
                    key={link.name} 
                    to={link.path}
                    isActive={location.pathname === link.path}
                  >
                    {link.name}
                  </NavLink>
                ))}
              </HStack>
            </Flex>
            
            <HStack spacing={4}>
              <NavLink to="/about" isActive={location.pathname === '/about'}>
                About
              </NavLink>
              <IconButton
                aria-label="Menu"
                display={{ base: 'flex', md: 'none' }}
                onClick={disclosure.onOpen}
                icon={<HamburgerIcon />}
                size="md"
                variant="ghost"
                color="whiteAlpha.800"
                _hover={{ color: 'white', bg: 'whiteAlpha.100' }}
              />
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Mobile drawer */}
      <Drawer
        isOpen={disclosure.isOpen}
        placement="right"
        onClose={disclosure.onClose}
        size="full"
      >
        <DrawerOverlay backdropFilter="blur(10px)" bg="rgba(0, 0, 0, 0.7)" />
        <DrawerContent bg="gray.900">
          <DrawerCloseButton color="gray.400" size="lg" mt={3} mr={3} />
          <DrawerHeader borderBottomWidth="1px" borderColor="whiteAlpha.100" py={6}>
            <Logo size="36px" />
          </DrawerHeader>
          <DrawerBody pt={10}>
            <VStack spacing={8} align="start">
              {Links.map((link) => (
                <NavLink 
                  key={link.name} 
                  to={link.path}
                  isActive={location.pathname === link.path}
                >
                  <Text fontSize="xl" fontWeight="500" onClick={disclosure.onClose}>
                    {link.name}
                  </Text>
                </NavLink>
              ))}
              <NavLink 
                to="/about"
                isActive={location.pathname === '/about'}
              >
                <Text fontSize="xl" fontWeight="500" onClick={disclosure.onClose}>
                  About
                </Text>
              </NavLink>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Box as="main">
        {children}
      </Box>

      {isHomePage && (
        <Box 
          as="footer" 
          bg="gray.900" 
          py={12} 
          borderTop="1px" 
          borderColor="whiteAlpha.100"
        >
          <Container maxW="container.xl">
            <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align="center">
              <Box mb={{ base: 6, md: 0 }}>
                <Logo size="28px" />
                <Text color="whiteAlpha.600" fontSize="sm" mt={2}>
                  © {new Date().getFullYear()} Vehicast. All rights reserved.
                </Text>
              </Box>
              
              <HStack spacing={10} color="whiteAlpha.600" fontSize="sm">
                <ChakraLink _hover={{ color: 'white' }}>Privacy</ChakraLink>
                <ChakraLink _hover={{ color: 'white' }}>Terms</ChakraLink>
                <ChakraLink _hover={{ color: 'white' }}>Contact</ChakraLink>
              </HStack>
            </Flex>
          </Container>
        </Box>
      )}
    </Box>
  );
} 