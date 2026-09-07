# Phase 1 — Foundation

## What is included

- Expo + React Native + TypeScript frontend
- Expo Router file-based navigation
- React Native Paper UI foundation
- Zustand authentication state foundation
- TanStack Query dependency for server state
- FastAPI backend
- Versioned `/api/v1` API router
- Pydantic settings configuration
- PostgreSQL Docker development service
- Backend health tests
- Environment template and secret-safe gitignore

## Frontend setup

From the repository root:

```bash
cd apps/mobile
npm install
npx expo start
```

For web:

```bash
npm run web
```

For Android:

```bash
npm run android
```

For iOS (macOS with Xcode):

```bash
npm run ios
```

The current Expo documentation recommends using `npx expo install` for Expo-compatible package versions. The project targets the current stable Expo SDK configured in `apps/mobile/package.json`.

## Backend setup

From the repository root:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create your local environment file from the root `.env.example`, then start PostgreSQL:

```bash
docker compose up -d postgres
```

Start FastAPI:

```bash
uvicorn app.main:app --reload
```

API health check:

```text
GET http://localhost:8000/health
GET http://localhost:8000/api/v1/health
```

Run tests:

```bash
pytest
```

## Next phase

Phase 2 will implement real authentication: User model, password hashing, registration, login, token/session handling, `/users/me`, frontend auth screens, secure token persistence, protected routes, and authentication tests.
