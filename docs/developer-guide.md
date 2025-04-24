# Driftix Developer Guide

## Project Structure

```
driftix/
├── src/
│   ├── app/                 # Next.js app directory
│   ├── components/         # React components
│   ├── lib/               # Utility functions and shared code
│   ├── types/             # TypeScript type definitions
│   └── store/             # State management
├── prisma/                # Database schema and migrations
├── public/               # Static assets
└── docs/                 # Documentation
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Git

### Development Setup

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env
   ```

4. Set up the database:

   ```bash
   npx prisma migrate dev
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

## Architecture

### Frontend

- Next.js 14 with App Router
- React Server Components
- Tailwind CSS for styling
- Shadcn UI components
- React Query for data fetching
- Zustand for state management

### Backend

- Next.js API routes
- Prisma ORM
- PostgreSQL database
- JWT authentication
- Rate limiting
- Input validation

### Security

- JWT-based authentication
- CSRF protection
- Rate limiting
- Input sanitization
- SQL injection prevention
- XSS protection

## Development Workflow

### Code Style

- ESLint for linting
- Prettier for formatting
- TypeScript for type safety
- Husky for pre-commit hooks

### Testing

- Jest for unit testing
- React Testing Library for component testing
- Cypress for E2E testing

### Git Workflow

1. Create a feature branch
2. Make changes
3. Write tests
4. Submit PR
5. Code review
6. Merge to main

## API Documentation

### Authentication

- JWT-based authentication
- Refresh token rotation
- Session management
- Role-based access control

### Endpoints

See `docs/api/openapi.yaml` for detailed API documentation.

## Database

### Schema

See `prisma/schema.prisma` for database schema.

### Migrations

```bash
# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database
npx prisma migrate reset
```

## Deployment

### Production Build

```bash
npm run build
```

### Environment Variables

Required environment variables:

- `DATABASE_URL`
- `JWT_SECRET`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

### Docker

```bash
# Build image
docker build -t driftix .

# Run container
docker run -p 3000:3000 driftix
```

## Performance Optimization

### Frontend

- Code splitting
- Image optimization
- Caching strategies
- Bundle size optimization

### Backend

- Database indexing
- Query optimization
- Caching
- Rate limiting

## Monitoring

### Logging

- Application logs
- Error tracking
- Performance monitoring
- User analytics

### Metrics

- Response times
- Error rates
- Resource usage
- User engagement

## Contributing

### Pull Request Process

1. Update documentation
2. Add tests
3. Ensure CI passes
4. Get code review
5. Merge to main

### Code Review Guidelines

- Follow style guide
- Write clear commit messages
- Add appropriate tests
- Update documentation

## Troubleshooting

### Common Issues

1. Database connection
2. Authentication
3. Build errors
4. Performance issues

### Debugging

- Use debug logs
- Check error tracking
- Monitor performance
- Review logs
