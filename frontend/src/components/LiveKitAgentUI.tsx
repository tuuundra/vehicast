import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import {
  LiveKitRoom,
  useVoiceAssistant,
  BarVisualizer,
  RoomAudioRenderer,
  VoiceAssistantControlBar,
  AgentState,
  TrackReferenceOrPlaceholder
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Box, Heading, Flex, useColorModeValue, Button } from '@chakra-ui/react';
import { ChatIcon, ChevronRightIcon } from '@chakra-ui/icons';
import ReactDOM from 'react-dom';

// Type assertion to fix TypeScript errors with LiveKit components
declare module '@livekit/components-react' {
  interface LiveKitRoomProps {
    children?: React.ReactNode;
  }
}

// Default values that will be overridden in production
const DEFAULT_LIVEKIT_URL = 'wss://your-livekit-server.livekit.cloud';

// Get environment variables if available
const LIVEKIT_SERVER_URL = process.env.REACT_APP_LIVEKIT_URL || DEFAULT_LIVEKIT_URL;
const TOKEN_ENDPOINT = process.env.REACT_APP_TOKEN_ENDPOINT || '/api/livekit/token';

// Create a dedicated container for the button that exists outside the React tree
const buttonContainer = document.createElement('div');
buttonContainer.style.position = 'fixed';
buttonContainer.style.top = '20px';
buttonContainer.style.right = '20px';
buttonContainer.style.zIndex = '2147483647'; // Maximum z-index value
buttonContainer.style.pointerEvents = 'none';
document.body.appendChild(buttonContainer);

// Export interface for imperative handle
export interface LiveKitAgentUIHandle {
  handleClick: () => Promise<void>;
  showAssistant: boolean;
}

export const LiveKitAgentUI = forwardRef<LiveKitAgentUIHandle, { hideButton?: boolean }>((props, ref) => {
  const { hideButton = false } = props;
  const [token, setToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const assistantRef = useRef<HTMLDivElement>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  // Declare all hooks unconditionally at the top level
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Initialize portal container in useEffect
  useEffect(() => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    setPortalContainer(container);
    return () => {
      document.body.removeChild(container);
    };
  }, []);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    handleClick: async () => {
      if (showAssistant) {
        setShowAssistant(false);
      } else {
        setIsLoading(true);
        try {
          const currentToken = await fetchToken();
          currentToken && setShowAssistant(true);
        } finally {
          setIsLoading(false);
        }
      }
    },
    showAssistant
  }));

  if (!portalContainer) return null; // Render nothing until container is ready

  const fetchToken = async () => {
    if (token) return token;
    setIsLoading(true);
    try {
      if (process.env.NODE_ENV === 'production') {
        const response = await fetch(TOKEN_ENDPOINT);
        const data = await response.json();
        setToken(data.token);
        return data.token;
      } else {
        return '';
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = async () => {
    if (showAssistant) {
      setShowAssistant(false);
    } else {
      setIsLoading(true);
      try {
        const currentToken = await fetchToken();
        currentToken && setShowAssistant(true);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <>
      {!hideButton && ReactDOM.createPortal(
        <Box
          position="fixed"
          top="20px"
          right="20px"
          zIndex="2147483647"
          pointerEvents="none"
        >
          <Button
            onClick={handleClick}
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
            leftIcon={<ChatIcon />}
            isLoading={isLoading}
            pointerEvents="auto"
            sx={{ 
              transform: 'translateZ(0)',
              willChange: 'transform',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '-20px',
                left: '-20px',
                right: '-20px',
                bottom: '-20px',
                background: 'rgba(255,0,0,0.1)',
                pointerEvents: 'none',
              },
              border: '2px solid red' // Temporary debug border
            }}
            _hover={{
              borderColor: 'white',
              transform: 'translateY(-2px)',
              boxShadow: 'dark-lg'
            }}
          >
            Click to Chat
          </Button>
        </Box>,
        portalContainer
      )}

      {/* Assistant rendered in normal flow */}
      {showAssistant && token && (
        <Box
          ref={assistantRef}
          position="fixed"
          top="12"
          right="20px"
          width="300px"
          bg={bgColor}
          borderRadius="md"
          boxShadow="md"
          border="1px"
          borderColor={borderColor}
          zIndex="2147483646"
          overflow="hidden"
        >
          <Heading size="md" p={4} borderBottom="1px" borderColor={borderColor}>
            Voice Assistant
          </Heading>
          {React.createElement(LiveKitRoom as any, {
            token: token,
            serverUrl: LIVEKIT_SERVER_URL,
            connect: true,
            audio: true,
            video: false,
            "data-lk-theme": "default",
            children: (
              <>
                <SimpleVoiceAssistant />
                <VoiceAssistantControlBar />
                <RoomAudioRenderer />
              </>
            )
          })}
        </Box>
      )}
    </>
  );
});

const SimpleVoiceAssistant: React.FC = () => {
  const { state, audioTrack } = useVoiceAssistant();
  
  return (
    <Flex direction="column" h="200px" p={4} align="center" justify="center">
      {/* Using type assertion to resolve TypeScript error */}
      {React.createElement(BarVisualizer as any, {
        state: state,
        barCount: 10,
        trackRef: audioTrack,
        style: { 
          width: '100%', 
          height: '120px',
          margin: '0 auto',
          transition: 'all 0.3s ease'
        }
      })}
      <Box mt={4} textAlign="center" fontWeight="medium">
        {getStateMessage(state)}
      </Box>
    </Flex>
  );
};

// Helper function to get appropriate message for each state
function getStateMessage(state: AgentState | undefined): string {
  switch (state) {
    case 'listening':
      return 'Listening...';
    case 'speaking':
      return 'Speaking...';
    case 'thinking':
      return 'Thinking...';
    default:
      return 'Ready to help';
  }
}

export default LiveKitAgentUI; 