# UPS Dashboard - Frontend

This is the frontend application for the UPS Asset Health Predictor Dashboard.

## Tech Stack
- **Next.js 16** (React 19)
- **TypeScript**
- **Tailwind CSS 4**
- **Recharts** for data visualization
- **Framer Motion** for animations
- **Lucide React** for icons

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production
```bash
npm run build
npm start
```

## Features

### Pages
- **Asset Health Hub** (`/`) - Overview of all assets with health predictions
- **Risk Dashboard** (`/risks`) - Detailed risk analysis and predictions
- **Action Board** (`/actions`) - Recommended maintenance actions
- **Ops Console** (`/operations`) - Operational metrics and alerts

### Key Features
- 📊 Real-time data visualization with Recharts
- 🎨 UPS brand colors and design system
- 📱 Fully responsive design
- ⚡ Fast and optimized with Next.js
- 🔔 Toast notifications for user feedback
- 💾 LocalStorage for scenario persistence

## Connecting to Backend

The frontend expects the backend API to be running on `http://localhost:5001`. Make sure to start the backend server before using the application.

## Project Structure
```
frontend/
├── src/
│   ├── app/           # Next.js app router pages
│   └── components/    # Reusable UI components
├── public/            # Static assets
└── package.json
```
