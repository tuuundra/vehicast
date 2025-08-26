# Deployment Guide for Render.com

This document provides instructions for deploying the Automotive Parts Prediction & Inventory Optimization application to Render.com.

## Prerequisites

- A Render.com account
- Your code pushed to a Git repository (GitHub, GitLab, etc.)
- Your API keys for Supabase and OpenAI

## Deployment Architecture

This application uses a three-service architecture on Render.com:

1. **vehicast-frontend.onrender.com**: Static site serving the frontend
2. **vehicast-api.onrender.com**: Web service running the Flask API
3. **vehicast-ws.onrender.com**: Web service running the WebSocket server

This architecture provides complete separation of concerns, allowing each service to be optimized and scaled independently.

## Deployment Steps

### 1. Deploy Using render.yaml (Recommended)

The easiest way to deploy is using the included `render.yaml` file:

1. Log in to your Render.com dashboard
2. Click "New +" and select "Blueprint"
3. Connect your repository
4. Render will automatically detect the `render.yaml` file and create all three services
5. Set your environment variables as prompted

### 2. Manual Deployment (Alternative)

If you prefer to set up services manually:

#### Frontend (Static Site)

1. Click "New +" and select "Static Site"
2. Connect your repository
3. Configure the service:
   - **Name**: vehicast-frontend
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/build`
4. Set environment variables:
   ```
   REACT_APP_API_URL=https://vehicast-api.onrender.com
   REACT_APP_WEBSOCKET_URL=wss://vehicast-ws.onrender.com
   REACT_APP_SUPABASE_URL=your-supabase-url
   REACT_APP_SUPABASE_ANON_KEY=your-supabase-key
   ```

#### API Service (Web Service)

1. Click "New +" and select "Web Service"
2. Connect your repository
3. Configure the service:
   - **Name**: vehicast-api
   - **Environment**: Python
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`
4. Set environment variables:
   ```
   FLASK_ENV=production
   FLASK_PORT=${PORT}
   FLASK_APP=app/app.py
   SUPABASE_URL=your-supabase-url
   SUPABASE_KEY=your-supabase-key
   OPENAI_API_KEY=your-openai-key
   CORS_ORIGIN=https://vehicast-frontend.onrender.com
   ```

#### WebSocket Service (Web Service)

1. Click "New +" and select "Web Service"
2. Connect your repository
3. Configure the service:
   - **Name**: vehicast-ws
   - **Environment**: Python
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python websocket_server.py`
4. Set environment variables:
   ```
   WS_HOST=0.0.0.0
   WEBSOCKET_PORT=${PORT}
   SUPABASE_URL=your-supabase-url
   SUPABASE_KEY=your-supabase-key
   OPENAI_API_KEY=your-openai-key
   CORS_ORIGIN=https://vehicast-frontend.onrender.com
   WEBSOCKET_SERVICE_URL=wss://vehicast-ws.onrender.com
   ```

### 3. (Optional) Set up Redis

If your application uses Redis:

1. In the Render dashboard, go to "New +" and select "Redis"
2. Configure your Redis instance
3. Once created, Render will automatically add a `REDIS_URL` environment variable to your services

## Verification

After deployment:

1. Visit your frontend at https://vehicast-frontend.onrender.com
2. The frontend should be able to communicate with the API at https://vehicast-api.onrender.com
3. Real-time chat should connect to the WebSocket at wss://vehicast-ws.onrender.com
4. Monitor the logs for all three services for any errors

## Troubleshooting

If you encounter issues:

1. Check the Render logs for all three services
2. Verify all environment variables are set correctly
3. Check CORS settings if the frontend can't communicate with the API or WebSocket
4. Ensure the frontend is correctly configured to connect to both services

## Updating Your Application

To update your application, simply push changes to your repository. Render will automatically rebuild and redeploy your services. 