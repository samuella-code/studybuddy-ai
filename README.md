# StudyBuddyAI

AI-powered, voice-first personal tutor for students.

StudyBuddy helps students learn through natural conversation, personalized study plans, quizzes, flashcards, study materials, and progress tracking across web, Android, and iOS.

## Current MVP

The repository now contains a working foundation for:

- React Native + Expo + TypeScript + Expo Router frontend
- FastAPI + SQLAlchemy + PostgreSQL backend
- Email/password registration and login
- JWT bearer authentication
- Persistent native/web sessions (SecureStore on native, local storage on web)
- Personalized onboarding subject selection
- Student dashboard
- Authenticated AI text tutoring API
- Conversation history sent to the AI provider
- Text-to-speech for tutor responses
- Interactive quiz mode
- Flashcard study mode
- Weekly study-plan UI

## Stack

- Frontend: React Native + Expo + TypeScript + Expo Router
- Web: Expo Web
- State: Zustand
- Server state: TanStack Query
- Forms: React Hook Form
- UI: React Native Paper
- Backend: Python + FastAPI + Pydantic + SQLAlchemy
- Database: PostgreSQL
- AI: provider-agnostic service abstraction
- Authentication: JWT + platform-aware secure token storage

## Repository structure

```text
studybuddy-ai/
├── apps/
│   └── mobile/
├── backend/
├── docs/
├── .env.example
├── .gitignore
├── docker-compose.yml
├── package.json
└── README.md
```

## Development roadmap

1. Foundation and project setup — complete
2. Authentication — complete
3. Dashboard UI — complete
4. AI text chat — complete
5. Persistent sessions — complete
6. Text-to-speech — complete
7. Speech-to-text / live voice conversation — next
8. Conversation memory — next
9. Database-backed study profile — next
10. Quiz generation from AI — next
11. Study planner persistence — next
12. Flashcard persistence and spaced repetition — next
13. Study materials / PDF ingestion — next
14. Progress analytics — next
15. Responsive web polish — next
16. Testing, CI and deployment — next

## Architecture

```text
React Native / Expo
       │
       ├── Web
       ├── Android
       └── iOS
       │
       ▼
    FastAPI API
       │
       ├── Auth
       ├── AI service
       ├── Voice service
       ├── Study services
       └── PostgreSQL
```

## Environment

Copy `.env.example` into the appropriate local environment file before running the backend. Never commit real API keys or production secrets.

For physical-device testing, `EXPO_PUBLIC_API_URL` must point to the computer's LAN address rather than `localhost`.

## Local commands

```bash
# frontend
npm run web

# backend
npm run backend

# backend tests
npm run backend:test
```

## License

Private project during development.
