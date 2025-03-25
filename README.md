# Drifti - Social Media Analytics Platform

A modern social media analytics platform built with Next.js, Express, and TimescaleDB.

## Project Structure

```
drifti/
├── backend/                 # Backend service
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   │   ├── database.js # Database configuration
│   │   │   └── firebase.js # Firebase configuration
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   └── index.js        # Main application file
│   ├── package.json        # Backend dependencies
│   └── .env               # Backend environment variables
│
├── frontend/               # Frontend service
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/        # Next.js pages
│   │   └── styles/       # CSS styles
│   ├── package.json      # Frontend dependencies
│   └── .env.local       # Frontend environment variables
│
└── render.yaml           # Render deployment configuration
```

## Environment Variables

### Backend (.env)
```
PORT=5000
JWT_SECRET=your_jwt_secret
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
TIMESCALE_URL=your_timescale_connection_string
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://drifti-backend.onrender.com
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
```

## Deployment

### Backend Service
- Build Command: `cd backend && npm ci`
- Start Command: `cd backend && npm start`
- Health Check: `/health`

### Frontend Service
- Build Command: `cd frontend && npm ci && npm run build`
- Start Command: `cd frontend && npm start`
- Health Check: `/api/health`

## Development

1. Clone the repository
2. Install dependencies:
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd frontend
   npm install
   ```
3. Set up environment variables
4. Start development servers:
   ```bash
   # Backend
   cd backend
   npm run dev
   
   # Frontend
   cd frontend
   npm run dev
   ```

## Features
- Real-time social media analytics
- User authentication with Firebase
- TimescaleDB for time-series data
- Modern React components
- Responsive design
- API health monitoring