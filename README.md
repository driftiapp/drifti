# Drifti - Modern Ride-Sharing Platform

A modern ride-sharing platform built with Next.js, Express, MongoDB, and Firebase.

## Project Structure

```
drifti/
├── frontend/          # Next.js frontend application
├── backend/          # Express.js backend server
└── README.md         # Project documentation
```

## Features

* Real-time ride booking and tracking
* Secure payment processing
* User authentication with Firebase
* MongoDB database integration
* Modern, responsive UI with TailwindCSS
* TypeScript for type safety
* RESTful API architecture
* Automated deployment with GitHub Actions

## Tech Stack

* **Frontend:**  
   * Next.js 14  
   * React 18  
   * TypeScript  
   * TailwindCSS  
   * Firebase Authentication  
   * Framer Motion
* **Backend:**  
   * Express.js  
   * TypeScript  
   * MongoDB  
   * Firebase Admin SDK  
   * JWT Authentication

## Getting Started

### Prerequisites

* Node.js >= 18.0.0
* MongoDB Atlas account
* Firebase project
* Render account (for deployment)

### Local Development

1. Clone the repository:  
git clone https://github.com/yourusername/drifti.git  
cd drifti
2. Install dependencies:  
# Install frontend dependencies  
cd frontend  
npm install  
# Install backend dependencies  
cd ../backend  
npm install
3. Set up environment variables:  
   * Create `.env` files in both frontend and backend directories  
   * Copy the example environment variables and fill in your values
4. Start the development servers:  
# Start backend server  
cd backend  
npm run dev  
# Start frontend server (in a new terminal)  
cd frontend  
npm run dev

## Deployment

### Automated Deployment with GitHub Actions

The project uses GitHub Actions for automated deployment to Render and Firebase:

1. Push to the `main` branch
2. GitHub Actions will:
   - Build the frontend and backend
   - Deploy the backend to Render
   - Deploy the frontend to Firebase
   - Run health checks
   - Notify on success/failure

### Manual Deployment

#### Backend Deployment on Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the following:  
   * Build Command: `npm install && npm run build`  
   * Start Command: `npm start`  
   * Environment Variables:  
   ```  
   MONGODB_URI=your_mongodb_uri  
   JWT_SECRET=your_jwt_secret  
   FIREBASE_PROJECT_ID=your_firebase_project_id  
   FIREBASE_PRIVATE_KEY=your_firebase_private_key  
   FIREBASE_CLIENT_EMAIL=your_firebase_client_email  
   ```

#### Frontend Deployment on Render

1. Create a new Static Site on Render
2. Connect your GitHub repository
3. Configure the following:  
   * Build Command: `npm install && npm run build`  
   * Publish Directory: `out`  
   * Environment Variables:  
   ```  
   NEXT_PUBLIC_API_URL=your_backend_url  
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key  
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain  
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id  
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket  
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id  
   NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id  
   ```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.