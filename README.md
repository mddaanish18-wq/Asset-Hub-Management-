# UPS Asset Health Predictor Dashboard

A full-stack predictive maintenance dashboard for UPS assets with AI-powered health predictions and risk analysis.

![UPS Dashboard](https://img.shields.io/badge/UPS-Dashboard-351C15?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-5FA04E?style=for-the-badge&logo=node.js&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

## 🏗️ Project Structure

```
ups-dashboard/
├── backend/              # Express.js API server
│   ├── routes/          # API route handlers
│   ├── db.js            # SQLite database connection
│   ├── seed.js          # Database seeding script
│   ├── server.js        # Express server entry point
│   └── package.json     # Backend dependencies
│
├── frontend/            # Next.js web application
│   ├── src/
│   │   ├── app/        # Next.js app router pages
│   │   └── components/ # Reusable UI components
│   ├── public/         # Static assets
│   └── package.json    # Frontend dependencies
│
└── package.json         # Root workspace configuration
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Install all dependencies** (root, backend, and frontend):
```bash
npm run install:all
```

Or install manually:
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

2. **Configure environment variables**:

Create `backend/.env`:
```env
PORT=5001
GOOGLE_API_KEY=your_api_key_here
```

3. **Seed the database**:
```bash
npm run seed
```

### Development

**Option 1: Run both servers concurrently** (recommended):
```bash
npm run dev
```

**Option 2: Run servers separately**:

Terminal 1 - Backend:
```bash
npm run dev:backend
```

Terminal 2 - Frontend:
```bash
npm run dev:frontend
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001

## 📦 Tech Stack

### Backend
- **Express.js** - Web framework
- **SQLite** with better-sqlite3 - Database
- **LangChain** - AI/ML integration
- **CORS** - Cross-origin resource sharing

### Frontend
- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Recharts** - Data visualization
- **Framer Motion** - Animations
- **Lucide React** - Icons

## 🎯 Features

- 📊 **Asset Health Hub** - Real-time asset health monitoring
- ⚠️ **Risk Dashboard** - Predictive risk analysis
- ✅ **Action Board** - Maintenance action tracking
- 🖥️ **Ops Console** - Operational metrics and alerts
- 🤖 **AI-Powered Predictions** - Machine learning health predictions
- 📱 **Responsive Design** - Works on all devices
- 🎨 **UPS Brand Design** - Official UPS colors and styling

## 📚 Documentation

- [Backend Documentation](./backend/README.md)
- [Frontend Documentation](./frontend/README.md)

## 🛠️ Available Scripts

| Script | Description |
|--------|-------------|
| `npm run install:all` | Install dependencies for all projects |
| `npm run dev` | Run both backend and frontend in development mode |
| `npm run dev:backend` | Run only backend server |
| `npm run dev:frontend` | Run only frontend server |
| `npm run seed` | Seed the database with sample data |
| `npm run build:frontend` | Build frontend for production |

## 📝 API Documentation

See [Backend README](./backend/README.md) for detailed API endpoint documentation.

## 🤝 Contributing

1. Make changes in appropriate directory (`backend/` or `frontend/`)
2. Test changes locally
3. Ensure all linting passes
4. Submit pull request

## 📄 License

Private - UPS Internal Use Only
