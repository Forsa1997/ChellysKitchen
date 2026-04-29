# Deployment Guide for Chellys Kitchen

This guide covers how to deploy Chellys Kitchen to production.

## Prerequisites

- Node.js 20+
- PostgreSQL database
- npm or yarn

## Environment Variables

### Backend (.env)

```bash
# Server Configuration
PORT=4000
HOST=0.0.0.0
NODE_ENV=production
LOG_LEVEL=info

# CORS Configuration
CORS_ORIGIN=https://your-frontend-domain.com

# Database Configuration
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

### Frontend (.env)

```bash
VITE_API_BASE_URL=https://your-backend-domain.com
VITE_ROUTER_MODE=hash
```

## Deployment Options

### Option 1: Render (Recommended)

Render provides free hosting for both backend and frontend.

#### Backend Deployment

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm run start`
   - **Environment Variables**: Add all backend env vars
4. Add a PostgreSQL database
5. Update `DATABASE_URL` with the connection string from Render

#### Frontend Deployment

1. Create a new Static Site on Render
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm ci && npm run build`
   - **Publish Directory**: `dist`
   - **Environment Variables**: Add `VITE_API_BASE_URL` pointing to your backend URL

#### Using render.yaml

The repository includes a `render.yaml` file for automated deployment:

1. Push your code to GitHub
2. Go to Render Dashboard → New Blueprint Instance
3. Connect your repository
4. Render will automatically create the database, backend, and frontend services

### Option 2: Docker Compose

For local development or self-hosted deployment:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Option 3: Manual Deployment

#### Backend

```bash
cd backend

# Install dependencies
npm ci

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Build
npm run build

# Start
npm run start
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm ci

# Build
npm run build

# Serve with any static file server
# Example using serve:
npx serve -s dist -l 3000
```

## Database Setup

### Initial Migration

```bash
cd backend
npx prisma migrate dev
```

### Seed Data (Optional)

```bash
cd backend
npm run prisma:seed
```

This creates:
- Admin user: `admin@chellyskitchen.com` / `admin123`
- Member user: `member@chellyskitchen.com` / `member123`
- Sample categories and recipes

## Health Checks

- Backend health: `GET /health`
- Backend API: `GET /api`
- Frontend: Visit your frontend URL

## Troubleshooting

### CORS Issues

Make sure `CORS_ORIGIN` in backend matches your frontend URL exactly.

### Database Connection

Verify `DATABASE_URL` is correct and the database is accessible.

### JWT Errors

Ensure `JWT_SECRET` and `JWT_REFRESH_SECRET` are set and match between deployments.

### Build Failures

- Clear node_modules: `rm -rf node_modules && npm ci`
- Check Node.js version: `node --version` (should be 20+)
- Verify all dependencies are in package.json

## Security Notes

- Change default passwords in production
- Use strong JWT secrets
- Enable HTTPS in production
- Keep dependencies updated
- Review CORS settings
- Use environment variables for sensitive data
