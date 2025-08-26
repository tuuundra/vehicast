import React from 'react';
import { Box, Text, Flex, Image } from '@chakra-ui/react';

interface LogoProps {
  size?: string;
  onClick?: () => void;
}

const Logo: React.FC<LogoProps> = ({ size = '40px', onClick }) => {
  const sizeNum = parseInt(size);
  const fontSize = `${Math.max(sizeNum * 0.7, 18)}px`;
  
  return (
    <Flex 
      onClick={onClick} 
      cursor={onClick ? 'pointer' : 'default'}
      alignItems="center"
      gap={3}
    >
      <Box 
        width={size}
        height={size}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Image 
          src="/gearlogo.png" 
          alt="Vehicast Logo"
          maxWidth="100%"
          maxHeight="100%"
          objectFit="contain"
          filter="brightness(0) invert(1)"
          transition="all 0.3s ease"
          _hover={{
            filter: "brightness(0) invert(1) drop-shadow(0 0 3px rgba(255, 255, 255, 0.7))"
          }}
        />
      </Box>
      <Text 
        fontWeight="bold" 
        fontSize={fontSize} 
        letterSpacing="-0.01em"
        textTransform="uppercase"
        fontFamily="'Montserrat', sans-serif"
        color="white"
      >
        Vehicast
      </Text>
    </Flex>
  );
};

export default Logo; 