# Chellys Kitchen - Vollständige Architektur-Plan

## 1. Technologie-Stack-Entscheidungen

### Backend Framework: Fastify + TypeScript

**Begründung:**
- **Fastify** bietet bessere Performance als Express (bis zu 2x schneller)
- Eingebaute TypeScript-Unterstützung mit strikter Typisierung
- Schema-basierte Validierung (JSON Schema) out-of-the-box
- Plugin-Architektur für modulare Erweiterbarkeit
- Bessere Developer Experience mit Auto-Completion
- Leichtgewichtig und cloud-native

**Alternativen in Betracht gezogen:**
- Express + TypeScript: Etabliert, aber weniger Performance, mehr Boilerplate
- NestJS: Über-engineered für dieses Projekt, steile Lernkurve
- Koa: Weniger Ökosystem-Unterstützung

### Datenbank: PostgreSQL

**Begründung:**
- Robuste relationale Integrität für User-Recipe-Beziehungen
- JSONB für flexible Daten (z.B. Zutaten-Listen)
- Volltextsuche für Recipe-Suche
- Managed Services verfügbar (Neon, Supabase, RDS)
- Migrations-Unterstützung via Prisma

### ORM: Prisma

**Begründung:**
- TypeScript-first mit generierten Typen
- Schema-First-Ansatz (prisma.schema)
- Eingebaute Migrations
- Query Builder mit Type-Safety
- Seeding für Testdaten
- Gute Integration mit Fastify

### Authentifizierung: JWT + bcrypt

**Begründung:**
- Stateless für Cloud-Deployment
- Keine Session-Storage nötig
- bcrypt für sicheres Password Hashing
- Refresh-Token Pattern für Sicherheit

### Frontend: Beibehaltung des existierenden Stacks

**Beibehalten:**
- React + TypeScript + Vite + Material UI
- API-Client-Struktur
- Domain-Typen

**Erweiterungen:**
- React Query für Server State Management
- Zod für Runtime-Validierung
- Axios für bessere Error Handling

## 2. Datenbank-Schema-Entwurf

### Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  GUEST
  MEMBER
  EDITOR
  ADMIN
}

enum RecipeStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum RecipeDifficulty {
  EINFACH
  MITTEL
  SCHWER
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  role      UserRole @default(MEMBER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  recipesCreated  Recipe[] @relation("CreatedBy")
  recipesUpdated  Recipe[] @relation("UpdatedBy")
  ratings         Rating[]
  
  @@index([email])
}

model Recipe {
  id                String           @id @default(cuid())
  slug              String           @unique
  title             String
  shortDescription  String
  description       String?          // Markdown
  img               String?
  tag               String?
  difficulty        RecipeDifficulty
  servings          Int
  preparationTime   Int              // in minutes
  cookingTime       Int              // in minutes
  category          String
  status            RecipeStatus     @default(DRAFT)
  
  // JSONB für flexible Daten
  ingredients       Json             // Array<{name, amount, unit}>
  steps             Json             // Array<{stepNumber, instruction}>
  nutritionalValues Json?            // {calories, protein, carbohydrates, fat}
  
  // Audit
  createdBy         User             @relation("CreatedBy", fields: [createdById], references: [id])
  createdById       String
  updatedBy         User?            @relation("UpdatedBy", fields: [updatedById], references: [id])
  updatedById       String?
  
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt
  publishedAt       DateTime?
  publishedBy       String?
  archivedAt        DateTime?
  
  ratings           Rating[]
  
  @@index([slug])
  @@index([status])
  @@index([category])
  @@index([createdById])
  @@index([createdAt])
}

model Rating {
  id        String   @id @default(cuid())
  userId    String
  recipeId  String
  stars     Int      // 1-5
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  recipe    Recipe   @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  
  @@unique([userId, recipeId])
  @@index([recipeId])
  @@index([stars])
}

model Category {
  id          String   @id @default(cuid())
  name        String   @unique
  slug        String   @unique
  description String?
  icon        String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([slug])
}
```

### Migrationen

```bash
# Initial Migration
npx prisma migrate dev --name init

# Seed Data
npx prisma db seed
```

## 3. API-Endpunkt-Struktur

### Auth Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me
```

### Recipe Endpoints

```
GET    /api/recipes
GET    /api/recipes/:slug
POST   /api/recipes
PATCH  /api/recipes/:id
DELETE /api/recipes/:id
PATCH  /api/recipes/:id/publish
PATCH  /api/recipes/:id/archive
```

### Rating Endpoints

```
POST   /api/recipes/:slug/rating
GET    /api/recipes/:slug/rating
DELETE /api/recipes/:slug/rating
```

### Category Endpoints

```
GET    /api/categories
POST   /api/categories (admin only)
PATCH  /api/categories/:id (admin only)
DELETE /api/categories/:id (admin only)
```

### Admin Endpoints

```
GET    /api/admin/users
PATCH  /api/admin/users/:id/role
GET    /api/admin/recipes
```

### Health Endpoint

```
GET    /health
```

## 4. Auth/RBAC-Architektur

### JWT Token Structure

```typescript
interface AccessTokenPayload {
  sub: string;      // User ID
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

interface RefreshTokenPayload {
  sub: string;
  tokenVersion: number;
  iat: number;
  exp: number;
}
```

### RBAC Matrix

| Action          | Guest | Member | Editor | Admin |
|-----------------|-------|--------|--------|-------|
| Browse Recipes  | Yes   | Yes    | Yes    | Yes   |
| View Recipe     | Yes   | Yes    | Yes    | Yes   |
| Create Recipe   | No    | Yes    | Yes    | Yes   |
| Edit Own Recipe | No    | Yes    | Yes    | Yes   |
| Edit Any Recipe | No    | No     | Yes    | Yes   |
| Publish Recipe  | No    | No     | Yes    | Yes   |
| Delete Recipe   | No    | Own    | Yes    | Yes   |
| Rate Recipe     | No    | Yes    | Yes    | Yes   |
| Manage Users    | No    | No     | No     | Yes   |
| Manage Categories| No    | No     | No     | Yes   |

### Authorization Middleware

```typescript
// middleware/auth.ts
export const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {
  const token = request.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
  
  const payload = verifyAccessToken(token);
  request.user = payload;
};

export const requireRole = (roles: UserRole[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user || !roles.includes(request.user.role)) {
      return reply.status(403).send({ error: 'Forbidden' });
    }
  };
};

export const requireOwnership = async (request: FastifyRequest, reply: FastifyReply) => {
  const recipeId = request.params.id;
  const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
  
  if (!recipe) {
    return reply.status(404).send({ error: 'Not Found' });
  }
  
  const isOwner = recipe.createdById === request.user.sub;
  const canEditAny = request.user.role === 'EDITOR' || request.user.role === 'ADMIN';
  
  if (!isOwner && !canEditAny) {
    return reply.status(403).send({ error: 'Forbidden' });
  }
  
  request.recipe = recipe;
};
```

## 5. Backend-Architektur (Layered)

```
backend/
├── src/
│   ├── api/              # Route Handlers
│   │   ├── auth/
│   │   ├── recipes/
│   │   ├── ratings/
│   │   ├── categories/
│   │   └── admin/
│   ├── application/      # Use Cases
│   │   ├── auth/
│   │   ├── recipes/
│   │   └── users/
│   ├── domain/          # Domain Logic
│   │   ├── entities/
│   │   ├── services/
│   │   └── validators/
│   ├── infrastructure/   # External Dependencies
│   │   ├── database/
│   │   ├── auth/
│   │   └── storage/
│   ├── middleware/
│   ├── types/
│   └── server.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── tests/
└── package.json
```

## 6. Phasen-Plan für die Implementierung

### Phase 1: Foundation (Week 1-2)

**Backend Setup:**
- [ ] Fastify + TypeScript Projekt initialisieren
- [ ] Prisma Setup mit PostgreSQL
- [ ] Database Schema definieren
- [ ] Migrations erstellen
- [ ] Seed Data erstellen
- [ ] Health Endpoint implementieren
- [ ] CORS konfigurieren
- [ ] Environment Variables Setup

**Frontend Updates:**
- [ ] API-Client an neue Endpunkte anpassen
- [ ] React Query integrieren
- [ ] Zod für Validierung hinzufügen

### Phase 2: Authentication (Week 3)

**Backend:**
- [ ] Password Hashing mit bcrypt
- [ ] JWT Token Generation
- [ ] Register Endpoint
- [ ] Login Endpoint
- [ ] Refresh Token Endpoint
- [ ] Me Endpoint
- [ ] Auth Middleware

**Frontend:**
- [ ] AuthContext an echte API anbinden
- [ ] Token Storage (localStorage/cookie)
- [ ] Protected Routes

### Phase 3: Recipe CRUD (Week 4-5)

**Backend:**
- [ ] GET /api/recipes mit Filterung
- [ ] GET /api/recipes/:slug
- [ ] POST /api/recipes
- [ ] PATCH /api/recipes/:id
- [ ] DELETE /api/recipes/:id
- [ ] Slug Generation
- [ ] Validation mit Zod

**Frontend:**
- [ ] Recipe List mit API-Daten
- [ ] Recipe Detail View
- [ ] Create Recipe Form
- [ ] Edit Recipe Form
- [ ] Delete Recipe

### Phase 4: RBAC & Authorization (Week 6)

**Backend:**
- [ ] Role-based Middleware
- [ ] Ownership Checks
- [ ] Publish/Archive Endpoints
- [ ] Admin Endpoints

**Frontend:**
- [ ] Role-basierte UI-Elemente
- [ ] Admin Dashboard
- [ ] Editor Features

### Phase 5: Ratings & Categories (Week 7)

**Backend:**
- [ ] Rating CRUD
- [ ] Category Management
- [ ] Average Rating Calculation

**Frontend:**
- [ ] Rating Component
- [ ] Category Filter
- [ ] Category Management (Admin)

### Phase 6: Polish & Testing (Week 8)

**Backend:**
- [ ] Unit Tests
- [ ] Integration Tests
- [ ] Error Handling
- [ ] Logging

**Frontend:**
- [ ] E2E Tests
- [ ] Responsive Design
- [ ] Loading States
- [ ] Error Handling

### Phase 7: Cloud Deployment (Week 9-10)

**Infrastructure:**
- [ ] Docker Containerisierung
- [ ] CI/CD Pipeline
- [ ] Environment Configuration
- [ ] Database Migration in Production
- [ ] Monitoring Setup

**Deployment:**
- [ ] Frontend Deployment (Vercel/Netlify)
- [ ] Backend Deployment (Render/Railway)
- [ ] Database Setup (Neon/Supabase)
- [ ] Environment Variables
- [ ] Health Checks

## 7. Cloud-Deployment-Überlegungen

### Deployment Targets

**Frontend:**
- **Vercel** (Empfohlen)
  - Zero-config deployment
  - Automatic HTTPS
  - Edge functions
  - Preview deployments
- Alternative: Netlify, GitHub Pages

**Backend:**
- **Render** (Empfohlen)
  - Free tier verfügbar
  - Managed PostgreSQL
  - Easy GitHub integration
  - Auto-deploy on push
- Alternative: Railway, Fly.io, AWS App Runner

**Database:**
- **Neon** (Empfohlen)
  - Serverless PostgreSQL
  - Free tier
  - Branching für Dev/Staging
  - Auto-scaling
- Alternative: Supabase, Railway Postgres, AWS RDS

### Docker Setup

```dockerfile
# backend/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./
EXPOSE 4000
CMD ["node", "dist/server.js"]
```

### Environment Variables

```bash
# Backend
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
NODE_ENV=production

# Frontend
VITE_API_BASE_URL=https://your-api.com
VITE_ROUTER_MODE=hash
```

### CI/CD Pipeline (GitHub Actions)

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: cd backend && npm ci
      - run: cd backend && npm test
      - run: cd backend && npm run build
      - uses: render/deploy@latest
        with:
          service: chellys-kitchen-api

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: cd frontend && npm ci
      - run: cd frontend && npm test
      - run: cd frontend && npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 8. Security Considerations

### Backend Security
- [ ] Rate Limiting für Auth Endpoints
- [ ] Input Validation mit Zod
- [ ] SQL Injection Prevention (via Prisma)
- [ ] XSS Prevention
- [ ] CORS Configuration
- [ ] Helmet.js für Security Headers
- [ ] Secure Cookie Flags
- [ ] Password Strength Requirements

### Frontend Security
- [ ] Content Security Policy
- [ ] XSS Prevention
- [ ] Token Storage (HttpOnly Cookies preferred)
- [ ] Logout on Token Expiry

## 9. Monitoring & Observability

### Logging
- Structured Logging mit Pino
- Log Levels: error, warn, info, debug
- Request/Response Logging
- Error Tracking

### Metrics
- Request Latency
- Error Rates
- Active Users
- Recipe Creation Rate

### Health Checks
```typescript
// GET /health
{
  status: "ok",
  timestamp: "2026-04-24T10:00:00Z",
  database: "connected",
  version: "1.0.0"
}
```

## 10. Open Questions & Future Enhancements

### Open Questions
1. Soll Social Login (Google, GitHub) implementiert werden?
2. Soll es ein Moderations-Workflow für Recipes geben?
3. Welche Sprache soll primär sein (Deutsch/Englisch/Mehrsprachig)?
4. Sollen User eigene Bilder hochladen können?
5. Soll es ein Favoriten-System geben?

### Future Enhancements
- Recipe Comments
- Recipe Collections/Bookmarks
- Advanced Search (Elasticsearch)
- Recipe Import/Export
- Meal Planning
- Shopping List Generation
- Recipe Sharing
- Analytics Dashboard

---

### Critical Files for Implementation

Basierend auf meiner Analyse sind dies die kritischsten Dateien für die Implementierung:

- `C:\Users\Chris\git\ChellysKitchen\frontend\src\api\client.ts` - API-Client mit Endpunkt-Definitionen
- `C:\Users\Chris\git\ChellysKitchen\frontend\src\types\domain.ts` - Domain-Typen für User, Recipe, Rating
- `C:\Users\Chris\git\ChellysKitchen\frontend\src\auth\AuthContext.tsx` - Authentifizierungs-Context
- `C:\Users\Chris\git\ChellysKitchen\backend\server.mjs` - Existierender Backend-Server (als Referenz)
- `C:\Users\Chris\git\ChellysKitchen\backend\src\queryRecipes.mjs` - Query-Logik (als Referenz)