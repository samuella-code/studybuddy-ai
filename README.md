# StudyBuddyAI

AI-powered, voice-first personal tutor for students.

StudyBuddy helps students learn through natural conversation, personalized study plans, quizzes, flashcards, study materials, and progress tracking across web, Android, and iOS.

## Project status

Phase 1 — foundation and architecture.

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
- Authentication: secure token-based sessions

## Repository structure

```text
studybuddy-ai/
├── apps/
│   └── mobile/
├── backend/
├── docs/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Development roadmap

1. Foundation and project setup
2. Authentication
3. Dashboard UI
4. AI text chat
5. Speech-to-text
6. Text-to-speech
7. Conversation memory
8. Quiz mode
9. Study planner
10. Flashcards
11. Study materials
12. Progress analytics
13. Responsive web polish
14. Testing and deployment

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

Copy the example environment files before running locally. Never commit real API keys or production secrets.

## License

Private project during development.
