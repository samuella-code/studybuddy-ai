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

export async function apiRequest<T>(path: string, options: RequestInit = {}, accessToken?: string): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
  let response: Response;
  try { response = await fetch(`${API_URL}${path}`, { ...options, headers }); }
  catch { throw new Error("Unable to connect to StudyBuddy. Check your internet connection and try again."); }
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
