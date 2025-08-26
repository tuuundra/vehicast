# Automotive Parts Prediction & Inventory Optimization Project

## Project Overview

The Automotive Parts Prediction & Inventory Optimization system is a proof-of-concept application that helps predict automotive component failures and optimize inventory management for auto parts distributors and repair shops.

This system addresses two key problems in the automotive industry:
- For repair shops: Difficulty predicting when vehicle components will fail, leading to unexpected repairs and customer dissatisfaction
- For parts distributors: Challenges in maintaining optimal inventory levels, resulting in either overstocking (tying up capital) or stockouts (lost sales)

Key features include:
- Component failure prediction based on vehicle make, model, and year
- Timeline estimation for when components might fail
- Parts demand forecasting across regions
- Inventory level recommendations for distributors
- Natural language search for finding parts and information

Technology stack:
- **Frontend**: React, TypeScript, Mapbox for visualization
- **Backend**: Python, Flask, WebSockets
- **Database**: Supabase (PostgreSQL with vector extensions)
- **AI/ML**: OpenAI API, scikit-learn, pgvector
- **Deployment**: Render.com for hosting

## System Architecture

This application uses a modern three-tier architecture designed for scalability and separation of concerns:

### Architecture Overview
- **Frontend**: Static React application serving the user interface
- **Backend API**: Flask server handling data processing and business logic
- **WebSocket Server**: Dedicated service for real-time chat communication

These components are deployed as three separate services on Render.com, allowing each to scale independently based on demand.

### Data Flow
1. User interacts with the React frontend
2. Frontend makes API calls to the Flask backend for data
3. Backend queries Supabase for structured data and vector search
4. For real-time chat, the frontend connects directly to the WebSocket server
5. WebSocket server communicates with OpenAI's streaming API and relays responses

This separation enables:
- Enhanced reliability (failure in one component doesn't affect others)
- Independent scaling of resources
- Simplified debugging and maintenance

## Synthetic Data Generation

Since this is a proof-of-concept, we created realistic but synthetic data to demonstrate the system's capabilities.

### Data Generation Process
The data generation pipeline consists of:
1. Creating a baseline demand forecast for common automotive parts
2. Distributing this demand across geographic regions
3. Generating vehicle-specific failure probabilities
4. Creating part descriptions and metadata for search functionality

### Implementation Details
- Python scripts generate CSV files with consistent relationships between data points
- Parts are logically connected to vehicles and specific components
- Demand patterns follow realistic geographic distribution (higher in urban areas)
- Generated data includes:
  - Part information (ID, name, component type, vehicle compatibility)
  - Demand forecasts with recommended stock levels
  - Regional demand intensity for map visualization
  - Failure probability data for predictive analysis

The synthetic data successfully mimics real-world patterns while allowing full control over the demonstration capabilities.

## Machine Learning Models

The prediction system uses scikit-learn models to estimate component failures and timeline predictions based on vehicle characteristics.

### Model Approach
Rather than building overly complex models for this proof-of-concept, we focused on:
- Simple but effective prediction algorithms
- Clear visualization of results
- Fast response times
- Interpretable outputs

### Implementation Details
- Vehicle make, model, and year are used as primary features
- Component failure prediction uses classification models
- Timeline prediction employs regression techniques
- Stock level recommendations use a combination of prediction results and buffer calculations
- Models process input data in real-time to provide immediate feedback

These models demonstrate how machine learning can provide valuable insights from automotive data, even with relatively simple implementations.

## Database Integration

Supabase provides a robust PostgreSQL database backend with built-in API functionality.

### Database Configuration
- PostgreSQL database hosted on Supabase
- Tables for parts, vehicles, components, and demand data
- Vector extensions for semantic search capabilities
- REST API for standard data operations

### Key Implementation Points
- Environment variables securely store connection credentials
- Database queries are optimized for performance
- Connection pooling handles concurrent requests
- Data is structured to support both standard lookups and vector search

Supabase offers an ideal balance of power and simplicity for this proof-of-concept, eliminating the need for custom database server setup while providing advanced features like vector search.

## Vector Search Implementation

The parts search functionality uses vector embeddings to enable semantic searching beyond simple keyword matching.

### Vectorization Process
1. Part descriptions are converted to vector embeddings using OpenAI's embedding models
2. These vectors capture semantic meaning rather than just keywords
3. Vectors are stored in Supabase using pgvector extension
4. Similarity search uses cosine distance to find relevant matches

### User Experience Benefits
- Natural language search ("I need brake parts for a 2015 Honda")
- Handles synonyms and related terms automatically
- Returns relevant results even when exact terms don't match
- Provides a more intuitive search experience

This implementation demonstrates how modern vector search techniques can dramatically improve the user experience for parts lookup.

## OpenAI API Integration

The system features an intelligent chat assistant that can answer questions about vehicles, parts, and the system itself.

### Chat Implementation
- Uses OpenAI's GPT models via API
- Context-aware responses based on database information
- Streaming responses for better user experience
- Natural language understanding of automotive terminology

### Technical Architecture
- Initial request goes through Flask API
- WebSocket connection established for real-time streaming
- Context from database enriches the prompts
- Responses stream to user as they're generated

The integration showcases how AI can enhance a technical system with natural language capabilities, making complex data more accessible.

## Frontend Development

The React-based frontend provides an intuitive interface for both distributors and shop technicians.

### Design Philosophy
- Clean, professional interface focused on readability
- Role-based views (distributor vs. shop)
- Responsive design that works on various devices
- Data visualization for better decision-making

### Key Components
- Interactive demand map using Mapbox
- Vehicle lookup forms with predictive results
- Real-time chat interface with streaming responses
- Part search with natural language processing
- Timeline visualization for component failures

The frontend emphasizes usability and clear data presentation, making complex predictions accessible to users with varying technical backgrounds.

## Backend Development

The Flask backend serves as the API layer, processing requests and coordinating with the database and ML components.

### API Architecture
- RESTful endpoints for data operations
- JSON response format for compatibility
- Stateless design for scalability
- CORS configuration for security

### Key Endpoints
- `/api/predict` - Component failure prediction
- `/api/predict_timeline` - Failure timeline estimation
- `/api/search` - Vector-based part search
- `/api/demand` - Demand forecast data
- `/api/regional_demand` - Geographic demand distribution
- `/api/chat/realtime` - Realtime chat session setup

The backend handles data validation, processing, and coordination between frontend requests and database operations, providing a stable foundation for the application.

## WebSocket Implementation

Real-time communication is handled by a dedicated WebSocket server for the chat functionality.

### Architecture Benefits
- Dedicated server for streaming responses
- Reduced load on the main API server
- Optimized for long-lived connections
- Better handling of timeouts and disconnections

### Implementation Details
- Pure Python WebSocket server using `websockets` library
- Connection handling with proper error recovery
- Session management for context persistence
- Direct integration with OpenAI's streaming API
- Client reconnection logic for reliability

This separation of concerns allows the chat functionality to operate efficiently without impacting the performance of the main application.

## Data Visualization

Interactive visualizations help users understand complex data patterns and make better decisions.

### Map Visualization
- Regional heatmap shows demand intensity across geographic areas
- Color coding indicates high-demand regions
- Interactive zoom and pan for detailed exploration
- Location markers for specific high-demand areas

### Prediction Visualizations
- Timeline charts for component failure probability
- Color-coded risk indicators
- Part demand forecasts with trend lines
- Stock level recommendations with visual indicators

These visualizations transform raw data into actionable insights, helping both distributors and shop technicians make informed decisions.

## Deployment Process

The application is deployed using Render.com's cloud platform with a three-service architecture.

### Deployment Structure
- Static Site: Hosts the React frontend
- Web Service 1: Runs the Flask API server
- Web Service 2: Operates the WebSocket server

### Configuration Management
- Environment variables store sensitive credentials
- PORT variables managed automatically by Render
- CORS settings configured for secure cross-origin requests
- WebSocket URL propagation between services

### Deployment Benefits
- Automated builds from GitHub repository
- Independent scaling of each service
- Built-in SSL/TLS encryption
- Zero-downtime deployments

This deployment approach provides a professional hosting solution that's both cost-effective and reliable for demonstration purposes.

## Future Enhancements

While this proof-of-concept demonstrates the core functionality, several enhancements could be made for a production system:

- **Data Integration**: Connect to real parts databases and vehicle service records
- **Advanced ML**: Incorporate more sophisticated prediction models using real historical data
- **User Authentication**: Add user management and role-based access controls
- **Mobile App**: Develop a companion mobile application for on-the-go access
- **Notifications**: Add alerts for low stock or upcoming predicted failures
- **Analytics Dashboard**: Create more detailed analytics for business intelligence
- **API Expansion**: Develop integration points for third-party systems

These enhancements would transform the proof-of-concept into a full production system while building on the existing architecture.

