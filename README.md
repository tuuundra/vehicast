
## Vehicast (automotive‑algo)

Scope
- i) Proof‑of‑concept time‑series component‑failure prediction integrated into a pragmatic web dashboard for automotive part distributors to anticipate demand from affiliated shops across the US.
- ii) Mechanic dashboard with an AI troubleshooting chatbot and cart checkout, backed by PostgreSQL vector embeddings and semantic search.
- Synthetic data generation, temporal features, and Monte‑Carlo evaluation with cost‑impact modeling.
- Exposed results via a lightweight ops‑review dashboard (Flask + React + WebSockets).

Stack
- React (Chakra UI, Mapbox), Flask API, WebSockets; Supabase pgvector for search; OpenAI for LLM responses.

### Technical overview

This proof of concept:
- Predicts component failures for specific vehicles and mileages
- Analyzes local vehicle registrations to understand fleet mix by region
- Forecasts demand from vehicle types and historical failure rates
- Optimizes distributor inventory levels to meet local demand efficiently
- Enables quick part identification for mechanics doing specific repairs

### Synthetic data
We generated synthetic registrations by region, component failure histories by make/model/year, and part fitment mappings to demonstrate end‑to‑end flow for recommendations.

### Predictive modeling
- Logistic Regression per component type (balanced class weights)
- One‑hot encoding for categorical features; numeric feature scaling
- 80/20 train/test with accuracy/precision/recall/F1
- Models serialized for the prediction service; thresholded failure risk → mapped to parts

### Database architecture (Supabase PostgreSQL)
- Vector embeddings across parts, components, vehicle types, failures, and documentation to power semantic search and similarity
- Relational links between vehicles ↔ parts, components ↔ failure rates, parts ↔ pricing, vehicle types ↔ registrations

Schema snapshot:

![Supabase schema](docs/images/supabase-schema.png)

### Frontend
- Distributor dashboard: heatmap demand, adjustable horizons (7d–6m), top parts, inventory metrics, reorder suggestions
- Mechanic dashboard: semantic search, compatibility filtering, alternatives, and streamlined cart/checkout

