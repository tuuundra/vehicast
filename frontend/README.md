# Automotive Parts Prediction & Inventory Optimization - Frontend

This is the React frontend for the Automotive Parts Prediction & Inventory Optimization system. It provides a modern, responsive user interface for interacting with the system's features.

## Features

- **Modern SaaS-like UI**: Clean, professional design inspired by modern SaaS applications like Supabase and ElevenLabs
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Predictions**: Get component failure predictions based on vehicle details
- **Semantic Search**: Find parts using natural language search
- **Demand Forecasting**: View demand forecasts and stock recommendations for distributors
- **Chat Assistant**: Get help and information through an AI-powered chat interface

## Getting Started

### Prerequisites

- Node.js 14+ and npm
- Python 3.8+ (for the backend)

### Installation

1. Install frontend dependencies:
   ```
   cd frontend
   npm install
   ```

2. Install backend dependencies:
   ```
   pip install -r requirements.txt
   ```

### Running the Application

#### Development Mode

To run both the frontend and backend together:

```
npm run dev
```

This will start:
- React development server on http://localhost:3000
- Flask backend API on http://localhost:5000

#### Frontend Only

```
cd frontend
npm start
```

#### Backend Only

```
python app.py
```

## Project Structure

- `/src/components` - Reusable UI components
- `/src/pages` - Page components for each route
- `/src/api` - API service for connecting to the backend
- `/src/theme` - Theme configuration for styling
- `/src/hooks` - Custom React hooks
- `/src/utils` - Utility functions

## Technologies Used

- **React**: Frontend library for building user interfaces
- **TypeScript**: Type-safe JavaScript
- **Chakra UI**: Component library for building accessible UI
- **React Router**: Routing for React applications
- **Axios**: HTTP client for API requests
- **Flask**: Python web framework for the backend API

## License

This project is licensed under the ISC License.
