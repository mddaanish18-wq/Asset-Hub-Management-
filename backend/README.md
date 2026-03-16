# UPS Dashboard - Backend API

This is the backend API for the UPS Asset Health Predictor Dashboard.

## Tech Stack
- **Node.js** with **Express**
- **SQLite** database with `better-sqlite3`
- **LangChain** for AI-powered features

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in this directory:
```env
PORT=5001
GOOGLE_API_KEY=your_api_key_here
```

### 3. Seed the Database
```bash
npm run seed
```

### 4. Start the Server
```bash
npm start
# or for development
npm run dev
```

The API will be available at `http://localhost:5001`

## API Endpoints

### Assets
- `GET /api/assets` - Get all assets with health predictions
- `GET /api/assets/:id` - Get specific asset details

### Risks
- `GET /api/risks` - Get all high-risk items
- `GET /api/risks/:id` - Get specific risk details

### Actions
- `GET /api/actions` - Get all recommended actions
- `POST /api/actions/:id/complete` - Mark action as completed

### Operations
- `GET /api/operations/metrics` - Get operational metrics
- `GET /api/operations/alerts` - Get system alerts

## Database
The SQLite database (`ups_assets.db`) is automatically created when you run the seed script.
