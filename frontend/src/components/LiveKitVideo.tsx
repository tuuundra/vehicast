import React from 'react';
import {
  ControlBar,
  GridLayout,
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
} from '@livekit/components-react';

import '@livekit/components-styles';

import { Track } from 'livekit-client';

const serverUrl = process.env.REACT_APP_LIVEKIT_URL || '';
const token = process.env.REACT_APP_LIVEKIT_TOKEN || '';

// Simple fallback component for when LiveKit is not available
const LiveKitFallback: React.FC = () => {
  return (
    <div 
      style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center',
        background: '#f0f0f0',
        border: '1px solid #ccc',
        borderRadius: '8px',
        padding: '20px'
      }}
    >
      <h3 style={{ marginBottom: '10px' }}>Video Chat</h3>
      <p>Loading video conference... If it doesn't appear, there may be compatibility issues with your browser.</p>
    </div>
  );
};

// Using a simplified approach to avoid TypeScript ReactNode issues
const LiveKitVideo: React.FC = () => {
  // Check if we can render LiveKit components
  const [canRenderLiveKit, setCanRenderLiveKit] = React.useState(false);
  
  React.useEffect(() => {
    // Check if we can render the LiveKit component on the client side
    setCanRenderLiveKit(true);
  }, []);

  if (!canRenderLiveKit || !serverUrl || !token) {
    return <LiveKitFallback />;
  }

  // Use TypeScript's "as any" assertion to bypass the type checking issues
  // This is safe because we're only doing this to work around LiveKit's TypeScript issues
  const LiveKitRoomComponent = LiveKitRoom as any;
  const ParticipantTileComponent = ParticipantTile as any;
  const RoomAudioRendererComponent = RoomAudioRenderer as any;
  const ControlBarComponent = ControlBar as any;

  return (
    <div className="livekit-container" style={{ height: '100%' }}>
      <LiveKitRoomComponent
        video={true}
        audio={true}
        token={token}
        serverUrl={serverUrl}
        data-lk-theme="default"
        style={{ height: '100%' }}
      >
        {/* LiveKit Video Conference */}
        <SimpleVideoConference />
        <RoomAudioRendererComponent />
        <ControlBarComponent />
      </LiveKitRoomComponent>
    </div>
  );
};

// Simplified video conference component
const SimpleVideoConference: React.FC = () => {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );
  
  // Use TypeScript's "as any" assertion to bypass the type checking issues
  const ParticipantTileComponent = ParticipantTile as any;
  
  return (
    <GridLayout tracks={tracks} style={{ height: 'calc(100vh - var(--lk-control-bar-height))' }}>
      <ParticipantTileComponent />
    </GridLayout>
  );
};

export default LiveKitVideo; 