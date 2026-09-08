import { Platform } from "react-native";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export type User = { id: string; email: string; name: string; learning_level?: string; daily_goal_minutes?: number };
export type AuthResponse = { access_token: string; token_type: string; user: User };
export type Subject = { id: string; name: string };
export type Progress = { total_minutes: number; current_streak: number; quiz_score: number; quizzes_taken: number; weak_topics: string[]; strong_topics: string[]; weekly_activity: Record<string, number> };
export type QuizQuestion = { id: string; question: string; options: string[]; answer: string; explanation: string };
export type Quiz = { id: string; subject: string; topic: string | null; difficulty: string; questions: QuizQuestion[] };
export type QuizResult = { score: number; total: number; percentage: number; feedback: string[] };
export type Flashcard = { id: string; subject: string; topic: string; question: string; answer: string; difficulty: string };
export type StudyPlan = { id: string; subject: string; exam_date: string; daily_minutes: number; confidence: string; topics: string[]; plan: Array<Record<string, unknown>> };

const OFFLINE_USER: User = { id: "offline-demo", email: "demo@studybuddy.local", name: "Demo Learner", learning_level: "beginner", daily_goal_minutes: 30 };

function offlineResponse<T>(path: string, options: RequestInit): T | undefined {
  const method = options.method ?? "GET";
  if (path === "/auth/login" || path === "/auth/register") {
    return { access_token: "offline-demo", token_type: "bearer", user: OFFLINE_USER } as T;
  }
  if (path === "/users/me") return OFFLINE_USER as T;
  if (path === "/chat") return { message: "You're currently offline. I can still help you practise with the StudyBuddy offline tutor. Try asking about arrays, photosynthesis, an example, a simpler explanation, or say “quiz me”." } as T;
  if (path === "/chat/history") return [] as T;
  if (path === "/subjects" && method === "GET") {
    return ["Mathematics", "Computer Science", "Biology", "Chemistry", "Physics", "English", "Economics", "General Knowledge"].map((name, index) => ({ id: `offline-subject-${index}`, name })) as T;
  }
  if (path === "/subjects" && method === "POST") {
    const body = JSON.parse(String(options.body ?? "{}")) as { name?: string };
    return { id: `offline-subject-${Date.now()}`, name: body.name ?? "My Subject" } as T;
  }
  if (path === "/progress") return { total_minutes: 0, current_streak: 1, quiz_score: 0, quizzes_taken: 0, weak_topics: [], strong_topics: [], weekly_activity: {} } as T;
  if (path === "/study-history") return [] as T;
  if (path === "/study-sessions") return { id: `offline-session-${Date.now()}` } as T;
  if (path === "/flashcards" && method === "GET") return [] as T;
  if (path === "/flashcards" && method === "POST") {
    const body = JSON.parse(String(options.body ?? "{}")) as Record<string, string>;
    return { ...body, id: `offline-card-${Date.now()}` } as T;
  }
  if (path === "/flashcards/generate") {
    const body = JSON.parse(String(options.body ?? "{}")) as { subject?: string; topic?: string; count?: number };
    const count = Math.min(Math.max(body.count ?? 5, 1), 10);
    return Array.from({ length: count }, (_, index) => ({
      id: `offline-card-${Date.now()}-${index}`,
      subject: body.subject ?? "General Knowledge",
      topic: body.topic ?? "Study Skills",
      question: `What is one important idea about ${body.topic ?? "this topic"}?`,
      answer: `Review the definition, understand a simple example, and explain the idea in your own words.`,
      difficulty: "medium",
    })) as T;
  }
  if (path === "/study-plans" && method === "GET") return [] as T;
  if (path === "/study-plans" && method === "POST") {
    const body = JSON.parse(String(options.body ?? "{}")) as { subject?: string; exam_date?: string; daily_minutes?: number; confidence?: string; topics?: string[] };
    const topics = body.topics?.length ? body.topics : ["Core concepts", "Practice questions", "Review"];
    return {
      id: `offline-plan-${Date.now()}`,
      subject: body.subject ?? "General Studies",
      exam_date: body.exam_date ?? new Date().toISOString().slice(0, 10),
      daily_minutes: body.daily_minutes ?? 30,
      confidence: body.confidence ?? "medium",
      topics,
      plan: topics.map((topic, index) => ({ day: index + 1, topic, minutes: body.daily_minutes ?? 30, task: `Study and practise ${topic}.` })),
    } as T;
  }
  if (path === "/quizzes/generate") {
    const body = JSON.parse(String(options.body ?? "{}")) as { subject?: string; topic?: string; difficulty?: string; count?: number };
    const count = Math.min(Math.max(body.count ?? 5, 1), 10);
    const questions: QuizQuestion[] = Array.from({ length: count }, (_, index) => ({
      id: `offline-question-${Date.now()}-${index}`,
      question: `Practice question ${index + 1}: What is the best way to learn ${body.topic ?? body.subject ?? "this topic"}?`,
      options: ["Understand the concept and practise it", "Memorize without understanding", "Skip difficult parts", "Study only once"],
      answer: "Understand the concept and practise it",
      explanation: "Active understanding and practice help you remember and apply what you learn.",
    }));
    return { id: `offline-quiz-${Date.now()}`, subject: body.subject ?? "General Knowledge", topic: body.topic ?? null, difficulty: body.difficulty ?? "medium", questions } as T;
  }
  if (path.startsWith("/quizzes/") && path.endsWith("/submit")) return { score: 0, total: 1, percentage: 0, feedback: ["Offline quiz results are available. Review the explanation and try again."] } as T;
  if (path === "/materials/upload") return { id: `offline-material-${Date.now()}`, filename: "Offline study material", content_type: "text/plain", characters: 0 } as T;
  if (path === "/materials/summarize") return { material_id: "offline-material", summary: "Offline summary is available after the material is processed locally. For full AI document analysis, reconnect to the StudyBuddy server." } as T;
  return undefined;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}, accessToken?: string): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    const fallback = offlineResponse<T>(path, options);
    if (fallback !== undefined) return fallback;
    throw new Error("This feature needs an internet connection, but your study progress remains available offline.");
  }
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try { const body = await response.json(); message = body.detail ?? message; } catch { /* non-JSON response */ }
    if (response.status === 401) message = "Your session has expired. Please sign in again.";
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export function register(name: string, email: string, password: string) { return apiRequest<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) }); }
export function login(email: string, password: string) { return apiRequest<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }); }
export function getMe(accessToken: string) { return apiRequest<User>("/users/me", {}, accessToken); }
export function updateProfile(input: { name?: string; learning_level?: string; daily_goal_minutes?: number }, accessToken: string) { return apiRequest<User>("/users/me", { method: "PATCH", body: JSON.stringify(input) }, accessToken); }
export function sendChatMessage(message: string, accessToken: string, history: Array<{ role: "user" | "assistant"; content: string }> = []) { return apiRequest<{ message: string }>("/chat", { method: "POST", body: JSON.stringify({ message, history }) }, accessToken); }
export function getChatHistory(accessToken: string) { return apiRequest<Array<{ id: string; title: string; messages: Array<{ role: "user" | "assistant"; content: string }> }>>("/chat/history", {}, accessToken); }
export function getSubjects(accessToken: string) { return apiRequest<Subject[]>("/subjects", {}, accessToken); }
export function createSubject(name: string, accessToken: string) { return apiRequest<Subject>("/subjects", { method: "POST", body: JSON.stringify({ name }) }, accessToken); }
export function getProgress(accessToken: string) { return apiRequest<Progress>("/progress", {}, accessToken); }
export function recordStudySession(subject: string, minutes: number, accessToken: string, topic?: string) { return apiRequest("/study-sessions", { method: "POST", body: JSON.stringify({ subject, topic, minutes }) }, accessToken); }
export function getStudyHistory(accessToken: string) { return apiRequest<Array<{ id: string; subject: string; topic: string | null; minutes: number; started_at: string }>>("/study-history", {}, accessToken); }
export function generateQuiz(input: { subject: string; topic?: string; difficulty?: string; count?: number }, accessToken: string) { return apiRequest<Quiz>("/quizzes/generate", { method: "POST", body: JSON.stringify(input) }, accessToken); }
export function submitQuiz(quizId: string, answers: Record<string, string>, accessToken: string) { return apiRequest<QuizResult>(`/quizzes/${quizId}/submit`, { method: "POST", body: JSON.stringify({ answers }) }, accessToken); }
export function getFlashcards(accessToken: string) { return apiRequest<Flashcard[]>("/flashcards", {}, accessToken); }
export function createFlashcard(card: Omit<Flashcard, "id">, accessToken: string) { return apiRequest<Flashcard>("/flashcards", { method: "POST", body: JSON.stringify(card) }, accessToken); }
export function generateFlashcards(input: { subject: string; topic: string; count?: number }, accessToken: string) { return apiRequest<Flashcard[]>("/flashcards/generate", { method: "POST", body: JSON.stringify(input) }, accessToken); }
export function createStudyPlan(input: { subject: string; exam_date: string; daily_minutes: number; confidence: string; topics: string[] }, accessToken: string) { return apiRequest<StudyPlan>("/study-plans", { method: "POST", body: JSON.stringify(input) }, accessToken); }
export function getStudyPlans(accessToken: string) { return apiRequest<StudyPlan[]>("/study-plans", {}, accessToken); }
async function formDataForFile(file: { uri: string; name: string; type: string }) { const form = new FormData(); if (Platform.OS === "web") { const blob = await fetch(file.uri).then((response) => response.blob()); form.append("file", blob, file.name); } else form.append("file", { uri: file.uri, name: file.name, type: file.type } as unknown as Blob); return form; }
export async function uploadMaterial(file: { uri: string; name: string; type: string }, accessToken: string) { return apiRequest<{ id: string; filename: string; content_type: string; characters: number }>("/materials/upload", { method: "POST", body: await formDataForFile(file) }, accessToken); }
export function summarizeMaterial(materialId: string, accessToken: string, instruction?: string) { return apiRequest<{ material_id: string; summary: string }>("/materials/summarize", { method: "POST", body: JSON.stringify({ material_id: materialId, instruction }) }, accessToken); }
export async function transcribeVoice(file: { uri: string; name: string; type: string }, accessToken: string) { return apiRequest<{ text: string }>("/voice/transcribe", { method: "POST", body: await formDataForFile(file) }, accessToken); }
export { API_URL };
