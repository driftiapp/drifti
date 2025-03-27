# Drifti - AI-Powered Deposit & Sales Report System

## Overview
Drifti is a comprehensive system for managing deposits and sales reports with AI-powered analytics.

## Tech Stack
- Frontend: Next.js, React, TypeScript
- Backend: Node.js, Express
- Database: MongoDB
- Authentication: Firebase
- Deployment: Render, Firebase Hosting

## Prerequisites
- Node.js 18.17.0 or higher
- MongoDB
- Firebase account
- Render account

## Local Development
1. Clone the repository:
```bash
git clone https://github.com/yourusername/drifti.git
cd drifti
```

2. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Set up environment variables:
- Copy `.env.example` to `.env` in both frontend and backend directories
- Fill in the required environment variables

4. Start development servers:
```bash
# From the root directory
npm run dev
```

## Deployment

### 1. Backend Deployment (Render)
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the following:
   - Build Command: `cd backend && npm ci`
   - Start Command: `cd backend && npm start`
   - Environment Variables: (see backend env vars in docs)

### 2. Frontend Deployment (Render)
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the following:
   - Build Command: `cd frontend && npm ci && npm run build && npm run export`
   - Start Command: `cd frontend && npx serve out`
   - Environment Variables: (see frontend env vars in docs)

### 3. Firebase Deployment
1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase:
```bash
cd frontend
firebase init
```

4. Deploy to Firebase:
```bash
firebase deploy
```

## Environment Variables

### Backend (.env)
```
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
```

### Frontend (.env)
```
NEXT_PUBLIC_API_URL=your_backend_url
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
```

## Available Scripts
- `npm run dev`: Start development servers
- `npm run build`: Build both frontend and backend
- `npm run deploy`: Deploy to Render and Firebase
- `npm run verify:deploy`: Verify deployment status
- `npm run deploy:rollback`: Rollback deployment if needed

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License
This project is licensed under the MIT License.