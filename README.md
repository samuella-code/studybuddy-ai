# StudyBuddy AI

StudyBuddy is a voice-first AI personal tutor for students. It provides natural tutoring conversations, AI-generated quizzes and flashcards, personalized study plans, study tracking, and study-material summarization from one Expo app running on web, Android, and iOS.

## Stack

- **Client:** React Native, Expo SDK 57, TypeScript, Expo Router, React Native Paper, TanStack Query, Zustand
- **Backend:** Python, FastAPI, Pydantic, SQLAlchemy 2.x
- **Database:** PostgreSQL
- **AI:** OpenAI Responses API behind a replaceable `AIProvider` abstraction
- **Voice:** Expo Audio for recording, backend transcription, Expo Speech for spoken answers
- **Documents:** Expo Document Picker + secure backend PDF/text extraction

Expo SDK 57 targets React Native 0.86, React 19.2.3 and React Native Web 0.21.0. The project is configured for that combination.

## Features

- Email/password authentication with hashed passwords and JWT access tokens
- Persistent authenticated sessions
- Learner profile and daily study goal
- Subject selection and custom subjects
- Voice-first AI tutor with listening, thinking, and speaking states
- Text chat fallback
- Conversation persistence and chat history
- AI-generated multiple-choice quizzes with scoring and feedback
- AI-generated flashcards with persistent storage
- AI-generated study plans based on exam date, available time, confidence, and topics
- Focus timer and study-session tracking
- Progress and weekly activity dashboard
- PDF, TXT, and Markdown study-material upload and AI summarization
- Friendly handling for authentication, network, AI, microphone, upload, and validation failures
- Responsive Expo Web layout

## Project structure

```text
studybuddy-ai/
├── apps/
│   └── mobile/              # Expo universal client
│       ├── app/             # Expo Router screens
│       ├── services/        # API and local storage
│       └── store/            # Zustand state
├── backend/
│   ├── app/
│   │   ├── ai/              # AI provider abstraction
│   │   ├── api/routes/      # FastAPI endpoints
│   │   ├── auth/             # JWT/password security
│   │   ├── database/         # SQLAlchemy engine/session
│   │   ├── models/           # Database models
│   │   └── schemas/          # Pydantic validation schemas
│   ├── tests/
│   └── requirements.txt
├── docs/
├── docker-compose.yml
└── .env.example
```

## Requirements

- Node.js 22+
- npm 10+
- Python 3.12+
- Docker Desktop/Engine + Compose (recommended for PostgreSQL)
- An OpenAI API key for real AI features

## Frontend installation

```bash
cd apps/mobile
npm install
npx expo install --fix
npm run typecheck
```

The `package.json` keeps Expo SDK packages aligned with SDK 57. Prefer `npx expo install` for Expo-managed dependencies instead of forcing npm through peer-dependency conflicts.

### Frontend dependencies

Runtime packages:

```text
@tanstack/react-query
expo
expo-audio
expo-constants
expo-document-picker
expo-linking
expo-router
expo-speech
expo-status-bar
react
react-dom
react-hook-form
react-native
react-native-paper
react-native-safe-area-context
react-native-screens
react-native-web
zustand
```

## Backend installation

From the repository root:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Then create the local environment file:

```bash
cd ..
cp .env.example .env
```

Set a real `JWT_SECRET_KEY` and `AI_API_KEY` in `.env`.

## Database

```bash
docker compose up -d db
```

The default local database is:

```text
postgresql+psycopg://studybuddy:studybuddy@localhost:5432/studybuddy
```

For local development, `AUTO_CREATE_TABLES=true` allows the API to create the tables automatically. For production, use a proper migration workflow before deployment.

## Run the application

Terminal 1:

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload
```

Terminal 2:

```bash
cd apps/mobile
npm run web
```

For Android/iOS development:

```bash
cd apps/mobile
npm run android
# or
npm run ios
```

## Physical phone

Set `EXPO_PUBLIC_API_URL` to your computer's LAN address, for example:

```text
EXPO_PUBLIC_API_URL=http://192.168.1.10:8000/api/v1
```

The phone and computer must be on the same network, and the backend port must be reachable from the phone.

## Testing

Frontend:

```bash
cd apps/mobile
npm run typecheck
```

Backend:

```bash
cd backend
source .venv/bin/activate
pytest
```

API documentation is available at `http://localhost:8000/docs` while the backend is running.

## AI and voice configuration

AI credentials are **backend-only**. Never place an OpenAI key in an `EXPO_PUBLIC_*` variable and never commit a real `.env` file.

Voice recording uses Expo Audio and the microphone permission configured in `app.json`. Expo Speech handles spoken AI answers locally. Native microphone configuration takes effect in development/release builds after the Expo config is applied.

## Deployment

For production, deploy the FastAPI service and PostgreSQL database separately or through a managed platform, set production environment variables, use a strong secret, restrict CORS to the deployed web origin, and use EAS Build for Android/iOS.

## Future improvements

- Streaming AI responses
- Realtime speech-to-speech tutoring
- Spaced-repetition scheduling for flashcards
- Rich PDF chunking/embeddings for very large documents
- Push reminders and study notifications
- Advanced topic mastery recommendations
- Automated migration generation and deployment pipeline
