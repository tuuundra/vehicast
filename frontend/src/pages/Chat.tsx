import React, { useState, useRef, useEffect } from 'react';
import { Box, Heading, Text, Container, Input, Button, VStack, HStack, Avatar, Flex, Spinner, Tabs, TabList, TabPanels, Tab, TabPanel } from '@chakra-ui/react';
import { sendChatMessage } from '../api/api';
import LiveKitVideo from '../components/LiveKitVideo';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

// Custom send button to avoid TypeScript issues with IconButton
const SendButton = ({ onClick, isDisabled }: { onClick: () => void; isDisabled: boolean }) => (
  <Button
    aria-label="Send message"
    colorScheme="brand"
    onClick={onClick}
    isDisabled={isDisabled}
    borderRadius="md"
    p={2}
  >
    Send
  </Button>
);

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your automotive assistant. How can I help you today?',
      sender: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Send message to API
      const response = await sendChatMessage(input);
      
      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.response || 'Sorry, I couldn\'t process your request.',
        sender: 'assistant',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, there was an error processing your request. Please try again.',
        sender: 'assistant',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Container maxW="container.md" h="calc(100vh - 200px)" display="flex" flexDirection="column">
      <Box mb={6}>
        <Heading as="h1" size="xl" mb={2}>
          Chat Assistant
        </Heading>
        <Text color="gray.600">
          Ask questions about our system, find parts, or get help with predictions
        </Text>
      </Box>

      <Tabs isFitted variant="enclosed" flex="1" display="flex" flexDirection="column">
        <TabList mb="1em">
          <Tab>Text Chat</Tab>
          <Tab>Video Chat</Tab>
        </TabList>

        <TabPanels flex="1" display="flex" flexDirection="column">
          <TabPanel p={0} flex="1" display="flex" flexDirection="column">
            <Box
              flex="1"
              overflowY="auto"
              bg="white"
              p={4}
              borderRadius="lg"
              shadow="md"
              mb={4}
            >
              <VStack spacing={4} align="stretch">
                {messages.map((message) => (
                  <Flex
                    key={message.id}
                    justify={message.sender === 'user' ? 'flex-end' : 'flex-start'}
                  >
                    <Box
                      maxW="80%"
                      bg={message.sender === 'user' ? 'brand.500' : 'gray.100'}
                      color={message.sender === 'user' ? 'white' : 'gray.800'}
                      p={3}
                      borderRadius="lg"
                      position="relative"
                    >
                      <HStack spacing={2} mb={2}>
                        <Avatar
                          size="xs"
                          name={message.sender === 'user' ? 'User' : 'Assistant'}
                          bg={message.sender === 'user' ? 'brand.700' : 'gray.300'}
                          color={message.sender === 'user' ? 'white' : 'gray.800'}
                        />
                        <Text fontWeight="bold" fontSize="sm">
                          {message.sender === 'user' ? 'You' : 'Assistant'}
                        </Text>
                      </HStack>
                      <Text>{message.text}</Text>
                      <Text fontSize="xs" color={message.sender === 'user' ? 'whiteAlpha.700' : 'gray.500'} mt={1}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </Box>
                  </Flex>
                ))}
                {loading && (
                  <Flex justify="flex-start">
                    <Box bg="gray.100" p={3} borderRadius="lg">
                      <HStack>
                        <Spinner size="sm" color="brand.500" />
                        <Text>Assistant is typing...</Text>
                      </HStack>
                    </Box>
                  </Flex>
                )}
                <div ref={messagesEndRef} />
              </VStack>
            </Box>

            <HStack as="form" onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                onKeyPress={handleKeyPress}
                bg="white"
                border="1px"
                borderColor="gray.200"
                _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)' }}
              />
              <SendButton
                onClick={handleSendMessage}
                isDisabled={!input.trim() || loading}
              />
            </HStack>
          </TabPanel>
          
          <TabPanel p={0} flex="1" display="flex" flexDirection="column">
            <Box flex="1" h="100%">
              <LiveKitVideo />
            </Box>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  );
};

export default Chat; 