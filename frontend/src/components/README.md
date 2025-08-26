# LiveKit Voice Assistant UI Component

This directory contains a React component for integrating a LiveKit-powered voice assistant into the automotive parts application.

## Components

### LiveKitAgentUI

The main component that provides a voice assistant interface. It connects to a LiveKit room and provides a user-friendly interface for voice interactions.

#### Usage

```jsx
import LiveKitAgentUI from './components/LiveKitAgentUI';

// In your component:
<LiveKitAgentUI />
```

#### Environment Variables

The component requires the following environment variables in your React application:

```
REACT_APP_LIVEKIT_URL=wss://your-livekit-server.livekit.cloud
REACT_APP_TOKEN_ENDPOINT=/api/livekit/token
```

- `REACT_APP_LIVEKIT_URL` - Your LiveKit server URL
- `REACT_APP_TOKEN_ENDPOINT` - The endpoint to fetch LiveKit tokens from your backend

#### Features

- Clean UI that integrates with your existing design system
- Audio visualization during voice interactions
- Status indicators for the assistant's state (listening, speaking, thinking)
- Token management and connection handling

## Integration with Backend

This component is designed to work with the LiveKit agent backend service located in the `backend/` directory. Make sure the backend service is running and properly configured before using this component.

## Styling

The component uses Chakra UI for styling and is designed to adapt to both light and dark modes. 