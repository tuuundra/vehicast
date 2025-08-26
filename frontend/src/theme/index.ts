import { extendTheme } from '@chakra-ui/react';

// Define the color palette based on the provided screenshot
const colors = {
  brand: {
    50: '#e6f7f4',
    100: '#c2ebe3',
    200: '#9ddfd2',
    300: '#79d3c1',
    400: '#6dc4a7', // Mint green from screenshot
    500: '#3ecf8e', // Supabase brand green
    600: '#223936', // Dark navy from screenshot
    700: '#1a2c2a',
    800: '#111e1d',
    900: '#080f0f',
  },
  secondary: {
    50: '#eef1f1',
    100: '#d3d9d8',
    200: '#b8c1bf',
    300: '#9da9a6',
    400: '#8bccc3', // Light teal from screenshot
    500: '#536462', // Dark slate gray from screenshot
    600: '#3c4f4d', // Dark teal from screenshot
    700: '#2c3a38',
    800: '#1b2524',
    900: '#0a1010',
  },
  gray: {
    50: '#f2f2f3',
    100: '#d9dadc',
    200: '#c1c2c5',
    300: '#a8aaae',
    400: '#8f9297',
    500: '#767a80',
    600: '#5d6166',
    700: '#44484c',
    800: '#1c1c1c', // Very dark gray (Supabase style)
    900: '#121212', // Nearly black (Supabase style)
  },
  purple: {
    400: '#9d5cff',
    500: '#8b46ff', // Supabase purple
  },
  success: {
    500: '#10b981',
  },
  warning: {
    500: '#f59e0b',
  },
  error: {
    500: '#ef4444',
  },
};

// Define the font stack exactly matching Render.com
const fonts = {
  heading: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  mono: '"SF Mono", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", monospace',
};

// Define component styles
const components = {
  Button: {
    baseStyle: {
      fontWeight: 'medium',
      borderRadius: '0',
      letterSpacing: '-0.01em',
      _focus: {
        boxShadow: 'none',
      },
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      py: '20px',
      px: '24px',
    },
    variants: {
      solid: (props: any) => ({
        bg: 'transparent',
        color: 'white',
        position: 'relative',
        _before: {
          content: '""',
          position: 'absolute',
          inset: 0,
          zIndex: -2,
          bg: props.colorScheme === 'brand' ? 'brand.500' : props.colorScheme === 'purple' ? 'purple.500' : `${props.colorScheme}.500`,
        },
        _hover: {
          bg: 'transparent',
          transform: 'none',
          _disabled: {
            bg: 'transparent',
          },
        },
        '& > *': {
          zIndex: 5,
          position: 'relative',
        }
      }),
      outline: (props: any) => ({
        bg: 'transparent',
        color: props.colorScheme === 'brand' ? 'brand.500' : `${props.colorScheme}.500`,
        borderWidth: '1px',
        borderColor: props.colorScheme === 'brand' ? 'brand.500' : `${props.colorScheme}.500`,
        _hover: {
          bg: 'transparent',
          transform: 'none',
          borderColor: props.colorScheme === 'brand' ? 'brand.500' : `${props.colorScheme}.500`,
        },
        '& > *': {
          zIndex: 5,
          position: 'relative',
        }
      }),
      ghost: (props: any) => ({
        color: props.colorScheme === 'brand' ? 'brand.500' : `${props.colorScheme}.500`,
        _hover: {
          bg: 'transparent',
          transform: 'none',
        },
      }),
    },
    defaultProps: {
      colorScheme: 'brand',
    },
  },
  Card: {
    baseStyle: {
      container: {
        borderRadius: 'lg',
        boxShadow: 'sm',
        overflow: 'hidden',
        bg: 'white',
        _dark: {
          bg: 'gray.800',
          borderColor: 'gray.700',
        },
        transition: 'all 0.2s',
        _hover: {
          boxShadow: 'md',
        },
      },
      header: {
        py: 4,
        px: 6,
      },
      body: {
        py: 4,
        px: 6,
      },
      footer: {
        py: 4,
        px: 6,
      },
    },
  },
  Heading: {
    baseStyle: {
      fontWeight: '700',
      letterSpacing: '-0.03em',
      lineHeight: '1.1',
    },
    sizes: {
      '4xl': {
        fontSize: ['3.8rem', null, '5.2rem'],
        lineHeight: '0.95',
        fontWeight: '800',
        letterSpacing: '-0.04em',
      },
      '3xl': {
        fontSize: ['3rem', null, '3.75rem'],
        lineHeight: '1',
        fontWeight: '800',
        letterSpacing: '-0.03em',
      },
      '2xl': {
        fontSize: ['2.25rem', null, '2.75rem'],
        lineHeight: '1.1',
        fontWeight: '700',
        letterSpacing: '-0.03em',
      },
      'xl': {
        fontSize: ['1.75rem', null, '2rem'],
        lineHeight: '1.2',
        fontWeight: '700',
        letterSpacing: '-0.02em',
      },
    },
  },
  Input: {
    baseStyle: {
      field: {
        borderRadius: 'md',
        _focus: {
          boxShadow: 'none',
          borderColor: 'brand.500',
        },
      },
    },
  },
  Link: {
    baseStyle: {
      _hover: {
        textDecoration: 'none',
      },
    },
  },
  Text: {
    baseStyle: {
      letterSpacing: '-0.01em',
      lineHeight: '1.6',
    },
    sizes: {
      xl: {
        fontSize: 'xl',
        lineHeight: '1.6',
        fontWeight: 'normal',
      },
      lg: {
        fontSize: 'lg',
        lineHeight: '1.6',
        fontWeight: 'normal',
      }
    }
  },
};

// Define global styles
const styles = {
  global: () => ({
    body: {
      bg: 'gray.900',
      color: 'gray.100',
      letterSpacing: '-0.015em',
      fontFeatureSettings: '"ss01", "ss02", "ss03", "cv01", "cv02", "cv03", "cv04"',
    },
    // Add font preloading to ensure proper font display
    '@font-face': {
      fontFamily: 'Inter',
      fontStyle: 'normal',
      fontWeight: '100 900',
      fontDisplay: 'optional',
      src: `url(https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap)`,
    },
  }),
};

// Create the theme
const theme = extendTheme({
  colors,
  fonts,
  components,
  styles,
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
    disableTransitionOnChange: false, // We don't need transitions since we're only using dark mode
  },
  shadows: {
    outline: 'none',
  },
  layerStyles: {
    card: {
      bg: 'gray.800',
      borderRadius: 'lg',
      boxShadow: 'sm',
      p: 6,
    },
    section: {
      bg: 'gray.800',
      borderRadius: 'lg',
      boxShadow: 'sm',
      p: 8,
    },
  },
  textStyles: {
    h1: {
      fontSize: ['3xl', '4xl'],
      fontWeight: 'bold',
      lineHeight: '110%',
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: ['2xl', '3xl'],
      fontWeight: 'semibold',
      lineHeight: '110%',
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: ['xl', '2xl'],
      fontWeight: 'semibold',
      lineHeight: '110%',
    },
    subtitle: {
      fontSize: ['md', 'lg'],
      fontWeight: 'normal',
      lineHeight: '140%',
      color: 'gray.400',
    },
  },
});

export default theme; 