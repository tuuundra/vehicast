/**
 * WebSocket client for real-time communication with OpenAI
 */

// Define event listener types
export type MessageCallback = (message: string) => void;
export type DeltaCallback = (delta: string, buffer: string) => void;
export type ErrorCallback = (error: string) => void;
export type ConnectedCallback = (clientId: string) => void;

// Define WebSocket message types
interface BaseWebSocketMessage {
  type: string;
}

interface ConnectedMessage extends BaseWebSocketMessage {
  type: 'connected';
  client_id: string;
  message: string;
}

interface SessionCreatedMessage extends BaseWebSocketMessage {
  type: 'session_created';
  session_id: string;
}

interface DeltaMessage extends BaseWebSocketMessage {
  type: 'delta';
  delta: string;
  buffer: string;
}

interface CompleteMessage extends BaseWebSocketMessage {
  type: 'complete';
  message: string;
}

interface ErrorMessage extends BaseWebSocketMessage {
  type: 'error';
  message: string;
}

interface PongMessage extends BaseWebSocketMessage {
  type: 'pong';
  timestamp: number;
}

// Union type for all WebSocket messages
type WebSocketMessage = 
  | ConnectedMessage
  | SessionCreatedMessage
  | DeltaMessage
  | CompleteMessage
  | ErrorMessage
  | PongMessage;

/**
 * WebSocket client class for real-time chat
 */
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private sessionId: string | null = null;
  private clientId: string | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: number | null = null;
  
  // Event callbacks
  private onDeltaCallback: DeltaCallback | null = null;
  private onCompleteCallback: MessageCallback | null = null;
  private onErrorCallback: ErrorCallback | null = null;
  private onConnectedCallback: ConnectedCallback | null = null;
  
  /**
   * Create a new WebSocket client
   * @param url The WebSocket server URL
   * @param sessionId Optional session ID for an existing session
   */
  constructor(url: string, sessionId: string | null = null) {
    this.url = url;
    this.sessionId = sessionId;
  }
  
  /**
   * Connect to the WebSocket server
   * @returns Promise that resolves when connected
   */
  public connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        // If already connected, resolve immediately
        if (this.isConnected && this.ws) {
          resolve(true);
          return;
        }
        
        // Create a new WebSocket connection
        this.ws = new WebSocket(this.url);
        
        // Set up event handlers
        this.ws.onopen = () => {
          console.log('WebSocket connection established');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve(true);
        };
        
        this.ws.onclose = () => {
          console.log('WebSocket connection closed');
          this.isConnected = false;
          this.attemptReconnect();
        };
        
        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnected = false;
          if (this.onErrorCallback) {
            this.onErrorCallback('WebSocket connection error');
          }
          reject(error);
        };
        
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as WebSocketMessage;
            this.handleMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
            if (this.onErrorCallback) {
              this.onErrorCallback('Error parsing message from server');
            }
          }
        };
      } catch (error) {
        console.error('Error connecting to WebSocket server:', error);
        this.isConnected = false;
        if (this.onErrorCallback) {
          this.onErrorCallback('Failed to connect to WebSocket server');
        }
        reject(error);
      }
    });
  }
  
  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
      
      // Clear any reconnect timeout
      if (this.reconnectTimeout !== null) {
        window.clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
    }
  }
  
  /**
   * Send a message to the server
   * @param message The message to send
   * @returns True if the message was sent, false otherwise
   */
  public sendMessage(message: string): boolean {
    if (!this.isConnected || !this.ws) {
      if (this.onErrorCallback) {
        this.onErrorCallback('Not connected to WebSocket server');
      }
      return false;
    }
    
    try {
      const messageData = {
        type: 'message',
        message,
        session_id: this.sessionId
      };
      
      this.ws.send(JSON.stringify(messageData));
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback('Failed to send message');
      }
      return false;
    }
  }
  
  /**
   * Send a message with conversation history to the server
   * @param message The message to send
   * @param history Array of message history objects {role: string, content: string}
   * @returns True if the message was sent, false otherwise
   */
  public sendMessageWithHistory(message: string, history: Array<{role: string, content: string}>): boolean {
    if (!this.isConnected || !this.ws) {
      if (this.onErrorCallback) {
        this.onErrorCallback('Not connected to WebSocket server');
      }
      return false;
    }
    
    try {
      const messageData = {
        type: 'message_with_history',
        message,
        history,
        session_id: this.sessionId
      };
      
      console.log('Sending message with history:', messageData);
      this.ws.send(JSON.stringify(messageData));
      return true;
    } catch (error) {
      console.error('Error sending message with history:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback('Failed to send message with history');
      }
      return false;
    }
  }
  
  /**
   * Send a ping to the server to keep the connection alive
   * @returns True if the ping was sent, false otherwise
   */
  public sendPing(): boolean {
    if (!this.isConnected || !this.ws) {
      return false;
    }
    
    try {
      const pingData = {
        type: 'ping',
        timestamp: Date.now()
      };
      
      this.ws.send(JSON.stringify(pingData));
      return true;
    } catch (error) {
      console.error('Error sending ping:', error);
      return false;
    }
  }
  
  /**
   * Start a ping interval to keep the connection alive
   * @param interval Interval in milliseconds (default: 30000)
   * @returns The interval ID
   */
  public startPingInterval(interval = 30000): number {
    return window.setInterval(() => {
      if (this.isConnected) {
        this.sendPing();
      }
    }, interval);
  }
  
  /**
   * Register callbacks for WebSocket events
   */
  public onDelta(callback: DeltaCallback): void {
    this.onDeltaCallback = callback;
  }
  
  public onComplete(callback: MessageCallback): void {
    this.onCompleteCallback = callback;
  }
  
  public onError(callback: ErrorCallback): void {
    this.onErrorCallback = callback;
  }
  
  public onConnected(callback: ConnectedCallback): void {
    this.onConnectedCallback = callback;
  }
  
  /**
   * Get the current session ID
   * @returns The session ID or null if not set
   */
  public getSessionId(): string | null {
    return this.sessionId;
  }
  
  /**
   * Get the client ID
   * @returns The client ID or null if not connected
   */
  public getClientId(): string | null {
    return this.clientId;
  }
  
  /**
   * Check if the client is connected
   * @returns True if connected, false otherwise
   */
  public isConnectedToServer(): boolean {
    return this.isConnected;
  }
  
  /**
   * Handle incoming WebSocket messages
   * @param data The parsed message data
   */
  private handleMessage(data: WebSocketMessage): void {
    switch (data.type) {
      case 'connected':
        this.handleConnected(data);
        break;
      case 'session_created':
        this.handleSessionCreated(data);
        break;
      case 'delta':
        this.handleDelta(data);
        break;
      case 'complete':
        this.handleComplete(data);
        break;
      case 'error':
        this.handleError(data);
        break;
      case 'pong':
        // Just log for debugging
        console.log('Pong received:', data.timestamp);
        break;
      default:
        console.warn('Unknown message type:', data);
    }
  }
  
  /**
   * Handle a 'connected' message
   * @param data The message data
   */
  private handleConnected(data: ConnectedMessage): void {
    this.clientId = data.client_id;
    console.log('Connected to server. Client ID:', this.clientId);
    
    if (this.onConnectedCallback && this.clientId) {
      this.onConnectedCallback(this.clientId);
    }
  }
  
  /**
   * Handle a 'session_created' message
   * @param data The message data
   */
  private handleSessionCreated(data: SessionCreatedMessage): void {
    this.sessionId = data.session_id;
    console.log('Session created:', this.sessionId);
  }
  
  /**
   * Handle a 'delta' message
   * @param data The message data
   */
  private handleDelta(data: DeltaMessage): void {
    if (this.onDeltaCallback) {
      this.onDeltaCallback(data.delta, data.buffer);
    }
  }
  
  /**
   * Handle a 'complete' message
   * @param data The message data
   */
  private handleComplete(data: CompleteMessage): void {
    if (this.onCompleteCallback) {
      this.onCompleteCallback(data.message);
    }
  }
  
  /**
   * Handle an 'error' message
   * @param data The message data
   */
  private handleError(data: ErrorMessage): void {
    console.error('Error from server:', data.message);
    
    if (this.onErrorCallback) {
      this.onErrorCallback(data.message);
    }
  }
  
  /**
   * Attempt to reconnect to the WebSocket server
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      return;
    }
    
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    
    this.reconnectTimeout = window.setTimeout(() => {
      this.reconnectAttempts++;
      this.connect().catch(() => {
        // If connection fails, the onclose handler will trigger another reconnect attempt
      });
    }, delay);
  }
} 