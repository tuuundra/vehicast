import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    // No response received
    if (!error.response) {
      console.error('No response received:', error.request);
      return Promise.reject(error);
    }
    
    return Promise.reject(error);
  }
);

// API functions for vehicle predictions
export const predictVehicleFailures = async (vehicleData: any) => {
  try {
    const response = await api.post('/api/predict', vehicleData);
    return response.data;
  } catch (error) {
    console.error('Error predicting vehicle failures:', error);
    throw error;
  }
};

export const predictTimeline = async (vehicleData: any) => {
  try {
    const response = await api.post('/api/predict_timeline', vehicleData);
    return response.data;
  } catch (error) {
    console.error('Error predicting timeline:', error);
    throw error;
  }
};

// API functions for parts search
export const searchParts = async (query: string, threshold = 0.5, limit = 5) => {
  try {
    const response = await api.post('/api/search', { query, threshold, limit });
    return response.data;
  } catch (error) {
    console.error('Error searching parts:', error);
    throw error;
  }
};

// API functions for demand forecasts
export const getDemandForecast = async (timeWindow = '6 months') => {
  try {
    console.log('Fetching demand forecast for time window:', timeWindow);
    console.log('API URL:', `${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/demand`);
    
    const response = await api.get('/api/demand', {
      params: { time_window: timeWindow },
    });
    
    console.log('Demand forecast response status:', response.status);
    console.log('Demand forecast response data:', response.data);
    
    return response.data;
  } catch (error: any) {
    console.error('Error getting demand forecast:', error);
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received from server');
    } else {
      console.error('Error message:', error.message);
    }
    throw error;
  }
};

// API function for regional demand heatmap data
export const getRegionalDemandData = async (timeWindow = '6 months', partId?: number | null) => {
  try {
    console.log('Fetching regional demand data for time window:', timeWindow, 'and partId:', partId);
    const url = '/api/regional_demand';
    const params = { 
      time_window: timeWindow,
      part_id: partId || undefined 
    };
    console.log('API request URL:', url);
    console.log('API request params:', params);
    
    const response = await api.get(url, { params });
    console.log('Regional demand data response status:', response.status);
    console.log('Regional demand data response headers:', response.headers);
    console.log('Regional demand data response data:', response.data);
    
    if (!response.data) {
      console.error('Empty response data received');
      throw new Error('Empty response data');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error getting regional demand data:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data
      });
    }
    throw error;
  }
};

// API functions for chat
export const sendChatMessage = async (message: string) => {
  try {
    const response = await api.post('/api/chat', { message });
    return response.data;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
};

// Realtime chat session setup 
export const setupRealtimeChat = async (message: string) => {
  try {
    console.log('Setting up realtime chat session for message:', message);
    const response = await api.post('/api/chat/realtime', { message });
    console.log('Realtime chat session response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error setting up realtime chat session:', error);
    throw error;
  }
};

// Get the WebSocket URL
export const getWebSocketUrl = () => {
  // Extract base URL parts
  const apiUrl = process.env.REACT_APP_API_URL || `http://localhost:${process.env.REACT_APP_FLASK_PORT || 5001}`;
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  
  // Extract host from API URL or use window.location.host as fallback
  let host;
  if (apiUrl.includes('://')) {
    // Full URL with protocol
    host = apiUrl.split('://')[1].split('/')[0];
  } else {
    // Relative URL or just the host
    host = apiUrl.includes('/') ? apiUrl.split('/')[0] : apiUrl;
  }
  
  // Use environment variable for WebSocket port
  const wsPort = process.env.REACT_APP_WEBSOCKET_PORT || process.env.WEBSOCKET_PORT || '8765';
  
  return `${wsProtocol}//${host.split(':')[0]}:${wsPort}`;
};

export default api; 