import { cli, defineAgent, multimodal, WorkerOptions, type JobContext } from '@livekit/agents';
import * as openai from '@livekit/agents-plugin-openai';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import express from 'express';
import { AccessToken } from 'livekit-server-sdk';
import cors from 'cors';

// Load environment variables
dotenv.config();

// Constants
const PORT = process.env.PORT || 3001;
const LIVEKIT_URL = process.env.LIVEKIT_URL || 'wss://your-livekit-url.livekit.cloud';
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'api-key';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'api-secret';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const ROOM_NAME = 'voice-assistant-room';

// Automotive Assistant Instructions
const AUTOMOTIVE_ASSISTANT_INSTRUCTIONS = `
You are an automotive parts specialist assistant for an automotive parts prediction platform.
You help users with:
1. Identifying parts they might need based on symptoms, vehicle info, and maintenance history
2. Explaining the functionality of different vehicle components
3. Providing insights on component life expectancy and failure patterns
4. Suggesting preventative maintenance based on mileage and vehicle conditions
5. Answering questions about inventory optimization and parts availability

Your first response should be: "Welcome to Automotive Assistant. How can I help with your vehicle or parts inquiries today?"

Use concise, professional language and focus on providing accurate technical information.
`;

// Initialize express app for token service
const app = express();
app.use(cors());
app.use(express.json());

// Generate a token for frontend clients
app.get('/api/livekit/token', (req, res) => {
  try {
    // Generate a unique ID for each user
    const userId = `user-${Math.floor(Math.random() * 100000)}`;
    
    const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: userId,
      name: 'User',
    });
    
    token.addGrant({
      roomJoin: true,
      room: ROOM_NAME,
      canPublish: true,
      canSubscribe: true,
    });
    
    res.json({ token: token.toJwt() });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// API health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Define the agent
export default defineAgent({
  entry: async (ctx: JobContext) => {
    // Connect to the room
    await ctx.connect();

    // Wait for a participant to join
    const participant = await ctx.waitForParticipant();
    console.log(`Starting automotive assistant for ${participant.identity}`);

    // Initialize the OpenAI realtime model
    const model = new openai.realtime.RealtimeModel({
      voice: 'shimmer',
      model: 'gpt-4o',
      instructions: AUTOMOTIVE_ASSISTANT_INSTRUCTIONS,
    });

    // Create a multimodal agent
    const agent = new multimodal.MultimodalAgent({
      model,
    });

    // Start the agent session
    const session = await agent
      .start(ctx.room, participant)
      .then((session) => session as openai.realtime.RealtimeSession);
    
    // Create the initial response - the welcome message is in the instructions
    session.response.create();
  },
});

// Start the token service
app.listen(PORT, () => {
  console.log(`Token service running on port ${PORT}`);
});

// Start the agent worker
if (process.env.NODE_ENV !== 'test') {
  cli.runApp(new WorkerOptions({ agent: fileURLToPath(import.meta.url) }));
} 