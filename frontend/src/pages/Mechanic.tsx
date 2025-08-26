import React, { useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Container, 
  useColorModeValue,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  SimpleGrid,
  Card,
  CardBody,
  Stack,
  Image,
  Divider,
  CardFooter,
  ButtonGroup,
  VStack,
  HStack,
  Spacer,
  Tag,
  CircularProgress,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Icon,
  Switch,
  FormControl,
  FormLabel,
  Tooltip,
} from '@chakra-ui/react';
import { SearchIcon, AddIcon, DeleteIcon, RepeatIcon, ArrowUpIcon, InfoIcon } from '@chakra-ui/icons';
import CollapsibleSidebar from '../components/CollapsibleSidebar';
import { 
  InventoryIcon, 
  PartsIcon
} from '../components/DashboardIcons';
import { useCart, CartItem } from '../context/CartContext';
import { sendChatMessage, setupRealtimeChat } from '../api/api';
import { WebSocketClient } from '../api/websocket';
import { extractPartSuggestions, initializeWebSocketConnection, closeWebSocketConnection, prepareMessageForDisplay } from '../utils/chatUtils';
import ReactMarkdown from 'react-markdown';

// Sample part data - would come from API in real implementation
const sampleParts = [
  {
    id: 'p1',
    name: 'Premium Brake Pads',
    partNumber: 'BP-12345',
    price: 79.99,
    compatibility: 'Honda CRV 2015-2018',
    image: 'https://via.placeholder.com/300x200',
    description: 'High-quality ceramic brake pads with noise reduction technology'
  },
  {
    id: 'p2',
    name: 'Synthetic Oil Filter',
    partNumber: 'OF-67890',
    price: 12.99,
    compatibility: 'Toyota Camry 2016-2022',
    image: 'https://via.placeholder.com/300x200',
    description: 'Long-lasting synthetic oil filter with advanced filtration'
  },
  {
    id: 'p3',
    name: 'Spark Plug Set (4)',
    partNumber: 'SP-24680',
    price: 24.95,
    compatibility: 'Multiple vehicles',
    image: 'https://via.placeholder.com/300x200',
    description: 'Platinum spark plugs for improved fuel efficiency and engine performance'
  }
];

// Message type for chat history
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  partSuggestions?: Array<{
    id: string;
    name: string;
    partNumber: string;
    price: number;
    compatibility: string;
    image: string;
    description: string;
  }>;
  isStreaming?: boolean;
}

// Search content component
const SearchContent = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [chatMode, setChatMode] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [messageHistory, setMessageHistory] = useState<Array<{role: string, content: string}>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { addItem } = useCart();
  const toast = useToast();
  const [isRealtime, setIsRealtime] = useState(true);
  const webSocketClientRef = useRef<WebSocketClient | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Suggested prompts - mix of specific part queries and general questions
  const suggestedPrompts = [
    "Find brakes for 2017 Honda CRV",
    "How do I diagnose grinding noise when braking?",
    "Troubleshooting steps for a car that won't start",
    "What's the difference between synthetic and conventional oil?"
  ];

  // Scrolls chat to the bottom
  const scrollToBottom = () => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Effect to scroll to bottom whenever chat history changes
  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  // Effect to clean up WebSocket connection on unmount
  useEffect(() => {
    return () => {
      if (webSocketClientRef.current) {
        webSocketClientRef.current.disconnect();
        webSocketClientRef.current = null;
      }
    };
  }, []);

  // Handle regular chat submission
  const handleRegularSubmit = async (currentQuery: string) => {
    try {
      // Call the actual API endpoint
      const response = await sendChatMessage(currentQuery);
      
      // Process the response
      const aiResponse = response.response;
      
      // Extract part information if available
      const partSuggestions = extractPartSuggestions(aiResponse, currentQuery, sampleParts);
      
      // Add AI response to chat history
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        partSuggestions
      }]);
    } catch (error) {
      console.error("Error fetching chat response:", error);
      
      // Add error message to chat history
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, I encountered an error while processing your request. Please try again later.",
        timestamp: new Date()
      }]);
      
      // Show toast
      toast({
        title: 'Error',
        description: 'Failed to get response from the server.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Handle realtime chat submission
  const handleRealtimeSubmit = async (currentQuery: string) => {
    try {
      // Add user message to OpenAI message history
      const updatedHistory = [
        ...messageHistory,
        { role: 'user', content: currentQuery }
      ];
      setMessageHistory(updatedHistory);
      
      // Add user message to chat display history
      setChatHistory(prev => [...prev, {
        role: 'user',
        content: currentQuery,
        timestamp: new Date(),
        isStreaming: false
      }]);

      // Add empty assistant message for streaming
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true
      }]);

      const onDelta = (delta: string, buffer: string) => {
        setChatHistory(prev => {
          const newHistory = [...prev];
          const lastMessage = newHistory[newHistory.length - 1];
          if (lastMessage && lastMessage.role === 'assistant' && lastMessage.isStreaming) {
            // Apply formatting even during streaming for a consistent experience
            lastMessage.content = prepareMessageForDisplay(buffer);
          }
          return newHistory;
        });
      };

      const onComplete = (finalMessage: string) => {
        setChatHistory(prev => {
          const newHistory = [...prev];
          const lastMessage = newHistory[newHistory.length - 1];
          if (lastMessage && lastMessage.role === 'assistant' && lastMessage.isStreaming) {
            // Apply full formatting to the final message
            lastMessage.content = prepareMessageForDisplay(finalMessage);
            lastMessage.isStreaming = false;
            
            // Extract part suggestions based on keywords
            const partSuggestions = extractPartSuggestions(finalMessage, currentQuery, sampleParts);
            if (partSuggestions) {
              lastMessage.partSuggestions = partSuggestions;
            }
          }
          return newHistory;
        });
        
        // Add assistant response to OpenAI message history
        setMessageHistory(prev => [...prev, {
          role: 'assistant',
          content: finalMessage
        }]);
        
        setIsSearching(false);

        // Focus the input after message completion
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 0);
      };

      const onError = (error: string) => {
        console.error("WebSocket error:", error);
        setChatHistory(prev => {
          const newHistory = [...prev];
          const lastMessage = newHistory[newHistory.length - 1];
          if (lastMessage && lastMessage.role === 'assistant' && lastMessage.isStreaming) {
            lastMessage.content = "I'm sorry, I encountered an error while processing your request. Please try again.";
            lastMessage.isStreaming = false;
          }
          return newHistory;
        });
        
        toast({
          title: 'Connection Error',
          description: 'Failed to connect to chat server. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        
        setIsSearching(false);
      };

      if (!webSocketClientRef.current) {
        // Initialize new WebSocket connection
        console.log('Creating new WebSocket connection');
        const wsClient = await initializeWebSocketConnection(
          currentQuery,
          onDelta,
          onComplete,
          onError
        );
        
        webSocketClientRef.current = wsClient;
        
        // Send the message with history
        wsClient.sendMessageWithHistory(currentQuery, updatedHistory);
      } else {
        console.log('Reusing existing WebSocket connection');
        // Reuse existing connection
        webSocketClientRef.current.sendMessageWithHistory(currentQuery, updatedHistory);
      }
    } catch (error) {
      console.error("Error in realtime chat:", error);
      
      // Add error message to chat history - simplified to avoid type errors
      setChatHistory(prev => [
        ...prev.slice(0, -1), // Remove the last message if it was a streaming assistant message
        {
          role: 'assistant',
          content: "I'm sorry, I encountered an error while processing your request. Please try again.",
          timestamp: new Date(),
          isStreaming: false
        }
      ]);
      
      toast({
        title: 'Error',
        description: 'Failed to set up realtime chat session.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      
      setIsSearching(false);
    }
  };

  // Handle search/chat submission
  const handleSubmit = async () => {
    // Make sure there's text to submit
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    // Store current query for processing
    const query = searchQuery;
    
    // Clear input field
    setSearchQuery('');
    
    // Note: We don't add the user message to chat history here anymore
    // because it will be added in handleRealtimeSubmit
    
    // Switch to chat mode if not already
    if (!chatMode) {
      setChatMode(true);
    }
    
    // Switch to realtime chat mode
    if (isRealtime) {
      await handleRealtimeSubmit(query);
    } else {
      await handleRegularSubmit(query);
    }

    // Focus the input after sending the message
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  };

  // Handle suggested prompt
  const handleSuggestedPrompt = async (prompt: string) => {
    // Instead of setting the search query and calling handleSubmit,
    // directly call handleRealtimeSubmit with the prompt
    
    // Switch to chat mode if not already
    if (!chatMode) {
      setChatMode(true);
    }
    
    setIsSearching(true);
    
    // Directly submit via handleRealtimeSubmit
    await handleRealtimeSubmit(prompt);
  };

  // Handle adding item to cart
  const handleAddToCart = (part: any) => {
    const cartItem: CartItem = {
      id: part.id,
      name: part.name,
      partNumber: part.partNumber,
      price: part.price,
      quantity: 1,
      image: part.image,
      compatibility: part.compatibility
    };
    
    addItem(cartItem);
    
    toast({
      title: 'Added to cart',
      description: `${part.name} has been added to your cart.`,
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  // Reset the chat
  const handleNewChat = () => {
    setChatMode(false);
    setChatHistory([]);
    setMessageHistory([]); // Clear OpenAI message history
    closeWebSocketConnection(webSocketClientRef.current);
    webSocketClientRef.current = null;
    setSearchQuery('');
  };

  return (
    <Flex 
      direction="column" 
      h="100vh"
      position="relative"
      bg="gray.900"
    >
      {/* Chat History Area */}
      {chatMode && (
        <Flex 
          direction="column"
          flex="1" 
          width="100%"
          py={6}
          pt={28} /* Increased top padding for more space from header */
          px={4}
          pb={36} /* Increased bottom padding to ensure content isn't hidden behind input */
          alignItems="center" /* Center the messages horizontally */
        >
          <Flex
            direction="column"
            width="100%"
            maxWidth="800px" /* Match the width of the input box */
          >
            {chatHistory.map((message, index) => (
              <Flex 
                key={index}
                flexDirection="column"
                alignSelf={message.role === 'user' ? 'flex-end' : 'flex-start'}
                maxW={message.role === 'user' ? "70%" : "90%"}
                mb={4}
              >
                {message.role === 'user' ? (
                  // User message with bubble
                  <Box
                    bg="gray.800"
                    borderRadius="lg"
                    p={4}
                    boxShadow="sm"
                  >
                    <Text whiteSpace="pre-wrap" color="white">{message.content}</Text>
                  </Box>
                ) : (
                  // Assistant message without bubble - now using ReactMarkdown for formatting
                  <Box pl={1} maxWidth="100%">
                    <Box 
                      whiteSpace="pre-wrap" 
                      className="markdown-content"
                    >
                      <ReactMarkdown
                        components={{
                          // Add custom components for lists to control spacing
                          ol: ({node, ...props}) => <ol className="custom-numbered-list" {...props} />,
                          ul: ({node, ...props}) => <ul className="custom-bullet-list" {...props} />,
                          li: ({node, ...props}) => <li className="custom-list-item" {...props} />
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                      {message.isStreaming && (
                        <Box as="span" ml={1} display="inline-block" animation="pulse 1.5s infinite">▋</Box>
                      )}
                    </Box>
                  </Box>
                )}
                
                {/* If there are part suggestions, show them */}
                {message.role === 'assistant' && message.partSuggestions && message.partSuggestions.length > 0 && (
                  <SimpleGrid columns={1} spacing={4} mt={6} width="100%">
                    {message.partSuggestions.map(part => (
                      <Card key={part.id} maxW="sm" bg="gray.800" borderColor="gray.700" borderWidth="1px">
                        <CardBody>
                          <Image
                            src={part.image}
                            alt={part.name}
                            borderRadius="lg"
                            height="120px"
                            objectFit="cover"
                          />
                          <Stack mt="4" spacing="2">
                            <Heading size="md">{part.name}</Heading>
                            <Text fontSize="sm">{part.compatibility}</Text>
                            <Text color="blue.400" fontSize="xl">
                              ${part.price.toFixed(2)}
                            </Text>
                          </Stack>
                        </CardBody>
                        <Divider color="gray.700" />
                        <CardFooter pt={2}>
                          <ButtonGroup spacing="2">
                            <Button variant="solid" colorScheme="blue" size="sm" onClick={() => handleAddToCart(part)}>
                              Add to cart
                            </Button>
                          </ButtonGroup>
                        </CardFooter>
                      </Card>
                    ))}
                  </SimpleGrid>
                )}
              </Flex>
            ))}
            <div ref={chatEndRef} />
          </Flex>
        </Flex>
      )}
      
      {/* Centered initial view - only shown when not in chat mode */}
      {!chatMode && (
        <Flex 
          direction="column" 
          flex="1" 
          width="100%" 
          height="100%" 
          justifyContent="center" 
          alignItems="center"
          px={4}
        >
          <Text fontSize="2xl" fontWeight="bold" mb={8} color="white">
            What can I help with?
          </Text>
          
          {/* Input box - centered version */}
          <Box 
            width="100%"
            maxW="800px"
            mb={8}
            transition="all 0.3s ease"
          >
            <Flex 
              position="relative"
              align="center"
              borderRadius="lg"
              bg="gray.800"
              border="1px solid"
              borderColor="gray.700"
              overflow="hidden"
              transition="all 0.2s ease"
              boxShadow="lg"
            >
              <Flex 
                px={4} 
                py={3} 
                flex="1"
                align="center"
              >
                <Input 
                  placeholder="Ask anything about automotive parts, issues, or repairs..."
                  variant="unstyled"
                  flex="1"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                  fontSize="md"
                  ref={inputRef}
                />
              </Flex>
              
              <Flex align="center" pr={2}>
                {/* Send button */}
                {searchQuery.trim() && !isSearching ? (
                  // Enabled state - has text and not searching
                  <Box
                    color="gray.400"
                    onClick={handleSubmit}
                    opacity={1}
                    cursor="pointer"
                    h="36px"
                    w="36px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    transition="opacity 0.2s ease"
                    _hover={{
                      opacity: 0.5
                    }}
                  >
                    <Box borderRadius="full" bg="white" p={0} width="24px" height="24px" display="flex" alignItems="center" justifyContent="center">
                      <ArrowUpIcon boxSize={3.5} color="black" />
                    </Box>
                  </Box>
                ) : (
                  // Disabled states
                  <Box
                    color="gray.400"
                    opacity={0.5}
                    cursor={searchQuery.trim() ? "not-allowed" : "default"}
                    h="36px"
                    w="36px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {/* Show search icon when empty, arrow when typing but disabled */}
                    {searchQuery.trim() ? (
                      <Box borderRadius="full" bg="white" p={0} width="24px" height="24px" display="flex" alignItems="center" justifyContent="center">
                        <ArrowUpIcon boxSize={3.5} color="black" />
                      </Box>
                    ) : (
                      <SearchIcon boxSize={5} />
                    )}
                  </Box>
                )}
              </Flex>
            </Flex>
          </Box>
          
          {/* Suggested prompts - centered below input */}
          <Flex 
            wrap="wrap" 
            gap={2} 
            justify="center"
            maxW="700px"
          >
            {suggestedPrompts.map((prompt, index) => (
              <Box 
                key={index}
                bg="gray.800"
                borderRadius="md"
                p={2}
                cursor="pointer"
                _hover={{ bg: "gray.700" }}
                onClick={() => handleSuggestedPrompt(prompt)}
                borderWidth="1px"
                borderColor="gray.700"
                fontSize="sm"
              >
                <Text>{prompt}</Text>
              </Box>
            ))}
          </Flex>
        </Flex>
      )}
      
      {/* Input Area - Only shown when in chat mode, fixed at bottom */}
      {chatMode && (
        <Box 
          position="fixed"
          bottom={0} /* Changed from 4 to 0 to extend all the way to bottom */
          left={0}
          right={0}
          py={3}
          display="flex"
          justifyContent="center"
          alignItems="center"
          zIndex={10}
          bg="gray.900" /* Match the page background */
          pb={6} /* Keep padding at bottom */
          marginLeft="60px" /* Add margin to prevent overlap with sidebar */
        >
          <Flex 
            position="relative"
            align="center"
            borderRadius="lg"
            bg="gray.800"
            border="1px solid"
            borderColor="gray.700"
            overflow="hidden"
            transition="all 0.2s ease"
            maxWidth="800px" /* Set max width to match initial state */
            width="95%" /* Slightly less than 100% to add space on sides */
          >
            <Flex 
              px={4} 
              py={3} 
              flex="1"
              align="center"
            >
              <Input 
                placeholder="Message AI Mechanic Assistant..."
                variant="unstyled"
                flex="1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                fontSize="md"
                disabled={isSearching && isRealtime}
                ref={inputRef}
              />
            </Flex>
            
            <Flex align="center" pr={2}>
              {/* Send button */}
              {searchQuery.trim() && !isSearching ? (
                // Enabled state - has text and not searching
                <Box
                  color="gray.400"
                  onClick={handleSubmit}
                  opacity={1}
                  cursor="pointer"
                  h="36px"
                  w="36px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  transition="opacity 0.2s ease"
                  _hover={{
                    opacity: 0.5
                  }}
                >
                  <Box borderRadius="full" bg="white" p={0} width="24px" height="24px" display="flex" alignItems="center" justifyContent="center">
                    <ArrowUpIcon boxSize={3.5} color="black" />
                  </Box>
                </Box>
              ) : (
                // Disabled states
                <Box
                  color="gray.400"
                  opacity={0.5}
                  cursor={searchQuery.trim() ? "not-allowed" : "default"}
                  h="36px"
                  w="36px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  {/* Show search icon when empty, arrow when typing but disabled */}
                  {searchQuery.trim() ? (
                    <Box borderRadius="full" bg="white" p={0} width="24px" height="24px" display="flex" alignItems="center" justifyContent="center">
                      <ArrowUpIcon boxSize={3.5} color="black" />
                    </Box>
                  ) : (
                    <SearchIcon boxSize={5} />
                  )}
                </Box>
              )}
            </Flex>
          </Flex>
        </Box>
      )}
    </Flex>
  );
};

// Cart content component
const CartContent = () => {
  const { items, removeItem, updateQuantity, subtotal, tax, total } = useCart();
  const toast = useToast();

  const handleRemoveItem = (id: string, name: string) => {
    removeItem(id);
    toast({
      title: 'Item removed',
      description: `${name} has been removed from your cart.`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box p={6}>
      <Heading size="lg" mb={6}>Shopping Cart</Heading>
      
      {items.length === 0 ? (
        <Box mb={6}>
          <Text fontSize="md" color="gray.500">
            Your cart is currently empty. Use the search to find and add parts.
          </Text>
        </Box>
      ) : (
        <Box>
          <Table variant="simple" colorScheme="gray" mb={6}>
            <Thead>
              <Tr>
                <Th>Product</Th>
                <Th>Quantity</Th>
                <Th isNumeric>Price</Th>
                <Th isNumeric>Total</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {items.map(item => (
                <Tr key={item.id}>
                  <Td>
                    <VStack align="start">
                      <Text fontWeight="bold">{item.name}</Text>
                      <Text fontSize="sm" color="gray.500">Part #: {item.partNumber}</Text>
                      {item.compatibility && (
                        <Text fontSize="xs" color="gray.500">{item.compatibility}</Text>
                      )}
                    </VStack>
                  </Td>
                  <Td>
                    <HStack>
                      <Button 
                        size="xs" 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        -
                      </Button>
                      <Text>{item.quantity}</Text>
                      <Button 
                        size="xs"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </Button>
                    </HStack>
                  </Td>
                  <Td isNumeric>${item.price.toFixed(2)}</Td>
                  <Td isNumeric>${(item.price * item.quantity).toFixed(2)}</Td>
                  <Td>
                    <Button 
                      size="sm" 
                      colorScheme="red" 
                      variant="ghost"
                      leftIcon={<DeleteIcon />}
                      onClick={() => handleRemoveItem(item.id, item.name)}
                    >
                      Remove
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          
          <Flex justifyContent="flex-end" mb={8}>
            <Box width="300px">
              <VStack align="stretch" spacing={4} p={4} bg="gray.800" borderRadius="md">
                <Flex justify="space-between">
                  <Text>Subtotal</Text>
                  <Text>${subtotal.toFixed(2)}</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text>Estimated Tax</Text>
                  <Text>${tax.toFixed(2)}</Text>
                </Flex>
                <Divider />
                <Flex justify="space-between" fontWeight="bold">
                  <Text>Total</Text>
                  <Text>${total.toFixed(2)}</Text>
                </Flex>
                <Button colorScheme="blue" size="lg">Proceed to Checkout</Button>
              </VStack>
            </Box>
          </Flex>
        </Box>
      )}
    </Box>
  );
};

// Order History content component
const OrderHistoryContent = () => (
  <Box p={6}>
    <Heading size="lg" mb={6}>Order History</Heading>
    <Text>View your past orders and reorder commonly purchased items.</Text>
    
    <Box mt={8}>
      <Text fontSize="md" color="gray.500" mb={4}>
        No recent orders found.
      </Text>
      
      {/* Sample orders that would appear when there is order history */}
      <SimpleGrid columns={1} spacing={6} display="none">
        <Box p={5} bg="gray.800" borderRadius="md" borderWidth="1px" borderColor="gray.700">
          <Flex justify="space-between" mb={4}>
            <VStack align="start" spacing={1}>
              <Text fontWeight="bold">Order #12345</Text>
              <Text fontSize="sm" color="gray.500">March 15, 2023</Text>
            </VStack>
            <Badge colorScheme="green">Completed</Badge>
          </Flex>
          <Divider mb={4} />
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <Box>
              <Text fontSize="sm" fontWeight="bold">Items</Text>
              <Text fontSize="sm">3x Premium Brake Pads</Text>
              <Text fontSize="sm">1x Synthetic Oil (5qt)</Text>
            </Box>
            <Box>
              <Text fontSize="sm" fontWeight="bold">Total</Text>
              <Text fontSize="md">$157.45</Text>
              <Button size="sm" colorScheme="blue" mt={2}>Reorder</Button>
            </Box>
          </SimpleGrid>
        </Box>
      </SimpleGrid>
    </Box>
  </Box>
);

export default function Mechanic() {
  const [activeSection, setActiveSection] = useState(0);
  const bgColor = useColorModeValue('gray.900', 'gray.900');
  const textColor = useColorModeValue('white', 'white');
  const { itemCount } = useCart();

  // Define sidebar items
  const navItems = [
    {
      icon: <SearchIcon />,
      label: 'Search',
      onClick: () => setActiveSection(0)
    },
    {
      icon: <PartsIcon />,
      label: 'Cart',
      onClick: () => setActiveSection(1)
    },
    {
      icon: <InventoryIcon />,
      label: 'Order History',
      onClick: () => setActiveSection(2)
    }
  ];

  // Render the active content section
  const renderContent = () => {
    switch (activeSection) {
      case 0:
        return <SearchContent />;
      case 1:
        return <CartContent />;
      case 2:
        return <OrderHistoryContent />;
      default:
        return <SearchContent />;
    }
  };

  return (
    <Box bg={bgColor} color={textColor} minH="100vh">
      <Flex height="100%">
        <CollapsibleSidebar 
          navItems={navItems.map((item, index) => 
            index === 1 ? 
              {...item, label: `Cart${itemCount > 0 ? ` (${itemCount})` : ''}`} : 
              item
          )} 
          activeIndex={activeSection}>
          {/* This is required as CollapsibleSidebar expects children */}
          <></>
        </CollapsibleSidebar>
        <Box flex="1">
          <Container maxW="container.xl" px={6}>
            {renderContent()}
          </Container>
        </Box>
      </Flex>
    </Box>
  );
} 