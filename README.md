# Chellys Kitchen 🍳

Eine moderne Rezept-Management-Webanwendung mit Authentifizierung, Rollen-basierter Zugriffskontrolle (RBAC) und Cloud-Deployment-fähiger Architektur.

## 🚀 Features

- **Rezept-Management**: Erstellen, Bearbeiten, Löschen und Durchsuchen von Rezepten
- **Authentifizierung**: Benutzer-Registrierung, Login und Token-basierte Auth
- **RBAC**: Rollen-basierte Zugriffskontrolle (Guest, Member, Editor, Admin)
- **Bewertungen**: Stern-Bewertungssystem für Rezepte
- **Kategorien**: Kategorisierte Rezept-Suche und Filterung
- **Admin Dashboard**: Benutzer- und Rezept-Management
- **Responsive Design**: Mobile- und Desktop-optimiertes UI
- **Cloud-Ready**: Docker-Containerisierung und CI/CD Pipeline

## 🏗️ Architektur

### Backend
- **Framework**: Fastify + TypeScript
- **Datenbank**: PostgreSQL mit Prisma ORM
- **Authentifizierung**: JWT mit Refresh Tokens
- **Validierung**: Zod Schemas
- **Architektur**: Layered (API → Application → Domain → Infrastructure)

### Frontend
- **Framework**: React + TypeScript + Vite
- **UI Library**: Material UI
- **State Management**: React Query (@tanstack/react-query)
- **Routing**: React Router
- **Build Tool**: Vite

## 📋 Voraussetzungen

- Node.js 20+
- PostgreSQL 15+
- Docker (optional, für Container-Deployment)

## 🛠️ Installation

### 1. Repository klonen

```bash
git clone https://github.com/your-username/chellys-kitchen.git
cd chellys-kitchen
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# .env Datei mit deinen Datenbank-Credentials konfigurieren
npx prisma generate
npx prisma migrate dev
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# .env Datei mit API URL konfigurieren
npm run dev
```

## 🐳 Docker Deployment

### Mit Docker Compose

```bash
docker-compose up -d
```

Dies startet:
- PostgreSQL Datenbank
- Backend API (Port 4000)
- Frontend Web App (Port 3000)

### Einzelne Services

```bash
# Backend
cd backend
docker build -t chellys-kitchen-api .
docker run -p 4000:4000 chellys-kitchen-api

# Frontend
cd frontend
docker build -t chellys-kitchen-web .
docker run -p 3000:80 chellys-kitchen-web
```

## 🌐 Cloud Deployment

### Frontend (Vercel)

1. Repository zu Vercel importieren
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. Environment Variables:
   - `VITE_API_BASE_URL`: Backend API URL

### Backend (Render)

1. Repository zu Render importieren
2. Build Command: `npm run build`
3. Start Command: `npm start`
4. Environment Variables:
   - `DATABASE_URL`: PostgreSQL Connection String
   - `JWT_SECRET`: Secret für JWT Tokens
   - `JWT_REFRESH_SECRET`: Secret für Refresh Tokens

### Datenbank (Neon/Supabase)

1. PostgreSQL Datenbank erstellen
2. Connection String kopieren
3. In Backend Environment Variables einfügen
4. Migrations ausführen:
   ```bash
   npx prisma migrate deploy
   ```

## 📊 API Endpoints

### Authentifizierung
- `POST /api/auth/register` - Benutzer registrieren
- `POST /api/auth/login` - Benutzer einloggen
- `POST /api/auth/refresh` - Access Token refreshen
- `GET /api/auth/me` - Aktuellen Benutzer abrufen

### Rezepte
- `GET /api/recipes` - Rezept-Liste mit Filterung
- `GET /api/recipes/:slug` - Einzelnes Rezept abrufen
- `POST /api/recipes` - Rezept erstellen (authentifiziert)
- `PATCH /api/recipes/:id` - Rezept bearbeiten (authentifiziert)
- `DELETE /api/recipes/:id` - Rezept löschen (authentifiziert)
- `PATCH /api/recipes/:id/publish` - Rezept veröffentlichen (Editor/Admin)
- `PATCH /api/recipes/:id/archive` - Rezept archivieren (Editor/Admin)

### Bewertungen
- `GET /api/recipes/:slug/rating` - Bewertungen abrufen
- `POST /api/recipes/:slug/rating` - Bewertung erstellen (authentifiziert)
- `DELETE /api/recipes/:slug/rating` - Bewertung löschen (authentifiziert)

### Kategorien
- `GET /api/categories` - Alle Kategorien abrufen
- `POST /api/categories` - Kategorie erstellen (Admin)
- `PATCH /api/categories/:id` - Kategorie bearbeiten (Admin)
- `DELETE /api/categories/:id` - Kategorie löschen (Admin)

### Admin
- `GET /api/admin/users` - Alle Benutzer abrufen (Admin)
- `PATCH /api/admin/users/:id/role` - Benutzerrolle ändern (Admin)

## 🔐 Rollen & Berechtigungen

| Rolle | Rezepte ansehen | Rezepte erstellen | Eigene Rezepte bearbeiten | Alle Rezepte bearbeiten | Rezepte veröffentlichen | Benutzer verwalten |
|-------|----------------|------------------|-------------------------|------------------------|------------------------|-------------------|
| Guest | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Member | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Editor | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

## 📝 Entwicklung

### Backend Entwicklung

```bash
cd backend
npm run dev  # Startet Server mit Hot Reload
```

### Frontend Entwicklung

```bash
cd frontend
npm run dev  # Startet Vite Dev Server
```

### Code Style

- **Backend**: ESLint + Prettier
- **Frontend**: ESLint + Prettier
- **TypeScript**: Strict Mode aktiviert

## 🗄️ Datenbank Schema

Das Projekt verwendet Prisma als ORM. Das Schema ist in `backend/prisma/schema.prisma` definiert.

### Haupt-Modelle

- **User**: Benutzer mit Rollen
- **Recipe**: Rezepte mit Zutaten, Schritten und Metadaten
- **Rating**: Benutzer-Bewertungen für Rezepte
- **Category**: Kategorien für Rezept-Klassifizierung

## 🔧 Konfiguration

### Backend Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/chellys_kitchen
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
NODE_ENV=development
PORT=4000
CORS_ORIGIN=http://localhost:5173
```

### Frontend Environment Variables

```env
VITE_API_BASE_URL=http://localhost:4000
VITE_ROUTER_MODE=browser
```

## 🚨 Troubleshooting

### Backend startet nicht

1. Prüfe ob PostgreSQL läuft:
   ```bash
   docker ps  # oder
   pg_isready -h localhost
   ```

2. Prüfe Environment Variables:
   ```bash
   cat backend/.env
   ```

3. Prüfe Datenbank-Verbindung:
   ```bash
   npx prisma db push
   ```

### Frontend kann nicht auf Backend zugreifen

1. Prüfe CORS Konfiguration in Backend
2. Prüfe `VITE_API_BASE_URL` in Frontend
3. Prüfe ob Backend auf Port 4000 läuft

### Migrations schlagen fehl

1. Prüfe Datenbank-Verbindung
2. Lösche Migrationen und neu starten:
   ```bash
   rm -rf prisma/migrations
   npx prisma migrate dev --name init
   ```

## 📄 Lizenz

MIT License - siehe LICENSE Datei für Details.

## 🤝 Contributing

Contributions sind willkommen! Bitte:

1. Fork das Repository
2. Erstelle einen Feature Branch
3. Commit deine Änderungen
4. Push zum Branch
5. Erstelle einen Pull Request

## 📞 Support

Für Fragen und Support:
- GitHub Issues: https://github.com/your-username/chellys-kitchen/issues
- Email: support@chellys-kitchen.com

## 🙏 Danksagung

- Material UI für das UI Framework
- Fastify für das Backend Framework
- Prisma für das ORM
- Vite für das Build Tool

---

**Chellys Kitchen** - Made with ❤️ for food lovers