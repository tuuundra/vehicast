import { WebSocketClient } from '../api/websocket';
import { setupRealtimeChat } from '../api/api';

// Function to extract part suggestions from message content
export const extractPartSuggestions = (
  message: string, 
  query: string, 
  sampleParts: any[]
) => {
  const partSuggestions: any[] = [];
  
  // Check for part keywords in the message and query
  if (message.toLowerCase().includes('brake pad') || 
      query.toLowerCase().includes('brake pad')) {
    partSuggestions.push(sampleParts[0]); 
  }
  
  if (message.toLowerCase().includes('oil filter') || 
      query.toLowerCase().includes('oil filter')) {
    partSuggestions.push(sampleParts[1]);
  }
  
  if (message.toLowerCase().includes('spark plug') || 
      query.toLowerCase().includes('spark plug')) {
    partSuggestions.push(sampleParts[2]);
  }
  
  return partSuggestions.length > 0 ? partSuggestions : undefined;
};

// Function to format chatbot responses for better display 
export const formatChatResponse = (text: string): string => {
  // This improves formatting of numbered sections by making them into proper headings
  // Matches patterns like "1. Brake Components" at the beginning of a line
  if (!text) return text;
  
  // First, enhance major numbered headers (1., 2., 3., etc.)
  let enhancedText = text.replace(
    /^(\d+)\.\s+([^\n]+)$/gm,
    (match, number, title) => {
      return `**${number}. ${title}**`;
    }
  );
  
  // Remove excessive line breaks (more than 2 consecutive)
  enhancedText = enhancedText.replace(/\n{3,}/g, '\n\n');
  
  return enhancedText;
};

/**
 * Message preparation pipeline for display
 * Uses line-by-line processing to ensure consistent markdown rendering
 */
export const prepareMessageForDisplay = (text: string): string => {
  if (!text) return '';
  
  // Process the text line by line
  const lines = text.split('\n');
  const resultLines = [];
  let lastLineType = 'none'; // Track the type of the last line added
  
  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i].trim();
    
    // Skip empty lines in specific contexts to reduce spacing
    if (currentLine === '') {
      const nextLineIsNumbered = i < lines.length - 1 && /^\d+\./.test(lines[i+1].trim());
      const nextLineIsBullet = i < lines.length - 1 && /^[•\-\*]/.test(lines[i+1].trim());
      
      // If last line was a header/section and next is a numbered item, skip this blank line
      if ((lastLineType === 'header' && nextLineIsNumbered) ||
          (lastLineType === 'numbered' && nextLineIsBullet) ||
          (lastLineType === 'bullet' && nextLineIsNumbered) ||
          (lastLineType === 'numberedWithColon' && (nextLineIsBullet || nextLineIsNumbered))) {
        continue;
      }
    }
    
    // Process the current line based on its content
    if (/^#/.test(currentLine) || /^[A-Z][a-z]+ [A-Z][a-z]+$/.test(currentLine)) {
      // This is a header or section title
      resultLines.push(currentLine);
      lastLineType = 'header';
    }
    else if (/^\d+\.\s+.*:$/.test(currentLine)) {
      // This is a numbered item with a colon at the end (like "1. Brake Pads:")
      resultLines.push(currentLine);
      lastLineType = 'numberedWithColon';
    }
    else if (/^\d+\.\s*$/.test(currentLine)) {
      // This is a numbered item without content
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        
        if (/^[A-Za-z]/.test(nextLine) && !(/^\d+\./.test(nextLine)) && !(/^[•\-\*]/.test(nextLine))) {
          // Combine with the next line
          resultLines.push(`${currentLine} ${nextLine}`);
          
          // If the combined line ends with a colon, mark it as numberedWithColon
          if (/.*:$/.test(nextLine)) {
            lastLineType = 'numberedWithColon';
          } else {
            lastLineType = 'numbered';
          }
          
          i++; // Skip the next line
          continue;
        }
      }
      
      resultLines.push(currentLine);
      lastLineType = 'numbered';
    }
    else if (/^[•\-\*]/.test(currentLine)) {
      // This is a bullet point
      resultLines.push(currentLine);
      lastLineType = 'bullet';
    }
    else if (currentLine === '') {
      // Empty line - keep only if needed for separation
      resultLines.push(currentLine);
      // Don't update lastLineType for empty lines
    }
    else {
      // Any other content
      resultLines.push(currentLine);
      lastLineType = 'text';
    }
  }
  
  // Join the processed lines back together
  let processed = resultLines.join('\n');
  
  // Step 7: Fix spacing between headers and first numbered item
  processed = processed.replace(/^([A-Za-z].*?)\n\n(\d+\.)/gm, '$1\n$2');
  
  // Step 8: Fix spacing between sections
  processed = processed.replace(/\n\n\n+/g, '\n\n');
  
  // Step 9: Fix spacing between a section and its first bullet
  processed = processed.replace(/(\n\n)([•\-\*])/g, '\n$2');
  
  // Step 10: Fix spacing after the last bullet in a section before the next section
  processed = processed.replace(/([•\-\*].*\n\n)(\d+\.)/g, '$1\n$2');
  
  // Step 11: Fix spacing after numbered items with colons before bullets
  processed = processed.replace(/(\d+\.\s+.*:)\n\n([•\-\*])/g, '$1\n$2');
  
  return processed;
};

// Helper function to initiate a WebSocket connection
export const initializeWebSocketConnection = async (
  message: string,
  onDelta: (delta: string, buffer: string) => void,
  onComplete: (message: string) => void,
  onError: (error: string) => void
): Promise<WebSocketClient> => {
  try {
    // Set up realtime chat session
    const sessionData = await setupRealtimeChat(message);
    
    // Get or construct WebSocket URL - ideally this should be returned from the API
    const websocketUrl = sessionData.websocket_url || getWebSocketFallbackUrl();
    
    console.log('Connecting to WebSocket at:', websocketUrl);
    
    // Create and configure the WebSocket client
    const wsClient = new WebSocketClient(websocketUrl, sessionData.session_id);
    
    // Register callbacks
    wsClient.onDelta(onDelta);
    wsClient.onComplete(onComplete);
    wsClient.onError(onError);
    
    // Connect to the server
    await wsClient.connect();
    
    return wsClient;
  } catch (error) {
    console.error('Error initializing WebSocket connection:', error);
    throw error;
  }
};

// Utility to safely close a WebSocket connection
export const closeWebSocketConnection = (wsClient: WebSocketClient | null) => {
  if (wsClient) {
    try {
      wsClient.disconnect();
      return true;
    } catch (error) {
      console.error('Error closing WebSocket connection:', error);
      return false;
    }
  }
  return false;
};

// Fallback function to get WebSocket URL if not provided by the API
const getWebSocketFallbackUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.hostname;
  const port = '8765'; // Default WebSocket port
  
  return `${protocol}//${host}:${port}`;
}; 