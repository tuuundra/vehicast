# LiveKit Voice Assistant Backend

This is a backend service for the LiveKit voice assistant integration in the automotive parts application. It provides:

1. A LiveKit agent powered by OpenAI that can assist users with voice interactions
2. Token generation endpoints for secure frontend connectivity
3. Simple API for health checks and diagnostics

## Prerequisites

- Node.js 18+ 
- npm or yarn
- LiveKit account with API keys
- OpenAI API key

## Setup

1. Clone the repository
2. Navigate to the backend directory
3. Install dependencies:
   ```
   npm install
   ```
4. Create a `.env` file based on the `.env.example` template:
   ```
   cp .env.example .env
   ```
5. Edit the `.env` file and fill in your API keys and configuration

## Development

To run the server in development mode with auto-reload:

```
npm run dev
```

## Production

To build and run in production:

```
npm run build
npm start
```

## API Endpoints

- `GET /api/health` - Check if the service is running
- `GET /api/livekit/token` - Generate a LiveKit token for frontend clients

## Environment Variables

- `LIVEKIT_URL` - Your LiveKit server URL (wss://...)
- `LIVEKIT_API_KEY` - Your LiveKit API key
- `LIVEKIT_API_SECRET` - Your LiveKit API secret
- `OPENAI_API_KEY` - Your OpenAI API key
- `PORT` - The port to run the server on (default: 3001) 