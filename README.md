# Drifti - Modern Ride-Sharing Application

Drifti is a modern ride-sharing application built with Next.js, Node.js, and MongoDB. The application provides a seamless experience for users to book rides and for drivers to manage their trips.

## Project Structure

```
drifti/
├── frontend/          # Next.js frontend application
├── backend/          # Node.js backend API
├── public/           # Static assets
└── render.yaml       # Render deployment configuration
```

## Features

- User authentication with Firebase
- Real-time ride booking
- Trip management
- Payment integration
- Responsive design
- Modern UI/UX

## Tech Stack

- Frontend:
  - Next.js 14
  - TypeScript
  - Tailwind CSS
  - Firebase Authentication

- Backend:
  - Node.js
  - Express
  - MongoDB
  - JWT Authentication

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/driftiapp/drifti.git
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
   - Update the variables with your configuration

4. Start the development servers:
   ```bash
   # Start backend server
   cd backend
   npm run dev

   # Start frontend server
   cd frontend
   npm run dev
   ```

## Deployment

The application is deployed on:
- Frontend: Firebase Hosting
- Backend: Render

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.